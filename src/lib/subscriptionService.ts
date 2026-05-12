import type { SupabaseClient } from '@supabase/supabase-js';
import type { SubscriptionPlan, Subscription, SubscriptionWithPlan } from '../types/subscription';
import type { Payment } from '../types/payments';

export class SubscriptionService {
  private supabase: SupabaseClient;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  async getPlans(): Promise<SubscriptionPlan[]> {
    const { data, error } = await this.supabase
      .from('subscription_plans')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error fetching plans:', error);
      return [];
    }

    return data || [];
  }

  async getPlanByName(name: string): Promise<SubscriptionPlan | null> {
    const { data, error } = await this.supabase
      .from('subscription_plans')
      .select('*')
      .eq('name', name)
      .eq('is_active', true)
      .single();

    if (error) {
      console.error('Error fetching plan:', error);
      return null;
    }

    return data;
  }

  async getPlansByRole(role: string): Promise<SubscriptionPlan[]> {
    const { data, error } = await this.supabase
      .from('subscription_plans')
      .select('*')
      .eq('is_active', true)
      .contains('target_roles', [role])
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error fetching plans by role:', error);
      return [];
    }

    return data || [];
  }

  async getUserSubscription(userId: string): Promise<SubscriptionWithPlan | null> {
    const { data, error } = await this.supabase
      .from('subscriptions')
      .select(`
        *,
        plan:subscription_plans(*)
      `)
      .eq('user_id', userId)
      .in('status', ['active', 'pending'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      console.error('Error fetching subscription:', error);
      return null;
    }

    return data;
  }

  async createSubscription(
    userId: string,
    planId: string,
    paymentMethod: string,
    paymentReference: string,
    billingPeriod: string = 'monthly'
  ): Promise<Subscription | null> {
    const startsAt = new Date();
    const expiresAt = new Date();
    if (billingPeriod === 'quarterly') {
      expiresAt.setMonth(expiresAt.getMonth() + 3);
    } else if (billingPeriod === 'yearly') {
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    } else {
      expiresAt.setMonth(expiresAt.getMonth() + 1);
    }

    const { data, error } = await this.supabase
      .from('subscriptions')
      .insert({
        user_id: userId,
        plan_id: planId,
        status: 'active',
        payment_method: paymentMethod,
        payment_reference: paymentReference,
        starts_at: startsAt.toISOString(),
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating subscription:', error);
      return null;
    }

    return data;
  }

  async cancelSubscription(subscriptionId: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('subscriptions')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('id', subscriptionId);

    if (error) {
      console.error('Error cancelling subscription:', error);
      return false;
    }

    return true;
  }

  async getUserPayments(userId: string): Promise<Payment[]> {
    const { data, error } = await this.supabase
      .from('payments')
      .select(`
        *,
        subscription:subscriptions(
          id,
          plan:subscription_plans(display_name)
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching payments:', error);
      return [];
    }

    return data || [];
  }

  async createPayment(
    userId: string,
    subscriptionId: string,
    amount: number,
    paymentMethod: string,
    paymentReference: string
  ): Promise<Payment | null> {
    const { data, error } = await this.supabase
      .from('payments')
      .insert({
        user_id: userId,
        subscription_id: subscriptionId,
        amount,
        payment_method: paymentMethod,
        payment_reference: paymentReference,
        status: 'completed',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating payment:', error);
      return null;
    }

    return data;
  }

  async getSubscriptionHistory(userId: string): Promise<Subscription[]> {
    const { data, error } = await this.supabase
      .from('subscriptions')
      .select(`
        *,
        plan:subscription_plans(*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching subscription history:', error);
      return [];
    }

    return data || [];
  }
}