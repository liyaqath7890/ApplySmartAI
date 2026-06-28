import React, { useState } from 'react';
import {
  FileText,
  Sparkles,
  Edit,
  Save,
  Download,
  RefreshCcw,
  Plus,
  Trash2,
  Eye,
} from 'lucide-react';
import { PageHeader, EmptyState, LoadingState } from '@/shared/components/ui';
import Button from '@/shared/components/ui/Button';
import Badge from '@/shared/components/ui/Badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  coverLetterService,
  CoverLetter,
} from '@/api/services/coverLetterService';
import toast from 'react-hot-toast';

export default function CoverLettersPage() {
  const [selectedLetter, setSelectedLetter] = useState<CoverLetter | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['cover-letters'],
    queryFn: coverLetterService.getCoverLetters,
  });

  const generateMutation = useMutation({
    mutationFn: coverLetterService.generateCoverLetter,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cover-letters'] });
      toast.success('Cover letter generated successfully!');
      setIsGenerating(false);
    },
    onError: () => {
      toast.error('Failed to generate cover letter');
      setIsGenerating(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: coverLetterService.deleteCoverLetter,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cover-letters'] });
      toast.success('Cover letter deleted');
      setSelectedLetter(null);
    },
    onError: () => {
      toast.error('Failed to delete cover letter');
    },
  });

  const handleGenerate = async () => {
    setIsGenerating(true);
    generateMutation.mutate();
  };

  const handleRewrite = async (id: string) => {
    try {
      await coverLetterService.rewriteCoverLetter(id);
      queryClient.invalidateQueries({ queryKey: ['cover-letters'] });
      toast.success('Cover letter rewritten');
    } catch {
      toast.error('Failed to rewrite cover letter');
    }
  };

  const handleImprove = async (id: string) => {
    try {
      await coverLetterService.improveCoverLetter(id);
      queryClient.invalidateQueries({ queryKey: ['cover-letters'] });
      toast.success('Cover letter improved');
    } catch {
      toast.error('Failed to improve cover letter');
    }
  };

  const letters = data?.coverLetters || [];

  if (!selectedLetter && letters.length > 0) {
    setSelectedLetter(letters[0]);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cover Letter Intelligence"
        subtitle="Generate, customize, and manage job-specific cover letters"
        icon={FileText}
      >
        <Button icon={Plus} onClick={handleGenerate} disabled={isGenerating}>
          {isGenerating ? 'Generating...' : '+ New Cover Letter'}
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cover Letters List */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Your Cover Letters
            </h3>

            {isLoading && <LoadingState message="Loading cover letters..." />}
            {error && (
              <div className="p-4 bg-red-50 rounded-lg border border-red-200 text-red-800 text-sm">
                Error loading cover letters
              </div>
            )}

            {!isLoading && !error && letters.length === 0 && (
              <EmptyState
                icon={FileText}
                title="No cover letters yet"
                description="Generate your first cover letter using our AI-powered builder."
              />
            )}

            {!isLoading && !error && letters.length > 0 && (
              <div className="space-y-2">
                {letters.map((letter) => (
                  <div
                    key={letter.id}
                    onClick={() => setSelectedLetter(letter)}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedLetter?.id === letter.id
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-primary-300'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">
                          {letter.title}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(letter.updatedAt).toLocaleDateString()}
                        </div>
                      </div>
                      {letter.isAiGenerated && (
                        <Badge variant="outline" size="sm">
                          AI
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Cover Letter Editor */}
        <div className="lg:col-span-2 space-y-4">
          {selectedLetter ? (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {selectedLetter.title}
                  </h3>
                  {selectedLetter.aiScore && (
                    <p className="text-sm text-emerald-600 mt-1">
                      AI Score: {selectedLetter.aiScore}%
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    icon={RefreshCcw}
                    onClick={() => handleRewrite(selectedLetter.id)}
                  >
                    Rewrite
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    icon={Sparkles}
                    onClick={() => handleImprove(selectedLetter.id)}
                  >
                    Improve
                  </Button>
                  <Button variant="outline" size="sm" icon={Download}>
                    Download
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={Trash2}
                    onClick={() => deleteMutation.mutate(selectedLetter.id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>

              <div className="prose prose-gray max-w-none">
                <div className="whitespace-pre-wrap text-gray-700">
                  {selectedLetter.content}
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  {selectedLetter.isAiGenerated && (
                    <>
                      <Sparkles className="h-4 w-4 text-primary-600" />
                      <span>AI-optimized cover letter</span>
                    </>
                  )}
                </div>
                <Button icon={Save}>Save Changes</Button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Select a cover letter
              </h3>
              <p className="text-gray-600">
                Choose a cover letter from the list or generate a new one
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
