import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { jobDiscoveryService, ExternalJob, JobPlatformCredential } from '../api/services/jobDiscoveryService';
import { useAuthStore } from '../store/authStore';
import { toast } from 'react-hot-toast';

const JobDiscoveryPage: React.FC = () => {
  const { isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();
  const [searchFilters, setSearchFilters] = useState({
    keywords: '',
    location: '',
    experienceLevel: '',
    employmentType: ''
  });

  const { data: jobsData, isLoading: jobsLoading } = useQuery({
    queryKey: ['savedJobs'],
    queryFn: jobDiscoveryService.getSavedJobs,
    enabled: isAuthenticated
  });

  const { data: credentialsData } = useQuery({
    queryKey: ['platformCredentials'],
    queryFn: jobDiscoveryService.getCredentials,
    enabled: isAuthenticated
  });

  const searchJobsMutation = useMutation({
    mutationFn: (platforms: string[]) => 
      jobDiscoveryService.searchJobs(platforms, searchFilters),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savedJobs'] });
      toast.success('Job search completed!');
    }
  });

  if (!isAuthenticated) return <div>Please log in</div>;

  const platforms = ['linkedin', 'naukri', 'foundit', 'wellfound', 'instahyre', 'indeed', 'cutshort', 'hirist'];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Job Discovery</h1>
        <p className="text-gray-600">Find and apply to jobs across multiple platforms</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Sidebar - Filters & Platforms */}
        <div className="lg:col-span-1 space-y-6">
          {/* Platforms */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold mb-4">Connected Platforms</h3>
            <div className="space-y-2">
              {platforms.map(platform => (
                <div key={platform} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="capitalize">{platform}</span>
                  <div className="w-3 h-3 rounded-full bg-gray-400" />
                </div>
              ))}
            </div>
            <button className="mt-4 w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
              Connect Platform
            </button>
          </div>

          {/* Search Filters */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold mb-4">Search Filters</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Keywords</label>
                <input
                  type="text"
                  value={searchFilters.keywords}
                  onChange={(e) => setSearchFilters({ ...searchFilters, keywords: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Software Engineer"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                <input
                  type="text"
                  value={searchFilters.location}
                  onChange={(e) => setSearchFilters({ ...searchFilters, location: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. San Francisco, CA"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Experience Level</label>
                <select
                  value={searchFilters.experienceLevel}
                  onChange={(e) => setSearchFilters({ ...searchFilters, experienceLevel: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Levels</option>
                  <option value="entry">Entry</option>
                  <option value="mid">Mid</option>
                  <option value="senior">Senior</option>
                  <option value="lead">Lead</option>
                  <option value="executive">Executive</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Employment Type</label>
                <select
                  value={searchFilters.employmentType}
                  onChange={(e) => setSearchFilters({ ...searchFilters, employmentType: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Types</option>
                  <option value="full-time">Full-time</option>
                  <option value="part-time">Part-time</option>
                  <option value="contract">Contract</option>
                  <option value="internship">Internship</option>
                  <option value="freelance">Freelance</option>
                </select>
              </div>
              <button
                onClick={() => searchJobsMutation.mutate(['mock'])}
                disabled={searchJobsMutation.isPending}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {searchJobsMutation.isPending ? 'Searching...' : 'Search Jobs'}
              </button>
            </div>
          </div>
        </div>

        {/* Right Content - Job List */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">
                Saved Jobs ({jobsData?.jobs?.length || 0})
              </h2>
              <div className="flex gap-2">
                <button className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
                  All
                </button>
                <button className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
                  New
                </button>
                <button className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
                  Applied
                </button>
              </div>
            </div>

            {jobsLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
              </div>
            ) : (
              <div className="space-y-4">
                {jobsData?.jobs?.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500">No jobs found</p>
                    <p className="text-sm text-gray-400 mt-2">Start searching for jobs to see them here</p>
                  </div>
                ) : (
                  jobsData?.jobs?.map((job: ExternalJob) => (
                    <div key={job.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold">{job.title}</h3>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              job.platform === 'mock' ? 'bg-purple-100 text-purple-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {job.platform}
                            </span>
                          </div>
                          <p className="text-gray-600 mb-1">{job.company}</p>
                          <p className="text-sm text-gray-500">
                            {job.location} • {job.employmentType} • {job.workType}
                          </p>
                          {job.salary && (
                            <p className="text-sm text-green-600 font-medium mt-2">{job.salary}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-blue-600">
                            {job.matchScore}%
                          </div>
                          <p className="text-xs text-gray-500">Match Score</p>
                        </div>
                      </div>
                      <div className="mt-4 flex gap-3">
                        <a
                          href={job.jobUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                        >
                          View Details
                        </a>
                        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                          Apply Now
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobDiscoveryPage;
