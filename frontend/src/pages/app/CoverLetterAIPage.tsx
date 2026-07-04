import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PageHeader, Button } from '@/shared/components/ui';
import { Sparkles, FileText, Download, Save, RefreshCw, Plus, Trash2, CheckCircle2, Copy } from 'lucide-react';
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
    <div className="space-y-6">
      <PageHeader title="Cover Letter AI" subtitle="Generate personalized cover letters in seconds" icon={FileText} />

      {successMsg && (
        <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-sm font-medium">
          <CheckCircle2 className="h-4 w-4" />{successMsg}
        </div>
      )}

      {/* View Tabs */}
      <div className="flex gap-2 border-b border-gray-200 pb-0">
        {(['create', 'saved'] as const).map(v => (
          <button
            key={v}
            onClick={() => setActiveView(v)}
            className={`px-4 py-2.5 text-sm font-medium capitalize border-b-2 transition-colors ${
              activeView === v ? 'border-primary-600 text-primary-700' : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            {v === 'create' ? 'Create New' : v.charAt(0).toUpperCase() + v.slice(1)}
            {v === 'saved' && ` (${savedLetters.length})`}
          </button>
        ))}
      </div>

      {activeView === 'create' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form Panel */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary-600" /> Job Details
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company Name *</label>
                  <input
                    type="text"
                    value={company}
                    onChange={e => setCompany(e.target.value)}
                    placeholder="e.g. TechCorp Inc."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role / Job Title *</label>
                  <input
                    type="text"
                    value={role}
                    onChange={e => setRole(e.target.value)}
                    placeholder="e.g. Senior Frontend Engineer"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tone</label>
                  <select
                    value={tone}
                    onChange={e => setTone(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option>Professional</option>
                    <option>Enthusiastic</option>
                    <option>Concise</option>
                    <option>Creative</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Job Description (optional)</label>
                  <textarea
                    rows={4}
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Paste job description for better tailoring..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
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
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">
                {content ? `${company || 'New'} — ${role || 'Cover Letter'}` : 'Cover Letter Editor'}
              </h3>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={handleCopy} disabled={!content} className="flex items-center gap-1">
                  <Copy className="h-4 w-4" /> Copy
                </Button>
                <Button variant="ghost" size="sm" onClick={handleSave} disabled={!content} className="flex items-center gap-1">
                  <Save className="h-4 w-4" /> Save
                </Button>
                <Button variant="ghost" size="sm" disabled={!content} className="flex items-center gap-1">
                  <Download className="h-4 w-4" /> Export
                </Button>
              </div>
            </div>
            {content ? (
              <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                className="w-full h-[560px] px-6 py-5 text-sm text-gray-800 font-serif leading-relaxed focus:outline-none resize-none"
                style={{ fontFamily: 'Georgia, serif' }}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-[560px] text-center p-8">
                <FileText className="h-16 w-16 text-gray-200 mb-4" />
                <p className="text-gray-500 font-medium mb-1">Your cover letter will appear here</p>
                <p className="text-sm text-gray-400">Fill in the job details and click "Generate with AI"</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeView === 'saved' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {savedLetters.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <FileText className="h-12 w-12 text-gray-200 mb-3" />
              <p className="text-gray-500">No saved cover letters yet</p>
              <Button className="mt-4" onClick={() => setActiveView('create')}>Create One</Button>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {savedLetters.map(letter => (
                <div key={letter.id} className="flex items-center justify-between p-5 hover:bg-gray-50">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-primary-50 rounded-lg">
                      <FileText className="h-5 w-5 text-primary-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{letter.title}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(letter.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => handleLoadSaved(letter)}>Edit</Button>
                    <Button variant="ghost" size="sm">
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:bg-red-50"
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
