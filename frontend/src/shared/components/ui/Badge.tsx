import React from 'react';

export type BadgeVariant =
  | 'default'
  | 'primary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'outline';

export type BadgeSize = 'sm' | 'md';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default:  'bg-gray-100 text-gray-800',
  primary:  'bg-primary-100 text-primary-800',
  success:  'bg-emerald-100 text-emerald-800',
  warning:  'bg-amber-100 text-amber-800',
  danger:   'bg-red-100 text-red-800',
  info:     'bg-blue-100 text-blue-800',
  outline:  'bg-transparent border border-gray-300 text-gray-700',
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: 'px-1.5 py-0 text-xs',
  md: 'px-2.5 py-0.5 text-xs',
};

export default function Badge({
  children,
  variant = 'default',
  size = 'md',
  className = '',
}: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center rounded-full font-medium
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className}
      `}
    >
      {children}
    </span>
  );
}
