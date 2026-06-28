
import React from 'react';
import { Building2, MapPin, Clock } from 'lucide-react';
import type { Application } from '../../../store/jobPipelineStore';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface ApplicationCardProps {
  application: Application;
  onClick?: () => void;
}

export const ApplicationCard: React.FC<ApplicationCardProps> = ({ application, onClick }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: application.id
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 999 : 'auto'
  };

  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMs = now.getTime() - new Date(date).getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    return new Date(date).toLocaleDateString();
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-all cursor-grab active:cursor-grabbing"
      onClick={(e) => { if (onClick) { e.stopPropagation(); onClick(); } }}
    >
      <h4 className="font-semibold text-gray-900 text-sm leading-tight">{application.jobTitle}</h4>
      <div className="flex items-center gap-2 text-xs text-gray-600 mt-1">
        <Building2 className="h-3 w-3" />
        {application.companyName}
      </div>
      {application.location && (
        <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
          <MapPin className="h-3 w-3" />
          {application.location}
        </div>
      )}
      <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100">
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <Clock className="h-3 w-3" />
          {getTimeAgo(application.appliedDate)}
        </div>
      </div>
    </div>
  );
};

