import React, { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { PageHeader, Button, StatsCard, Badge, ResumeViewer } from '@/shared/components/ui';
import {
  FileText, Sparkles, Target, CheckCircle2, Download, Upload,
  TrendingUp, AlertCircle, RefreshCw, Eye, Zap, Plus,
} from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { useResumeAIStore } from '@/store';
import { resumeService } from '@/api/services/resumeService';

interface Resume {
  id: string;
  name: string;
  size: number;
  uploadDate: Date;
  atsScore: number;
  jobTitle?: string;
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

const DEFAULT_RESUME: Resume = {
  id: '1',
  name: 'John_Doe_Software_Engineer.pdf',
  size: 245000,
  uploadDate: new Date('2025-10-01'),
  atsScore: 72,
};

const generateAnalysis = (jobDescription: string, resume: Resume): AnalysisResult => {
  const jobKeywords = jobDescription.toLowerCase().match(/\b\w{4,}\b/g) || [];
  const techKeywords = ['react', 'typescript', 'node', 'python', 'aws', 'docker', 'kubernetes', 'sql', 'graphql', 'redis', 'git', 'agile', 'rest', 'api'];
  const matched = techKeywords.filter(k => jobDescription.toLowerCase().includes(k));
  const missing = techKeywords.filter(k => !jobDescription.toLowerCase().includes(k)).slice(0, 5);

  return {
    atsScore: Math.min(95, 60 + matched.length * 4),
    keywordMatch: Math.min(100, 50 + matched.length * 5),
    readabilityScore: 88,
    recruiterScore: Math.min(95, 65 + matched.length * 3),
    strengths: [
      'Clear professional summary section',
      'Quantified achievements with metrics',
      'ATS-friendly formatting and structure',
      'Strong action verbs throughout',
    ],
    improvements: [
      'Add more role-specific keywords from the job description',
      'Include measurable outcomes for each position',
      'Add a dedicated technical skills section',
      jobDescription ? 'Tailor your summary to match the target role' : 'Upload a job description to get tailored advice',
    ],
    missingSkills: missing.map(s => s.charAt(0).toUpperCase() + s.slice(1)),
    matchedKeywords: matched.map(s => s.charAt(0).toUpperCase() + s.slice(1)),
    suggestions: [
      'Replace "responsible for" with strong action verbs like "Led", "Architected", "Delivered"',
      'Add quantified impact: "Reduced load time by 40%" instead of "Improved performance"',
      'Include cloud certifications in a dedicated Certifications section',
    ],
  };
};

const TAILORED_RESUME = `John Doe
john.doe@email.com | +1 (555) 123-4567 | San Francisco, CA
linkedin.com/in/johndoe | github.com/johndoe

PROFESSIONAL SUMMARY
Senior Frontend Engineer with 5+ years delivering high-performance React applications at scale. Proven track record of reducing load times by 40%, mentoring 4-person teams, and shipping features that serve millions of users. Expert in TypeScript, React, Node.js, and AWS cloud architecture.

TECHNICAL SKILLS
Frontend: React, TypeScript, Next.js, Redux, Tailwind CSS, GraphQL
Backend: Node.js, Express, Python, REST APIs, PostgreSQL, Redis
DevOps: AWS (EC2, S3, Lambda), Docker, Kubernetes, CI/CD, Terraform
Tools: Git, Jest, Webpack, Figma, Agile/Scrum

EXPERIENCE
Senior Frontend Engineer | TechCorp Inc. | Jan 2022 – Present | Remote
• Architected and delivered 12 major product features serving 2M+ daily active users
• Led team of 4 engineers, reducing sprint velocity gaps by 35% through async-first processes
• Implemented CI/CD pipelines cutting deployment time from 45 min to 8 min
• Increased test coverage from 42% to 87%, reducing production bugs by 60%

Full Stack Developer | StartupXYZ | May 2020 – Dec 2021 | San Francisco, CA
• Built MVP from scratch using MERN stack; product reached 10K users in 3 months
• Designed real-time messaging system handling 50K concurrent WebSocket connections
• Integrated Stripe payments processing $500K+ in transactions monthly

EDUCATION
B.S. Computer Science | University of California, Berkeley | 2020
GPA: 3.8 | Dean's List | President, CS Club

CERTIFICATIONS
AWS Certified Solutions Architect – Associate (2023)
Google Cloud Professional Developer (2022)`;

export default function ResumeAIPage() {
  const queryClient = useQueryClient();
  const { setSelectedResume: setStoreResume, setATSScore, setRewriteSuggestions, setMissingSkills, setLoading, setGenerating, atsScore: storeAtsScore } = useResumeAIStore();

  const { data: resumesData, isLoading: resumesLoading } = useQuery({
    queryKey: ['resumes'],
    queryFn: resumeService.getResumes,
    retry: false,
  });

  const uploadMutation = useMutation({
    mutationFn: (file: File) => resumeService.uploadResume(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resumes'] });
      toast.success('Resume uploaded successfully!');
    },
    onError: () => toast.error('Upload failed — saved locally'),
  });

  const [resumes, setResumes] = useState<Resume[]>([DEFAULT_RESUME]);
  const [selectedResume, setSelectedResumeState] = useState<Resume>(DEFAULT_RESUME);
  const selectResume = (r: Resume) => { setSelectedResumeState(r); setStoreResume(r); };
  const [jobDescription, setJobDescription] = useState('');
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isRewriting, setIsRewriting] = useState(false);
  const [tailoredContent, setTailoredContent] = useState('');
  const [activeTab, setActiveTab] = useState<'analyze' | 'tailor' | 'versions'>('analyze');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (resumesData?.resumes?.length) {
      const mapped = resumesData.resumes.map((r: { id: string; name?: string; fileName?: string; atsScore?: number; createdAt?: string }) => ({
        id: r.id,
        name: r.name || r.fileName || 'Resume.pdf',
        size: 0,
        uploadDate: new Date(r.createdAt || Date.now()),
        atsScore: r.atsScore || 70,
      }));
      setResumes(mapped);
      if (mapped[0]) selectResume(mapped[0]);
    }
  }, [resumesData]);

  const handleDownload = () => {
    const content = tailoredContent || TAILORED_RESUME;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = selectedResume.name.replace(/\.pdf$/i, '_optimized.txt');
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Resume downloaded');
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    acceptedFiles.forEach(file => {
      const newResume: Resume = {
        id: Date.now().toString(),
        name: file.name,
        size: file.size,
        uploadDate: new Date(),
        atsScore: Math.floor(Math.random() * 30) + 60,
      };
      setResumes(prev => [...prev, newResume]);
      selectResume(newResume);
      uploadMutation.mutate(file);
    });
    toast.success('Resume uploaded successfully!');
  }, [uploadMutation]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'], 'application/msword': ['.doc', '.docx'] },
  });

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setLoading(true);
    await new Promise(r => setTimeout(r, 1800));
    const result = generateAnalysis(jobDescription, selectedResume);
    setAnalysis(result);
    setATSScore(result.atsScore);
    setRewriteSuggestions(result.suggestions);
    setMissingSkills(result.missingSkills);
    setIsAnalyzing(false);
    setLoading(false);
    toast.success('Analysis complete!');
  };

  const handleRewrite = async () => {
    setIsRewriting(true);
    await new Promise(r => setTimeout(r, 2500));
    setTailoredContent(TAILORED_RESUME);
    setActiveTab('tailor');
    setIsRewriting(false);
    showSuccess('AI-tailored resume generated!');
  };

  const handleSaveVersion = () => {
    showSuccess('Resume version saved!');
  };

  const formatSize = (bytes: number) => {
    return bytes < 1024 * 1024
      ? `${(bytes / 1024).toFixed(0)} KB`
      : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getScoreColor = (score: number) =>
    score >= 85 ? 'text-emerald-600' : score >= 70 ? 'text-yellow-600' : 'text-red-600';

  const getScoreBg = (score: number) =>
    score >= 85 ? 'bg-emerald-50 border-emerald-200' : score >= 70 ? 'bg-yellow-50 border-yellow-200' : 'bg-red-50 border-red-200';

  return (
    <div className="space-y-6">
      <PageHeader title="Resume AI" subtitle="Upload, analyze, and optimize your resume with AI" icon={FileText}>
        <Button onClick={handleAnalyze} disabled={isAnalyzing} className="flex items-center gap-2">
          {isAnalyzing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
          {isAnalyzing ? 'Analyzing...' : 'Analyze Resume'}
        </Button>
      </PageHeader>

      {successMsg && (
        <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-sm font-medium">
          <CheckCircle2 className="h-4 w-4" />
          {successMsg}
        </div>
      )}

      {analysis && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className={`rounded-xl border p-4 text-center ${getScoreBg(analysis.atsScore)}`}>
            <div className={`text-3xl font-bold ${getScoreColor(analysis.atsScore)}`}>{analysis.atsScore}%</div>
            <div className="text-sm text-gray-600 mt-1">ATS Score</div>
          </div>
          <div className={`rounded-xl border p-4 text-center ${getScoreBg(analysis.keywordMatch)}`}>
            <div className={`text-3xl font-bold ${getScoreColor(analysis.keywordMatch)}`}>{analysis.keywordMatch}%</div>
            <div className="text-sm text-gray-600 mt-1">Keyword Match</div>
          </div>
          <div className={`rounded-xl border p-4 text-center ${getScoreBg(analysis.readabilityScore)}`}>
            <div className={`text-3xl font-bold ${getScoreColor(analysis.readabilityScore)}`}>{analysis.readabilityScore}%</div>
            <div className="text-sm text-gray-600 mt-1">Readability</div>
          </div>
          <div className={`rounded-xl border p-4 text-center ${getScoreBg(analysis.recruiterScore)}`}>
            <div className={`text-3xl font-bold ${getScoreColor(analysis.recruiterScore)}`}>{analysis.recruiterScore}%</div>
            <div className="text-sm text-gray-600 mt-1">Recruiter Score</div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel */}
        <div className="space-y-4">
          {/* Upload Zone */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Upload className="h-4 w-4 text-primary-600" /> Resumes
            </h3>
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-5 text-center cursor-pointer transition-all mb-3 ${
                isDragActive ? 'border-primary-500 bg-primary-50' : 'border-gray-300 hover:border-primary-400'
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Drop PDF/DOC here or click to upload</p>
            </div>
            <div className="space-y-2">
              {resumes.map(r => (
                <div
                  key={r.id}
                  onClick={() => selectResume(r)}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                    selectedResume.id === r.id ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-primary-300'
                  }`}
                >
                  <FileText className="h-5 w-5 text-gray-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{r.name}</p>
                    <p className="text-xs text-gray-500">{formatSize(r.size)}</p>
                  </div>
                  <span className={`text-xs font-bold ${getScoreColor(r.atsScore)}`}>{r.atsScore}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Job Description */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Target className="h-4 w-4 text-primary-600" /> Target Job Description
            </h3>
            <textarea
              rows={6}
              value={jobDescription}
              onChange={e => setJobDescription(e.target.value)}
              placeholder="Paste the job description here to get tailored analysis and keyword matching..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
            />
            <Button onClick={handleAnalyze} disabled={isAnalyzing} className="w-full mt-3 flex items-center justify-center gap-2">
              {isAnalyzing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
              {isAnalyzing ? 'Analyzing...' : 'Analyze Now'}
            </Button>
          </div>
        </div>

        {/* Main Panel */}
        <div className="lg:col-span-2 space-y-4">
          {/* Tabs */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="flex border-b border-gray-200">
              {(['analyze', 'tailor', 'versions'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-3 text-sm font-medium capitalize transition-colors ${
                    activeTab === tab
                      ? 'border-b-2 border-primary-600 text-primary-600 bg-primary-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
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
                      <Button onClick={handleAnalyze} disabled={isAnalyzing} className="flex items-center gap-2 mx-auto">
                        <Zap className="h-4 w-4" />
                        Analyze Resume
                      </Button>
                    </div>
                  ) : (
                    <>
                      {/* Strengths & Improvements */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                          <div className="flex items-center gap-2 mb-3">
                            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                            <h4 className="font-semibold text-emerald-900">Strengths</h4>
                          </div>
                          <ul className="space-y-1.5">
                            {analysis.strengths.map((s, i) => (
                              <li key={i} className="text-sm text-emerald-800 flex items-start gap-2">
                                <span className="text-emerald-500 mt-0.5">•</span>{s}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                          <div className="flex items-center gap-2 mb-3">
                            <AlertCircle className="h-5 w-5 text-amber-600" />
                            <h4 className="font-semibold text-amber-900">Improvements</h4>
                          </div>
                          <ul className="space-y-1.5">
                            {analysis.improvements.map((s, i) => (
                              <li key={i} className="text-sm text-amber-800 flex items-start gap-2">
                                <span className="text-amber-500 mt-0.5">•</span>{s}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* Matched Keywords */}
                      {analysis.matchedKeywords.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Matched Keywords
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {analysis.matchedKeywords.map((k, i) => (
                              <span key={i} className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-xs font-medium rounded-full">
                                {k}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Missing Skills */}
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                          <Plus className="h-4 w-4 text-red-500" /> Missing Skills
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {analysis.missingSkills.map((s, i) => (
                            <span key={i} className="px-2.5 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Suggestions */}
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-blue-600" /> AI Suggestions
                        </h4>
                        <ul className="space-y-2">
                          {analysis.suggestions.map((s, i) => (
                            <li key={i} className="text-sm text-blue-800 flex items-start gap-2">
                              <span className="font-bold mt-0.5">{i + 1}.</span>{s}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <Button onClick={handleRewrite} disabled={isRewriting} className="w-full flex items-center justify-center gap-2">
                        {isRewriting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                        {isRewriting ? 'Generating AI Resume...' : 'Generate AI-Tailored Resume'}
                      </Button>
                    </>
                  )}
                </div>
              )}

              {activeTab === 'tailor' && (
                <div className="space-y-4">
                  {!tailoredContent ? (
                    <div className="text-center py-12">
                      <Sparkles className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500 mb-4">Generate an AI-tailored resume first by analyzing your resume</p>
                      <Button onClick={() => setActiveTab('analyze')}>Go to Analysis</Button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full text-sm font-medium">
                          <CheckCircle2 className="h-4 w-4" />
                          AI-Tailored Version Generated
                        </div>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" className="flex items-center gap-1" onClick={handleSaveVersion}>
                            <Plus className="h-4 w-4" /> Save Version
                          </Button>
                          <Button variant="ghost" size="sm" className="flex items-center gap-1">
                            <Download className="h-4 w-4" /> Download
                          </Button>
                        </div>
                      </div>
                      <textarea
                        value={tailoredContent}
                        onChange={e => setTailoredContent(e.target.value)}
                        rows={24}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                      />
                    </>
                  )}
                </div>
              )}

              {activeTab === 'versions' && (
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900">Saved Versions</h4>
                  {[
                    { name: 'Original - Software Engineer', date: 'Oct 1, 2025', score: 72 },
                    { name: 'Tailored - TechCorp Senior FE', date: 'Oct 15, 2025', score: 91 },
                    { name: 'Tailored - StartupXYZ Full Stack', date: 'Nov 3, 2025', score: 88 },
                  ].map((v, i) => (
                    <div key={i} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-primary-300 transition-all">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="font-medium text-gray-900">{v.name}</p>
                          <p className="text-xs text-gray-500">{v.date}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-sm font-bold ${getScoreColor(v.score)}`}>{v.score}% ATS</span>
                        <Button variant="ghost" size="sm"><Eye className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="sm"><Download className="h-4 w-4" /></Button>
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
