import type { APIRoute } from 'astro';
import { createClient, createServiceRoleClient } from '../../../lib/supabase';
import { getTransactionStatus, initMerchantPayment } from '../../../lib/dexchangeService';

export const POST: APIRoute = async ({ request, cookies, url }) => {
  const supabase = createClient({ request, cookies });

  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) {
    return new Response(
      JSON.stringify({ success: false, message: 'Non authentifié' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const body = await request.json() as { subscriptionId?: string };
  const subscriptionId = body?.subscriptionId;

  if (!subscriptionId) {
    return new Response(
      JSON.stringify({ success: false, message: 'subscriptionId manquant' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const serviceSupabase = createServiceRoleClient();

  const { data: subscription, error: subError } = await serviceSupabase
    .from('subscriptions')
    .select('id, status, payment_reference, plan_id, user_id, plan:subscription_plans(display_name, price)')
    .eq('id', subscriptionId)
    .eq('user_id', authData.user.id)
    .single();

  if (subError || !subscription) {
    return new Response(
      JSON.stringify({ success: false, message: 'Abonnement non trouvé' }),
      { status: 404, headers: { 'Content-Type': 'application/json' } }
    );
  }

  if (subscription.status === 'active') {
    return new Response(
      JSON.stringify({ success: true, alreadyActive: true, redirect: '/espace-employes/abonnement' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }

  if (subscription.status !== 'pending') {
    return new Response(
      JSON.stringify({ success: false, message: 'Cet abonnement ne peut pas être relancé' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  if (subscription.payment_reference) {
    try {
      const statusResponse = await getTransactionStatus(subscription.payment_reference);
      const verifiedStatus = statusResponse.transaction.Status;

      if (verifiedStatus === 'SUCCESS') {
        await serviceSupabase
          .from('subscriptions')
          .update({ status: 'cancelled', updated_at: new Date().toISOString() })
          .eq('user_id', authData.user.id)
          .eq('status', 'active')
          .neq('id', subscriptionId);

        await serviceSupabase
          .from('subscriptions')
          .update({ status: 'active', updated_at: new Date().toISOString() })
          .eq('id', subscriptionId);

        await serviceSupabase
          .from('payments')
          .update({ status: 'completed' })
          .eq('subscription_id', subscriptionId)
          .eq('status', 'pending');

        return new Response(
          JSON.stringify({
            success: true,
            alreadyPaid: true,
            redirect: `/espace-employes/abonnement/succes?ref=${subscriptionId}`,
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }
    } catch {
      // Dexchange verification failed or transaction expired — proceed to create new link
    }
  }

  if (!import.meta.env.DEXCHANGE_API_KEY || !import.meta.env.DEXCHANGE_WEBHOOK_SECRET) {
    return new Response(
      JSON.stringify({ success: false, message: 'Service de paiement non configuré' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const planData = Array.isArray(subscription.plan) ? subscription.plan[0] : subscription.plan;
  if (!planData) {
    return new Response(
      JSON.stringify({ success: false, message: 'Plan introuvable' }),
      { status: 404, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const baseUrl = `${url.protocol}//${url.host}`;
  const webhookSecret = import.meta.env.DEXCHANGE_WEBHOOK_SECRET;
  const webhookUrl = `${baseUrl}/api/payment/webhook?wsec=${encodeURIComponent(webhookSecret)}&sub=${subscriptionId}`;
  const externalTransactionId = `PREV-${subscriptionId}-R${Date.now()}`;

  let dexchangeResponse;
  try {
    dexchangeResponse = await initMerchantPayment({
      externalTransactionId,
      ItemName: `Abonnement PREVICARE ${planData.display_name}`,
      ItemPrice: planData.price,
      customData: JSON.stringify({ subscriptionId, userId: authData.user.id }),
      callBackURL: webhookUrl,
      successUrl: `${baseUrl}/espace-employes/abonnement/succes?ref=${subscriptionId}`,
      failureUrl: `${baseUrl}/espace-employes/abonnement/echec?ref=${subscriptionId}`,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur lors de la création du lien de paiement';
    return new Response(
      JSON.stringify({ success: false, message }),
      { status: 502, headers: { 'Content-Type': 'application/json' } }
    );
  }

  await serviceSupabase
    .from('subscriptions')
    .update({ payment_reference: dexchangeResponse.transactionId })
    .eq('id', subscriptionId);

  await serviceSupabase
    .from('payments')
    .update({ payment_reference: dexchangeResponse.transactionId })
    .eq('subscription_id', subscriptionId)
    .eq('status', 'pending');

  return new Response(
    JSON.stringify({ success: true, paymentUrl: dexchangeResponse.PaymentUrl }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
};
