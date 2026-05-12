import type { SupabaseClient } from '@supabase/supabase-js';

export type ConsultationCategory = 'employee' | 'technician' | 'expatriate' | 'executive';
export type ConsultationType = 'electronic' | 'in_person';
export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';
export type BookingPaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';

export interface ConsultationBooking {
  id: string;
  user_id: string | null;
  contact_info: Record<string, unknown>;
  profile_category: ConsultationCategory;
  price: number;
  consultation_type: ConsultationType;
  preferred_date: string | null;
  preferred_time: string | null;
  subject: string;
  message: string | null;
  payment_method: string | null;
  payment_reference: string | null;
  payment_status: BookingPaymentStatus;
  status: BookingStatus;
  created_at: string;
  updated_at: string;
}

export const CONSULTATION_PRICES: Record<ConsultationCategory, number> = {
  employee: 15000,
  technician: 25000,
  expatriate: 40000,
  executive: 42900,
};

export const CONSULTATION_CATEGORY_LABELS: Record<ConsultationCategory, string> = {
  employee: 'Employé',
  technician: 'Agent de maîtrise / Technicien',
  expatriate: 'Expatrié',
  executive: 'Cadre',
};

export class ConsultationBookingService {
  private supabase: SupabaseClient;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  async createBooking(
    userId: string | null,
    details: {
      profileCategory: ConsultationCategory;
      consultationType: ConsultationType;
      preferredDate?: string;
      preferredTime?: string;
      subject: string;
      message?: string;
      contactInfo?: Record<string, unknown>;
    }
  ): Promise<ConsultationBooking | null> {
    const price = CONSULTATION_PRICES[details.profileCategory];

    const { data, error } = await this.supabase
      .from('consultation_bookings')
      .insert({
        user_id: userId,
        contact_info: details.contactInfo || {},
        profile_category: details.profileCategory,
        price,
        consultation_type: details.consultationType,
        preferred_date: details.preferredDate || null,
        preferred_time: details.preferredTime || null,
        subject: details.subject,
        message: details.message || null,
        status: 'pending',
        payment_status: 'pending',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating consultation booking:', error);
      return null;
    }

    return data;
  }

  async getUserBookings(userId: string): Promise<ConsultationBooking[]> {
    const { data, error } = await this.supabase
      .from('consultation_bookings')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching consultation bookings:', error);
      return [];
    }

    return data || [];
  }

  async updatePaymentStatus(
    id: string,
    paymentStatus: BookingPaymentStatus,
    paymentMethod?: string,
    paymentReference?: string
  ): Promise<boolean> {
    const update: Record<string, unknown> = {
      payment_status: paymentStatus,
      updated_at: new Date().toISOString(),
    };
    if (paymentMethod) update.payment_method = paymentMethod;
    if (paymentReference) update.payment_reference = paymentReference;

    const { error } = await this.supabase
      .from('consultation_bookings')
      .update(update)
      .eq('id', id);

    if (error) {
      console.error('Error updating booking payment status:', error);
      return false;
    }

    return true;
  }
}