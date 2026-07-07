import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  description?: string;
}

export default function StatsCard({
  title,
  value,
  icon: Icon,
  trend = 'neutral',
  trendValue,
  description,
}: StatsCardProps) {
  const trendColors = {
    up: 'text-emerald-500 bg-emerald-500/10 border border-emerald-500/20',
    down: 'text-red-500 bg-red-500/10 border border-red-500/20',
    neutral: 'text-app-secondary bg-app-hover border border-app-border',
  };

  const trendIcons = {
    up: '↑',
    down: '↓',
    neutral: '→',
  };

  return (
    <div className="bg-app-card rounded-xl border border-app-border p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-app-secondary">{title}</p>
          <h3 className="text-2xl font-bold text-app-primary mt-2">{value}</h3>
          {trendValue && (
            <div className="flex items-center mt-2">
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${trendColors[trend]}`}
              >
                {trendIcons[trend]} {trendValue}
              </span>
              {description && (
                <span className="text-xs text-app-secondary ml-2">{description}</span>
              )}
            </div>
          )}
        </div>
        <div className="p-3 bg-app-hover rounded-lg">
          <Icon className="h-6 w-6 text-blue-500" />
        </div>
      </div>
    </div>
  );
}
