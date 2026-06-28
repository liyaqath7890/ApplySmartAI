import React from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { CreditCard } from 'lucide-react';
import { PageHeader, StatsGridSkeleton, Button } from '@/shared/components/ui';
import { billingService } from '@/api/services/billingService';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

export default function AppBillingPage() {
  const { isAuthenticated } = useAuthStore();

  const { data: plansData, isLoading: plansLoading } = useQuery({
    queryKey: ['plans'],
    queryFn: () => billingService.getPlans(),
    enabled: isAuthenticated,
    retry: false,
  });

  const { data: subscriptionData } = useQuery({
    queryKey: ['subscription'],
    queryFn: () => billingService.getSubscription(),
    enabled: isAuthenticated,
    retry: false,
  });

  const checkoutMutation = useMutation({
    mutationFn: (planId: string) => billingService.createCheckoutSession(planId),
    onSuccess: (data) => { window.location.href = data.url; },
    onError: () => toast.error('Checkout unavailable — demo mode'),
  });

  const cancelMutation = useMutation({
    mutationFn: () => billingService.cancelSubscription(),
    onSuccess: () => toast.success('Subscription cancelled'),
    onError: () => toast.error('Unable to cancel subscription'),
  });

  const demoPlans = [
    { id: 'free', name: 'Free', description: 'Get started with basic features', price: 0, billingPeriod: 'month', features: ['Job Discovery', 'Master Profile', '5 AI credits/month'], isPopular: false },
    { id: 'pro', name: 'Pro', description: 'Full access to Career OS', price: 29, billingPeriod: 'month', features: ['Unlimited AI tools', 'Interview Simulator', 'Career Twin', 'Priority support'], isPopular: true },
    { id: 'team', name: 'Team', description: 'For career coaches and teams', price: 99, billingPeriod: 'month', features: ['Everything in Pro', 'Team dashboard', 'Custom branding', 'API access'], isPopular: false },
  ];

  const plans = plansData?.plans?.length ? plansData.plans : demoPlans;

  if (plansLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Billing" subtitle="Manage your subscription and plans" icon={CreditCard} />
        <StatsGridSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Billing" subtitle="Manage your subscription and plans" icon={CreditCard} />

      {subscriptionData?.subscription && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <h3 className="font-semibold text-blue-800">Current Plan</h3>
          <p className="text-blue-700">{subscriptionData.subscription.plan?.name}</p>
          <p className="text-sm text-blue-600 mt-1">Status: {subscriptionData.subscription.status}</p>
          {subscriptionData.subscription.status === 'active' && (
            <button onClick={() => cancelMutation.mutate()} className="mt-2 text-sm text-red-600 hover:text-red-700">Cancel Subscription</button>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <div key={plan.id} className={`border rounded-xl p-6 bg-white ${plan.isPopular ? 'border-primary-600 shadow-lg ring-2 ring-primary-100' : 'border-gray-200'}`}>
            {plan.isPopular && <div className="bg-primary-600 text-white text-xs font-semibold px-3 py-1 rounded-full inline-block mb-4">Most Popular</div>}
            <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
            <p className="text-gray-600 mb-4 text-sm">{plan.description}</p>
            <div className="mb-4">
              <span className="text-4xl font-bold">${plan.price}</span>
              <span className="text-gray-600">/{plan.billingPeriod}</span>
            </div>
            <ul className="space-y-2 mb-6">
              {plan.features?.map((feature, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-gray-700">
                  <span className="text-emerald-500">✓</span>{String(feature)}
                </li>
              ))}
            </ul>
            <Button
              className="w-full"
              variant={plan.isPopular ? 'primary' : 'outline'}
              onClick={() => checkoutMutation.mutate(plan.id)}
              disabled={checkoutMutation.isPending}
            >
              {subscriptionData?.subscription?.planId === plan.id ? 'Current Plan' : 'Subscribe'}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
