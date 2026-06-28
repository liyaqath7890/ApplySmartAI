import { Loader2 } from 'lucide-react';
import { clsx } from 'clsx';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  text?: string;
}

export default function LoadingSpinner({ 
  size = 'md', 
  className, 
  text 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  return (
    <div className={clsx('flex flex-col items-center justify-center gap-2', className)}>
      <Loader2 className={clsx('animate-spin text-primary-600', sizeClasses[size])} />
      {text && (
        <p className="text-sm text-dark-600">{text}</p>
      )}
    </div>
  );
}