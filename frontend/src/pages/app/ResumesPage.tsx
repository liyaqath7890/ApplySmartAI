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
    <div className="space-y-6">
      <PageHeader
        title="Resume Manager"
        subtitle="Create, manage, and optimize your resumes for different roles."
        icon={FileText}
      >
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
      </PageHeader>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Resumes</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{resumes.length}</p>
            </div>
            <div className="p-3 bg-primary-50 rounded-lg">
              <FileText className="h-6 w-6 text-primary-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Average ATS Score</p>
              <p className="text-3xl font-bold text-emerald-600 mt-1">
                {averageAtsScore}%
              </p>
            </div>
            <div className="p-3 bg-emerald-50 rounded-lg">
              <TrendingUp className="h-6 w-6 text-emerald-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Templates Available</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {templates.length}
              </p>
            </div>
            <div className="p-3 bg-amber-50 rounded-lg">
              <Sparkles className="h-6 w-6 text-amber-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Loading */}
      {resumesLoading && <LoadingState message="Loading resumes..." />}

      {/* Error */}
      {error && (
        <div className="p-6 bg-red-50 rounded-xl border border-red-200 text-red-800">
          Error loading resumes
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
            <div className="bg-white rounded-xl border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Your Resumes</h2>
              </div>
              <div className="divide-y divide-gray-200">
                {resumes.map((resume) => (
                  <div key={resume.id} className="p-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-primary-50 rounded-lg">
                        <FileText className="h-6 w-6 text-primary-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900">
                            {resume.fileName}
                          </h3>
                          {resume.isPrimary && <Badge variant="primary">Primary</Badge>}
                        </div>
                        <div className="flex items-center gap-4 mt-1">
                          <span className="text-sm text-gray-500">
                            {resume.fileType} • {Math.round(resume.fileSize / 1024)} KB
                          </span>
                          <span className="text-sm text-gray-500">
                            Updated {new Date(resume.updatedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-600">ATS Score</p>
                        <p className="text-2xl font-bold text-emerald-600">
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
                        <Button variant="ghost" size="sm" icon={Edit}>
                          Edit
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
            <div className="bg-white rounded-xl border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  Resume Templates
                </h2>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    className="border border-gray-200 rounded-xl p-4 hover:border-primary-300 transition-colors cursor-pointer"
                  >
                    <h3 className="font-semibold text-gray-900 mb-1">
                      {template.name}
                    </h3>
                    <p className="text-sm text-gray-600 mb-3">{template.description}</p>
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
