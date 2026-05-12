import type { SupabaseClient } from '@supabase/supabase-js';
import type { SupportTicket, TicketMessage, TicketWithMessages, TicketCategory, TicketPriority } from '../types/tickets';

export class TicketService {
  private supabase: SupabaseClient;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  async getUserTickets(userId: string): Promise<SupportTicket[]> {
    const { data, error } = await this.supabase
      .from('support_tickets')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching tickets:', error);
      return [];
    }

    return data || [];
  }

  async getTicketById(ticketId: string, userId: string): Promise<TicketWithMessages | null> {
    const { data: ticket, error: ticketError } = await this.supabase
      .from('support_tickets')
      .select('*')
      .eq('id', ticketId)
      .eq('user_id', userId)
      .single();

    if (ticketError) {
      console.error('Error fetching ticket:', ticketError);
      return null;
    }

    const { data: messages, error: messagesError } = await this.supabase
      .from('ticket_messages')
      .select(`
        *,
        sender:profiles(first_name, last_name, avatar_url)
      `)
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true });

    if (messagesError) {
      console.error('Error fetching messages:', messagesError);
    }

    return {
      ...ticket,
      messages: messages || [],
    };
  }

  async createTicket(
    userId: string,
    category: TicketCategory,
    subject: string,
    description: string,
    priority: TicketPriority = 'normal'
  ): Promise<SupportTicket | null> {
    const { data: ticket, error: ticketError } = await this.supabase
      .from('support_tickets')
      .insert({
        user_id: userId,
        category,
        subject,
        description,
        priority,
        status: 'open',
      })
      .select()
      .single();

    if (ticketError) {
      console.error('Error creating ticket:', ticketError);
      return null;
    }

    await this.supabase
      .from('ticket_messages')
      .insert({
        ticket_id: ticket.id,
        sender_id: userId,
        message: description,
        attachments: [],
      });

    return ticket;
  }

  async addMessage(
    ticketId: string,
    senderId: string,
    message: string,
    attachments: any[] = []
  ): Promise<TicketMessage | null> {
    const { data, error } = await this.supabase
      .from('ticket_messages')
      .insert({
        ticket_id: ticketId,
        sender_id: senderId,
        message,
        attachments,
      })
      .select(`
        *,
        sender:profiles(first_name, last_name, avatar_url)
      `)
      .single();

    if (error) {
      console.error('Error adding message:', error);
      return null;
    }

    await this.supabase
      .from('support_tickets')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', ticketId);

    return data;
  }

  async updateTicketStatus(ticketId: string, status: SupportTicket['status']): Promise<boolean> {
    const { error } = await this.supabase
      .from('support_tickets')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', ticketId);

    if (error) {
      console.error('Error updating ticket status:', error);
      return false;
    }

    return true;
  }

  async getTicketStats(userId: string): Promise<{
    total: number;
    open: number;
    inProgress: number;
    resolved: number;
  }> {
    const { data, error } = await this.supabase
      .from('support_tickets')
      .select('status')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching ticket stats:', error);
      return { total: 0, open: 0, inProgress: 0, resolved: 0 };
    }

    const tickets = data || [];
    return {
      total: tickets.length,
      open: tickets.filter(t => t.status === 'open').length,
      inProgress: tickets.filter(t => t.status === 'in_progress').length,
      resolved: tickets.filter(t => t.status === 'resolved' || t.status === 'closed').length,
    };
  }
}
