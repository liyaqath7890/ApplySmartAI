import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { PageHeader, Button } from '@/shared/components/ui';
import { Sparkles, FileText, Download, Save, RefreshCw, Plus, Trash2, CheckCircle2, Copy } from 'lucide-react';
import { useCoverLetterAIStore } from '@/store';

interface SavedLetter {
  id: string;
  title: string;
  content: string;
  company: string;
  role: string;
  createdAt: Date;
  isTemplate: boolean;
}

const TEMPLATES = [
  {
    id: 't1', name: 'Software Engineer', category: 'Tech',
    content: `Dear Hiring Manager,

I am writing to express my strong interest in the [ROLE] position at [COMPANY]. With [X] years of experience in software development and a proven track record of delivering scalable solutions, I am confident in my ability to contribute meaningfully to your team.

In my current role, I have [ACHIEVEMENT 1]. I have also [ACHIEVEMENT 2], which directly aligns with the requirements outlined in your job posting.

What excites me most about [COMPANY] is [COMPANY SPECIFIC REASON]. Your commitment to [VALUE] resonates deeply with my own professional philosophy.

I would welcome the opportunity to discuss how my experience can help drive [COMPANY]'s continued success. Thank you for your time and consideration.

Sincerely,
[YOUR NAME]`
  },
  {
    id: 't2', name: 'Product Manager', category: 'Product',
    content: `Dear [HIRING MANAGER],

I am excited to apply for the [ROLE] role at [COMPANY]. Having spent [X] years bridging the gap between customer needs and technical execution, I bring a data-driven approach and deep empathy for users to every product decision.

At [PREVIOUS COMPANY], I led the development of [PRODUCT/FEATURE], which resulted in [METRIC]. I specialize in [SKILL 1], [SKILL 2], and [SKILL 3] — capabilities I believe are essential for this role.

Thank you for considering my application. I look forward to the opportunity to contribute to [COMPANY]'s mission.

Best regards,
[YOUR NAME]`
  },
  {
    id: 't3', name: 'Data Scientist', category: 'Data',
    content: `Dear Hiring Team,

I am applying for the [ROLE] position at [COMPANY] with great enthusiasm. My background in machine learning, statistical analysis, and business intelligence positions me well to drive data-informed decisions at scale.

During my tenure at [PREVIOUS COMPANY], I developed [ML MODEL/ANALYSIS] that improved [METRIC] by [PERCENTAGE]. I am proficient in Python, SQL, TensorFlow, and have extensive experience with [TOOL/PLATFORM].

I am particularly drawn to [COMPANY] because of your innovative use of data in [AREA]. I am eager to bring my expertise to your team.

Warmly,
[YOUR NAME]`
  },
];

const generateLetter = (company: string, role: string, description: string, tone: string): string => {
  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const toneIntro: Record<string, string> = {
    Professional: 'I am writing to express my strong interest in',
    Enthusiastic: 'I am thrilled and excited to apply for',
    Concise: 'I am applying for',
    Creative: 'When I came across the opportunity for',
  };
  const intro = toneIntro[tone] || toneIntro['Professional'];

  return `John Doe
john.doe@email.com | +1 (555) 123-4567 | San Francisco, CA
${today}

Hiring Manager
${company || 'The Company'}
[Company Address]

Dear Hiring Manager,

${intro} the ${role || 'open'} position at ${company || 'your company'}. With 5+ years of experience in full-stack development and a passion for building products that scale, I am confident in my ability to make an immediate impact on your team.

${description ? `Having reviewed your job description carefully, I am particularly excited about the emphasis on ${description.slice(0, 80).trim()}... My background directly aligns with these requirements.` : 'My background in React, TypeScript, Node.js, and cloud architecture directly aligns with the requirements outlined in your posting.'}

At TechCorp Inc., I led a cross-functional team of 4 engineers to architect and ship a real-time data platform that reduced dashboard load times by 40% and increased user engagement by 25%. Before that, at StartupXYZ, I built the entire MVP from the ground up — reaching 10,000 users in just 3 months.

What draws me to ${company || 'your company'} specifically is your reputation for engineering excellence and your commitment to solving meaningful problems at scale. I believe strongly in the culture of continuous improvement and would be energized to contribute to your mission.

I would welcome the opportunity to discuss how my experience can help ${company || 'your team'} achieve its goals. Thank you for your time and consideration.

Sincerely,
John Doe`;
};

export default function CoverLetterAIPage() {
  const { setCurrentCoverLetter, setGenerating } = useCoverLetterAIStore();
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [description, setDescription] = useState('');
  const [tone, setTone] = useState('Professional');
  const [content, setContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [savedLetters, setSavedLetters] = useState<SavedLetter[]>([
    {
      id: '1', title: 'TechCorp - Senior Frontend Engineer', company: 'TechCorp Inc.',
      role: 'Senior Frontend Engineer', createdAt: new Date('2025-06-01'), isTemplate: false,
      content: generateLetter('TechCorp Inc.', 'Senior Frontend Engineer', '', 'Professional'),
    },
  ]);
  const [activeView, setActiveView] = useState<'create' | 'saved' | 'templates'>('create');
  const [successMsg, setSuccessMsg] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('t1');

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleGenerate = async () => {
    if (!company.trim() || !role.trim()) return;
    setIsGenerating(true);
    setGenerating(true);
    await new Promise(r => setTimeout(r, 2000));
    const letter = generateLetter(company, role, description, tone);
    setContent(letter);
    setCurrentCoverLetter({ title: `${company} - ${role}`, content: letter, isTemplate: false });
    setIsGenerating(false);
    setGenerating(false);
    toast.success('Cover letter generated!');
  };

  const handleSave = () => {
    if (!content) return;
    const letter: SavedLetter = {
      id: Date.now().toString(),
      title: `${company} - ${role}`,
      company, role, content,
      createdAt: new Date(),
      isTemplate: false,
    };
    setSavedLetters(prev => [letter, ...prev]);
    showSuccess('Cover letter saved!');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    showSuccess('Copied to clipboard!');
  };

  const handleDeleteLetter = (id: string) => {
    setSavedLetters(prev => prev.filter(l => l.id !== id));
  };

  const handleLoadTemplate = (templateId: string) => {
    const t = TEMPLATES.find(t => t.id === templateId);
    if (t) {
      setContent(t.content);
      setActiveView('create');
      showSuccess('Template loaded — fill in the placeholders!');
    }
  };

  const handleLoadSaved = (letter: SavedLetter) => {
    setCompany(letter.company);
    setRole(letter.role);
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
        {(['create', 'saved', 'templates'] as const).map(v => (
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

            {/* Quick Load Templates */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 mb-3">Quick Templates</h3>
              <div className="space-y-2">
                {TEMPLATES.map(t => (
                  <button
                    key={t.id}
                    onClick={() => handleLoadTemplate(t.id)}
                    className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-primary-400 hover:bg-primary-50 transition-all"
                  >
                    <p className="text-sm font-medium text-gray-900">{t.name}</p>
                    <p className="text-xs text-gray-500">{t.category}</p>
                  </button>
                ))}
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

      {activeView === 'templates' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TEMPLATES.map(t => (
            <div key={t.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:border-primary-400 transition-all">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-semibold text-gray-900">{t.name}</h4>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{t.category}</span>
                </div>
              </div>
              <p className="text-xs text-gray-500 line-clamp-4 mb-4 leading-relaxed">{t.content}</p>
              <Button className="w-full" onClick={() => handleLoadTemplate(t.id)}>
                Use Template
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
