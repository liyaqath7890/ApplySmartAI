import React from 'react';
import { FileText, Download, X } from 'lucide-react';
import Button from './ui/Button';

interface PdfPreviewProps {
  url?: string;
  fileName?: string;
  content?: string;
  onClose?: () => void;
  onDownload?: () => void;
}

export default function PdfPreview({ url, fileName, content, onClose, onDownload }: PdfPreviewProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col h-full min-h-[400px]">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-2 min-w-0">
          <FileText className="h-5 w-5 text-primary-600 flex-shrink-0" />
          <span className="text-sm font-medium text-gray-900 truncate">{fileName || 'Resume Preview'}</span>
        </div>
        <div className="flex items-center gap-2">
          {onDownload && (
            <Button variant="ghost" size="sm" onClick={onDownload} className="flex items-center gap-1">
              <Download className="h-4 w-4" />
              Download
            </Button>
          )}
          {onClose && (
            <button onClick={onClose} className="p-1 rounded hover:bg-gray-200">
              <X className="h-5 w-5 text-gray-500" />
            </button>
          )}
        </div>
      </div>
      <div className="flex-1 overflow-auto p-4 bg-gray-100">
        {url ? (
          <iframe
            src={url}
            title={fileName || 'PDF Preview'}
            className="w-full h-full min-h-[360px] bg-white rounded-lg border border-gray-200"
          />
        ) : content ? (
          <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono bg-white p-6 rounded-lg border border-gray-200 min-h-[360px]">
            {content}
          </pre>
        ) : (
          <div className="flex flex-col items-center justify-center h-full min-h-[360px] text-gray-500">
            <FileText className="h-12 w-12 mb-3 text-gray-300" />
            <p className="text-sm">Select a resume to preview</p>
          </div>
        )}
      </div>
    </div>
  );
}
