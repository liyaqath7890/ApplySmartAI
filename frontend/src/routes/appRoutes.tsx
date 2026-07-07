import { lazy } from 'react';
import {
  User,
  Briefcase,
  FolderKanban,
  FileText,
  MessageSquare,
  Calendar,
  Sparkles,
  Bell,
  Settings,
  LayoutDashboard,
  BarChart3,
  Users,
  Share2,
  Building2,
  BookOpen,
  GraduationCap,
  CreditCard,
  Activity,
  Zap,
} from 'lucide-react';

const DashboardPage = lazy(() => import('@/pages/app/DashboardPage'));
const MasterProfilePage = lazy(() => import('@/pages/app/MasterProfilePage'));
const JobDiscoveryPage = lazy(() => import('@/pages/app/JobDiscoveryPage'));
const JobPipelinePage = lazy(() => import('@/pages/app/JobPipelinePage'));
const ResumeAIPage = lazy(() => import('@/pages/app/ResumeAIPage'));
const CoverLetterAIPage = lazy(() => import('@/pages/app/CoverLetterAIPage'));
const InterviewPrepPage = lazy(() => import('@/pages/app/InterviewPrepPage'));
const CareerTwinPage = lazy(() => import('@/pages/app/CareerTwinPage'));
const NotificationsCenterPage = lazy(() => import('@/pages/app/NotificationsPage'));
const SettingsPage = lazy(() => import('@/pages/app/SettingsPage'));
const AnalyticsPage = lazy(() => import('@/pages/app/AnalyticsPage'));
const RecruitersPage = lazy(() => import('@/pages/app/RecruitersPage'));
const ReferralsPage = lazy(() => import('@/pages/app/ReferralsPage'));
const CompaniesPage = lazy(() => import('@/pages/app/CompaniesPage'));
const CompanyDetailsPage = lazy(() => import('@/pages/app/CompanyDetailsPage'));
const SavedCompaniesPage = lazy(() => import('@/pages/app/SavedCompaniesPage'));
const LearningPathPage = lazy(() => import('@/pages/app/LearningPathPage'));
const SkillGapPage = lazy(() => import('@/pages/app/SkillGapPage'));
const AppBillingPage = lazy(() => import('@/pages/app/AppBillingPage'));
const OperationsDashboardPage = lazy(() => import('@/pages/app/OperationsDashboardPage'));
const ApplicationWorkspacePage = lazy(() => import('@/pages/app/ApplicationWorkspacePage'));
const CoachPage = lazy(() => import('@/pages/app/CoachPage'));
const NetworkingPage = lazy(() => import('@/pages/app/NetworkingPage'));
const CalendarPage = lazy(() => import('@/pages/app/CalendarPage'));
const BrowserProductivityPage = lazy(() => import('@/pages/app/BrowserProductivityPage'));
const LearningPage = lazy(() => import('@/pages/app/LearningPage'));
const AdminMonitoringPage = lazy(() => import('@/pages/app/AdminMonitoringPage'));

export interface AppRoute {
  path: string;
  element: React.ReactNode;
  title: string;
  icon: React.ElementType;
}

export const appRoutes: AppRoute[] = [
  { path: 'dashboard', element: <DashboardPage />, title: 'Dashboard', icon: LayoutDashboard },
  { path: 'master-profile', element: <MasterProfilePage />, title: 'Master Profile', icon: User },
  { path: 'job-discovery', element: <JobDiscoveryPage />, title: 'Job Discovery', icon: Briefcase },
  { path: 'job-pipeline', element: <JobPipelinePage />, title: 'Job Pipeline', icon: FolderKanban },
  { path: 'applications/:id/workspace', element: <ApplicationWorkspacePage />, title: 'Application Workspace', icon: Sparkles },
  { path: 'resume-ai', element: <ResumeAIPage />, title: 'Resume AI', icon: FileText },
  { path: 'cover-letter-ai', element: <CoverLetterAIPage />, title: 'Cover Letter AI', icon: MessageSquare },
  { path: 'interview-preparation', element: <InterviewPrepPage />, title: 'Interview Preparation', icon: Calendar },
  { path: 'career-twin', element: <CareerTwinPage />, title: 'Career Twin', icon: Sparkles },
  { path: 'notifications', element: <NotificationsCenterPage />, title: 'Notifications Center', icon: Bell },
  { path: 'analytics', element: <AnalyticsPage />, title: 'Analytics', icon: BarChart3 },
  { path: 'recruiters', element: <RecruitersPage />, title: 'Recruiters', icon: Users },
  { path: 'referrals', element: <ReferralsPage />, title: 'Referrals', icon: Share2 },
  { path: 'companies', element: <CompaniesPage />, title: 'Companies', icon: Building2 },
  { path: 'companies/:id', element: <CompanyDetailsPage />, title: 'Company Details', icon: Building2 },
  { path: 'companies/saved', element: <SavedCompaniesPage />, title: 'Saved Companies', icon: Building2 },
  { path: 'learning-path', element: <LearningPathPage />, title: 'Learning Path', icon: BookOpen },
  { path: 'skill-gap', element: <SkillGapPage />, title: 'Skill Gap Analysis', icon: GraduationCap },
  { path: 'operations', element: <OperationsDashboardPage />, title: 'Operations Dashboard', icon: Activity },
  { path: 'billing', element: <AppBillingPage />, title: 'Billing', icon: CreditCard },
  { path: 'settings', element: <SettingsPage />, title: 'Settings', icon: Settings },
  { path: 'coach', element: <CoachPage />, title: 'Daily Coach', icon: Sparkles },
  { path: 'networking', element: <NetworkingPage />, title: 'Networking Workspace', icon: Share2 },
  { path: 'calendar', element: <CalendarPage />, title: 'Smart Calendar', icon: Calendar },
  { path: 'productivity', element: <BrowserProductivityPage />, title: 'Browser Productivity', icon: Zap },
  { path: 'learning', element: <LearningPage />, title: 'Learning Hub', icon: GraduationCap },
  { path: 'monitoring', element: <AdminMonitoringPage />, title: 'System Health', icon: Activity },
];
