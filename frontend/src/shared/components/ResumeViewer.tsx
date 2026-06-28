import React, { useState } from 'react';
import { FileText, Download, Eye, Trash2 } from 'lucide-react';
import PdfPreview from './PdfPreview';
import Button from './ui/Button';
import { EmptyState } from './ui';
import { formatDistanceToNow } from 'date-fns';

export interface ResumeItem {
  id: string;
  name: string;
  size?: number;
  uploadDate?: Date | string;
  atsScore?: number;
  url?: string;
  content?: string;
}

interface ResumeViewerProps {
  resumes: ResumeItem[];
  onUpload?: () => void;
  onDelete?: (id: string) => void;
  onDownload?: (resume: ResumeItem) => void;
  isLoading?: boolean;
}

export default function ResumeViewer({ resumes, onUpload, onDelete, onDownload, isLoading }: ResumeViewerProps) {
  const [selected, setSelected] = useState<ResumeItem | null>(resumes[0] || null);

  React.useEffect(() => {
    if (resumes.length > 0 && !selected) setSelected(resumes[0]);
    if (selected && !resumes.find((r) => r.id === selected.id)) setSelected(resumes[0] || null);
  }, [resumes, selected]);

  const handleDownload = (resume: ResumeItem) => {
    if (onDownload) {
      onDownload(resume);
      return;
    }
    if (resume.content) {
      const blob = new Blob([resume.content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = resume.name.replace(/\.pdf$/i, '.txt');
      a.click();
      URL.revokeObjectURL(url);
    } else if (resume.url) {
      window.open(resume.url, '_blank');
    }
  };

  if (isLoading) {
    return <div className="animate-pulse h-96 bg-gray-100 rounded-xl" />;
  }

  if (resumes.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        title="No resumes yet"
        description="Upload your first resume to get started with AI optimization"
        action={onUpload ? <Button onClick={onUpload}>Upload Resume</Button> : undefined}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1 space-y-2">
        {resumes.map((resume) => (
          <div
            key={resume.id}
            className={`p-4 rounded-lg border cursor-pointer transition-colors ${
              selected?.id === resume.id ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-primary-300'
            }`}
            onClick={() => setSelected(resume)}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="h-5 w-5 text-primary-600 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{resume.name}</p>
                  {resume.uploadDate && (
                    <p className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(resume.uploadDate), { addSuffix: true })}
                    </p>
                  )}
                </div>
              </div>
              {resume.atsScore !== undefined && (
                <span className="text-xs font-semibold text-emerald-600">{resume.atsScore}%</span>
              )}
            </div>
            <div className="flex gap-1 mt-2">
              <button
                onClick={(e) => { e.stopPropagation(); setSelected(resume); }}
                className="p-1.5 rounded hover:bg-white"
                title="Preview"
              >
                <Eye className="h-4 w-4 text-gray-500" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); handleDownload(resume); }}
                className="p-1.5 rounded hover:bg-white"
                title="Download"
              >
                <Download className="h-4 w-4 text-gray-500" />
              </button>
              {onDelete && (
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(resume.id); }}
                  className="p-1.5 rounded hover:bg-white"
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </button>
              )}
            </div>
          </div>
        ))}
        {onUpload && (
          <Button variant="outline" className="w-full" onClick={onUpload}>
            Upload New Resume
          </Button>
        )}
      </div>
      <div className="lg:col-span-2">
        <PdfPreview
          url={selected?.url}
          fileName={selected?.name}
          content={selected?.content}
          onDownload={selected ? () => handleDownload(selected) : undefined}
        />
      </div>
    </div>
  );
}
