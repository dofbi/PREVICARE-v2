import type { APIRoute } from 'astro';
import { createClient } from '../../lib/supabase';
import { processPayment } from '../../lib/paymentService';
import { initMerchantPayment } from '../../lib/dexchangeService';
import { isQuoteRequired, isPriceOnDemand } from '../../types/subscription';
import type { PaymentMethodType } from '../../types/payments';

const CGA_CURRENT_VERSION = '1.0';

export const POST: APIRoute = async ({ request, cookies, url }) => {
  try {
    const supabase = createClient({ request, cookies });

    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) {
      return new Response(
        JSON.stringify({ success: false, message: 'Non authentifié' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const formData = await request.formData();
    const planId = formData.get('planId') as string;
    const paymentMethod = formData.get('paymentMethod') as PaymentMethodType;
    const billingPeriod = (formData.get('billingPeriod') as string) || 'monthly';
    const cgaAccepted = formData.get('cgaAccepted') as string;
    const cgaVersion = (formData.get('cgaVersion') as string) || CGA_CURRENT_VERSION;

    if (!planId || !paymentMethod) {
      return new Response(
        JSON.stringify({ success: false, message: 'Données manquantes' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (cgaAccepted !== 'on') {
      return new Response(
        JSON.stringify({ success: false, message: 'Vous devez accepter les Conditions Générales d\'Abonnement (CGA) pour souscrire.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (paymentMethod === 'mock' && !import.meta.env.DEV) {
      return new Response(
        JSON.stringify({ success: false, message: 'Mode test non disponible en production' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (paymentMethod !== 'mock') {
      if (!import.meta.env.DEXCHANGE_API_KEY) {
        return new Response(
          JSON.stringify({ success: false, message: 'Service de paiement non configuré' }),
          { status: 503, headers: { 'Content-Type': 'application/json' } }
        );
      }
      if (!import.meta.env.DEXCHANGE_WEBHOOK_SECRET) {
        return new Response(
          JSON.stringify({ success: false, message: 'Service de paiement non configuré (webhook)' }),
          { status: 503, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    const { data: plan, error: planError } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('id', planId)
      .single();

    if (planError || !plan) {
      return new Response(
        JSON.stringify({ success: false, message: 'Plan non trouvé' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (isQuoteRequired(plan)) {
      return new Response(
        JSON.stringify({ success: false, message: 'Ce plan nécessite une demande de devis. Veuillez utiliser le formulaire de devis.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (isPriceOnDemand(plan.price)) {
      return new Response(
        JSON.stringify({ success: false, message: 'Le prix de ce plan est sur devis. Veuillez contacter notre équipe.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const planPrice = plan.price as number;

    const effectiveBillingPeriod = billingPeriod || plan.billing_period || 'monthly';
    let priceMultiplier = 1;
    if (effectiveBillingPeriod === 'quarterly') {
      priceMultiplier = 3;
    } else if (effectiveBillingPeriod === 'yearly') {
      priceMultiplier = 12;
    }
    const totalAmount = planPrice * priceMultiplier;

    if (paymentMethod === 'mock') {
      const paymentResult = await processPayment({
        amount: totalAmount,
        method: 'mock',
        description: `Abonnement ${plan.display_name}`,
      });

      if (!paymentResult.success) {
        return new Response(
          JSON.stringify({ success: false, message: paymentResult.message }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      await supabase
        .from('subscriptions')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('user_id', authData.user.id)
        .in('status', ['active', 'pending']);

      const startsAt = new Date();
      const expiresAt = new Date();
      if (effectiveBillingPeriod === 'quarterly') {
        expiresAt.setMonth(expiresAt.getMonth() + 3);
      } else if (effectiveBillingPeriod === 'yearly') {
        expiresAt.setFullYear(expiresAt.getFullYear() + 1);
      } else {
        expiresAt.setMonth(expiresAt.getMonth() + 1);
      }

      const { data: subscription, error: subError } = await supabase
        .from('subscriptions')
        .insert({
          user_id: authData.user.id,
          plan_id: planId,
          status: 'active',
          payment_method: 'mock',
          payment_reference: paymentResult.reference,
          starts_at: startsAt.toISOString(),
          expires_at: expiresAt.toISOString(),
        })
        .select()
        .single();

      if (subError) {
        return new Response(
          JSON.stringify({ success: false, message: "Erreur lors de la création de l'abonnement" }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }

      await supabase.from('payments').insert({
        user_id: authData.user.id,
        subscription_id: subscription.id,
        amount: totalAmount,
        payment_method: 'mock',
        payment_reference: paymentResult.reference,
        status: 'completed',
      });

      // Record CGA acceptance — try cga_acceptances table, fallback to subscription row
      const { error: cgaError } = await supabase.from('cga_acceptances').insert({
        user_id: authData.user.id,
        subscription_id: subscription.id,
        cga_version: cgaVersion,
        accepted_at: new Date().toISOString(),
      });
      if (cgaError) {
        await supabase.from('subscriptions').update({
          cga_version: cgaVersion,
          cga_accepted_at: new Date().toISOString(),
        }).eq('id', subscription.id);
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Abonnement activé avec succès !',
          redirect: '/espace-employes/abonnement',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const startsAt = new Date();
    const expiresAt = new Date();
    if (effectiveBillingPeriod === 'quarterly') {
      expiresAt.setMonth(expiresAt.getMonth() + 3);
    } else if (effectiveBillingPeriod === 'yearly') {
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    } else {
      expiresAt.setMonth(expiresAt.getMonth() + 1);
    }

    const { data: pendingSub, error: pendingSubError } = await supabase
      .from('subscriptions')
      .insert({
        user_id: authData.user.id,
        plan_id: planId,
        status: 'pending',
        payment_method: 'dexchange',
        payment_reference: null,
        starts_at: startsAt.toISOString(),
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (pendingSubError || !pendingSub) {
      return new Response(
        JSON.stringify({ success: false, message: "Erreur lors de la création de l'abonnement" }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Record CGA acceptance for pending subscription (Dexchange flow)
    const { error: cgaError2 } = await supabase.from('cga_acceptances').insert({
      user_id: authData.user.id,
      subscription_id: pendingSub.id,
      cga_version: cgaVersion,
      accepted_at: new Date().toISOString(),
    });
    if (cgaError2) {
      await supabase.from('subscriptions').update({
        cga_version: cgaVersion,
        cga_accepted_at: new Date().toISOString(),
      }).eq('id', pendingSub.id);
    }

    const baseUrl = `${url.protocol}//${url.host}`;
    const externalTransactionId = `PREV-${pendingSub.id}`;
    const webhookSecret = import.meta.env.DEXCHANGE_WEBHOOK_SECRET;
    const webhookUrl = webhookSecret
      ? `${baseUrl}/api/payment/webhook?wsec=${encodeURIComponent(webhookSecret)}&sub=${pendingSub.id}`
      : `${baseUrl}/api/payment/webhook?sub=${pendingSub.id}`;

    let dexchangeResponse;
    try {
      dexchangeResponse = await initMerchantPayment({
        externalTransactionId,
        ItemName: `Abonnement PREVICARE ${plan.display_name}`,
        ItemPrice: totalAmount,
        customData: JSON.stringify({ subscriptionId: pendingSub.id, userId: authData.user.id }),
        callBackURL: webhookUrl,
        successUrl: `${baseUrl}/espace-employes/abonnement/succes?ref=${pendingSub.id}`,
        failureUrl: `${baseUrl}/espace-employes/abonnement/echec?ref=${pendingSub.id}`,
      });
    } catch (dexError: unknown) {
      await supabase
        .from('subscriptions')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('id', pendingSub.id);

      const message =
        dexError instanceof Error
          ? dexError.message
          : 'Erreur lors de la création du lien de paiement';

      return new Response(
        JSON.stringify({ success: false, message }),
        { status: 502, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { error: refUpdateError } = await supabase
      .from('subscriptions')
      .update({ payment_reference: dexchangeResponse.transactionId })
      .eq('id', pendingSub.id);

    if (refUpdateError) {
      console.error('Subscribe: error saving payment reference:', refUpdateError);
    }

    const { error: paymentInsertError } = await supabase.from('payments').insert({
      user_id: authData.user.id,
      subscription_id: pendingSub.id,
      amount: totalAmount,
      payment_method: 'dexchange',
      payment_reference: dexchangeResponse.transactionId,
      status: 'pending',
    });

    if (paymentInsertError) {
      console.error('Subscribe: error creating payment row:', paymentInsertError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        paymentUrl: dexchangeResponse.PaymentUrl,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Subscribe error:', error);
    const message = error instanceof Error ? error.message : 'Une erreur est survenue';
    return new Response(
      JSON.stringify({ success: false, message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
