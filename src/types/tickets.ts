export type TicketCategory = 'juridique' | 'contrat' | 'paie' | 'general';
export type TicketPriority = 'low' | 'normal' | 'high' | 'urgent';
export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

export interface SupportTicket {
  id: string;
  user_id: string;
  ticket_number: string;
  category: TicketCategory;
  subject: string;
  description: string;
  priority: TicketPriority;
  status: TicketStatus;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
}

export interface TicketMessage {
  id: string;
  ticket_id: string;
  sender_id: string;
  message: string;
  attachments: TicketAttachment[];
  created_at: string;
  sender?: {
    first_name: string;
    last_name: string;
    avatar_url: string | null;
  };
}

export interface TicketAttachment {
  name: string;
  url: string;
  type: string;
  size: number;
}

export interface TicketWithMessages extends SupportTicket {
  messages: TicketMessage[];
}

export const TICKET_CATEGORIES: Record<TicketCategory, { label: string; icon: string; color: string }> = {
  juridique: { label: 'Juridique', icon: '⚖️', color: 'bg-red-100 text-red-800' },
  // ipres: { label: 'IPRES / Retraite', icon: '📊', color: 'bg-green-100 text-green-800' },
  contrat: { label: 'Contrat de travail', icon: '📄', color: 'bg-blue-100 text-blue-800' },
  paie: { label: 'Paie / Salaire', icon: '💰', color: 'bg-amber-100 text-amber-800' },
  general: { label: 'Question générale', icon: '❓', color: 'bg-gray-100 text-gray-800' },
};

export const TICKET_PRIORITIES: Record<TicketPriority, { label: string; color: string }> = {
  low: { label: 'Basse', color: 'bg-gray-100 text-gray-800' },
  normal: { label: 'Normale', color: 'bg-blue-100 text-blue-800' },
  high: { label: 'Haute', color: 'bg-orange-100 text-orange-800' },
  urgent: { label: 'Urgente', color: 'bg-red-100 text-red-800' },
};

export const TICKET_STATUSES: Record<TicketStatus, { label: string; color: string }> = {
  open: { label: 'Ouvert', color: 'bg-blue-100 text-blue-800' },
  in_progress: { label: 'En cours', color: 'bg-yellow-100 text-yellow-800' },
  resolved: { label: 'Résolu', color: 'bg-green-100 text-green-800' },
  closed: { label: 'Fermé', color: 'bg-gray-100 text-gray-800' },
};
