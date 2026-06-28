import React from 'react';
import { LucideIcon } from 'lucide-react';
import { PageHeader, EmptyState } from '@/shared/components/ui';

interface PlaceholderPageProps {
  title: string;
  subtitle?: string;
  icon: LucideIcon;
}

export default function PlaceholderPage({ title, subtitle, icon }: PlaceholderPageProps) {
  return (
    <div className="space-y-6">
      <PageHeader title={title} subtitle={subtitle} icon={icon} />
      <EmptyState
        icon={icon}
        title="Coming Soon!"
        description="This feature is currently under development. Check back soon!"
      />
    </div>
  );
}
