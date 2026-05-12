import type { APIRoute } from 'astro';
import { createClient } from '../../lib/supabase';
import { ConsultationBookingService, CONSULTATION_PRICES } from '../../lib/consultationBookingService';
import { initMerchantPayment } from '../../lib/dexchangeService';
import type { ConsultationCategory, ConsultationType } from '../../lib/consultationBookingService';

export const POST: APIRoute = async ({ request, cookies, url }) => {
  try {
    const supabase = createClient({ request, cookies });
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return new Response(
        JSON.stringify({ success: false, message: 'Non authentifié' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return new Response(
        JSON.stringify({ success: false, message: 'Requête invalide' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const profileCategory = body.profileCategory as ConsultationCategory | undefined;
    const consultationType = body.consultationType as ConsultationType | undefined;
    const preferredDate = body.preferredDate as string | undefined;
    const preferredTime = body.preferredTime as string | undefined;
    const subject = body.subject as string | undefined;
    const message = body.message as string | undefined;

    if (!profileCategory || !consultationType || !subject) {
      return new Response(
        JSON.stringify({ success: false, message: 'Catégorie, mode de consultation et sujet sont requis' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!CONSULTATION_PRICES[profileCategory]) {
      return new Response(
        JSON.stringify({ success: false, message: 'Catégorie de profil invalide' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const price = CONSULTATION_PRICES[profileCategory];

    const bookingService = new ConsultationBookingService(supabase);
    const booking = await bookingService.createBooking(user.id, {
      profileCategory,
      consultationType,
      preferredDate,
      preferredTime,
      subject,
      message,
      contactInfo: { email: user.email, name: user.user_metadata?.full_name || '' },
    });

    if (!booking) {
      return new Response(
        JSON.stringify({ success: false, message: 'Erreur lors de la création de la réservation' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!import.meta.env.DEXCHANGE_API_KEY) {
      await bookingService.updatePaymentStatus(booking.id, 'completed', 'mock', `MOCK-CONSULT-${booking.id}`);
      return new Response(
        JSON.stringify({ success: true, bookingId: booking.id }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const baseUrl = `${url.protocol}//${url.host}`;
    const webhookSecret = import.meta.env.DEXCHANGE_WEBHOOK_SECRET;
    const webhookUrl = webhookSecret
      ? `${baseUrl}/api/payment/webhook?wsec=${encodeURIComponent(webhookSecret)}&booking=${booking.id}`
      : `${baseUrl}/api/payment/webhook?booking=${booking.id}`;

    let dexchangeResponse;
    try {
      dexchangeResponse = await initMerchantPayment({
        externalTransactionId: `CONSULT-${booking.id}`,
        ItemName: `Consultation PREVICARE — ${subject}`,
        ItemPrice: price,
        customData: JSON.stringify({ bookingId: booking.id, userId: user.id, type: 'consultation' }),
        callBackURL: webhookUrl,
        successUrl: `${baseUrl}/rdv-consultation?success=1`,
        failureUrl: `${baseUrl}/rdv-consultation?error=1`,
      });
    } catch (dexError: unknown) {
      const msg = dexError instanceof Error ? dexError.message : 'Erreur lors de la création du lien de paiement';
      return new Response(
        JSON.stringify({ success: false, message: msg }),
        { status: 502, headers: { 'Content-Type': 'application/json' } }
      );
    }

    await bookingService.updatePaymentStatus(booking.id, 'pending', 'dexchange', dexchangeResponse.transactionId);

    return new Response(
      JSON.stringify({ success: true, bookingId: booking.id, paymentUrl: dexchangeResponse.PaymentUrl }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Consultation booking error:', error);
    const message = error instanceof Error ? error.message : 'Une erreur est survenue';
    return new Response(
      JSON.stringify({ success: false, message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};