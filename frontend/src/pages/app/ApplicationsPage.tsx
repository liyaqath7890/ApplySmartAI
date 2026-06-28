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
      className="bg-white p-4 rounded-lg border border-gray-200 cursor-grab active:cursor-grabbing hover:border-primary-300 transition-colors"
    >
      <div className="flex items-start gap-3">
        <GripVertical className="h-5 w-5 text-gray-400 mt-0.5" {...attributes} {...listeners} />
        <div className="flex-1">
          <h4 className="font-medium text-gray-900">{application.jobId ? 'Job' : 'External Job'}</h4>
          <p className="text-sm text-gray-600">{application.status}</p>
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-gray-500">{application.appliedAt ? new Date(application.appliedAt).toLocaleDateString() : 'N/A'}</span>
            {application.matchScore && (
              <span className="text-xs font-medium text-emerald-600">{application.matchScore}% Match</span>
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
  { key: 'saved', title: 'Saved', color: 'bg-gray-100 text-gray-700' },
  { key: 'applied', title: 'Applied', color: 'bg-blue-100 text-blue-700' },
  { key: 'interview', title: 'Interview', color: 'bg-amber-100 text-amber-700' },
  { key: 'offer', title: 'Offer', color: 'bg-emerald-100 text-emerald-700' },
  { key: 'accepted', title: 'Accepted', color: 'bg-emerald-100 text-emerald-700' },
  { key: 'rejected', title: 'Rejected', color: 'bg-red-100 text-red-700' },
  { key: 'withdrawn', title: 'Withdrawn', color: 'bg-gray-100 text-gray-700' },
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
      toast.success('Application updated!');
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
    <div className="space-y-6">
      <PageHeader
        title="Application Tracker"
        subtitle="Track all your job applications in one place"
        icon={CheckSquare}
      >
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'kanban' ? 'primary' : 'outline'}
            size="sm"
            icon={CheckSquare}
            onClick={() => setViewMode('kanban')}
          >
            Kanban
          </Button>
          <Button
            variant={viewMode === 'table' ? 'primary' : 'outline'}
            size="sm"
            icon={List}
            onClick={() => setViewMode('table')}
          >
            Table
          </Button>
          <Button
            variant={viewMode === 'timeline' ? 'primary' : 'outline'}
            size="sm"
            icon={Calendar}
            onClick={() => setViewMode('timeline')}
          >
            Timeline
          </Button>
        </div>
      </PageHeader>

      {/* Loading */}
      {isLoading && <LoadingState message="Loading applications..." />}

      {/* Error */}
      {error && (
        <div className="p-6 bg-red-50 rounded-xl border border-red-200 text-red-800">
          Error loading applications
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 overflow-x-auto">
                {statusColumns.map((column) => {
                  const columnApps = getApplicationsByStatus(column.key);
                  return (
                    <div key={column.key} className="min-w-[280px]">
                      <div className="mb-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-semibold text-gray-900">{column.title}</h3>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${column.color}`}>
                              {columnApps.length}
                            </span>
                          </div>
                        </div>
                      </div>
                      <SortableContext
                        items={columnApps.map((app) => `${app.id}:${column.key}`)}
                        strategy={verticalListSortingStrategy}
                      >
                        <div className="bg-gray-50 rounded-xl p-4 space-y-3 min-h-[400px]">
                          {columnApps.map((app) => (
                            <SortableApplication key={app.id} application={app} />
                          ))}
                          {columnApps.length === 0 && (
                            <div className="text-center py-8 text-gray-500 text-sm">
                              No applications
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
            <div className="bg-white rounded-xl border border-gray-200">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left font-medium text-gray-500 p-4">Job</th>
                      <th className="text-left font-medium text-gray-500 p-4">Status</th>
                      <th className="text-left font-medium text-gray-500 p-4">Match</th>
                      <th className="text-left font-medium text-gray-500 p-4">Applied</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data?.applications?.map((app) => {
                      const column = statusColumns.find((c) => c.key === app.status);
                      return (
                        <tr key={app.id} className="border-b border-gray-100">
                          <td className="p-4 font-medium text-gray-900">
                            {app.jobId ? 'Job' : 'External Job'}
                          </td>
                          <td className="p-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${column?.color}`}>
                              {app.status}
                            </span>
                          </td>
                          <td className="p-4 text-gray-700">
                            {app.matchScore ? `${app.matchScore}%` : 'N/A'}
                          </td>
                          <td className="p-4 text-gray-500">
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
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              {data?.applications?.length === 0 ? (
                <EmptyState
                  icon={Briefcase}
                  title="No applications yet"
                  description="Start applying to jobs to track them here."
                />
              ) : (
                <div className="space-y-8">
                  {data?.applications.map((app, index) => (
                    <div key={app.id} className="relative pl-8">
                      <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                      <div className="absolute -left-1.5 top-0 w-3 h-3 rounded-full bg-primary-600 border-4 border-white"></div>
                      <div className="pb-8">
                        <h4 className="font-medium text-gray-900">
                          {app.jobId ? 'Job' : 'External Job'}
                        </h4>
                        <p className="text-sm text-gray-600">{app.status}</p>
                        <p className="text-xs text-gray-500 mt-1">
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
