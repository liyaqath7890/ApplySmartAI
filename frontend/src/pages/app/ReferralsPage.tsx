import React from 'react';
import toast from 'react-hot-toast';
import { Share2, Users } from 'lucide-react';
import { PageHeader, Button, EmptyState, Badge } from '@/shared/components/ui';
import { useReferralsStore } from '@/store';

export default function ReferralsPage() {
  const { referrals, stats, requestReferral } = useReferralsStore();

  const handleRequest = (id: string, role: string) => {
    requestReferral(id);
    toast.success(`Referral request sent for ${role}`);
  };

  const statusVariant = (status: string) => {
    switch (status) {
      case 'completed': return 'success' as const;
      case 'requested': return 'warning' as const;
      case 'accepted': return 'info' as const;
      default: return 'default' as const;
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Referral Opportunities" subtitle="Get referrals from your network" icon={Share2} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-gradient-to-br from-primary-50 to-blue-50 rounded-xl border border-primary-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Referral Stats</h3>
            <div className="space-y-4">
              <div><div className="text-2xl font-bold text-primary-600">{stats.total}</div><div className="text-sm text-gray-600">Total Referrals</div></div>
              <div><div className="text-2xl font-bold text-emerald-600">{stats.successful}</div><div className="text-sm text-gray-600">Successful Referrals</div></div>
              <div><div className="text-2xl font-bold text-amber-600">{stats.bonusEarned}</div><div className="text-sm text-gray-600">Total Bonus Earned</div></div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          {referrals.length === 0 ? (
            <EmptyState icon={Share2} title="No referral opportunities" description="Check back later for new referral openings" />
          ) : (
            referrals.map((referral) => (
              <div key={referral.id} className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{referral.role}</h3>
                    <p className="text-sm text-gray-600">{referral.company}</p>
                    {referral.location && <p className="text-xs text-gray-500 mt-1">{referral.location}</p>}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium">{referral.bonus}</span>
                    <Badge variant={statusVariant(referral.status)}>{referral.status}</Badge>
                  </div>
                </div>
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-700"><Users className="h-4 w-4" /><span>Referrer: {referral.referrer}</span></div>
                  <div className="text-sm text-gray-500">{referral.posted}</div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline">View Details</Button>
                  <Button disabled={referral.status !== 'open'} onClick={() => handleRequest(referral.id, referral.role)}>
                    {referral.status === 'open' ? 'Request Referral' : 'Requested'}
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
