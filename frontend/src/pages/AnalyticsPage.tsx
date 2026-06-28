import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { analyticsService } from '../api/services/analyticsService';
import { useAuthStore } from '../store/authStore';

const AnalyticsPage: React.FC = () => {
  const { isAuthenticated } = useAuthStore();
  const [searchJobTitle, setSearchJobTitle] = useState('');
  const [searchSkill, setSearchSkill] = useState('');

  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: () => analyticsService.getDashboardStats(),
    enabled: isAuthenticated
  });

  const { data: salaryData, isLoading: salaryLoading, refetch: refetchSalary } = useQuery({
    queryKey: ['salaryPrediction', searchJobTitle],
    queryFn: () => analyticsService.getSalaryPrediction({ jobTitle: searchJobTitle }),
    enabled: false
  });

  const { data: demandData, isLoading: demandLoading, refetch: refetchDemand } = useQuery({
    queryKey: ['marketDemand', searchSkill],
    queryFn: () => analyticsService.getMarketDemand(searchSkill),
    enabled: false
  });

  const { data: trendsData, isLoading: trendsLoading } = useQuery({
    queryKey: ['skillTrends'],
    queryFn: () => analyticsService.getSkillTrends(),
    enabled: isAuthenticated
  });

  if (!isAuthenticated) return <div>Please log in</div>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Career Analytics</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {statsLoading ? (
          <div>Loading...</div>
        ) : (
          Object.entries(statsData?.stats || {}).map(([key, value]) => (
            <div key={key} className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-gray-600 text-sm font-medium mb-2">
                {key.replace(/([A-Z])/g, ' $1').trim()}
              </h3>
              <p className="text-3xl font-bold">{String(value)}</p>
            </div>
          ))
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Salary Prediction</h2>
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={searchJobTitle}
              onChange={(e) => setSearchJobTitle(e.target.value)}
              placeholder="e.g., Software Engineer"
              className="flex-1 p-2 border rounded-lg"
            />
            <button
              onClick={() => refetchSalary()}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Predict
            </button>
          </div>
          {salaryLoading ? (
            <div>Loading...</div>
          ) : salaryData ? (
            <div>
              <p className="text-2xl font-bold">
                ${salaryData.prediction.median?.toLocaleString() || 'N/A'}
              </p>
              <p className="text-gray-600">
                Range: ${salaryData.prediction.min?.toLocaleString() || 'N/A'} - ${salaryData.prediction.max?.toLocaleString() || 'N/A'}
              </p>
            </div>
          ) : null}
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Market Demand</h2>
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={searchSkill}
              onChange={(e) => setSearchSkill(e.target.value)}
              placeholder="e.g., React"
              className="flex-1 p-2 border rounded-lg"
            />
            <button
              onClick={() => refetchDemand()}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Check
            </button>
          </div>
          {demandLoading ? (
            <div>Loading...</div>
          ) : demandData ? (
            <div>
              <p className={`text-2xl font-bold ${
                demandData.demand.demand === 'high' ? 'text-green-600' :
                demandData.demand.demand === 'medium' ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {demandData.demand.demand?.toUpperCase() || 'N/A'}
              </p>
              <p className="text-gray-600">
                Growth: {demandData.demand.growth || 'N/A'}
              </p>
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-8 bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Skill Trends</h2>
        {trendsLoading ? (
          <div>Loading...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h3 className="font-semibold mb-2 text-green-600">Trending Up</h3>
              <ul className="space-y-1">
                {trendsData?.trends.trending?.map((skill: string, i: number) => (
                  <li key={i} className="text-gray-700">{skill}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2 text-red-600">Trending Down</h3>
              <ul className="space-y-1">
                {trendsData?.trends.declining?.map((skill: string, i: number) => (
                  <li key={i} className="text-gray-700">{skill}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2 text-purple-600">Emerging</h3>
              <ul className="space-y-1">
                {trendsData?.trends.emerging?.map((skill: string, i: number) => (
                  <li key={i} className="text-gray-700">{skill}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyticsPage;
