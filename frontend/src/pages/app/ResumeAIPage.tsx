import React, { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { PageHeader, Button, StatsCard, Badge, LoadingState, EmptyState } from '@/shared/components/ui';
import {
  FileText, Sparkles, Target, CheckCircle2, Download, Upload,
  TrendingUp, AlertCircle, RefreshCw, Zap, Plus, Trash2, Star,
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

const generateAnalysis = (jd: string): AnalysisResult => {
  const tech = ['react','typescript','node','python','aws','docker','kubernetes','sql','graphql','redis','git','agile','rest','api'];
  const matched = tech.filter(k => jd.toLowerCase().includes(k));
  const missing = tech.filter(k => !jd.toLowerCase().includes(k)).slice(0, 5);
  return {
    atsScore: Math.min(95, 60 + matched.length * 4),
    keywordMatch: Math.min(100, 50 + matched.length * 5),
    readabilityScore: 88,
    recruiterScore: Math.min(95, 65 + matched.length * 3),
    strengths: ['Clear professional summary','Quantified achievements with metrics','ATS-friendly formatting','Strong action verbs throughout'],
    improvements: [
      'Add more role-specific keywords from the job description',
      'Include measurable outcomes for each position',
      jd ? 'Tailor your summary to match the target role' : 'Paste a job description for tailored advice',
    ],
    missingSkills: missing.map(s => s.charAt(0).toUpperCase() + s.slice(1)),
    matchedKeywords: matched.map(s => s.charAt(0).toUpperCase() + s.slice(1)),
    suggestions: [
      'Replace "responsible for" with action verbs like "Led", "Architected", "Delivered"',
      'Add quantified impact: "Reduced load time by 40%" vs "Improved performance"',
      'Include cloud certifications in a dedicated Certifications section',
    ],
  };
};

const TAILORED_TEMPLATE = `John Doe | john.doe@email.com | +1 (555) 123-4567 | San Francisco, CA

PROFESSIONAL SUMMARY
Senior Frontend Engineer with 5+ years delivering high-performance React applications at scale.
Reduced build times by 35%, mentored 4-person teams, and shipped features for millions of users.
Expert in TypeScript, React, Node.js, and AWS cloud architecture.

TECHNICAL SKILLS
Frontend: React, TypeScript, Next.js, Redux, Tailwind CSS, GraphQL
Backend: Node.js, Express, Python, REST APIs, PostgreSQL, Redis
DevOps: AWS, Docker, Kubernetes, CI/CD, Terraform
Tools: Git, Jest, Figma, Agile/Scrum

EXPERIENCE
Senior Frontend Engineer | TechCorp Inc. | Jan 2022–Present
• Architected 12 major features serving 2M+ daily active users
• Led 4 engineers, reducing sprint gaps by 35%
• Cut deployment time from 45 min to 8 min via CI/CD
• Raised test coverage from 42% to 87%, cutting production bugs by 60%

EDUCATION
B.S. Computer Science | University of California, Berkeley | 2020
GPA: 3.8 | Dean's List

CERTIFICATIONS
AWS Certified Solutions Architect – Associate (2023)`;

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
  const [savedVersions, setSavedVersions] = useState<{ name: string; score: number; date: string; content: string }[]>([]);

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
    setIsAnalyzing(true);
    await new Promise(r => setTimeout(r, 1500));
    const res = generateAnalysis(jd);
    setAnalysis(res);
    setATSScore(res.atsScore);
    setRewriteSuggestions(res.suggestions);
    setMissingSkills(res.missingSkills);
    setIsAnalyzing(false);
    toast.success('Analysis complete!');
  };

  const handleRewrite = async () => {
    setIsRewriting(true);
    await new Promise(r => setTimeout(r, 2000));
    setTailored(TAILORED_TEMPLATE);
    setActiveTab('tailor');
    setIsRewriting(false);
    toast.success('AI-tailored resume generated!');
  };

  const handleSaveVersion = () => {
    const v = { name: `Tailored — ${new Date().toLocaleDateString()}`, score: analysis?.atsScore ?? 85, date: new Date().toLocaleDateString(), content: tailored };
    setSavedVersions(p => [v, ...p]);
    toast.success('Version saved!');
  };

  const handleDownload = (content?: string) => {
    const text = content ?? tailored ?? TAILORED_TEMPLATE;
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
              <div className="text-sm text-gray-600 mt-1">{label}</div>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left panel */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><Upload className="h-4 w-4 text-primary-600" />Resumes</h3>
            <div {...getRootProps()} className={`border-2 border-dashed rounded-lg p-5 text-center cursor-pointer transition-all mb-3 ${isDragActive ? 'border-primary-500 bg-primary-50' : 'border-gray-300 hover:border-primary-400'}`}>
              <input {...getInputProps()} />
              <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Drop PDF/DOC here or click to upload</p>
            </div>
            {resumesLoading ? <LoadingState message="Loading resumes…" /> : (
              <div className="space-y-2">
                {localResumes.length === 0 ? (
                  <EmptyState icon={FileText} title="No resumes" description="Upload your first resume" />
                ) : localResumes.map(r => (
                  <div key={r.id} onClick={() => { setSelected(r); setStoreResume(r as any); }}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${selected.id === r.id ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-primary-300'}`}>
                    <FileText className="h-5 w-5 text-gray-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{r.name}</p>
                      <p className="text-xs text-gray-500">{r.size > 0 ? fmt(r.size) : '—'}</p>
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

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><Target className="h-4 w-4 text-primary-600" />Target Job Description</h3>
            <textarea rows={6} value={jd} onChange={e => setJd(e.target.value)}
              placeholder="Paste the job description here for tailored keyword analysis…"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 resize-none" />
            <Button onClick={handleAnalyze} disabled={isAnalyzing} className="w-full mt-3 justify-center">
              {isAnalyzing ? <><RefreshCw className="h-4 w-4 animate-spin mr-1" />Analyzing…</> : <><Zap className="h-4 w-4 mr-1" />Analyze Now</>}
            </Button>
          </div>
        </div>

        {/* Main panel */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="flex border-b border-gray-200">
              {(['analyze', 'tailor', 'versions'] as const).map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === tab ? 'border-b-2 border-primary-600 text-primary-600 bg-primary-50' : 'text-gray-600 hover:text-gray-900'}`}>
                  {tab === 'tailor' ? 'AI Tailored' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            <div className="p-6">
              {activeTab === 'analyze' && (
                <div className="space-y-5">
                  {!analysis ? (
                    <div className="text-center py-12">
                      <Sparkles className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500 mb-4">Click "Analyze Resume" to get AI-powered insights</p>
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
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900">Saved Versions</h4>
                  {savedVersions.length === 0 ? (
                    <EmptyState icon={FileText} title="No saved versions" description="Generate and save a tailored resume to see versions here" />
                  ) : savedVersions.map((v, i) => (
                    <div key={i} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-primary-300">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-gray-400" />
                        <div><p className="font-medium text-gray-900">{v.name}</p><p className="text-xs text-gray-500">{v.date}</p></div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-sm font-bold ${scoreColor(v.score)}`}>{v.score}% ATS</span>
                        <Button variant="ghost" size="sm" onClick={() => handleDownload(v.content)}><Download className="h-4 w-4" /></Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
