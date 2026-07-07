import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Zap, Download, Link2, FileText, CheckSquare, Sparkles, Loader2, ArrowRight, Clipboard, Plus, FileSpreadsheet } from 'lucide-react';
import { PageHeader, Button, Skeleton } from '@/shared/components/ui';
import { jobService } from '@/api/services/jobService';
import { resumeService } from '@/api/services/resumeService';
import { coverLetterService } from '@/api/services/coverLetterService';
import { useJobPipelineStore } from '@/store';
import axios from '@/api/axios';

export default function BrowserProductivityPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();

  const [jobUrl, setJobUrl] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importedData, setImportedData] = useState<any>(null);

  // Selector choices
  const [selectedResume, setSelectedResume] = useState('');
  const [selectedCoverLetter, setSelectedCoverLetter] = useState('');
  const [appNotes, setAppNotes] = useState('');

  // Checklist items
  const [checklist, setChecklist] = useState([
    { id: 1, text: 'Review Job description key requirements', completed: false },
    { id: 2, text: 'Optimize Resume for ATS keywords', completed: false },
    { id: 3, text: 'Tailor custom Cover Letter tone', completed: false },
    { id: 4, text: 'Identify networking contacts at company', completed: false },
    { id: 5, text: 'Submit application', completed: false },
  ]);

  // Load Resumes & Cover Letters
  const { data: resumesData } = useQuery({
    queryKey: ['resumes'],
    queryFn: () => resumeService.getResumes(),
  });
  const { data: lettersData } = useQuery({
    queryKey: ['coverLetters'],
    queryFn: () => coverLetterService.getCoverLetters(),
  });

  const resumes = resumesData?.resumes || [];
  const letters = lettersData?.coverLetters || [];

  // Bookmarklet source
  const bookmarkletCode = `javascript:(function(){window.open('${window.location.origin}/app/productivity?import_url='+encodeURIComponent(window.location.href),'_blank')})()`;

  useEffect(() => {
    const importUrl = searchParams.get('import_url');
    if (importUrl) {
      setJobUrl(importUrl);
      handleImportUrl(importUrl);
    }
  }, [searchParams]);

  const handleImportUrl = async (url: string) => {
    if (!url.trim()) return;
    setIsImporting(true);
    setImportedData(null);
    try {
      const res = await jobService.importJob(url);
      if (res.success) {
        setImportedData(res.data);
        setAppNotes(res.data.application?.notes || '');
        toast.success(res.message || 'Job successfully imported!');
        
        // Autoselect primary resume if available
        const primaryRes = resumes.find(r => r.isPrimary);
        if (primaryRes) setSelectedResume(primaryRes.id);

        // Pre-fill notes if available
        queryClient.invalidateQueries({ queryKey: ['dashboard-analytics'] });
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to import job details');
    } finally {
      setIsImporting(false);
      // Clean query parameters so it does not auto-run on reload
      setSearchParams({});
    }
  };

  const handleManualImport = (e: React.FormEvent) => {
    e.preventDefault();
    handleImportUrl(jobUrl);
  };

  const handleSaveAppDetails = async () => {
    if (!importedData?.application?.id) return;
    try {
      await axios.put(`/applications/${importedData.application.id}`, {
        resumeId: selectedResume || null,
        coverLetterId: selectedCoverLetter || null,
        notes: appNotes
      });
      toast.success('Application details updated');
    } catch (err) {
      toast.error('Failed to save details');
    }
  };

  const toggleCheck = (id: number) => {
    setChecklist(p => p.map(item => item.id === id ? { ...item, completed: !item.completed } : item));
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(bookmarkletCode);
    toast.success('Bookmarklet code copied to clipboard!');
  };

  return (
    <div className="space-y-6 p-6 bg-app-bg text-app-primary min-h-screen animate-fade-in">
      <PageHeader title="Browser Productivity Suite" subtitle="Import jobs from LinkedIn, Indeed, or Glassdoor in one-click." icon={Zap} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Import Box and Bookmarklet installer */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Quick paste form */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-bold text-slate-200 mb-2 flex items-center gap-1.5"><Link2 className="h-5 w-5 text-blue-400" /> Quick Import</h3>
            <p className="text-xs text-app-secondary mb-4">Paste any Job Posting URL here to scrape and analyze using the AI pipeline.</p>
            <form onSubmit={handleManualImport} className="space-y-3">
              <input
                type="url"
                required
                placeholder="https://www.linkedin.com/jobs/view/..."
                value={jobUrl}
                onChange={e => setJobUrl(e.target.value)}
                className="w-full px-3 py-2 border border-app-border rounded-xl text-sm bg-app-bg text-app-primary placeholder:text-app-secondary focus:outline-none"
              />
              <Button type="submit" disabled={isImporting} className="w-full flex justify-center items-center gap-2">
                {isImporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                {isImporting ? 'Importing & Analyzing...' : 'Import Job URL'}
              </Button>
            </form>
          </div>

          {/* Bookmarklet installer card */}
          <div className="glass-card p-6 space-y-4">
            <h3 className="text-lg font-bold text-slate-200 flex items-center gap-1.5"><Sparkles className="h-5 w-5 text-indigo-400" /> One-Click Bookmarklet</h3>
            <p className="text-xs text-slate-450 leading-relaxed">
              Drag the button below to your browser Bookmarks Bar, or copy the code block to create a manual bookmark. When you are looking at a job description on LinkedIn, click it to instantly load this job.
            </p>
            
            {/* Draggable button */}
            <a
              href={bookmarkletCode}
              onClick={e => e.preventDefault()}
              className="inline-flex items-center justify-center w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-xs font-bold shadow-lg hover:shadow-indigo-500/20 cursor-move border border-blue-500/35"
            >
              🚀 Drag to Bookmarks
            </a>

            <div className="relative bg-slate-900 p-3 rounded-lg border border-app-border">
              <code className="text-[10px] text-slate-400 block break-all whitespace-pre-wrap">{bookmarkletCode}</code>
              <button
                onClick={copyToClipboard}
                className="absolute top-2 right-2 p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-400"
                title="Copy Bookmarklet Code"
              >
                <Clipboard className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Dynamic import summary panel */}
        <div className="lg:col-span-2">
          {isImporting ? (
            <div className="glass-card p-8 text-center space-y-4">
              <Loader2 className="h-10 w-10 text-blue-500 animate-spin mx-auto" />
              <h3 className="font-semibold text-slate-200">Processing Job Posting...</h3>
              <p className="text-xs text-app-secondary max-w-sm mx-auto">
                Our AI agents are scraping the description, matching required skill tags, and computing ATS keyword coverage indexes.
              </p>
            </div>
          ) : importedData ? (
            <div className="glass-card p-6 space-y-6 animate-slide-up">
              
              {/* Job Title Header */}
              <div className="border-b border-app-border pb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-blue-400">{importedData.job?.company}</span>
                    <h2 className="text-xl font-bold text-slate-200 mt-1">{importedData.job?.title}</h2>
                    <p className="text-xs text-app-secondary mt-1">{importedData.job?.location}</p>
                  </div>
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-center">
                    <span className="text-2xl font-bold text-emerald-400">{importedData.job?.aiScore || 75}%</span>
                    <p className="text-[9px] uppercase font-bold tracking-wider text-emerald-500 mt-0.5">ATS Match</p>
                  </div>
                </div>
              </div>

              {/* Linking Selectors */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-app-secondary mb-1.5">Link Target Resume</label>
                  <select
                    value={selectedResume}
                    onChange={e => setSelectedResume(e.target.value)}
                    className="w-full px-3 py-2 border border-app-border rounded-xl text-sm bg-app-bg text-app-primary focus:outline-none"
                  >
                    <option value="">-- Choose Resume --</option>
                    {resumes.map(r => <option key={r.id} value={r.id}>{r.fileName} ({r.atsScore || 0}% ATS)</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-app-secondary mb-1.5">Link Custom Cover Letter</label>
                  <select
                    value={selectedCoverLetter}
                    onChange={e => setSelectedCoverLetter(e.target.value)}
                    className="w-full px-3 py-2 border border-app-border rounded-xl text-sm bg-app-bg text-app-primary focus:outline-none"
                  >
                    <option value="">-- Choose Cover Letter --</option>
                    {letters.map(l => <option key={l.id} value={l.id}>{l.title}</option>)}
                  </select>
                </div>
              </div>

              {/* Prepare Action Checklist */}
              <div>
                <h4 className="text-sm font-semibold text-slate-250 mb-3">Preparation Action Checklist</h4>
                <div className="space-y-2">
                  {checklist.map(item => (
                    <button
                      key={item.id}
                      onClick={() => toggleCheck(item.id)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl border border-app-border bg-slate-900/30 text-left text-xs font-medium hover:border-slate-800"
                    >
                      <CheckSquare className={`h-4 w-4 ${item.completed ? 'text-emerald-450' : 'text-slate-600'}`} />
                      <span className={item.completed ? 'line-through text-app-secondary' : 'text-slate-300'}>{item.text}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Application Notes */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-app-secondary mb-1.5">Application Prep Notes</label>
                <textarea
                  rows={4}
                  value={appNotes}
                  onChange={e => setAppNotes(e.target.value)}
                  placeholder="Record recruiter contact notes, interview questions, or follow up reminders..."
                  className="w-full px-3 py-2 border border-app-border rounded-xl text-sm bg-app-bg text-app-primary focus:outline-none resize-none placeholder:text-app-secondary"
                />
              </div>

              {/* Bottom control links */}
              <div className="flex justify-between items-center border-t border-app-border pt-4">
                <Link
                  to={`/app/applications/${importedData.application?.id}/workspace`}
                  className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1"
                >
                  Open Application Workspace <ArrowRight className="h-3.5 w-3.5" />
                </Link>
                <Button onClick={handleSaveAppDetails}>Save Details</Button>
              </div>

            </div>
          ) : (
            <div className="glass-card p-12 text-center text-app-secondary flex flex-col items-center justify-center">
              <Clipboard className="h-12 w-12 text-slate-600 mb-3 animate-pulse" />
              <h3 className="font-semibold text-slate-350 mb-1">Waiting for import target</h3>
              <p className="text-xs max-w-xs">
                Paste a URL in the box on the left, or use the drag-and-drop bookmarklet while browsing vacancies.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
