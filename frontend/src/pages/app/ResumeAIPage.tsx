import React, { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { PageHeader, Button, StatsCard, Badge, LoadingState, EmptyState } from '@/shared/components/ui';
import {
  FileText, Sparkles, Target, CheckCircle2, Download, Upload,
  TrendingUp, AlertCircle, RefreshCw, Zap, Plus, Trash2, Star,
  GitCompare, History, Square, CheckSquare
} from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { useResumeAIStore } from '@/store';
import { resumeService, Resume } from '@/api/services/resumeService';

// ── Local Resume type for the AI page (superset of API Resume) ───────────────
interface LocalResume {
  id: string;
  name: string;
  size: number;
  uploadDate: Date;
  atsScore: number;
  isPrimary?: boolean;
  fileUrl?: string;
}

interface AnalysisResult {
  atsScore: number;
  keywordMatch: number;
  readabilityScore: number;
  recruiterScore: number;
  strengths: string[];
  improvements: string[];
  missingSkills: string[];
  matchedKeywords: string[];
  suggestions: string[];
}

const DEFAULT_RESUME: LocalResume = {
  id: 'default',
  name: 'Your_Resume.pdf',
  size: 0,
  uploadDate: new Date(),
  atsScore: 0,
};

const mapApiResume = (r: Resume): LocalResume => ({
  id: r.id,
  name: r.fileName,
  size: r.fileSize,
  uploadDate: new Date(r.createdAt),
  atsScore: r.atsScore ?? 0,
  isPrimary: r.isPrimary,
  fileUrl: r.fileUrl,
});



export default function ResumeAIPage() {
  const queryClient = useQueryClient();
  const { setSelectedResume: setStoreResume, setATSScore, setRewriteSuggestions, setMissingSkills } = useResumeAIStore();

  const { data: resumesData, isLoading: resumesLoading } = useQuery({
    queryKey: ['resumes'],
    queryFn: resumeService.getResumes,
    retry: false,
  });

  const uploadMutation = useMutation({
    mutationFn: (file: File) => resumeService.uploadResume(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resumes'] });
      toast.success('Resume uploaded!');
    },
    onError: () => toast.error('Upload failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => resumeService.deleteResume(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resumes'] });
      toast.success('Resume deleted');
    },
  });

  const setPrimaryMutation = useMutation({
    mutationFn: (id: string) => resumeService.setPrimary(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['resumes'] }),
  });

  const [localResumes, setLocalResumes] = useState<LocalResume[]>([]);
  const [selected, setSelected] = useState<LocalResume>(DEFAULT_RESUME);
  const [jd, setJd] = useState('');
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isRewriting, setIsRewriting] = useState(false);
  const [tailored, setTailored] = useState('');
  const [activeTab, setActiveTab] = useState<'analyze' | 'tailor' | 'versions'>('analyze');

  // Version management states
  const [selectedVersionIds, setSelectedVersionIds] = useState<string[]>([]);
  const [comparisonResult, setComparisonResult] = useState<any>(null);
  const [isComparing, setIsComparing] = useState(false);

  const { data: versionsData, refetch: refetchVersions } = useQuery({
    queryKey: ['resumeVersions', selected.id],
    queryFn: () => resumeService.getVersions(selected.id),
    enabled: selected.id !== 'default' && !selected.id.startsWith('local-'),
  });

  useEffect(() => {
    if (resumesData?.resumes?.length) {
      const mapped = resumesData.resumes.map(mapApiResume);
      setLocalResumes(mapped);
      const primary = mapped.find(r => r.isPrimary) ?? mapped[0];
      setSelected(primary);
      setStoreResume(primary as any);
    }
  }, [resumesData, setStoreResume]);

  const onDrop = useCallback((files: File[]) => {
    files.forEach(f => {
      const lr: LocalResume = { id: `local-${Date.now()}`, name: f.name, size: f.size, uploadDate: new Date(), atsScore: 0 };
      setLocalResumes(p => [lr, ...p]);
      setSelected(lr);
      uploadMutation.mutate(f);
    });
  }, [uploadMutation]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'], 'application/msword': ['.doc', '.docx'] },
  });

  const handleAnalyze = async () => {
    if (selected.id === 'default' || selected.id.startsWith('local-')) {
      toast.error('Please select or upload a valid resume first');
      return;
    }
    if (!jd) {
      toast.error('Please provide a job description');
      return;
    }
    try {
      setIsAnalyzing(true);
      const res = await resumeService.analyzeResume(selected.id, jd);
      const analysisData = res.analysis || {};
      
      const mappedAnalysis: AnalysisResult = {
        atsScore: analysisData.overallScore || 0,
        keywordMatch: analysisData.keywordScore || 0,
        readabilityScore: analysisData.formatScore || 0,
        recruiterScore: analysisData.sectionScore || 0,
        strengths: analysisData.details?.matchedKeywords?.map((k: string) => `Matched keyword: ${k}`) || [],
        improvements: analysisData.details?.formatIssues || [],
        missingSkills: analysisData.details?.missingKeywords || [],
        matchedKeywords: analysisData.details?.matchedKeywords || [],
        suggestions: analysisData.details?.missingSections?.map((s: string) => `Missing section: ${s}`) || [],
      };
      
      setAnalysis(mappedAnalysis);
      setATSScore(mappedAnalysis.atsScore);
      setRewriteSuggestions(mappedAnalysis.suggestions);
      setMissingSkills(mappedAnalysis.missingSkills);
      toast.success('Analysis complete!');
    } catch (error) {
      toast.error('Failed to analyze resume');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleRewrite = async () => {
    if (selected.id === 'default' || selected.id.startsWith('local-')) {
      toast.error('Please select or upload a valid resume first');
      return;
    }
    if (!jd) {
      toast.error('Please provide a job description');
      return;
    }
    try {
      setIsRewriting(true);
      const res = await resumeService.tailorResume(selected.id, jd);
      setTailored(typeof res.version.content === 'string' ? res.version.content : JSON.stringify(res.version.content, null, 2));
      setActiveTab('tailor');
      refetchVersions();
      toast.success('AI-tailored resume generated!');
    } catch (error) {
      toast.error('Failed to tailor resume');
    } finally {
      setIsRewriting(false);
    }
  };

  const handleSaveVersion = () => {
    // Versions are already saved to the backend by `tailorResume`.
    // We can just refetch and switch to versions tab.
    refetchVersions();
    setActiveTab('versions');
    toast.success('Version is already saved in the database!');
  };

  const handleToggleVersionSelect = (id: string) => {
    setSelectedVersionIds(prev => 
      prev.includes(id) 
        ? prev.filter(vid => vid !== id) 
        : prev.length < 2 ? [...prev, id] : [prev[1], id]
    );
  };

  const handleCompare = async () => {
    if (selectedVersionIds.length !== 2) return;
    setIsComparing(true);
    try {
      const res = await resumeService.compareVersions(selectedVersionIds[0], selectedVersionIds[1]);
      if (res.success) {
        setComparisonResult(res.comparison);
      }
    } catch (err) {
      toast.error('Failed to compare versions');
    } finally {
      setIsComparing(false);
    }
  };

  const handleRestoreVersion = async (versionId: string) => {
    try {
      const res = await resumeService.revertVersion(versionId);
      if (res.success) {
        toast.success('Successfully reverted to version!');
        refetchVersions();
        queryClient.invalidateQueries({ queryKey: ['resumes'] });
      }
    } catch (err) {
      toast.error('Revert failed');
    }
  };

  const handleDeleteVersion = async (versionId: string) => {
    if (!window.confirm('Delete this version?')) return;
    try {
      const res = await resumeService.deleteVersion(versionId);
      if (res.success) {
        toast.success('Version deleted');
        refetchVersions();
        setSelectedVersionIds(prev => prev.filter(vid => vid !== versionId));
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Delete version failed');
    }
  };

  const handleDownload = (content?: string) => {
    const text = content ?? tailored;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${selected.name.replace(/\.[^.]+$/, '')}_optimized.txt`;
    a.click(); URL.revokeObjectURL(url);
    toast.success('Downloaded!');
  };

  const scoreColor = (s: number) => s >= 85 ? 'text-emerald-600' : s >= 70 ? 'text-yellow-600' : 'text-red-600';
  const scoreBg = (s: number) => s >= 85 ? 'bg-emerald-50 border-emerald-200' : s >= 70 ? 'bg-yellow-50 border-yellow-200' : 'bg-red-50 border-red-200';
  const fmt = (b: number) => b < 1024*1024 ? `${(b/1024).toFixed(0)} KB` : `${(b/1024/1024).toFixed(1)} MB`;

  return (
    <div className="space-y-6">
      <PageHeader title="Resume AI" subtitle="Upload, analyze, and optimize your resume with AI" icon={FileText}>
        <Button onClick={handleAnalyze} disabled={isAnalyzing}>
          {isAnalyzing ? <><RefreshCw className="h-4 w-4 animate-spin mr-2" />Analyzing…</> : <><Zap className="h-4 w-4 mr-2" />Analyze</>}
        </Button>
      </PageHeader>

      {analysis && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'ATS Score', val: analysis.atsScore },
            { label: 'Keyword Match', val: analysis.keywordMatch },
            { label: 'Readability', val: analysis.readabilityScore },
            { label: 'Recruiter Score', val: analysis.recruiterScore },
          ].map(({ label, val }) => (
            <div key={label} className={`rounded-xl border p-4 text-center ${scoreBg(val)}`}>
              <div className={`text-3xl font-bold ${scoreColor(val)}`}>{val}%</div>
              <div className="text-sm text-app-secondary mt-1">{label}</div>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left panel */}
        <div className="space-y-4">
          <div className="bg-app-card rounded-xl border border-app-border p-5">
            <h3 className="font-semibold text-app-primary mb-3 flex items-center gap-2"><Upload className="h-4 w-4 text-blue-500" />Resumes</h3>
            <div {...getRootProps()} className={`border-2 border-dashed rounded-lg p-5 text-center cursor-pointer transition-all mb-3 ${isDragActive ? 'border-primary-500 bg-primary-50' : 'border-gray-300 hover:border-primary-400'}`}>
              <input {...getInputProps()} />
              <Upload className="h-8 w-8 text-app-secondary mx-auto mb-2" />
              <p className="text-sm text-app-secondary">Drop PDF/DOC here or click to upload</p>
            </div>
            {resumesLoading ? <LoadingState message="Loading resumes…" /> : (
              <div className="space-y-2">
                {localResumes.length === 0 ? (
                  <EmptyState icon={FileText} title="No resumes" description="Upload your first resume" />
                ) : localResumes.map(r => (
                  <div key={r.id} onClick={() => { setSelected(r); setStoreResume(r as any); }}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${selected.id === r.id ? 'border-blue-500 bg-blue-500/5' : 'border-app-border hover:border-blue-400'}`}>
                    <FileText className="h-5 w-5 text-gray-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-app-primary truncate">{r.name}</p>
                      <p className="text-xs text-app-secondary">{r.size > 0 ? fmt(r.size) : '—'}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      {r.isPrimary && <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />}
                      <span className={`text-xs font-bold ${scoreColor(r.atsScore)}`}>{r.atsScore}%</span>
                      <button onClick={e => { e.stopPropagation(); deleteMutation.mutate(r.id); }} className="p-1 hover:text-red-600 text-gray-300"><Trash2 className="h-3 w-3" /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-app-card rounded-xl border border-app-border p-5">
            <h3 className="font-semibold text-app-primary mb-3 flex items-center gap-2"><Target className="h-4 w-4 text-blue-500" />Target Job Description</h3>
            <textarea rows={6} value={jd} onChange={e => setJd(e.target.value)}
              placeholder="Paste the job description here for tailored keyword analysis…"
              className="w-full px-3 py-2 border border-app-border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 resize-none bg-app-bg text-app-primary placeholder:text-app-secondary" />
            <Button onClick={handleAnalyze} disabled={isAnalyzing} className="w-full mt-3 justify-center">
              {isAnalyzing ? <><RefreshCw className="h-4 w-4 animate-spin mr-1" />Analyzing…</> : <><Zap className="h-4 w-4 mr-1" />Analyze Now</>}
            </Button>
          </div>
        </div>

        {/* Main panel */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-app-card rounded-xl border border-app-border overflow-hidden">
            <div className="flex border-b border-app-border">
              {(['analyze', 'tailor', 'versions'] as const).map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === tab ? 'border-b-2 border-blue-500 text-blue-500 bg-blue-500/5' : 'text-app-secondary hover:text-app-primary'}`}>
                  {tab === 'tailor' ? 'AI Tailored' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            <div className="p-6">
              {activeTab === 'analyze' && (
                <div className="space-y-5">
                  {!analysis ? (
                    <div className="text-center py-12">
                      <Sparkles className="h-12 w-12 text-app-secondary mx-auto mb-3" />
                      <p className="text-app-secondary mb-4">Click "Analyze Resume" to get AI-powered insights</p>
                      <Button onClick={handleAnalyze} disabled={isAnalyzing}><Zap className="h-4 w-4 mr-2" />Analyze Resume</Button>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                          <div className="flex items-center gap-2 mb-3"><CheckCircle2 className="h-5 w-5 text-emerald-600" /><h4 className="font-semibold text-emerald-900">Strengths</h4></div>
                          <ul className="space-y-1">{analysis.strengths.map((s, i) => <li key={i} className="text-sm text-emerald-800 flex gap-2"><span className="text-emerald-500 mt-0.5">•</span>{s}</li>)}</ul>
                        </div>
                        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                          <div className="flex items-center gap-2 mb-3"><AlertCircle className="h-5 w-5 text-amber-600" /><h4 className="font-semibold text-amber-900">Improvements</h4></div>
                          <ul className="space-y-1">{analysis.improvements.map((s, i) => <li key={i} className="text-sm text-amber-800 flex gap-2"><span className="text-amber-500 mt-0.5">•</span>{s}</li>)}</ul>
                        </div>
                      </div>
                      {analysis.matchedKeywords.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-600" />Matched Keywords</h4>
                          <div className="flex flex-wrap gap-2">{analysis.matchedKeywords.map((k, i) => <span key={i} className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-xs font-medium rounded-full">{k}</span>)}</div>
                        </div>
                      )}
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2"><Plus className="h-4 w-4 text-red-500" />Missing Skills</h4>
                        <div className="flex flex-wrap gap-2">{analysis.missingSkills.map((s, i) => <span key={i} className="px-2.5 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">{s}</span>)}</div>
                      </div>
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2"><Sparkles className="h-4 w-4 text-blue-600" />AI Suggestions</h4>
                        <ul className="space-y-2">{analysis.suggestions.map((s, i) => <li key={i} className="text-sm text-blue-800 flex gap-2"><span className="font-bold mt-0.5">{i + 1}.</span>{s}</li>)}</ul>
                      </div>
                      <Button onClick={handleRewrite} disabled={isRewriting} className="w-full justify-center">
                        {isRewriting ? <><RefreshCw className="h-4 w-4 animate-spin mr-2" />Generating…</> : <><Sparkles className="h-4 w-4 mr-2" />Generate AI-Tailored Resume</>}
                      </Button>
                    </>
                  )}
                </div>
              )}

              {activeTab === 'tailor' && (
                <div className="space-y-4">
                  {!tailored ? (
                    <div className="text-center py-12">
                      <Sparkles className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500 mb-4">Analyze your resume first to generate a tailored version</p>
                      <Button onClick={() => setActiveTab('analyze')}>Go to Analysis</Button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full text-sm font-medium"><CheckCircle2 className="h-4 w-4" />AI-Tailored Version Ready</div>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" onClick={handleSaveVersion}><Plus className="h-4 w-4 mr-1" />Save Version</Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDownload(tailored)}><Download className="h-4 w-4 mr-1" />Download</Button>
                        </div>
                      </div>
                      <textarea value={tailored} onChange={e => setTailored(e.target.value)} rows={24}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-primary-500 resize-none" />
                    </>
                  )}
                </div>
              )}

              {activeTab === 'versions' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b border-app-border">
                    <h4 className="font-semibold text-slate-205 text-sm">Saved Version History</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={selectedVersionIds.length !== 2 || isComparing}
                      onClick={handleCompare}
                      className="flex items-center gap-1.5 text-blue-450 hover:text-blue-355"
                    >
                      <GitCompare className="h-4 w-4" /> Compare Selected ({selectedVersionIds.length}/2)
                    </Button>
                  </div>
                  {!versionsData?.versions || versionsData.versions.length === 0 ? (
                    <EmptyState icon={FileText} title="No saved versions" description="Generate and save a tailored resume to see versions here" />
                  ) : (
                    <div className="space-y-3">
                      {versionsData.versions.map((v: any) => {
                        const isSelected = selectedVersionIds.includes(v.id);
                        return (
                          <div key={v.id} className={`flex items-center justify-between p-4 border rounded-xl bg-app-card transition-all ${v.isCurrent ? 'border-emerald-500/50 bg-emerald-500/5' : isSelected ? 'border-blue-500 bg-blue-500/5' : 'border-app-border hover:border-slate-800'}`}>
                            <div className="flex items-center gap-3">
                              <button
                                type="button"
                                onClick={() => handleToggleVersionSelect(v.id)}
                                className="text-app-secondary hover:text-blue-400"
                              >
                                {isSelected ? (
                                  <CheckSquare className="h-4.5 w-4.5 text-blue-400" />
                                ) : (
                                  <Square className="h-4.5 w-4.5" />
                                )}
                              </button>
                              <FileText className="h-5 w-5 text-slate-500" />
                              <div>
                                <p className="font-medium text-slate-200 text-sm flex items-center gap-2">
                                  {v.title}
                                  {v.isCurrent && <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/25 text-emerald-400 border border-emerald-500/30">Active</span>}
                                </p>
                                <p className="text-xs text-app-secondary mt-0.5">{new Date(v.createdAt).toLocaleDateString()}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className={`text-xs font-bold ${scoreColor(v.atsScore || 0)}`}>{v.atsScore || 0}% ATS</span>
                              <Button variant="ghost" size="sm" onClick={() => handleDownload(typeof v.content === 'string' ? v.content : JSON.stringify(v.content))}><Download className="h-4 w-4" /></Button>
                              <Button variant="ghost" size="sm" onClick={() => handleRestoreVersion(v.id)} title="Restore this version"><History className="h-4 w-4" /></Button>
                              {!v.isCurrent && (
                                <button onClick={() => handleDeleteVersion(v.id)} className="p-1 hover:text-red-500 text-app-secondary" title="Delete draft"><Trash2 className="h-4 w-4" /></button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Side-by-side comparison modal */}
      {comparisonResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setComparisonResult(null)} />
          <div className="relative w-full max-w-2xl bg-app-card border border-app-border rounded-xl shadow-2xl p-6 overflow-hidden animate-slide-up">
            <h3 className="text-lg font-bold text-slate-200 mb-4 flex items-center gap-2">
              <GitCompare className="h-5 w-5 text-blue-400" /> Version Comparison Diff
            </h3>
            
            <div className="grid grid-cols-2 gap-4 border border-app-border rounded-xl p-4 bg-slate-900/30 mb-4">
              <div>
                <span className="text-[10px] text-app-secondary uppercase font-bold tracking-wider">Older Version (v{comparisonResult.version1?.versionNumber})</span>
                <p className="text-xs text-slate-400 mt-1">ATS Score: {comparisonResult.version1?.atsScore}%</p>
                <p className="text-[10px] text-app-secondary mt-0.5">{new Date(comparisonResult.version1?.createdAt).toLocaleDateString()}</p>
              </div>
              <div>
                <span className="text-[10px] text-app-secondary uppercase font-bold tracking-wider">Newer Version (v{comparisonResult.version2?.versionNumber})</span>
                <p className="text-xs text-slate-400 mt-1">ATS Score: {comparisonResult.version2?.atsScore}%</p>
                <p className="text-[10px] text-app-secondary mt-0.5">{new Date(comparisonResult.version2?.createdAt).toLocaleDateString()}</p>
              </div>
              <div className="col-span-2 border-t border-app-border pt-3">
                <span className="text-xs font-semibold text-slate-350">ATS Score Difference:</span>
                <span className={`text-xs font-bold ml-2 ${comparisonResult.atsScoreDifference >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {comparisonResult.atsScoreDifference >= 0 ? `+${comparisonResult.atsScoreDifference}%` : `${comparisonResult.atsScoreDifference}%`}
                </span>
              </div>
            </div>

            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
              {/* Added items */}
              {comparisonResult.contentChanges?.added?.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-450 mb-2">Added Skills / Keywords</h4>
                  <div className="flex flex-wrap gap-2">
                    {comparisonResult.contentChanges.added.map((k: string, i: number) => (
                      <span key={i} className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">+{k}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Removed items */}
              {comparisonResult.contentChanges?.removed?.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-rose-455 mb-2">Removed Skills / Keywords</h4>
                  <div className="flex flex-wrap gap-2">
                    {comparisonResult.contentChanges.removed.map((k: string, i: number) => (
                      <span key={i} className="px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium">-{k}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Modified sections list */}
              {comparisonResult.contentChanges?.modified?.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-blue-450 mb-2">Structure & Content Modifications</h4>
                  <ul className="space-y-1.5">
                    {comparisonResult.contentChanges.modified.map((mod: string, i: number) => (
                      <li key={i} className="text-xs text-slate-350 flex gap-2 items-start">
                        <span className="text-blue-400 mt-0.5">•</span>
                        <span>{mod}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {(!comparisonResult.contentChanges?.added?.length && !comparisonResult.contentChanges?.removed?.length && !comparisonResult.contentChanges?.modified?.length) && (
                <div className="text-center py-6 text-xs text-app-secondary">No structural differences found between these drafts. Content remains identical.</div>
              )}
            </div>

            <div className="flex gap-2 justify-end border-t border-app-border pt-4 mt-6">
              <Button variant="ghost" onClick={() => setComparisonResult(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
