import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { 
  Briefcase, 
  Sparkles, 
  FileText, 
  MessageSquare, 
  Calendar, 
  Building2, 
  ExternalLink, 
  ChevronLeft, 
  Loader2, 
  Check, 
  Download,
  AlertCircle
} from 'lucide-react';
import workspaceService, { WorkspaceDetails } from '@/api/services/workspaceService';
import { applicationService } from '@/api/services/applicationService';
import Button from '@/shared/components/ui/Button';

const ApplicationWorkspacePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<WorkspaceDetails | null>(null);
  const [activeTab, setActiveTab] = useState<'summary' | 'resume' | 'cover-letter' | 'interview' | 'company'>('summary');
  
  // Custom states for workspace operations
  const [isGeneratingResume, setIsGeneratingResume] = useState(false);
  const [isGeneratingCoverLetter, setIsGeneratingCoverLetter] = useState(false);
  const [isSavingCoverLetter, setIsSavingCoverLetter] = useState(false);
  const [coverLetterText, setCoverLetterText] = useState('');
  const [interviewQuestions, setInterviewQuestions] = useState<any[]>([]);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [companyIntel, setCompanyIntel] = useState<any>(null);
  const [isLoadingCompany, setIsLoadingCompany] = useState(false);

  // External Apply flow state
  const [showApplyModal, setShowApplyModal] = useState(false);
  
  // Tracking form states
  const [recruiter, setRecruiter] = useState('');
  const [salary, setSalary] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [isSavingTracking, setIsSavingTracking] = useState(false);

  const fetchWorkspaceData = async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const res = await workspaceService.getDetails(id);
      setData(res.data);
      if (res.data.application.coverLetter) {
        setCoverLetterText(res.data.application.coverLetter.content || '');
      }
      setRecruiter(res.data.application.recruiter || '');
      setSalary(res.data.application.salary || '');
      if (res.data.application.followUpDate) {
        setFollowUpDate(new Date(res.data.application.followUpDate).toISOString().split('T')[0]);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to load workspace data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkspaceData();
  }, [id]);

  // Lazy loading tab contents
  useEffect(() => {
    if (!id || !data) return;

    if (activeTab === 'interview' && interviewQuestions.length === 0) {
      setIsLoadingQuestions(true);
      workspaceService.getInterviewPrep(id)
        .then((res) => setInterviewQuestions(res.data))
        .catch(() => toast.error('Failed to generate interview prep'))
        .finally(() => setIsLoadingQuestions(false));
    }

    if (activeTab === 'company' && !companyIntel) {
      setIsLoadingCompany(true);
      workspaceService.getCompanyIntel(id)
        .then((res) => setCompanyIntel(res.data))
        .catch(() => toast.error('Failed to load company intelligence'))
        .finally(() => setIsLoadingCompany(false));
    }
  }, [activeTab, id, data]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="h-10 w-10 text-violet-600 animate-spin" />
        <p className="text-gray-500 font-medium">Assembling your custom workspace...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center max-w-md mx-auto">
        <AlertCircle className="h-12 w-12 text-red-500 mb-3" />
        <h3 className="text-lg font-semibold text-gray-800">Workspace Unavailable</h3>
        <p className="text-gray-500 mt-1">This application workspace could not be found or you do not have permission to view it.</p>
        <Button className="mt-4" onClick={() => navigate('/job-pipeline')}>Back to Job Pipeline</Button>
      </div>
    );
  }

  const { application, job, resumeVersions } = data;
  const ai = job.aiAnalysis || {};

  const handleGenerateResume = async () => {
    if (!id) return;
    setIsGeneratingResume(true);
    try {
      await workspaceService.generateResume(id);
      toast.success('Tailored Resume version created successfully');
      // Refetch
      const res = await workspaceService.getDetails(id);
      setData(res.data);
    } catch (err: any) {
      toast.error('Failed to generate resume');
    } finally {
      setIsGeneratingResume(false);
    }
  };

  const handleGenerateCoverLetter = async () => {
    if (!id) return;
    setIsGeneratingCoverLetter(true);
    try {
      const res = await workspaceService.generateCoverLetter(id);
      setCoverLetterText(res.data.content);
      toast.success('AI Cover Letter created successfully');
      // Refetch
      const updated = await workspaceService.getDetails(id);
      setData(updated.data);
    } catch (err: any) {
      toast.error('Failed to generate cover letter');
    } finally {
      setIsGeneratingCoverLetter(false);
    }
  };

  const handleSaveCoverLetter = async () => {
    if (!id) return;
    setIsSavingCoverLetter(true);
    try {
      await workspaceService.updateCoverLetter(id, coverLetterText);
      toast.success('Cover Letter changes saved successfully');
    } catch (err: any) {
      toast.error('Failed to save cover letter changes');
    } finally {
      setIsSavingCoverLetter(false);
    }
  };

  const handleExternalApplyRedirect = () => {
    const url = job.jobUrl || job.applyUrl;
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
      setShowApplyModal(true);
    } else {
      toast.error('No application URL available for this job');
    }
  };

  const handleConfirmApply = async (applied: boolean) => {
    if (!id) return;
    try {
      const newStatus = applied ? 'applied' : 'imported';
      await applicationService.updateStatus(id, newStatus);
      toast.success(applied ? 'Application saved as Applied!' : 'Application status kept as Imported');
      setShowApplyModal(false);
      fetchWorkspaceData();
    } catch (err: any) {
      toast.error('Failed to update status');
    }
  };

  const handleSaveTracking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setIsSavingTracking(true);
    try {
      await applicationService.updateTrackingDetails(id, {
        recruiter,
        salary,
        followUpDate
      });
      toast.success('Tracking information saved successfully');
      fetchWorkspaceData();
    } catch (err) {
      toast.error('Failed to update tracking information');
    } finally {
      setIsSavingTracking(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div className="flex items-center space-x-3">
          <button onClick={() => navigate('/job-pipeline')} className="p-2 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg transition">
            <ChevronLeft className="h-5 w-5 text-gray-600" />
          </button>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-bold text-gray-900">{job.title}</h1>
              <span className="px-3 py-1 bg-violet-50 text-violet-700 text-xs font-semibold rounded-full border border-violet-100 uppercase tracking-wide">
                {application.status}
              </span>
            </div>
            <p className="text-gray-600 font-medium">{job.company} • {job.location || 'Remote'}</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Button 
            onClick={handleExternalApplyRedirect}
            className="bg-violet-600 hover:bg-violet-700 text-white font-semibold flex items-center space-x-2 shadow-sm rounded-lg"
          >
            <span>Apply on Company Site</span>
            <ExternalLink className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Tabs Row */}
      <div className="flex border-b border-gray-200 overflow-x-auto">
        <button
          onClick={() => setActiveTab('summary')}
          className={`py-3 px-6 font-semibold text-sm border-b-2 whitespace-nowrap transition-colors flex items-center space-x-2 ${
            activeTab === 'summary' 
              ? 'border-violet-600 text-violet-600' 
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <Briefcase className="h-4 w-4" />
          <span>Job & AI Match</span>
        </button>
        <button
          onClick={() => setActiveTab('resume')}
          className={`py-3 px-6 font-semibold text-sm border-b-2 whitespace-nowrap transition-colors flex items-center space-x-2 ${
            activeTab === 'resume' 
              ? 'border-violet-600 text-violet-600' 
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <FileText className="h-4 w-4" />
          <span>Tailored Resume</span>
        </button>
        <button
          onClick={() => setActiveTab('cover-letter')}
          className={`py-3 px-6 font-semibold text-sm border-b-2 whitespace-nowrap transition-colors flex items-center space-x-2 ${
            activeTab === 'cover-letter' 
              ? 'border-violet-600 text-violet-600' 
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <MessageSquare className="h-4 w-4" />
          <span>Cover Letter</span>
        </button>
        <button
          onClick={() => setActiveTab('interview')}
          className={`py-3 px-6 font-semibold text-sm border-b-2 whitespace-nowrap transition-colors flex items-center space-x-2 ${
            activeTab === 'interview' 
              ? 'border-violet-600 text-violet-600' 
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <Calendar className="h-4 w-4" />
          <span>Interview Prep</span>
        </button>
        <button
          onClick={() => setActiveTab('company')}
          className={`py-3 px-6 font-semibold text-sm border-b-2 whitespace-nowrap transition-colors flex items-center space-x-2 ${
            activeTab === 'company' 
              ? 'border-violet-600 text-violet-600' 
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <Building2 className="h-4 w-4" />
          <span>Company Intel</span>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols (Dynamic content) */}
        <div className="lg:col-span-2 space-y-6">
          {activeTab === 'summary' && (
            <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6 shadow-sm">
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-gray-900">Job Description</h3>
                <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">
                  {job.description || 'No description provided.'}
                </p>
              </div>

              {job.requirements && job.requirements.length > 0 && (
                <div className="space-y-3 border-t border-gray-100 pt-5">
                  <h3 className="text-md font-bold text-gray-900">Job Requirements</h3>
                  <ul className="list-disc pl-5 space-y-2 text-sm text-gray-600">
                    {job.requirements.map((reqItem: string, idx: number) => (
                      <li key={idx}>{reqItem}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {activeTab === 'resume' && (
            <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6 shadow-sm">
              <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 flex items-center space-x-2">
                    <Sparkles className="h-5 w-5 text-violet-600" />
                    <span>Tailored Resume Assistant</span>
                  </h3>
                  <p className="text-gray-500 text-xs mt-0.5">Optimize headers and skills specifically for this posting.</p>
                </div>
                <Button 
                  onClick={handleGenerateResume}
                  disabled={isGeneratingResume}
                  className="bg-violet-600 hover:bg-violet-700 text-white font-medium flex items-center space-x-2 text-sm py-2 px-4 rounded-lg"
                >
                  {isGeneratingResume ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Optimizing...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      <span>Generate Tailored version</span>
                    </>
                  )}
                </Button>
              </div>

              {resumeVersions && resumeVersions.length > 0 ? (
                <div className="space-y-6">
                  {resumeVersions.map((version: any) => {
                    const content = JSON.parse(version.content || '{}');
                    return (
                      <div key={version.id} className="border border-violet-100 bg-violet-50/20 rounded-xl p-6 space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-violet-900 bg-violet-100/50 px-2.5 py-1 rounded-md">
                            Version {version.versionNumber} (AI Generated)
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(version.createdAt).toLocaleDateString()}
                          </span>
                        </div>

                        {content.headline && (
                          <div className="space-y-1">
                            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Headline Target</span>
                            <p className="text-sm font-semibold text-gray-800">{content.headline}</p>
                          </div>
                        )}

                        {content.summary && (
                          <div className="space-y-1">
                            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Professional Summary</span>
                            <p className="text-sm text-gray-600 leading-relaxed">{content.summary}</p>
                          </div>
                        )}

                        {content.skills && content.skills.length > 0 && (
                          <div className="space-y-1.5">
                            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Recommended Skills Keywords</span>
                            <div className="flex flex-wrap gap-1.5">
                              {content.skills.map((s: string, i: number) => (
                                <span key={i} className="text-xs font-medium px-2 py-0.5 bg-violet-100 text-violet-800 rounded">
                                  {s}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {content.experienceBullets && content.experienceBullets.length > 0 && (
                          <div className="space-y-1.5">
                            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Tailored Achievement Highlights</span>
                            <ul className="list-disc pl-5 text-xs text-gray-600 space-y-1">
                              {content.experienceBullets.map((b: string, i: number) => (
                                <li key={i}>{b}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl">
                  <FileText className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                  <h4 className="text-sm font-bold text-gray-700">No Custom Resumes</h4>
                  <p className="text-gray-500 text-xs max-w-xs mx-auto mt-1">Generate a tailored version of your resume to increase keyword match for this job.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'cover-letter' && (
            <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6 shadow-sm">
              <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Custom Cover Letter</h3>
                  <p className="text-gray-500 text-xs mt-0.5">Edit or dynamically generate cover letters matching the requirements.</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Button 
                    onClick={handleGenerateCoverLetter}
                    disabled={isGeneratingCoverLetter}
                    className="bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 font-medium text-sm py-2 px-4 rounded-lg flex items-center space-x-1.5"
                  >
                    {isGeneratingCoverLetter ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                        <span>Generating...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 text-violet-600" />
                        <span>AI Generate</span>
                      </>
                    )}
                  </Button>
                  <Button 
                    onClick={handleSaveCoverLetter}
                    disabled={isSavingCoverLetter}
                    className="bg-violet-600 hover:bg-violet-700 text-white font-medium text-sm py-2 px-4 rounded-lg flex items-center space-x-1.5"
                  >
                    {isSavingCoverLetter ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin text-white" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4" />
                        <span>Save Changes</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <textarea 
                value={coverLetterText}
                onChange={(e) => setCoverLetterText(e.target.value)}
                rows={18}
                className="w-full text-sm font-mono border border-gray-200 rounded-xl p-4 bg-gray-50/30 text-gray-800 leading-relaxed focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                placeholder="Paste or write cover letter here..."
              />
            </div>
          )}

          {activeTab === 'interview' && (
            <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6 shadow-sm">
              <div className="border-b border-gray-100 pb-4">
                <h3 className="text-lg font-bold text-gray-900">AI Interview preparation</h3>
                <p className="text-gray-500 text-xs mt-0.5">Mock questions and optimal answers generated by our AI agent.</p>
              </div>

              {isLoadingQuestions ? (
                <div className="flex flex-col items-center justify-center py-16 space-y-3">
                  <Loader2 className="h-8 w-8 text-violet-600 animate-spin" />
                  <span className="text-sm text-gray-500 font-medium">Assembling interview guides...</span>
                </div>
              ) : interviewQuestions && interviewQuestions.length > 0 ? (
                <div className="space-y-6">
                  {['Technical', 'HR', 'Behavioral', 'Coding', 'Company-specific'].map((cat) => {
                    const filtered = interviewQuestions.filter(q => q.category === cat);
                    if (filtered.length === 0) return null;
                    return (
                      <div key={cat} className="space-y-4">
                        <h4 className="text-sm font-bold text-violet-900 uppercase tracking-wider bg-violet-50/50 px-3 py-1.5 rounded-lg border border-violet-100">
                          {cat} Questions
                        </h4>
                        <div className="divide-y divide-gray-100">
                          {filtered.map((item, i) => (
                            <div key={i} className="py-4 first:pt-0 last:pb-0 space-y-2">
                              <h5 className="text-sm font-semibold text-gray-850">Q: {item.question}</h5>
                              <p className="text-xs bg-gray-50 text-gray-600 border border-gray-100 rounded-lg p-3 italic">
                                <strong>Suggested strategy:</strong> {item.suggestedAnswer}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <AlertCircle className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm font-medium">Failed to load questions</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'company' && (
            <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6 shadow-sm">
              <div className="border-b border-gray-100 pb-4">
                <h3 className="text-lg font-bold text-gray-900">Company Intelligence</h3>
                <p className="text-gray-500 text-xs mt-0.5">Deep-dive into tech stack, benefits, culture, and hiring trends.</p>
              </div>

              {isLoadingCompany ? (
                <div className="flex flex-col items-center justify-center py-16 space-y-3">
                  <Loader2 className="h-8 w-8 text-violet-600 animate-spin" />
                  <span className="text-sm text-gray-500 font-medium">Extracting corporate profile...</span>
                </div>
              ) : companyIntel ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border border-gray-150 rounded-xl p-4 space-y-1">
                      <span className="text-xs font-bold text-gray-400 uppercase">Website</span>
                      <a href={companyIntel.website} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-violet-600 flex items-center space-x-1 hover:underline">
                        <span>{companyIntel.website || 'N/A'}</span>
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </div>
                    <div className="border border-gray-150 rounded-xl p-4 space-y-1">
                      <span className="text-xs font-bold text-gray-400 uppercase">Interview Difficulty</span>
                      <p className="text-sm font-semibold text-gray-800">{companyIntel.interviewDifficulty || 'Medium'}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-sm font-bold text-gray-900">About the Company</h4>
                    <p className="text-sm text-gray-600 leading-relaxed">{companyIntel.description || 'No description available.'}</p>
                  </div>

                  {companyIntel.hiringTrends && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-bold text-gray-900">Hiring Context & Growth</h4>
                      <p className="text-sm text-gray-600 leading-relaxed">{companyIntel.hiringTrends}</p>
                    </div>
                  )}

                  {companyIntel.technologiesUsed && companyIntel.technologiesUsed.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-bold text-gray-900">Technologies Used</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {companyIntel.technologiesUsed.map((tech: string, i: number) => (
                          <span key={i} className="text-xs font-semibold bg-gray-100 text-gray-700 px-2.5 py-1 rounded-md">
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {companyIntel.benefits && companyIntel.benefits.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-bold text-gray-900">Offered Benefits</h4>
                      <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1">
                        {companyIntel.benefits.map((benefit: string, i: number) => (
                          <li key={i}>{benefit}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Building2 className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm font-medium">Company information details unavailable</p>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Right 1 Col (AI Analysis cards & Custom forms) */}
        <div className="space-y-6">
          
          {/* AI Scores */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6 shadow-sm">
            <h3 className="text-md font-bold text-gray-900 flex items-center space-x-2">
              <Sparkles className="h-5 w-5 text-violet-600" />
              <span>AI Job Match Scores</span>
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-violet-50/50 border border-violet-100 rounded-xl p-4 text-center">
                <span className="text-xs text-violet-850 font-semibold block mb-1">Resume Match</span>
                <span className="text-3xl font-extrabold text-violet-750">{job.matchScore || 0}%</span>
              </div>
              <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 text-center">
                <span className="text-xs text-blue-850 font-semibold block mb-1">ATS Friendly</span>
                <span className="text-3xl font-extrabold text-blue-750">{ai.atsScore || 0}%</span>
              </div>
            </div>

            {ai.missingSkills && ai.missingSkills.length > 0 && (
              <div className="space-y-2 border-t border-gray-100 pt-4">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Missing Skills</span>
                <div className="flex flex-wrap gap-1">
                  {ai.missingSkills.map((skill: string, i: number) => (
                    <span key={i} className="text-xs font-medium bg-red-50 text-red-750 border border-red-100 px-2 py-0.5 rounded">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {ai.skillGapAnalysis && ai.skillGapAnalysis.length > 0 && (
              <div className="space-y-2 border-t border-gray-100 pt-4">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Skill Gap Analysis</span>
                <ul className="list-disc pl-5 text-xs text-gray-600 space-y-1.5">
                  {ai.skillGapAnalysis.map((gap: string, i: number) => (
                    <li key={i}>{gap}</li>
                  ))}
                </ul>
              </div>
            )}

            {ai.learningRecommendations && ai.learningRecommendations.length > 0 && (
              <div className="space-y-2 border-t border-gray-100 pt-4">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Learning Recommendations</span>
                <ul className="list-disc pl-5 text-xs text-gray-600 space-y-1.5">
                  {ai.learningRecommendations.map((rec: string, i: number) => (
                    <li key={i}>{rec}</li>
                  ))}
                </ul>
              </div>
            )}

            {ai.salaryInsight && (
              <div className="space-y-1 border-t border-gray-100 pt-4">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Salary Insight</span>
                <p className="text-xs text-gray-600 leading-relaxed">{ai.salaryInsight}</p>
              </div>
            )}
          </div>

          {/* Tracking Details Form */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4 shadow-sm">
            <h3 className="text-md font-bold text-gray-900">Application Tracking Details</h3>
            <form onSubmit={handleSaveTracking} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase block">Recruiter Name</label>
                <input 
                  type="text" 
                  value={recruiter}
                  onChange={(e) => setRecruiter(e.target.value)}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-800"
                  placeholder="e.g. Sarah Jenkins"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase block">Expected Salary / Offer</label>
                <input 
                  type="text" 
                  value={salary}
                  onChange={(e) => setSalary(e.target.value)}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-800"
                  placeholder="e.g. $135k"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase block">Follow-up Date</label>
                <input 
                  type="date" 
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-800"
                />
              </div>

              <Button 
                type="submit"
                disabled={isSavingTracking}
                className="w-full bg-gray-900 hover:bg-gray-800 text-white font-semibold py-2 rounded-lg text-sm transition"
              >
                {isSavingTracking ? 'Saving...' : 'Update tracking info'}
              </Button>
            </form>
          </div>

        </div>

      </div>

      {/* Floating Redirect Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 text-center space-y-6 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="p-3 bg-violet-100 rounded-full w-12 h-12 mx-auto flex items-center justify-center text-violet-600">
              <ExternalLink className="h-6 w-6" />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-gray-900">Did you apply to the position?</h3>
              <p className="text-sm text-gray-500">We opened the external application link in a new tab. Let us know if you successfully completed it so we can update the status pipeline!</p>
            </div>

            <div className="flex space-x-3">
              <Button 
                onClick={() => handleConfirmApply(true)}
                className="flex-1 bg-violet-600 hover:bg-violet-700 text-white font-bold py-2.5 rounded-lg text-sm"
              >
                Yes, I applied
              </Button>
              <Button 
                onClick={() => handleConfirmApply(false)}
                variant="outline"
                className="flex-1 border-gray-200 text-gray-650 hover:bg-gray-50 font-bold py-2.5 rounded-lg text-sm"
              >
                No / Not yet
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ApplicationWorkspacePage;
