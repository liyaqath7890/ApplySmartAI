import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  text?: string;
  fullScreen?: boolean;
}

export default function LoadingState({
  text = 'Loading...',
  fullScreen = false,
}: LoadingStateProps) {
  const content = (
    <div className="flex flex-col items-center justify-center gap-3">
      <Loader2 className="h-10 w-10 text-primary-600 animate-spin" />
      <p className="text-sm text-gray-600">{text}</p>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        {content}
      </div>
    );
  }

  return content;
}
