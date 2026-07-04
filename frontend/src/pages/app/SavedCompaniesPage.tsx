import React, { useEffect, useState } from 'react';
import { Bookmark, Building2, EyeOff, MapPin, Search } from 'lucide-react';
import { PageHeader, Button, EmptyState, Skeleton, Badge } from '@/shared/components/ui';
import axios from '@/api/axios';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

interface SavedCompany {
  id: string;
  name: string;
  industry: string;
  companySize: string;
  headquarters: string;
  activeJobs: number;
}

interface Interaction {
  isFollowing: boolean;
  isBookmarked: boolean;
  isHidden: boolean;
  company: SavedCompany;
}

export default function SavedCompaniesPage() {
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'following' | 'bookmarked' | 'hidden'>('following');
  const navigate = useNavigate();

  useEffect(() => {
    fetchInteractions();
  }, []);

  const fetchInteractions = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/companies/interactions');
      setInteractions(response.data.interactions || []);
    } catch (err) {
      toast.error('Failed to load saved companies');
    } finally {
      setLoading(false);
    }
  };

  const removeInteraction = async (companyId: string, field: string) => {
    try {
      await axios.post(`/companies/${companyId}/interaction`, { [field]: false });
      setInteractions(prev => prev.map(i => {
        if (i.company.id === companyId) {
          return { ...i, [field]: false };
        }
        return i;
      }));
      toast.success('Updated successfully');
    } catch (err) {
      toast.error('Failed to update company');
    }
  };

  const filtered = interactions.filter(i => {
    if (activeTab === 'following') return i.isFollowing && !i.isHidden;
    if (activeTab === 'bookmarked') return i.isBookmarked && !i.isHidden;
    if (activeTab === 'hidden') return i.isHidden;
    return false;
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Saved Companies" subtitle="Manage companies you follow, bookmark, or hide." icon={Bookmark} />

      <div className="flex space-x-1 bg-gray-100 p-1 rounded-xl w-fit">
        <button 
          onClick={() => setActiveTab('following')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'following' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
        >
          Following
        </button>
        <button 
          onClick={() => setActiveTab('bookmarked')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'bookmarked' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
        >
          Bookmarked
        </button>
        <button 
          onClick={() => setActiveTab('hidden')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'hidden' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
        >
          Hidden
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-64 rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState 
          icon={activeTab === 'hidden' ? EyeOff : Building2} 
          title={`No ${activeTab} companies`} 
          description={activeTab === 'hidden' ? 'You haven\'t hidden any companies.' : 'Explore companies and save them here.'}
          action={<Button onClick={() => navigate('/app/companies')}>Explore Companies</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(interaction => (
            <div key={interaction.company.id} className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="h-12 w-12 rounded-lg bg-primary-100 flex items-center justify-center">
                    <Building2 className="h-6 w-6 text-primary-600" />
                  </div>
                  <Button 
                    variant="ghost" 
                    className="text-red-600 hover:bg-red-50 hover:text-red-700 p-2"
                    onClick={() => removeInteraction(interaction.company.id, activeTab === 'following' ? 'isFollowing' : activeTab === 'bookmarked' ? 'isBookmarked' : 'isHidden')}
                  >
                    Remove
                  </Button>
                </div>
                <h3 className="text-lg font-bold text-gray-900">{interaction.company.name}</h3>
                <p className="text-gray-600 text-sm mb-4">{interaction.company.industry}</p>
                <div className="space-y-2 text-sm text-gray-700 mb-4">
                  <div className="flex items-center gap-2"><MapPin className="h-4 w-4" /> <span>{interaction.company.headquarters || 'Remote'}</span></div>
                  <div className="flex items-center gap-2"><Search className="h-4 w-4" /> <span>{interaction.company.activeJobs} Open Jobs</span></div>
                </div>
              </div>
              <Button variant="outline" className="w-full" onClick={() => navigate(`/app/companies/${interaction.company.id}`)}>
                View Details
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
