import type { APIRoute } from 'astro';
import { createClient } from '../../../lib/supabase';
import { TicketService } from '../../../lib/ticketService';

export const POST: APIRoute = async ({ request, cookies }) => {
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
    const ticketId = formData.get('ticketId') as string;
    const message = formData.get('message') as string;

    if (!ticketId || !message) {
      return new Response(
        JSON.stringify({ success: false, message: 'Tous les champs sont requis' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const ticketService = new TicketService(supabase);
    
    const ticket = await ticketService.getTicketById(ticketId, authData.user.id);
    if (!ticket) {
      return new Response(
        JSON.stringify({ success: false, message: 'Ticket non trouvé' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const newMessage = await ticketService.addMessage(
      ticketId,
      authData.user.id,
      message
    );

    if (!newMessage) {
      return new Response(
        JSON.stringify({ success: false, message: 'Erreur lors de l\'envoi du message' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Message envoyé avec succès',
        data: newMessage,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Reply ticket error:', error);
    return new Response(
      JSON.stringify({ success: false, message: 'Une erreur est survenue' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
