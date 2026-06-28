
import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import type { Application } from '../../../store/jobPipelineStore';
import { ApplicationCard } from './ApplicationCard';

interface PipelineColumnProps {
  columnId: string;
  title: string;
  applications: Application[];
  onCardClick?: (app: Application) => void;
}

export const PipelineColumn: React.FC<PipelineColumnProps> = ({ columnId, title, applications, onCardClick }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: columnId
  });

  const getColumnColor = () => {
    switch (columnId) {
      case 'saved': return 'text-gray-600 bg-gray-100';
      case 'applied': return 'text-blue-600 bg-blue-100';
      case 'screening': return 'text-yellow-600 bg-yellow-100';
      case 'interview': return 'text-purple-600 bg-purple-100';
      case 'offer': return 'text-emerald-600 bg-emerald-100';
      case 'rejected': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div
      ref={setNodeRef}
      className={`
        flex flex-col min-h-[400px] rounded-xl border-2 transition-all
        ${isOver ? 'border-primary-500 bg-primary-50' : 'border-gray-200 bg-gray-50/50'}
      `}
    >
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full ${getColumnColor()}`}></span>
            <h3 className="font-semibold text-gray-900">{title}</h3>
          </div>
          <span className="text-xs font-medium bg-gray-200 text-gray-700 px-2 py-1 rounded-full">
            {applications.length}
          </span>
        </div>
      </div>
      <div className="flex-1 p-3 space-y-3">
        {applications.map((app) => (
          <ApplicationCard key={app.id} application={app} onClick={onCardClick ? () => onCardClick(app) : undefined} />
        ))}
        {applications.length === 0 && (
          <div className="p-6 flex items-center justify-center text-center border border-dashed border-gray-300 rounded-lg bg-white/50">
            <p className="text-sm text-gray-500">No applications here yet</p>
          </div>
        )}
      </div>
    </div>
  );
};

