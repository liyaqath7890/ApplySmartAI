import React from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { billingService, Plan } from '../api/services/billingService';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

const BillingPage: React.FC = () => {
  const { isAuthenticated } = useAuthStore();

  const { data: plansData, isLoading: plansLoading } = useQuery({
    queryKey: ['plans'],
    queryFn: () => billingService.getPlans(),
    enabled: isAuthenticated
  });

  const { data: subscriptionData, isLoading: subscriptionLoading } = useQuery({
    queryKey: ['subscription'],
    queryFn: () => billingService.getSubscription(),
    enabled: isAuthenticated
  });

  const checkoutMutation = useMutation({
    mutationFn: (planId: string) => billingService.createCheckoutSession(planId),
    onSuccess: (data) => {
      window.location.href = data.url;
    }
  });

  const cancelMutation = useMutation({
    mutationFn: () => billingService.cancelSubscription(),
    onSuccess: () => {
      toast.success('Subscription cancelled');
    }
  });

  if (!isAuthenticated) return <div>Please log in</div>;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-center">Pricing Plans</h1>

      {subscriptionData?.subscription && (
        <div className="mb-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-800">Current Plan</h3>
          <p className="text-blue-700">{subscriptionData.subscription.plan?.name}</p>
          <p className="text-sm text-blue-600 mt-1">
            Status: {subscriptionData.subscription.status}
          </p>
          {subscriptionData.subscription.status === 'active' && (
            <button
              onClick={() => cancelMutation.mutate()}
              className="mt-2 text-sm text-red-600 hover:text-red-700"
            >
              Cancel Subscription
            </button>
          )}
        </div>
      )}

      {plansLoading ? (
        <div className="text-center py-12">Loading plans...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plansData?.plans.map((plan) => (
            <div
              key={plan.id}
              className={`border rounded-lg p-6 ${
                plan.isPopular ? 'border-blue-600 shadow-lg scale-105' : ''
              }`}
            >
              {plan.isPopular && (
                <div className="bg-blue-600 text-white text-xs font-semibold px-3 py-1 rounded-full inline-block mb-4">
                  Most Popular
                </div>
              )}
              <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
              <p className="text-gray-600 mb-4">{plan.description}</p>
              <div className="mb-4">
                <span className="text-4xl font-bold">${plan.price}</span>
                <span className="text-gray-600">/{plan.billingPeriod}</span>
              </div>
              <ul className="space-y-2 mb-6">
                {plan.features?.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {String(feature)}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => checkoutMutation.mutate(plan.id)}
                className={`w-full py-2 rounded-lg font-medium ${
                  plan.isPopular
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                }`}
              >
                {subscriptionData?.subscription?.planId === plan.id ? 'Current Plan' : 'Subscribe'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BillingPage;
