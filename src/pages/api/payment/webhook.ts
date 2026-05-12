import type { APIRoute } from 'astro';
import { createServiceRoleClient } from '../../../lib/supabase';
import { getTransactionStatus } from '../../../lib/dexchangeService';
import type { DexchangeWebhookPayload } from '../../../lib/dexchangeService';

async function processWebhook(
  dexchangeTransactionId: string,
  externalTransactionId: string,
  webhookAmount?: number
): Promise<{ status: number; body: Record<string, unknown> }> {
  if (!externalTransactionId.startsWith('PREV-')) {
    return { status: 400, body: { success: false, message: 'Transaction non reconnue' } };
  }

  // Format: PREV-{uuid} (initial) or PREV-{uuid}-R{timestamp} (retry)
  // UUID is always 36 chars: extract exactly those 36 chars after "PREV-"
  const afterPrefix = externalTransactionId.slice('PREV-'.length);
  const subscriptionId = afterPrefix.length >= 36 ? afterPrefix.slice(0, 36) : afterPrefix;

  let verifiedStatus: string;
  let verifiedExternalId: string | undefined;
  let verifiedAmount: number | undefined;

  try {
    const statusResponse = await getTransactionStatus(dexchangeTransactionId);
    verifiedStatus = statusResponse.transaction.Status;
    verifiedExternalId = statusResponse.transaction.ExternalTransactionId;
    verifiedAmount = statusResponse.transaction.Amount;
    console.log(`[Webhook] Verified status for ${dexchangeTransactionId}:`, verifiedStatus, 'amount:', verifiedAmount);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur inconnue';
    console.error('[Webhook] Failed to verify transaction with Dexchange API:', msg);
    return { status: 500, body: { success: false, message: 'Impossible de vérifier la transaction' } };
  }

  if (verifiedExternalId !== undefined && verifiedExternalId !== externalTransactionId) {
    console.error('[Webhook] externalTransactionId mismatch. Verified:', verifiedExternalId, 'Payload:', externalTransactionId);
    return { status: 403, body: { success: false, message: 'Transaction non autorisée (ID mismatch)' } };
  }

  const supabase = createServiceRoleClient();

  const { data: subscription, error: subError } = await supabase
    .from('subscriptions')
    .select('id, status, payment_reference, user_id, plan_id')
    .eq('id', subscriptionId)
    .single();

  if (subError || !subscription) {
    console.error('[Webhook] Subscription not found:', subscriptionId, subError);
    return { status: 404, body: { success: false, message: 'Abonnement non trouvé' } };
  }

  if (
    subscription.payment_reference &&
    subscription.payment_reference !== dexchangeTransactionId
  ) {
    console.error('[Webhook] Transaction ID mismatch. DB:', subscription.payment_reference, 'Received:', dexchangeTransactionId);
    return { status: 403, body: { success: false, message: 'Transaction non autorisée (ref mismatch)' } };
  }

  if (verifiedAmount !== undefined && webhookAmount !== undefined) {
    const { data: plan, error: planErr } = await supabase
      .from('subscription_plans')
      .select('price')
      .eq('id', subscription.plan_id)
      .single();

    if (planErr || !plan) {
      console.error('[Webhook] Could not load plan for amount check:', planErr);
      return { status: 500, body: { success: false, message: 'Erreur de vérification du montant' } };
    }

    if (Math.round(verifiedAmount) !== Math.round(plan.price)) {
      console.error('[Webhook] Amount mismatch. Expected:', plan.price, 'Verified:', verifiedAmount);
      return { status: 403, body: { success: false, message: 'Montant incohérent' } };
    }
  }

  if (subscription.status === 'active') {
    console.log(`[Webhook] Subscription ${subscriptionId} already active, skipping`);
    return { status: 200, body: { success: true, message: 'Déjà traité' } };
  }

  if (verifiedStatus === 'SUCCESS') {
    const { error: cancelPrevError } = await supabase
      .from('subscriptions')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('user_id', subscription.user_id)
      .eq('status', 'active')
      .neq('id', subscriptionId);

    if (cancelPrevError) {
      console.error('[Webhook] Error cancelling previous subscription:', cancelPrevError);
      return { status: 500, body: { success: false, message: "Erreur lors de la mise à jour de l'abonnement précédent" } };
    }

    const { error: activateError } = await supabase
      .from('subscriptions')
      .update({
        status: 'active',
        payment_reference: dexchangeTransactionId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', subscriptionId);

    if (activateError) {
      console.error('[Webhook] Error activating subscription:', activateError);
      return { status: 500, body: { success: false, message: "Erreur d'activation de l'abonnement" } };
    }

    const { error: paymentUpdateError } = await supabase
      .from('payments')
      .update({ status: 'completed' })
      .eq('subscription_id', subscriptionId)
      .eq('status', 'pending');

    if (paymentUpdateError) {
      console.error('[Webhook] Error updating payment status:', paymentUpdateError);
    }

    console.log(`[Webhook] Subscription ${subscriptionId} activated successfully`);

  } else if (verifiedStatus === 'FAILED' || verifiedStatus === 'CANCELLED' || verifiedStatus === 'EXPIRED') {
    const { error: cancelError } = await supabase
      .from('subscriptions')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', subscriptionId);

    if (cancelError) {
      console.error('[Webhook] Error cancelling subscription:', cancelError);
      return { status: 500, body: { success: false, message: "Erreur lors de l'annulation" } };
    }

    const { error: paymentFailError } = await supabase
      .from('payments')
      .update({ status: 'failed' })
      .eq('subscription_id', subscriptionId)
      .eq('status', 'pending');

    if (paymentFailError) {
      console.error('[Webhook] Error updating payment to failed:', paymentFailError);
    }

    console.log(`[Webhook] Subscription ${subscriptionId} cancelled (status: ${verifiedStatus})`);
  } else {
    console.log(`[Webhook] Status still pending: ${verifiedStatus}, no action taken`);
  }

  return { status: 200, body: { success: true } };
}

function checkSecret(url: URL): boolean {
  const webhookSecret = import.meta.env.DEXCHANGE_WEBHOOK_SECRET;
  if (!webhookSecret) return false;
  const incoming = url.searchParams.get('wsec');
  return incoming === webhookSecret;
}

export const GET: APIRoute = async ({ url }) => {
  console.log('[Webhook GET] Received params:', Object.fromEntries(url.searchParams));

  if (!checkSecret(url)) {
    return new Response('Unauthorized', { status: 401 });
  }

  const transactionId =
    url.searchParams.get('transactionId') ||
    url.searchParams.get('id') ||
    url.searchParams.get('transaction_id');

  const externalId =
    url.searchParams.get('externalTransactionId') ||
    url.searchParams.get('external_transaction_id') ||
    url.searchParams.get('ref');

  // If Dexchange didn't pass IDs in params, use the sub param (subscriptionId we embedded)
  if (!transactionId || !externalId) {
    const subscriptionId = url.searchParams.get('sub');
    if (!subscriptionId) {
      console.warn('[Webhook GET] Missing transaction IDs and sub param — cannot process');
      return new Response('OK', { status: 200 });
    }

    const supabase = createServiceRoleClient();
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('id, payment_reference, status')
      .eq('id', subscriptionId)
      .single();

    if (!sub?.payment_reference) {
      console.warn('[Webhook GET] No payment_reference for subscription:', subscriptionId);
      return new Response('OK', { status: 200 });
    }

    if (sub.status === 'active') {
      console.log('[Webhook GET] Subscription already active:', subscriptionId);
      return new Response('OK', { status: 200 });
    }

    console.log('[Webhook GET] Verifying via sub param — dexchangeId:', sub.payment_reference);
    // Verify status with Dexchange and use subscriptionId directly
    let verifiedStatus: string;
    try {
      const statusResponse = await getTransactionStatus(sub.payment_reference);
      verifiedStatus = statusResponse.transaction.Status;
      console.log('[Webhook GET] Verified status:', verifiedStatus, 'for sub:', subscriptionId);
    } catch (err) {
      console.error('[Webhook GET] Failed to verify transaction:', err);
      return new Response('OK', { status: 200 });
    }

    if (verifiedStatus === 'SUCCESS') {
      // Get user_id to cancel any other active subscription
      const { data: fullSub } = await supabase
        .from('subscriptions')
        .select('user_id')
        .eq('id', subscriptionId)
        .single();

      if (fullSub?.user_id) {
        await supabase
          .from('subscriptions')
          .update({ status: 'cancelled', updated_at: new Date().toISOString() })
          .eq('user_id', fullSub.user_id)
          .eq('status', 'active')
          .neq('id', subscriptionId);
      }

      await supabase
        .from('subscriptions')
        .update({ status: 'active', updated_at: new Date().toISOString() })
        .eq('id', subscriptionId);

      await supabase
        .from('payments')
        .update({ status: 'completed' })
        .eq('subscription_id', subscriptionId)
        .eq('status', 'pending');

      console.log('[Webhook GET] Subscription activated via sub param:', subscriptionId);
    } else if (['FAILED', 'CANCELLED', 'EXPIRED'].includes(verifiedStatus)) {
      await supabase
        .from('subscriptions')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('id', subscriptionId);

      await supabase
        .from('payments')
        .update({ status: 'failed' })
        .eq('subscription_id', subscriptionId)
        .eq('status', 'pending');

      console.log('[Webhook GET] Subscription cancelled via sub param:', subscriptionId, verifiedStatus);
    } else {
      console.log('[Webhook GET] Status still pending:', verifiedStatus);
    }

    return new Response('OK', { status: 200 });
  }

  const result = await processWebhook(transactionId, externalId);
  return new Response(JSON.stringify(result.body), {
    status: result.status,
    headers: { 'Content-Type': 'application/json' },
  });
};

export const POST: APIRoute = async ({ request, url }) => {
  const webhookSecret = import.meta.env.DEXCHANGE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('[Webhook POST] DEXCHANGE_WEBHOOK_SECRET is not configured');
    return new Response(
      JSON.stringify({ success: false, message: 'Service non configuré' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }

  if (!checkSecret(url)) {
    return new Response(
      JSON.stringify({ success: false, message: 'Non autorisé' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  let payload: DexchangeWebhookPayload;
  try {
    payload = (await request.json()) as DexchangeWebhookPayload;
  } catch {
    return new Response(
      JSON.stringify({ success: false, message: 'Corps de requête invalide' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const { externalTransactionId, STATUS, id: dexchangeTransactionId, AMOUNT: webhookAmount } = payload;

  if (!externalTransactionId || !STATUS || !dexchangeTransactionId) {
    return new Response(
      JSON.stringify({ success: false, message: 'Payload invalide' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const result = await processWebhook(dexchangeTransactionId, externalTransactionId, webhookAmount);
  return new Response(JSON.stringify(result.body), {
    status: result.status,
    headers: { 'Content-Type': 'application/json' },
  });
};
