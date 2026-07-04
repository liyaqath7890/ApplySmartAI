import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Building2, Users, MapPin, Globe, Award, Briefcase, ChevronLeft, Bookmark, Brain, TrendingUp, AlertCircle } from 'lucide-react';
import { PageHeader, Button, Badge, Skeleton, EmptyState } from '@/shared/components/ui';
import axios from '@/api/axios';
import toast from 'react-hot-toast';

interface CompanyDetails {
  id: string;
  name: string;
  industry: string;
  category?: string;
  companySize: string;
  headquarters: string;
  description: string;
  website: string;
  companyRating: string;
  activeJobs: number;
  fresherFriendly: boolean;
  remoteAvailability: string;
  hybridAvailability: boolean;
  onsiteAvailability: boolean;
  foundedYear?: number;
  hiringStatus: string;
  technologiesUsed: string[];
  benefits: string[];
}

interface Insights {
  cultureSummary: string;
  hiringTrends: string;
  skillDemand: string[];
  interviewDifficulty: string;
  hiringProbability: string;
  salaryInsights: string;
}

export default function CompanyDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [company, setCompany] = useState<CompanyDetails | null>(null);
  const [insights, setInsights] = useState<Insights | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [compRes, insRes, intRes] = await Promise.all([
          axios.get(`/companies/${id}`),
          axios.get(`/companies/${id}/insights`).catch(() => ({ data: { insights: null } })),
          axios.get(`/companies/interactions`).catch(() => ({ data: { interactions: [] } }))
        ]);
        
        setCompany(compRes.data.company);
        if (insRes.data.insights) setInsights(insRes.data.insights);
        
        const interactions = intRes.data?.interactions || [];
        const inter = interactions.find((i: any) => i.companyId === id);
        if (inter) {
          setIsFollowing(inter.isFollowing);
          setIsBookmarked(inter.isBookmarked);
        }
      } catch (err) {
        toast.error('Failed to load company details');
      } finally {
        setLoading(false);
      }
    }
    if (id) fetchData();
  }, [id]);

  const toggleInteraction = async (type: 'follow' | 'bookmark') => {
    try {
      const payload = type === 'follow' ? { isFollowing: !isFollowing } : { isBookmarked: !isBookmarked };
      await axios.post(`/companies/${id}/interaction`, payload);
      if (type === 'follow') setIsFollowing(!isFollowing);
      else setIsBookmarked(!isBookmarked);
      toast.success(type === 'follow' 
        ? (!isFollowing ? 'Following company' : 'Unfollowed company') 
        : (!isBookmarked ? 'Bookmarked company' : 'Removed bookmark'));
    } catch (err) {
      toast.error(`Failed to ${type} company`);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-40 w-full rounded-xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="lg:col-span-2 h-96 rounded-xl" />
          <Skeleton className="h-96 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate('/app/companies')} className="mb-4">
          <ChevronLeft className="h-4 w-4 mr-2" /> Back to Companies
        </Button>
        <EmptyState icon={Building2} title="Company Not Found" description="The company you are looking for does not exist." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => navigate('/app/companies')} className="-ml-2 mb-2">
        <ChevronLeft className="h-4 w-4 mr-2" /> Back to Companies
      </Button>

      <div className="bg-white rounded-xl border border-gray-200 p-8 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="h-24 w-24 rounded-xl bg-primary-100 flex items-center justify-center shrink-0">
            <Building2 className="h-12 w-12 text-primary-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{company.name}</h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {company.headquarters || 'Remote'}</div>
              <div className="flex items-center gap-1"><Users className="h-4 w-4" /> {company.companySize || 'Unknown'} employees</div>
              <div className="flex items-center gap-1"><Globe className="h-4 w-4" /> <a href={company.website} target="_blank" rel="noreferrer" className="text-primary-600 hover:underline">Website</a></div>
              <div className="flex items-center gap-1"><Award className="h-4 w-4 text-yellow-500" /> {company.companyRating || 'N/A'} Rating</div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Button variant={isFollowing ? 'primary' : 'outline'} className="flex-1 md:flex-none" onClick={() => toggleInteraction('follow')}>
            {isFollowing ? 'Following' : 'Follow'}
          </Button>
          <Button variant="outline" className="p-2" onClick={() => toggleInteraction('bookmark')}>
            <Bookmark className={`h-5 w-5 ${isBookmarked ? 'fill-primary-600 text-primary-600' : ''}`} />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">About {company.name}</h2>
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{company.description || 'No description available.'}</p>
            
            <div className="mt-6 flex flex-wrap gap-2">
              {company.fresherFriendly && <Badge variant="success">Fresher Friendly</Badge>}
              {company.remoteAvailability && <Badge variant="info">Remote Options</Badge>}
              {company.hybridAvailability && <Badge variant="warning">Hybrid</Badge>}
            </div>
          </div>

          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-100 p-6">
            <div className="flex items-center gap-2 mb-6">
              <Brain className="h-6 w-6 text-indigo-600" />
              <h2 className="text-xl font-bold text-indigo-900">AI Company Insights</h2>
            </div>
            
            {insights ? (
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-indigo-900 mb-2">Culture Summary</h3>
                  <p className="text-indigo-800/80 text-sm">{insights.cultureSummary}</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white/60 p-4 rounded-lg">
                    <h3 className="font-semibold text-indigo-900 mb-1 flex items-center gap-2"><TrendingUp className="h-4 w-4" /> Hiring Trends</h3>
                    <p className="text-indigo-800/80 text-sm">{insights.hiringTrends}</p>
                  </div>
                  <div className="bg-white/60 p-4 rounded-lg">
                    <h3 className="font-semibold text-indigo-900 mb-1">Interview Difficulty</h3>
                    <p className="text-indigo-800/80 text-sm">{insights.interviewDifficulty}</p>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-indigo-900 mb-2">Top Skills in Demand</h3>
                  <div className="flex flex-wrap gap-2">
                    {insights.skillDemand.map(skill => <Badge key={skill} className="bg-indigo-100 text-indigo-700">{skill}</Badge>)}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <AlertCircle className="h-8 w-8 text-indigo-300 mx-auto mb-3" />
                <p className="text-indigo-600 font-medium">AI Insights are being generated...</p>
                <p className="text-indigo-400 text-sm mt-1">Check back later for culture and hiring analysis.</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-bold text-gray-900 mb-4">Company Overview</h2>
            <div className="space-y-4">
              <div>
                <span className="text-sm text-gray-500 block">Industry</span>
                <span className="font-medium">{company.industry || 'N/A'}</span>
              </div>
              {company.category && (
                <div>
                  <span className="text-sm text-gray-500 block">Category</span>
                  <span className="font-medium">{company.category}</span>
                </div>
              )}
              {company.foundedYear && (
                <div>
                  <span className="text-sm text-gray-500 block">Founded</span>
                  <span className="font-medium">{company.foundedYear}</span>
                </div>
              )}
              <div>
                <span className="text-sm text-gray-500 block">Hiring Status</span>
                <Badge variant={company.hiringStatus === 'Actively Hiring' ? 'success' : 'default'} className="mt-1">
                  {company.hiringStatus || 'Unknown'}
                </Badge>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900">Active Jobs</h2>
              <Badge variant="primary">{company.activeJobs}</Badge>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              {company.name} currently has {company.activeJobs} open positions.
            </p>
            <Button className="w-full" variant="outline" onClick={() => navigate(`/app/jobs?company=${company.name}`)}>
              View All Jobs
            </Button>
          </div>
          
          {company.technologiesUsed && company.technologiesUsed.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="font-bold text-gray-900 mb-4">Tech Stack</h2>
              <div className="flex flex-wrap gap-2">
                {company.technologiesUsed.map(tech => (
                  <span key={tech} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">{tech}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
