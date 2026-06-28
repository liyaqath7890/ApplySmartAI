
import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { PageHeader, StatsCard } from '@/shared/components/ui';
import { Briefcase, X } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragOverlay, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { PipelineColumn } from '@/features/jobs-pipeline/components/PipelineColumn';
import { ApplicationCard } from '@/features/jobs-pipeline/components/ApplicationCard';
import { useJobPipelineStore, Application, PipelineStage } from '@/store';
import { applicationService } from '@/api/services/applicationService';
import Button from '@/shared/components/ui/Button';

const STATUS_MAP: Record<string, PipelineStage> = {
  wishlist: 'saved', applied: 'applied', screening: 'screening', interview: 'interview', offer: 'offer', rejected: 'rejected',
};

const columns = [
  { id: 'saved', title: 'Saved' },
  { id: 'applied', title: 'Applied' },
  { id: 'screening', title: 'Screening' },
  { id: 'interview', title: 'Interview' },
  { id: 'offer', title: 'Offer' },
  { id: 'rejected', title: 'Rejected' },
];

const JobPipelinePage: React.FC = () => {
  const { applications, setApplications, setActiveId, activeId, updateApplicationStage, updateApplicationNotes, setLoading } = useJobPipelineStore();
  const [notesModal, setNotesModal] = useState<Application | null>(null);
  const [notesText, setNotesText] = useState('');

  const { isLoading } = useQuery({
    queryKey: ['pipeline-applications'],
    queryFn: () => applicationService.getApplications(),
    retry: false,
  });

  useEffect(() => {
    setLoading(isLoading);
  }, [isLoading, setLoading]);

  useEffect(() => {
    applicationService.getApplications()
      .then((data) => {
        if (data.applications?.length) {
          setApplications(data.applications.map((a) => ({
            id: a.id,
            jobId: a.jobId || a.externalJobId,
            jobTitle: 'Application',
            companyName: 'Company',
            status: STATUS_MAP[a.status] || 'applied',
            appliedDate: new Date(a.appliedAt || a.createdAt),
            notes: a.notes,
          })));
        }
      })
      .catch(() => { /* use persisted store data */ });
  }, [setApplications]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const getApplicationsByColumn = (columnId: string) => applications.filter((app) => app.status === columnId);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    const activeItemId = active.id as string;
    const overId = over.id as string;
    const activeApp = applications.find((a) => a.id === activeItemId);

    if (activeApp && columns.some((c) => c.id === overId)) {
      updateApplicationStage(activeItemId, overId as PipelineStage);
      toast.success(`Moved to ${overId}`);
      applicationService.moveApplication(activeItemId, (overId === 'saved' ? 'wishlist' : overId) as 'applied' | 'screening' | 'interview' | 'offer' | 'rejected' | 'wishlist').catch(() => {});
    } else if (activeApp) {
      const sameColumnApps = applications.filter((a) => a.status === activeApp.status);
      const oldIndex = sameColumnApps.findIndex((a) => a.id === activeItemId);
      const newIndex = sameColumnApps.findIndex((a) => a.id === overId);
      if (oldIndex !== -1 && newIndex !== -1) {
        const newColumnApps = arrayMove(sameColumnApps, oldIndex, newIndex);
        const otherApps = applications.filter((a) => a.status !== activeApp.status);
        setApplications([...otherApps, ...newColumnApps]);
      }
    }
    setActiveId(null);
  };

  const saveNotes = () => {
    if (notesModal) {
      updateApplicationNotes(notesModal.id, notesText);
      toast.success('Notes saved');
      setNotesModal(null);
    }
  };

  const activeApplication = applications.find((a) => a.id === activeId);

  return (
    <div className="space-y-6">
      <PageHeader title="Job Pipeline" subtitle="Track your job applications through every stage" icon={Briefcase} />

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {columns.map((col) => (
          <StatsCard key={col.id} title={col.title} value={getApplicationsByColumn(col.id).length.toString()} icon={Briefcase} />
        ))}
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd} onDragStart={(e) => setActiveId(e.active.id as string)}>
        <div className="flex gap-4 overflow-x-auto pb-4 -mx-2 px-2">
          {columns.map((column) => (
            <div key={column.id} className="min-w-[280px] flex-shrink-0">
              <SortableContext items={getApplicationsByColumn(column.id).map((a) => a.id)} strategy={verticalListSortingStrategy}>
                <PipelineColumn columnId={column.id} title={column.title} applications={getApplicationsByColumn(column.id)} onCardClick={(app) => { setNotesModal(app); setNotesText(app.notes || ''); }} />
              </SortableContext>
            </div>
          ))}
        </div>
        <DragOverlay>
          {activeApplication ? <div className="opacity-80 shadow-xl"><ApplicationCard application={activeApplication} /></div> : null}
        </DragOverlay>
      </DndContext>

      {notesModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">{notesModal.jobTitle}</h3>
              <button onClick={() => setNotesModal(null)}><X className="h-5 w-5 text-gray-500" /></button>
            </div>
            <p className="text-sm text-gray-600 mb-4">{notesModal.companyName}</p>
            <textarea value={notesText} onChange={(e) => setNotesText(e.target.value)} rows={4} className="w-full border border-gray-300 rounded-lg p-3 text-sm" placeholder="Add notes..." />
            <div className="flex gap-2 mt-4">
              <Button onClick={saveNotes}>Save Notes</Button>
              <Button variant="outline" onClick={() => setNotesModal(null)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobPipelinePage;
