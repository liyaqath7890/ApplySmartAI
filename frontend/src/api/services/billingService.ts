import axios from '../axios';

export interface Plan {
  id: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  billingPeriod: 'monthly' | 'yearly';
  stripePriceId: string | null;
  features: any[];
  limits: Record<string, any>;
  isActive: boolean;
  isPopular: boolean;
  orderIndex: number;
  createdAt: string;
}

export interface Subscription {
  id: string;
  userId: string;
  planId: string | null;
  stripeSubscriptionId: string | null;
  stripeCustomerId: string | null;
  status: 'active' | 'past_due' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'trialing' | 'unpaid';
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  createdAt: string;
  plan?: Plan;
}

export const billingService = {
  getPlans: async (): Promise<{ plans: Plan[] }> => {
    const response = await axios.get('/billing/plans');
    return response.data;
  },

  createCheckoutSession: async (planId: string): Promise<{ sessionId: string; url: string }> => {
    const response = await axios.post('/billing/checkout', { planId });
    return response.data;
  },

  getSubscription: async (): Promise<{ subscription: Subscription | null }> => {
    const response = await axios.get('/billing/subscription');
    return response.data;
  },

  cancelSubscription: async (): Promise<{ message: string }> => {
    const response = await axios.post('/billing/subscription/cancel');
    return response.data;
  }
};
