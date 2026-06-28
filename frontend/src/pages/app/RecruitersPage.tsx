import React, { useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Users, MessageSquare, Share2, Search } from 'lucide-react';
import { PageHeader, Button, EmptyState, Skeleton, Badge } from '@/shared/components/ui';
import { useRecruitersStore } from '@/store';
import { recruiterService } from '@/api/services/v2/recruiterService';

export default function RecruitersPage() {
  const { recruiters, searchQuery, setSearchQuery, setRecruiters, setLoading, isLoading } = useRecruitersStore();

  useQuery({ queryKey: ['recruiters'], queryFn: () => recruiterService.getRecruiters(), retry: false });

  useEffect(() => {
    setLoading(true);
    recruiterService.getRecruiters()
      .then((data) => {
        if (data.recruiters?.length) {
          setRecruiters(data.recruiters.map((r) => ({
            id: r.id,
            name: r.name,
            role: r.role || 'Recruiter',
            company: r.company || 'Unknown',
            location: 'Remote',
            email: r.email || undefined,
            linkedinUrl: r.linkedinUrl || undefined,
            hiring: r.tags || [],
            active: r.status !== 'inactive',
            status: r.status,
            lastContactAt: r.lastContactAt || undefined,
            notes: r.notes || undefined,
          })));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [setRecruiters, setLoading]);

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase();
    if (!q) return recruiters;
    return recruiters.filter((r) =>
      r.name.toLowerCase().includes(q) || r.company.toLowerCase().includes(q) || r.hiring.some((h) => h.toLowerCase().includes(q))
    );
  }, [recruiters, searchQuery]);

  const handleMessage = (name: string) => toast.success(`Opening message to ${name}`);
  const handleConnect = (name: string) => toast.success(`Connection request sent to ${name}`);

  return (
    <div className="space-y-6">
      <PageHeader title="Recruiter Discovery" subtitle="Connect with recruiters and hiring managers" icon={Users}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input type="text" placeholder="Search recruiters..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm" />
        </div>
      </PageHeader>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-64 rounded-xl" />)}</div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Users} title="No recruiters found" description="Try a different search term" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((recruiter) => (
            <div key={recruiter.id} className="bg-white rounded-xl border border-gray-200 p-6 hover:border-primary-300 transition-colors">
              <div className="flex items-start justify-between mb-4">
                <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center">
                  <span className="text-lg font-bold text-primary-600">{recruiter.name.charAt(0)}{recruiter.name.split(' ')[1]?.charAt(0) || ''}</span>
                </div>
                <div className={`h-3 w-3 rounded-full ${recruiter.active ? 'bg-emerald-500' : 'bg-gray-300'}`} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">{recruiter.name}</h3>
              <p className="text-sm text-primary-600 mb-1">{recruiter.role}</p>
              <p className="text-sm text-gray-600 mb-3">{recruiter.company}</p>
              <Badge variant={recruiter.status === 'engaged' ? 'success' : 'default'}>{recruiter.status}</Badge>
              <div className="flex flex-wrap gap-2 my-4">
                {recruiter.hiring.map((skill, i) => (
                  <span key={i} className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">{skill}</span>
                ))}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => handleMessage(recruiter.name)}><MessageSquare className="h-4 w-4 mr-1" />Message</Button>
                <Button className="flex-1" onClick={() => handleConnect(recruiter.name)}><Share2 className="h-4 w-4 mr-1" />Connect</Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
