export interface SubscriptionPlan {
  id: string;
  name: string;
  display_name: string;
  description: string | null;
  price: number | null;
  billing_period: 'monthly' | 'quarterly' | 'yearly';
  features: string[];
  is_active: boolean;
  sort_order: number;
  tier_level: number | null;
  target_roles: string[];
  is_quote_required: boolean;
  token_limits: Record<string, number> | null;
  created_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: SubscriptionStatus;
  contract_number: string | null;
  payment_reference: string | null;
  payment_method: PaymentMethod | null;
  starts_at: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
  plan?: SubscriptionPlan;
}

export type SubscriptionStatus = 'pending' | 'active' | 'expired' | 'cancelled';

export type PaymentMethod = 'om' | 'wave' | 'card' | 'mock' | 'dexchange';

export interface SubscriptionWithPlan extends Subscription {
  plan: SubscriptionPlan;
}

export const QUOTE_REQUIRED_PLANS = ['entreprise', 'expatrie'];

export const PLAN_BADGES: Record<string, { color: string; label: string }> = {
  essentiel: { color: 'bg-blue-100 text-blue-800', label: 'Basique' },
  serenite: { color: 'bg-purple-100 text-purple-800', label: 'Silver' },
  integral: { color: 'bg-amber-100 text-amber-800', label: 'Gold' },
  entreprise: { color: 'bg-gray-100 text-gray-800', label: 'Employeurs' },
  delegate: { color: 'bg-green-100 text-green-800', label: 'Délégués' },
  expatrie: { color: 'bg-indigo-100 text-indigo-800', label: 'Expatriés' },
};

export const STATUS_LABELS: Record<SubscriptionStatus, { color: string; label: string }> = {
  pending: { color: 'bg-yellow-100 text-yellow-800', label: 'En attente' },
  active: { color: 'bg-green-100 text-green-800', label: 'Actif' },
  expired: { color: 'bg-red-100 text-red-800', label: 'Expiré' },
  cancelled: { color: 'bg-gray-100 text-gray-800', label: 'Annulé' },
};

export function isQuoteRequired(plan: SubscriptionPlan): boolean {
  if (plan.is_quote_required) return true;
  return QUOTE_REQUIRED_PLANS.includes(plan.name);
}

export function isPriceOnDemand(price: number | null | undefined): boolean {
  return price === null || price === 0;
}

export function getBillingLabel(period: string | null | undefined): string {
  switch (period) {
    case 'quarterly': return '/trimestre';
    case 'yearly': return '/an';
    default: return '/mois';
  }
}