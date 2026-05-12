import type { SupabaseClient } from '@supabase/supabase-js';

export type QuoteStatus = 'submitted' | 'in_review' | 'quoted' | 'accepted' | 'rejected';

export interface QuoteRequest {
  id: string;
  user_id: string;
  plan_id: string;
  company_name: string | null;
  number_of_employees: number | null;
  desired_services: string[];
  message: string;
  status: QuoteStatus;
  quoted_price: number | null;
  quoted_billing_period: string | null;
  admin_notes: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  plan?: { id: string; name: string; display_name: string };
}

export interface QuoteRequestWithPlan extends QuoteRequest {
  plan: NonNullable<QuoteRequest['plan']>;
}

export class QuoteRequestService {
  private supabase: SupabaseClient;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  async createQuoteRequest(
    userId: string,
    planId: string,
    details: {
      companyName?: string;
      numberOfEmployees?: number;
      desiredServices: string[];
      message: string;
    }
  ): Promise<QuoteRequest | null> {
    const { data, error } = await this.supabase
      .from('quote_requests')
      .insert({
        user_id: userId,
        plan_id: planId,
        company_name: details.companyName || null,
        number_of_employees: details.numberOfEmployees || null,
        desired_services: details.desiredServices,
        message: details.message,
        status: 'submitted',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating quote request:', error);
      return null;
    }

    return data;
  }

  async getUserQuoteRequests(userId: string): Promise<QuoteRequestWithPlan[]> {
    const { data, error } = await this.supabase
      .from('quote_requests')
      .select(`*, plan:subscription_plans(id, name, display_name)`)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching quote requests:', error);
      return [];
    }

    return (data || []).map((qr: any) => ({
      ...qr,
      plan: Array.isArray(qr.plan) ? qr.plan[0] : qr.plan,
    }));
  }

  async getQuoteRequestById(id: string, userId: string): Promise<QuoteRequestWithPlan | null> {
    const { data, error } = await this.supabase
      .from('quote_requests')
      .select(`*, plan:subscription_plans(id, name, display_name)`)
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching quote request:', error);
      return null;
    }

    if (!data) return null;

    return {
      ...data,
      plan: Array.isArray(data.plan) ? data.plan[0] : data.plan,
    };
  }

  async acceptQuote(id: string, userId: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('quote_requests')
      .update({ status: 'accepted', updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', userId)
      .eq('status', 'quoted');

    if (error) {
      console.error('Error accepting quote:', error);
      return false;
    }

    return true;
  }
}