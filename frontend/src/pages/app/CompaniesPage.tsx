import React, { useMemo, useState } from 'react';
import { Building2, TrendingUp, Users, MapPin, Award, Briefcase, Search, Bookmark } from 'lucide-react';
import { PageHeader, Button, EmptyState, Skeleton, Badge } from '@/shared/components/ui';
import { useCompaniesStore, Company } from '@/store';
import toast from 'react-hot-toast';

export default function CompaniesPage() {
  const { companies, searchQuery, industryFilter, setSearchQuery, setIndustryFilter, toggleSave, isLoading } = useCompaniesStore();
  const [selected, setSelected] = useState<Company | null>(null);

  const industries = useMemo(() => ['All', ...new Set(companies.map((c) => c.industry))], [companies]);

  const filtered = useMemo(() => {
    return companies.filter((c) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = !q || c.name.toLowerCase().includes(q) || c.industry.toLowerCase().includes(q);
      const matchesIndustry = industryFilter === 'All' || c.industry === industryFilter;
      return matchesSearch && matchesIndustry;
    });
  }, [companies, searchQuery, industryFilter]);

  return (
    <div className="space-y-6">
      <PageHeader title="Company Intelligence" subtitle="Discover companies that match your career goals" icon={Building2}>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => window.location.href = '/app/companies/saved'} className="mr-2">
            <Bookmark className="h-4 w-4 mr-2" /> Saved
          </Button>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input type="text" placeholder="Search companies..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
          <select value={industryFilter} onChange={(e) => setIndustryFilter(e.target.value)} className="p-2 border border-gray-300 rounded-lg text-sm">
            {industries.map((ind) => <option key={ind} value={ind}>{ind}</option>)}
          </select>
        </div>
      </PageHeader>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-72 rounded-xl" />)}</div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Building2} title="No companies found" description="Try adjusting your search or filters" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((company) => (
            <div key={company.id} className="bg-white rounded-xl border border-gray-200 p-6 hover:border-primary-300 transition-colors">
              <div className="flex items-start justify-between mb-4">
                <div className="h-12 w-12 rounded-lg bg-primary-100 flex items-center justify-center"><Building2 className="h-6 w-6 text-primary-600" /></div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 text-yellow-600"><Award className="h-4 w-4" /><span className="text-sm font-medium">{company.rating}</span></div>
                  <button onClick={() => { toggleSave(company.id); toast.success(company.isSaved ? 'Removed from saved' : 'Company saved'); }}>
                    <Bookmark className={`h-5 w-5 ${company.isSaved ? 'fill-primary-600 text-primary-600' : 'text-gray-400'}`} />
                  </button>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">{company.name}</h3>
              <p className="text-sm text-gray-600 mb-4">{company.industry}</p>
              <div className="space-y-2 text-sm text-gray-700 mb-4">
                <div className="flex items-center gap-2"><Users className="h-4 w-4" /><span>{company.size} employees</span></div>
                <div className="flex items-center gap-2"><MapPin className="h-4 w-4" /><span>{company.location}</span></div>
                <div className="flex items-center gap-2"><Briefcase className="h-4 w-4" /><span>{company.hiring} open roles</span></div>
              </div>
              <div className="flex flex-wrap gap-2 mb-4">
                {company.freshers && <Badge variant="success">Freshers</Badge>}
                {company.remote && <Badge variant="info">Remote</Badge>}
                <Badge variant="warning">{company.growth} Growth</Badge>
              </div>
              <Button variant="outline" className="w-full" onClick={() => window.location.href = `/app/companies/${company.id}`}>View Details</Button>
            </div>
          ))}
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-xl max-w-lg w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-2">{selected.name}</h2>
            <p className="text-gray-600 mb-4">{selected.description || `${selected.name} is a ${selected.industry} company with ${selected.size} employees.`}</p>
            <div className="grid grid-cols-2 gap-4 text-sm mb-4">
              <div><span className="text-gray-500">Rating</span><p className="font-semibold">{selected.rating}/5</p></div>
              <div><span className="text-gray-500">Open Roles</span><p className="font-semibold">{selected.hiring}</p></div>
              <div><span className="text-gray-500">Location</span><p className="font-semibold">{selected.location}</p></div>
              <div><span className="text-gray-500">Growth</span><p className="font-semibold flex items-center gap-1"><TrendingUp className="h-4 w-4" />{selected.growth}</p></div>
            </div>
            <Button onClick={() => setSelected(null)}>Close</Button>
          </div>
        </div>
      )}
    </div>
  );
}
