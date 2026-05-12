import type { APIRoute } from 'astro';
import { createClient } from '../../lib/supabase';
import { QuoteRequestService } from '../../lib/quoteRequestService';

export const POST: APIRoute = async ({ request, cookies }) => {
  const supabase = createClient({ request: request, cookies });
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return new Response(JSON.stringify({ success: false, message: 'Non authentifié' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ success: false, message: 'Requête invalide' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  const planId = body.planId as string | undefined;
  const companyName = body.companyName as string | undefined;
  const numberOfEmployees = body.numberOfEmployees ? Number(body.numberOfEmployees) : undefined;
  const desiredServices = body.desiredServices as string[] | undefined;
  const message = (body.message as string) || '';
  const country = body.country as string | undefined;

  if (!planId) {
    return new Response(JSON.stringify({ success: false, message: 'Plan manquant' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  if (!desiredServices || desiredServices.length === 0) {
    return new Response(JSON.stringify({ success: false, message: 'Veuillez sélectionner au moins un service' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  const quoteService = new QuoteRequestService(supabase);
  const result = await quoteService.createQuoteRequest(user.id, planId, {
    companyName,
    numberOfEmployees,
    desiredServices,
    message: [message, country ? `Pays de résidence : ${country}` : ''].filter(Boolean).join('\n'),
  });

  if (!result) {
    return new Response(JSON.stringify({ success: false, message: 'Erreur lors de la création de la demande' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }

  return new Response(JSON.stringify({ success: true, quoteRequestId: result.id }), { status: 200, headers: { 'Content-Type': 'application/json' } });
};