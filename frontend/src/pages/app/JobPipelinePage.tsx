import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { PageHeader, StatsCard } from '@/shared/components/ui';
import { Briefcase, X, Plus, Sparkles, Loader2, Link as LinkIcon } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragOverlay, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { PipelineColumn } from '@/features/jobs-pipeline/components/PipelineColumn';
import { ApplicationCard } from '@/features/jobs-pipeline/components/ApplicationCard';
import { useJobPipelineStore, Application, PipelineStage } from '@/store';
import { applicationService } from '@/api/services/applicationService';
import Button from '@/shared/components/ui/Button';

const columns = [
  { id: 'imported', title: 'Imported' },
  { id: 'resume_generated', title: 'Resume Gen' },
  { id: 'cover_letter_generated', title: 'CL Gen' },
  { id: 'ready_to_apply', title: 'Ready to Apply' },
  { id: 'applied', title: 'Applied' },
  { id: 'assessment', title: 'Assessment' },
  { id: 'interview_scheduled', title: 'Interview Sched' },
  { id: 'interview_completed', title: 'Interview Done' },
  { id: 'hr_round', title: 'HR Round' },
  { id: 'technical_round', title: 'Tech Round' },
  { id: 'final_round', title: 'Final Round' },
  { id: 'offer', title: 'Offer' },
  { id: 'rejected', title: 'Rejected' },
  { id: 'withdrawn', title: 'Withdrawn' },
];

const JobPipelinePage: React.FC = () => {
  const navigate = useNavigate();
  const { applications, fetchPipeline, setApplications, setActiveId, activeId, updateApplicationStage } = useJobPipelineStore();
  
  // Import modal states
  const [showImportModal, setShowImportModal] = useState(false);
  const [importUrl, setImportUrl] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  useEffect(() => {
    fetchPipeline();
  }, [fetchPipeline]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const getApplicationsByColumn = (columnId: string) => applications.filter((app) => app.status === columnId);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) { setActiveId(null); return; }
    const activeItemId = active.id as string;
    const overId = over.id as string;
    const activeApp = applications.find((a) => a.id === activeItemId);

    if (activeApp && columns.some((c) => c.id === overId)) {
      updateApplicationStage(activeItemId, overId as PipelineStage);
      toast.success(`Moved to ${overId}`);
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

  const handleImportJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importUrl) {
      toast.error('Please enter a job URL');
      return;
    }
    setIsImporting(true);
    try {
      const res = await applicationService.importJob(importUrl);
      if (res.success && res.data?.application) {
        toast.success(res.message || 'Job imported and analyzed!');
        setShowImportModal(false);
        setImportUrl('');
        // Navigate straight to the workspace
        navigate(`/applications/${res.data.application.id}/workspace`);
      } else {
        toast.error('Failed to import job details');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Error occurred during job import');
    } finally {
      setIsImporting(false);
    }
  };

  const activeApplication = applications.find((a) => a.id === activeId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader title="Job Pipeline" subtitle="Track your job applications through every stage" icon={Briefcase} />
        <Button 
          onClick={() => setShowImportModal(true)}
          className="bg-violet-600 hover:bg-violet-700 text-white font-semibold flex items-center space-x-2 py-2.5 px-4 rounded-xl shadow-sm self-start sm:self-auto"
        >
          <Plus className="h-5 w-5" />
          <span>Import Job from URL</span>
        </Button>
      </div>

      {/* Stats Summary */}
      <div className="flex gap-4 overflow-x-auto pb-2 -mx-2 px-2">
        {columns.slice(0, 5).map((col) => (
          <div key={col.id} className="min-w-[160px] flex-shrink-0">
            <StatsCard title={col.title} value={getApplicationsByColumn(col.id).length.toString()} icon={Briefcase} />
          </div>
        ))}
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd} onDragStart={(e) => setActiveId(e.active.id as string)}>
        <div className="flex gap-4 overflow-x-auto pb-4 -mx-2 px-2 min-h-[500px]">
          {columns.map((column) => (
            <div key={column.id} className="min-w-[280px] w-[280px] flex-shrink-0">
              <SortableContext items={getApplicationsByColumn(column.id).map((a) => a.id)} strategy={verticalListSortingStrategy}>
                <PipelineColumn 
                  columnId={column.id} 
                  title={column.title} 
                  applications={getApplicationsByColumn(column.id)} 
                  onCardClick={(app) => navigate(`/applications/${app.id}/workspace`)} 
                />
              </SortableContext>
            </div>
          ))}
        </div>
        <DragOverlay>
          {activeApplication ? <div className="opacity-80 shadow-xl"><ApplicationCard application={activeApplication} /></div> : null}
        </DragOverlay>
      </DndContext>

      {/* Universal Job Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/55 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-6 shadow-2xl border border-gray-100 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div className="flex items-center space-x-2">
                <Sparkles className="h-5 w-5 text-violet-600" />
                <h3 className="text-lg font-bold text-gray-900 font-sans">Smart Universal Job Import</h3>
              </div>
              <button onClick={() => setShowImportModal(false)} className="p-1 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-gray-700">
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-sm text-gray-500 leading-relaxed">
              Paste the link to a job posting from LinkedIn, Greenhouse, Lever, Ashby, Naukri, apna or any company careers site. We'll automatically identify the ATS and generate match scores and custom application materials.
            </p>

            <form onSubmit={handleImportJob} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Job Posting URL</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <LinkIcon className="h-4 w-4" />
                  </div>
                  <input 
                    type="url" 
                    required
                    value={importUrl}
                    onChange={(e) => setImportUrl(e.target.value)}
                    className="w-full text-sm border border-gray-200 rounded-xl pl-9 pr-3 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                    placeholder="https://jobs.lever.co/example-company/12345"
                  />
                </div>
              </div>

              <div className="flex space-x-3 pt-4 border-t border-gray-100">
                <Button 
                  type="submit" 
                  disabled={isImporting}
                  className="flex-1 bg-violet-600 hover:bg-violet-700 text-white font-bold py-3 rounded-xl text-sm shadow-sm flex items-center justify-center space-x-2"
                >
                  {isImporting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-white" />
                      <span>Extracting Job details...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      <span>Start Smart Import</span>
                    </>
                  )}
                </Button>
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => setShowImportModal(false)}
                  className="border-gray-200 text-gray-600 hover:bg-gray-50 font-bold py-3 px-6 rounded-xl text-sm"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobPipelinePage;
