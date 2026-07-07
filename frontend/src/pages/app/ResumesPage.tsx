import React, { useState } from 'react';
import {
  FileText,
  Plus,
  Download,
  TrendingUp,
  Sparkles,
  Upload,
  Edit,
  Eye,
} from 'lucide-react';
import { PageHeader, EmptyState, LoadingState } from '@/shared/components/ui';
import Button from '@/shared/components/ui/Button';
import Badge from '@/shared/components/ui/Badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { resumeService, Resume, ResumeTemplate } from '@/api/services/resumeService';
import toast from 'react-hot-toast';

export default function ResumesPage() {
  const [isUploading, setIsUploading] = useState(false);
  const queryClient = useQueryClient();

  const { data: resumesData, isLoading: resumesLoading, error } = useQuery({
    queryKey: ['resumes'],
    queryFn: resumeService.getResumes,
  });

  const { data: templatesData } = useQuery({
    queryKey: ['resume-templates'],
    queryFn: resumeService.getTemplates,
  });

  const uploadMutation = useMutation({
    mutationFn: (file: File) => resumeService.uploadResume(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resumes'] });
      toast.success('Resume uploaded successfully!');
      setIsUploading(false);
    },
    onError: () => {
      toast.error('Failed to upload resume');
      setIsUploading(false);
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      uploadMutation.mutate(file);
    }
  };

  const handleGenerateResume = async () => {
    try {
      await resumeService.generateResume();
      queryClient.invalidateQueries({ queryKey: ['resumes'] });
      toast.success('Resume generated successfully!');
    } catch {
      toast.error('Failed to generate resume');
    }
  };

  const resumes = resumesData?.resumes || [];
  const templates = templatesData?.templates || [];

  const averageAtsScore =
    resumes.length > 0
      ? Math.round(resumes.reduce((acc, r) => acc + r.atsScore, 0) / resumes.length)
      : 0;

  return (
    <div className="space-y-6 animate-fade-in p-6 bg-app-bg text-app-primary min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-app-border pb-4 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 to-indigo-300 bg-clip-text text-transparent">
            Resume Manager
          </h1>
          <p className="text-sm text-app-secondary mt-1">Manage and evaluate your resumes against ATS standards.</p>
        </div>
        <div className="flex gap-2">
          <label className="cursor-pointer">
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              className="hidden"
              onChange={handleFileChange}
              disabled={isUploading}
            />
            <Button icon={Upload} variant="outline">
              {isUploading ? 'Uploading...' : 'Upload Resume'}
            </Button>
          </label>
          <Button icon={Plus} onClick={handleGenerateResume}>
            Generate New
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6 bg-app-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-app-secondary font-semibold">Total Resumes</p>
              <p className="text-3xl font-extrabold text-app-primary mt-2">{resumes.length}</p>
            </div>
            <div className="p-3 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-xl">
              <FileText className="h-6 w-6" />
            </div>
          </div>
        </div>
        <div className="glass-card p-6 bg-app-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-app-secondary font-semibold">Average ATS Score</p>
              <p className="text-3xl font-extrabold text-emerald-450 mt-2">
                {averageAtsScore}%
              </p>
            </div>
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-455 rounded-xl">
              <TrendingUp className="h-6 w-6" />
            </div>
          </div>
        </div>
        <div className="glass-card p-6 bg-app-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-app-secondary font-semibold">Templates Available</p>
              <p className="text-3xl font-extrabold text-app-primary mt-2">
                {templates.length}
              </p>
            </div>
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl">
              <Sparkles className="h-6 w-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Loading */}
      {resumesLoading && <LoadingState message="Loading resumes..." />}

      {/* Error */}
      {error && (
        <div className="p-6 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl">
          Error loading resumes.
        </div>
      )}

      {/* Resume List */}
      {!resumesLoading && !error && (
        <>
          {resumes.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No resumes yet"
              description="Upload your first resume or generate one using our AI-powered builder."
            />
          ) : (
            <div className="glass-card overflow-hidden">
              <div className="p-6 border-b border-app-border bg-app-card">
                <h2 className="text-lg font-bold text-app-primary">Your Resumes</h2>
              </div>
              <div className="divide-y divide-app-border">
                {resumes.map((resume) => (
                  <div key={resume.id} className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-app-hover transition-colors duration-200">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-xl">
                        <FileText className="h-6 w-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-app-primary text-sm">
                            {resume.fileName}
                          </h3>
                          {resume.isPrimary && <Badge variant="primary">Primary</Badge>}
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-xs text-app-secondary">
                          <span>
                            {resume.fileType} • {Math.round(resume.fileSize / 1024)} KB
                          </span>
                          <span>
                            Updated {new Date(resume.updatedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto">
                      <div className="text-left sm:text-right">
                        <p className="text-xs font-semibold text-app-secondary uppercase tracking-wider">ATS Score</p>
                        <p className="text-2xl font-extrabold text-emerald-450">
                          {resume.atsScore}%
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" icon={Eye}>
                          Preview
                        </Button>
                        <Button variant="outline" size="sm" icon={Download}>
                          Download
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Templates */}
          {templates.length > 0 && (
            <div className="glass-card overflow-hidden">
              <div className="p-6 border-b border-app-border bg-app-card">
                <h2 className="text-lg font-bold text-app-primary">
                  Resume Templates
                </h2>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    className="border border-app-border bg-app-card rounded-xl p-4 hover:border-blue-500/40 hover:bg-app-hover transition duration-200 cursor-pointer"
                  >
                    <h3 className="font-bold text-app-primary text-sm mb-1">
                      {template.name}
                    </h3>
                    <p className="text-xs text-app-secondary mb-3">{template.description}</p>
                    <Badge variant="outline">{template.templateType}</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
