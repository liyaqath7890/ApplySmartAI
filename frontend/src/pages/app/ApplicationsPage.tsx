import React, { useState } from 'react';
import {
  CheckSquare,
  List,
  Calendar,
  Briefcase,
  Clock,
  Filter,
  GripVertical,
} from 'lucide-react';
import { PageHeader, LoadingState, EmptyState } from '@/shared/components/ui';
import Button from '@/shared/components/ui/Button';
import Badge from '@/shared/components/ui/Badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { applicationService, Application } from '@/api/services/applicationService';
import { useApplicationStore } from '@/store/applicationStore';
import toast from 'react-hot-toast';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

type ViewMode = 'kanban' | 'table' | 'timeline';

interface SortableApplicationProps {
  application: Application;
  onStatusChange?: (id: string, status: Application['status']) => void;
}

function SortableApplication({ application, onStatusChange }: SortableApplicationProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: application.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-app-card p-4 rounded-xl border border-app-border cursor-grab active:cursor-grabbing hover:border-blue-500/50 hover:bg-app-hover transition duration-200"
    >
      <div className="flex items-start gap-3">
        <GripVertical className="h-5 w-5 text-app-secondary mt-0.5" {...attributes} {...listeners} />
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-app-primary text-sm truncate">{application.jobId ? 'Job Application' : 'External Referral'}</h4>
          <p className="text-xs text-app-secondary mt-0.5 uppercase tracking-wider">{application.status}</p>
          <div className="flex items-center justify-between mt-3 text-xs">
            <span className="text-app-secondary">{application.appliedAt ? new Date(application.appliedAt).toLocaleDateString() : 'N/A'}</span>
            {application.matchScore && (
              <span className="font-semibold text-emerald-400">{application.matchScore}% Match</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface Column {
  key: Application['status'];
  title: string;
  color: string;
}

const statusColumns: Column[] = [
  { key: 'imported', title: 'Imported', color: 'bg-slate-800 text-slate-300 border-slate-700/50' },
  { key: 'applied', title: 'Applied', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  { key: 'interview_scheduled', title: 'Interview', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  { key: 'offer', title: 'Offer', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  { key: 'rejected', title: 'Rejected', color: 'bg-red-500/10 text-red-400 border-red-500/20' },
  { key: 'withdrawn', title: 'Withdrawn', color: 'bg-slate-800 text-slate-350 border-slate-700/50' },
];

export default function ApplicationsPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const { applications, setApplications, updateApplicationStatus } = useApplicationStore();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['applications'],
    queryFn: async () => applicationService.getApplications(),
  });

  const mutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: Application['status'] }) =>
      applicationService.moveApplication(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      toast.success('Application status updated!');
    },
    onError: () => {
      toast.error('Failed to update application');
    },
  });

  const handleDragEnd = async (event: any) => {
    const { active, over } = event;
    if (!over) return;
    if (active.id === over.id) return;

    const [applicationId, targetStatus] = over.id.split(':');
    if (targetStatus) {
      mutation.mutate({ id: applicationId, status: targetStatus as Application['status'] });
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const getApplicationsByStatus = (status: Application['status']) => {
    return data?.applications?.filter((app: Application) => app.status === status) || [];
  };

  return (
    <div className="space-y-6 animate-fade-in p-6 bg-app-bg text-app-primary min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-app-border pb-4 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 to-indigo-300 bg-clip-text text-transparent">
            Application Pipeline
          </h1>
          <p className="text-sm text-app-secondary mt-1">Track and manage your live application lifecycles.</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'kanban' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setViewMode('kanban')}
          >
            Kanban
          </Button>
          <Button
            variant={viewMode === 'table' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setViewMode('table')}
          >
            Table
          </Button>
          <Button
            variant={viewMode === 'timeline' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setViewMode('timeline')}
          >
            Timeline
          </Button>
        </div>
      </div>

      {/* Loading */}
      {isLoading && <LoadingState message="Loading applications..." />}

      {/* Error */}
      {error && (
        <div className="p-6 bg-red-500/10 rounded-xl border border-red-500/20 text-red-400">
          Error loading applications. Check server connection.
        </div>
      )}

      {!isLoading && !error && (
        <>
          {/* Kanban View */}
          {viewMode === 'kanban' && (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-4 overflow-x-auto pb-4">
                {statusColumns.map((column) => {
                  const columnApps = getApplicationsByStatus(column.key);
                  return (
                    <div key={column.key} className="min-w-[260px] space-y-3">
                      <div className="flex items-center justify-between px-1">
                        <span className="text-sm font-bold text-app-primary">{column.title}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${column.color}`}>
                          {columnApps.length}
                        </span>
                      </div>
                      
                      <SortableContext
                        items={columnApps.map((app) => `${app.id}:${column.key}`)}
                        strategy={verticalListSortingStrategy}
                      >
                        <div className="bg-app-card border border-app-border rounded-2xl p-3 space-y-3 min-h-[450px] transition-all">
                          {columnApps.map((app) => (
                            <SortableApplication key={app.id} application={app} />
                          ))}
                          {columnApps.length === 0 && (
                            <div className="text-center py-12 text-app-secondary text-xs">
                              Empty column
                            </div>
                          )}
                        </div>
                      </SortableContext>
                    </div>
                  );
                })}
              </div>
            </DndContext>
          )}

          {/* Table View */}
          {viewMode === 'table' && (
            <div className="glass-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="border-b border-app-border text-app-secondary font-semibold">
                      <th className="p-4">Job Info</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Match %</th>
                      <th className="p-4">Applied Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-app-border text-app-primary">
                    {data?.applications?.map((app) => {
                      const column = statusColumns.find((c) => c.key === app.status);
                      return (
                        <tr key={app.id} className="hover:bg-app-hover transition-colors">
                          <td className="p-4 font-semibold text-app-primary">
                            {app.jobId ? 'Job Application' : 'External Referral'}
                          </td>
                          <td className="p-4">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${column?.color}`}>
                              {app.status}
                            </span>
                          </td>
                          <td className="p-4 font-medium text-app-secondary">
                            {app.matchScore ? `${app.matchScore}%` : 'N/A'}
                          </td>
                          <td className="p-4 text-app-secondary">
                            {app.appliedAt ? new Date(app.appliedAt).toLocaleDateString() : 'N/A'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Timeline View */}
          {viewMode === 'timeline' && (
            <div className="glass-card p-6">
              {data?.applications?.length === 0 ? (
                <EmptyState
                  icon={Briefcase}
                  title="No applications yet"
                  description="Start applying to jobs to track them here."
                />
              ) : (
                <div className="space-y-8 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-app-border">
                  {data?.applications.map((app) => (
                    <div key={app.id} className="relative pl-8">
                      <div className="absolute left-1.5 top-1.5 w-3 h-3 rounded-full bg-blue-500 border-4 border-app-bg ring-2 ring-blue-500/20"></div>
                      <div>
                        <h4 className="font-semibold text-app-primary">
                          {app.jobId ? 'Job Application' : 'External Referral'}
                        </h4>
                        <p className="text-sm text-app-secondary mt-0.5">Moved to status: <span className="text-blue-400 font-semibold">{app.status}</span></p>
                        <p className="text-xs text-app-secondary mt-1">
                          {app.appliedAt ? new Date(app.appliedAt).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
