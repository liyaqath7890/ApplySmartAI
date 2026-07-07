import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PageHeader, Button } from '@/shared/components/ui';
import { Sparkles, FileText, Download, Save, RefreshCw, Trash2, CheckCircle2, Copy } from 'lucide-react';
import { useCoverLetterAIStore } from '@/store';
import { coverLetterService, CoverLetter } from '@/api/services/coverLetterService';

export default function CoverLetterAIPage() {
  const { setCurrentCoverLetter, setGenerating } = useCoverLetterAIStore();
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [description, setDescription] = useState('');
  const [tone, setTone] = useState('Professional');
  const [content, setContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [templateType, setTemplateType] = useState('Standard');
  const [keywordInput, setKeywordInput] = useState('');
  const [refineFeedback, setRefineFeedback] = useState('');
  const queryClient = useQueryClient();
  
  const { data: savedLettersData } = useQuery({
    queryKey: ['coverLetters'],
    queryFn: () => coverLetterService.getCoverLetters(),
  });
  const savedLetters = savedLettersData?.coverLetters || [];

  const [activeView, setActiveView] = useState<'create' | 'saved'>('create');
  const [successMsg, setSuccessMsg] = useState('');

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleGenerate = async () => {
    if (!company.trim() || !role.trim()) return;
    setIsGenerating(true);
    setGenerating(true);
    try {
      const res = await coverLetterService.generateCoverLetter({
        jobData: { title: role, company, description },
        tone,
        templateType,
        customPrompt: keywordInput ? `Strictly incorporate these keywords: ${keywordInput}` : '',
      });
      const letter = res.coverLetter.content;
      setContent(letter);
      setCurrentCoverLetter({ title: res.coverLetter.title, content: letter, isTemplate: false });
      queryClient.invalidateQueries({ queryKey: ['coverLetters'] });
      toast.success('Cover letter generated!');
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Failed to generate cover letter');
    } finally {
      setIsGenerating(false);
      setGenerating(false);
    }
  };

  const saveMutation = useMutation({
    mutationFn: (data: any) => coverLetterService.createCoverLetter(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coverLetters'] });
      showSuccess('Cover letter saved!');
    },
    onError: () => {
      toast.error('Failed to save cover letter');
    },
  });

  const handleSave = () => {
    if (!content) return;
    saveMutation.mutate({
      title: `${company} - ${role}`,
      content,
      isAiGenerated: true,
    });
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    showSuccess('Copied to clipboard!');
  };

  const deleteMutation = useMutation({
    mutationFn: (id: string) => coverLetterService.deleteCoverLetter(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coverLetters'] });
    },
  });

  const handleDeleteLetter = (id: string) => {
    deleteMutation.mutate(id);
  };

  const handleLoadSaved = (letter: CoverLetter) => {
    const parts = letter.title.split(' - ');
    if (parts.length >= 2) {
      setCompany(parts[0]);
      setRole(parts[1]);
    } else {
      setCompany('');
      setRole(letter.title);
    }
    setContent(letter.content);
    setActiveView('create');
  };

  return (
    <div className="space-y-6 animate-fade-in p-6 bg-app-bg text-app-primary min-h-screen">
      <div className="flex justify-between items-center border-b border-app-border pb-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 to-indigo-300 bg-clip-text text-transparent">
            Cover Letter Builder
          </h1>
          <p className="text-sm text-app-secondary mt-1">Design target-centric letters powered by AI matching guidelines.</p>
        </div>
      </div>

      {successMsg && (
        <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-sm font-semibold">
          <CheckCircle2 className="h-4 w-4" />{successMsg}
        </div>
      )}

      {/* View Tabs */}
      <div className="flex gap-2 border-b border-app-border pb-0">
        {(['create', 'saved'] as const).map(v => (
          <button
            key={v}
            onClick={() => setActiveView(v)}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all duration-200 ${
              activeView === v ? 'border-blue-500 text-blue-400' : 'border-transparent text-app-secondary hover:text-app-primary'
            }`}
          >
            {v === 'create' ? 'Create New' : 'Saved Letters'}
            {v === 'saved' && ` (${savedLetters.length})`}
          </button>
        ))}
      </div>

      {activeView === 'create' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form Panel */}
          <div className="space-y-4">
            <div className="glass-card p-5">
              <h3 className="font-semibold text-app-primary mb-4 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-blue-455" /> Job Details
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-app-secondary mb-1.5">Company Name *</label>
                  <input
                    type="text"
                    value={company}
                    onChange={e => setCompany(e.target.value)}
                    placeholder="e.g. Stripe"
                    className="w-full px-3 py-2 bg-app-bg border border-app-border rounded-xl text-app-primary placeholder-slate-450 focus:outline-none focus:ring-2 focus:ring-blue-500/40 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-app-secondary mb-1.5">Role / Job Title *</label>
                  <input
                    type="text"
                    value={role}
                    onChange={e => setRole(e.target.value)}
                    placeholder="e.g. Staff Product Designer"
                    className="w-full px-3 py-2 bg-app-bg border border-app-border rounded-xl text-app-primary placeholder-slate-450 focus:outline-none focus:ring-2 focus:ring-blue-500/40 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-app-secondary mb-1.5">Tone</label>
                  <select
                    value={tone}
                    onChange={e => setTone(e.target.value)}
                    className="w-full px-3 py-2 bg-app-bg border border-app-border rounded-xl text-app-primary focus:outline-none focus:ring-2 focus:ring-blue-500/40 text-sm"
                  >
                    <option>Professional</option>
                    <option>Enthusiastic</option>
                    <option>Concise</option>
                    <option>Creative</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-app-secondary mb-1.5">Template Format</label>
                  <select
                    value={templateType}
                    onChange={e => setTemplateType(e.target.value)}
                    className="w-full px-3 py-2 bg-app-bg border border-app-border rounded-xl text-app-primary focus:outline-none focus:ring-2 focus:ring-blue-500/40 text-sm"
                  >
                    <option value="Standard">Standard Business</option>
                    <option value="Creative">Creative / Narrative</option>
                    <option value="Executive">Executive / Metric-focused</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-app-secondary mb-1.5">Focus Keywords (comma-separated)</label>
                  <input
                    type="text"
                    value={keywordInput}
                    onChange={e => setKeywordInput(e.target.value)}
                    placeholder="e.g. React, Docker, Kubernetes"
                    className="w-full px-3 py-2 bg-app-bg border border-app-border rounded-xl text-app-primary placeholder-slate-450 focus:outline-none focus:ring-2 focus:ring-blue-500/40 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-app-secondary mb-1.5">Job Description (optional)</label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Paste full description to auto-tailor keywords..."
                    className="w-full px-3 py-2 bg-app-bg border border-app-border rounded-xl text-app-primary placeholder-slate-450 focus:outline-none focus:ring-2 focus:ring-blue-500/40 text-sm resize-none"
                  />
                </div>
                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating || !company.trim() || !role.trim()}
                  className="w-full flex items-center justify-center gap-2"
                >
                  {isGenerating ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  {isGenerating ? 'Generating...' : 'Generate with AI'}
                </Button>
              </div>
            </div>
          </div>

          {/* Editor Panel */}
          <div className="lg:col-span-2 glass-card overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-app-border">
              <h3 className="font-semibold text-app-primary text-sm">
                {content ? `${company || 'New'} — ${role || 'Cover Letter'}` : 'Cover Letter Editor'}
              </h3>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={handleCopy} disabled={!content} className="text-blue-400 hover:text-blue-300">
                  Copy
                </Button>
                <Button variant="ghost" size="sm" onClick={handleSave} disabled={!content} className="text-blue-450 hover:text-blue-355">
                  Save
                </Button>
              </div>
            </div>
            {content ? (
              <>
                <textarea
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  className="w-full h-[480px] px-6 py-5 bg-app-bg text-sm text-app-primary font-sans leading-relaxed focus:outline-none resize-none border-b border-app-border"
                />
                <div className="p-4 bg-slate-900/30 flex flex-col md:flex-row gap-3 items-center">
                  <div className="flex-1 w-full">
                    <input
                      type="text"
                      placeholder="Ask AI to refine letter (e.g., 'Make it sound more professional', 'Improve grammar')"
                      value={refineFeedback}
                      onChange={e => setRefineFeedback(e.target.value)}
                      className="w-full px-3 py-2 bg-app-bg border border-app-border rounded-xl text-xs text-app-primary focus:outline-none"
                    />
                  </div>
                  <Button
                    size="sm"
                    disabled={isGenerating || !refineFeedback.trim()}
                    onClick={async () => {
                      setIsGenerating(true);
                      try {
                        const res = await coverLetterService.generateCoverLetter({
                          jobData: { title: role, company, description },
                          tone,
                          templateType,
                          feedback: `Apply change request: ${refineFeedback}. Current cover letter draft: ${content}`
                        });
                        setContent(res.coverLetter.content);
                        setRefineFeedback('');
                        toast.success('Cover letter draft refined!');
                      } catch (err) {
                        toast.error('Refinement optimization failed');
                      } finally {
                        setIsGenerating(false);
                      }
                    }}
                  >
                    Refine with AI
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-[560px] text-center p-8">
                <FileText className="h-16 w-16 text-app-secondary mb-4 animate-pulse" />
                <p className="text-app-primary font-semibold mb-1">Your cover letter will appear here</p>
                <p className="text-sm text-app-secondary">Fill in the job details and click "Generate with AI"</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeView === 'saved' && (
        <div className="glass-card overflow-hidden">
          {savedLetters.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <FileText className="h-12 w-12 text-app-secondary mb-3" />
              <p className="text-app-secondary font-semibold">No saved cover letters yet</p>
              <Button className="mt-4" onClick={() => setActiveView('create')}>Create One</Button>
            </div>
          ) : (
            <div className="divide-y divide-app-border">
              {savedLetters.map(letter => (
                <div key={letter.id} className="flex items-center justify-between p-5 hover:bg-app-hover transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-blue-500/10 rounded-xl text-blue-400 border border-blue-500/20">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-app-primary">{letter.title}</p>
                      <p className="text-xs text-app-secondary">
                        {new Date(letter.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => handleLoadSaved(letter)}>Edit</Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-400 hover:bg-red-950/20"
                      onClick={() => handleDeleteLetter(letter.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
