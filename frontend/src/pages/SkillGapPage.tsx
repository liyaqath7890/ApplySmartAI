import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { learningService } from '../api/services/learningService';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

const SkillGapPage: React.FC = () => {
  const { isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

  const analyzeGapsMutation = useMutation({
    mutationFn: () => learningService.analyzeSkillGaps(selectedJobId || undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['learningPaths'] });
      toast.success('Skill gap analysis complete!');
    }
  });

  const { data: pathsData, isLoading: pathsLoading } = useQuery({
    queryKey: ['learningPaths'],
    queryFn: () => learningService.getLearningPaths(),
    enabled: isAuthenticated
  });

  const updateStepMutation = useMutation({
    mutationFn: ({ stepId, isCompleted }: { stepId: string; isCompleted: boolean }) =>
      learningService.updateStepProgress(stepId, isCompleted),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['learningPaths'] });
      toast.success('Progress updated!');
    }
  });

  if (!isAuthenticated) return <div>Please log in</div>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Skill Gap Analysis</h1>
        <button
          onClick={() => analyzeGapsMutation.mutate()}
          disabled={analyzeGapsMutation.isPending}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {analyzeGapsMutation.isPending ? 'Analyzing...' : 'Analyze Skill Gaps'}
        </button>
      </div>

      {pathsLoading ? (
        <div>Loading...</div>
      ) : (
        <div className="space-y-8">
          {pathsData?.paths.map((path) => (
            <div key={path.id} className="border rounded-lg p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-semibold">{path.title}</h3>
                  <p className="text-gray-600 mt-1">{path.description}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-lg">{path.progressPercentage}%</p>
                  <div className="w-32 h-2 bg-gray-200 rounded-full mt-2">
                    <div
                      className="h-full bg-blue-600 rounded-full"
                      style={{ width: `${path.progressPercentage}%` }}
                    />
                  </div>
                </div>
              </div>

              {path.steps && (
                <div className="mt-6 space-y-3">
                  {path.steps.map((step) => (
                    <div key={step.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <input
                        type="checkbox"
                        checked={step.isCompleted}
                        onChange={(e) => updateStepMutation.mutate({
                          stepId: step.id,
                          isCompleted: e.target.checked
                        })}
                        className="w-5 h-5"
                      />
                      <div className="flex-1">
                        <p className={step.isCompleted ? 'line-through text-gray-500' : 'font-medium'}>
                          {step.title}
                        </p>
                        {step.description && (
                          <p className="text-sm text-gray-600">{step.description}</p>
                        )}
                      </div>
                      <span className="text-sm text-gray-500">
                        {step.resourceType}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {pathsData?.paths.length === 0 && (
            <div className="text-center py-12">
              <h3 className="text-xl mb-4">No learning paths yet</h3>
              <p className="text-gray-600">Analyze your skill gaps to create a personalized learning path!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SkillGapPage;
