import type { APIRoute } from 'astro';
import { createServiceRoleClient } from '../../lib/supabase';

export const POST: APIRoute = async ({ request }) => {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return new Response(
      JSON.stringify({ success: false, message: 'Requête invalide' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const name = (body.name as string) || '';
  const email = body.email as string | undefined;
  const subject = body.subject as string | undefined;
  const message = body.message as string | undefined;
  const category = (body.category as string) || 'general';

  if (!email || !subject || !message) {
    return new Response(
      JSON.stringify({ success: false, message: 'E-mail, sujet et message sont requis' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const supabase = createServiceRoleClient();

  const { error } = await supabase
    .from('support_tickets')
    .insert({
      name,
      email,
      subject,
      message,
      category,
      status: 'open',
    });

  if (error) {
    console.error('Contact form error:', error);
    return new Response(
      JSON.stringify({ success: false, message: 'Erreur lors de l\'envoi du message' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  return new Response(
    JSON.stringify({ success: true }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
};