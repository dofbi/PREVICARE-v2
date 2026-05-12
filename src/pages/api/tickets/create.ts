import type { APIRoute } from 'astro';
import { createClient } from '../../../lib/supabase';
import { TicketService } from '../../../lib/ticketService';
import type { TicketCategory, TicketPriority } from '../../../types/tickets';

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
    const category = formData.get('category') as TicketCategory;
    const subject = formData.get('subject') as string;
    const description = formData.get('description') as string;
    const priority = (formData.get('priority') as TicketPriority) || 'normal';

    if (!category || !subject || !description) {
      return new Response(
        JSON.stringify({ success: false, message: 'Tous les champs sont requis' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (description.length < 20) {
      return new Response(
        JSON.stringify({ success: false, message: 'La description doit contenir au moins 20 caractères' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const ticketService = new TicketService(supabase);
    const ticket = await ticketService.createTicket(
      authData.user.id,
      category,
      subject,
      description,
      priority
    );

    if (!ticket) {
      return new Response(
        JSON.stringify({ success: false, message: 'Erreur lors de la création du ticket' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Ticket créé avec succès',
        ticket: {
          id: ticket.id,
          ticket_number: ticket.ticket_number,
        },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Create ticket error:', error);
    return new Response(
      JSON.stringify({ success: false, message: 'Une erreur est survenue' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
