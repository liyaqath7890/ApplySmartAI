import { lazy } from 'react';

const DashboardPage = lazy(() => import('@/features/dashboard/pages/DashboardPage'));
const ProfilePage = lazy(() => import('@/features/candidates/profiles/pages/ProfilePage'));
const ApplicationsPage = lazy(() => import('@/features/jobs/applications/pages/ApplicationsPage'));
const SavedJobsPage = lazy(() => import('@/features/jobs/saved-jobs/pages/SavedJobsPage'));
const SettingsPage = lazy(() => import('@/features/settings/pages/SettingsPage'));
const AgentDashboardPage = lazy(() => import('@/pages/AgentDashboardPage'));
const SkillGapPage = lazy(() => import('@/pages/SkillGapPage'));
const CareerRoadmapPage = lazy(() => import('@/pages/CareerRoadmapPage'));
const PortfolioPage = lazy(() => import('@/pages/PortfolioPage'));
const AnalyticsPage = lazy(() => import('@/pages/AnalyticsPage'));
const BillingPage = lazy(() => import('@/pages/BillingPage'));
const CareerProfilePage = lazy(() => import('@/pages/CareerProfilePage'));
const JobDiscoveryPage = lazy(() => import('@/pages/JobDiscoveryPage'));

export const protectedRoutes = [
  { path: 'dashboard', element: <DashboardPage /> },
  { path: 'profile', element: <ProfilePage /> },
  { path: 'career-profile', element: <CareerProfilePage /> },
  { path: 'job-discovery', element: <JobDiscoveryPage /> },
  { path: 'applications', element: <ApplicationsPage /> },
  { path: 'saved-jobs', element: <SavedJobsPage /> },
  { path: 'settings', element: <SettingsPage /> },
  { path: 'agents', element: <AgentDashboardPage /> },
  { path: 'skill-gaps', element: <SkillGapPage /> },
  { path: 'roadmap', element: <CareerRoadmapPage /> },
  { path: 'portfolio', element: <PortfolioPage /> },
  { path: 'analytics', element: <AnalyticsPage /> },
  { path: 'billing', element: <BillingPage /> },
];