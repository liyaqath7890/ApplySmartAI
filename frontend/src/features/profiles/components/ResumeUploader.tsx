
import React, { useCallback, useState } from 'react';
import { Upload, FileText, Trash2, Eye, Download } from 'lucide-react';
import { Button, EmptyState } from '@/shared/components/ui';
import { useDropzone } from 'react-dropzone';
import { useMasterProfileStore } from '@/store';

export const ResumeUploader: React.FC = () => {
  const { resumes, setResumes, setLoading } = useMasterProfileStore();
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setIsUploading(true);
    // Mock upload delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const newResumes = acceptedFiles.map(file => ({
      id: Date.now() + Math.random().toString(36).substr(2, 9),
      name: file.name,
      fileType: file.type,
      uploadDate: new Date(),
      size: file.size
    }));
    
    setResumes([...resumes, ...newResumes]);
    setIsUploading(false);
  }, [resumes, setResumes]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    multiple: true
  });

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDelete = (id: string) => {
    setResumes(resumes.filter(r => r.id !== id));
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          Resumes
        </h2>
      </div>

      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 mb-6 cursor-pointer transition-all text-center
          ${isDragActive ? 'border-primary-500 bg-primary-50' : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'}
        `}
      >
        <input {...getInputProps()} />
        <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-lg font-medium text-gray-900 mb-1">
          {isDragActive ? 'Drop the files here...' : 'Drag & drop files here, or click to select'}
        </p>
        <p className="text-sm text-gray-500">PDF, DOC, DOCX (Max 5MB each)</p>
      </div>

      {isUploading && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="animate-pulse h-6 w-6 rounded-full bg-blue-400"></div>
            <span className="text-sm font-medium text-blue-700">Uploading resume(s)...</span>
          </div>
        </div>
      )}

      {resumes.length === 0 && !isUploading ? (
          <EmptyState
            icon={Upload}
            title="No resumes uploaded yet"
            description="Upload your resume to start applying to jobs"
          />
        ) : (
        <div className="space-y-3">
          {resumes.map(resume => (
            <div key={resume.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-primary-300 transition-all">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <FileText className="h-6 w-6 text-gray-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{resume.name}</p>
                  <p className="text-sm text-gray-500">
                    {formatFileSize(resume.size)} • Uploaded on {new Date(resume.uploadDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  View
                </Button>
                <Button variant="ghost" size="sm" className="flex items-center gap-1">
                  <Download className="h-4 w-4" />
                  Download
                </Button>
                <Button variant="ghost" size="sm" className="flex items-center gap-1 text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleDelete(resume.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

