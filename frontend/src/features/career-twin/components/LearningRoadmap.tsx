
import React from 'react';
import { CheckCircle2, Circle } from 'lucide-react';
import type { CareerMilestone } from '@/store/careerTwinStore';

interface LearningRoadmapProps {
  milestones?: CareerMilestone[];
  onToggle?: (id: string) => void;
}

export const LearningRoadmap: React.FC<LearningRoadmapProps> = ({ milestones = [], onToggle }) => {
  const items = milestones.length > 0 ? milestones : [
    { id: '1', week: 1, title: 'Generate your Career Twin plan', description: '', category: 'skill' as const, isCompleted: false, dueDate: '' },
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900">Career Roadmap</h3>
        <span className="text-sm text-gray-500">{items.filter((m) => m.isCompleted).length}/{items.length} complete</span>
      </div>
      <div className="space-y-6">
        {items.map((item, index) => {
          const status = item.isCompleted ? 'completed' : index === items.findIndex((m) => !m.isCompleted) ? 'in_progress' : 'pending';
          return (
            <div key={item.id} className="flex gap-4">
              <div className="flex flex-col items-center">
                <button
                  onClick={() => onToggle?.(item.id)}
                  className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors ${
                    status === 'completed' ? 'bg-emerald-500 border-emerald-500' : status === 'in_progress' ? 'bg-blue-500 border-blue-500' : 'bg-gray-200 border-gray-300 hover:border-primary-400'
                  }`}
                >
                  {status === 'completed' ? <CheckCircle2 className="h-4 w-4 text-white" /> : status === 'in_progress' ? <div className="w-3 h-3 bg-white rounded-full animate-pulse" /> : <Circle className="h-4 w-4 text-gray-400" />}
                </button>
                {index < items.length - 1 && (
                  <div className={`w-0.5 flex-1 mt-1 min-h-[24px] ${status === 'completed' ? 'bg-emerald-500' : 'bg-gray-200'}`} />
                )}
              </div>
              <div className="pb-6 flex-1">
                <h4 className={`font-semibold ${status === 'completed' ? 'text-gray-700 line-through' : 'text-gray-900'}`}>{item.title}</h4>
                {item.description && <p className="text-sm text-gray-500 mt-1">{item.description}</p>}
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-gray-400">Week {item.week}</span>
                  {item.dueDate && <span className="text-xs text-gray-400">· Due {item.dueDate}</span>}
                  <span className="text-xs px-2 py-0.5 bg-gray-100 rounded-full text-gray-600">{item.category}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {onToggle && (
        <p className="text-xs text-gray-500 mt-2">Click milestones to mark complete</p>
      )}
    </div>
  );
};
