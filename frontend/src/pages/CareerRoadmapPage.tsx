import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { roadmapService } from '../api/services/roadmapService';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';
import { LoadingState } from '@/shared/components/ui';

const CareerRoadmapPage: React.FC = () => {
  const { isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();
  const [targetRole, setTargetRole] = useState('');
  const [currentRole, setCurrentRole] = useState('');
  const [timelineYears, setTimelineYears] = useState(3);

  const { data: roadmapsData, isLoading } = useQuery({
    queryKey: ['careerRoadmaps'],
    queryFn: () => roadmapService.getRoadmaps(),
    enabled: isAuthenticated
  });

  const generateRoadmapMutation = useMutation({
    mutationFn: () => roadmapService.generateRoadmap({ targetRole, currentRole, timelineYears }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['careerRoadmaps'] });
      toast.success('Career roadmap generated!');
      setTargetRole('');
      setCurrentRole('');
    }
  });

  const updateMilestoneMutation = useMutation({
    mutationFn: ({ milestoneId, isCompleted }: { milestoneId: string; isCompleted: boolean }) =>
      roadmapService.updateMilestone(milestoneId, isCompleted),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['careerRoadmaps'] });
      toast.success('Milestone updated!');
    }
  });

  if (!isAuthenticated) return <div>Please log in</div>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Career Roadmap</h1>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Generate Your Roadmap</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">Current Role</label>
              <input
                type="text"
                value={currentRole}
                onChange={(e) => setCurrentRole(e.target.value)}
                placeholder="e.g., Junior Developer"
                className="w-full p-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Target Role</label>
              <input
                type="text"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder="e.g., Senior Engineer"
                className="w-full p-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Timeline (Years)</label>
              <select
                value={timelineYears}
                onChange={(e) => setTimelineYears(parseInt(e.target.value))}
                className="w-full p-2 border rounded-lg"
              >
                <option value={1}>1 Year</option>
                <option value={2}>2 Years</option>
                <option value={3}>3 Years</option>
                <option value={5}>5 Years</option>
              </select>
            </div>
          </div>
          <button
            onClick={() => generateRoadmapMutation.mutate()}
            disabled={!targetRole || generateRoadmapMutation.isPending}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {generateRoadmapMutation.isPending ? 'Generating...' : 'Generate Roadmap'}
          </button>
        </div>
      </div>

      {isLoading ? (
        <LoadingState message="Loading career roadmaps..." />
      ) : (
        <div className="space-y-8">
          {roadmapsData?.roadmaps.map((roadmap) => (
            <div key={roadmap.id} className="border rounded-lg p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-semibold">{roadmap.title}</h3>
                  <p className="text-gray-600 mt-1">{roadmap.description}</p>
                  <p className="text-sm text-gray-500 mt-2">
                    {roadmap.currentRole} → {roadmap.targetRole} ({roadmap.timelineYears} years)
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-lg">{roadmap.progressPercentage}%</p>
                  <div className="w-32 h-2 bg-gray-200 rounded-full mt-2">
                    <div
                      className="h-full bg-green-600 rounded-full"
                      style={{ width: `${roadmap.progressPercentage}%` }}
                    />
                  </div>
                </div>
              </div>

              {roadmap.milestones && (
                <div className="mt-6">
                  <div className="relative">
                    <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200" />
                    <div className="space-y-4">
                      {roadmap.milestones.map((milestone, index) => (
                        <div key={milestone.id} className="flex gap-4">
                          <div className="relative z-10 w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 border-4 border-white" style={{
                            backgroundColor: milestone.isCompleted ? '#10b981' : '#9ca3af'
                          }}>
                            {milestone.isCompleted && (
                              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                          <div className="flex-1 bg-gray-50 p-4 rounded-lg">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className={`font-semibold ${milestone.isCompleted ? 'text-green-700' : ''}`}>
                                  {milestone.title}
                                </h4>
                                {milestone.description && (
                                  <p className="text-sm text-gray-600 mt-1">{milestone.description}</p>
                                )}
                              </div>
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={milestone.isCompleted}
                                  onChange={(e) => updateMilestoneMutation.mutate({
                                    milestoneId: milestone.id,
                                    isCompleted: e.target.checked
                                  })}
                                  className="w-5 h-5"
                                />
                                <span className="text-sm">Completed</span>
                              </label>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}

          {roadmapsData?.roadmaps.length === 0 && (
            <div className="text-center py-12">
              <h3 className="text-xl mb-4">No career roadmaps yet</h3>
              <p className="text-gray-600">Generate your first career roadmap above!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CareerRoadmapPage;
