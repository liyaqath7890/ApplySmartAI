import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  /** Primary label shown under the spinner */
  message?: string;
  /** @deprecated use message */
  text?: string;
  fullScreen?: boolean;
}

export default function LoadingState({
  message,
  text,
  fullScreen = false,
}: LoadingStateProps) {
  const label = message ?? text ?? 'Loading...';

  const content = (
    <div className="flex flex-col items-center justify-center gap-3 py-12">
      <Loader2 className="h-10 w-10 text-primary-600 animate-spin" />
      <p className="text-sm text-gray-600">{label}</p>
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
