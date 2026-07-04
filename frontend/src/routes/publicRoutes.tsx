import { lazy } from 'react';

const HomePage = lazy(() => import('@/features/home/pages/HomePage'));
const JobsPage = lazy(() => import('@/features/jobs/listings/pages/JobsPage'));
const JobDetailPage = lazy(() => import('@/features/jobs/listings/pages/JobDetailPage'));
const ResumeAnalyzerPage = lazy(() => import('@/features/ai/resume-analyzer/pages/ResumeAnalyzerPage'));
const AICareerCoachPage = lazy(() => import('@/features/ai/career-coach/pages/AICareerCoachPage'));
const InterviewSimulatorPage = lazy(() => import('@/features/ai/interview-agent/pages/InterviewSimulatorPage'));

export const publicRoutes = [
  { path: '', element: <HomePage /> },
  { path: 'jobs', element: <JobsPage /> },
  { path: 'jobs/:id', element: <JobDetailPage /> },
  { path: 'tools/resume-analyzer', element: <ResumeAnalyzerPage /> },
  { path: 'tools/career-coach', element: <AICareerCoachPage /> },
  { path: 'tools/interview-simulator', element: <InterviewSimulatorPage /> },
];