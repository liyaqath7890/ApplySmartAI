# AI Career Operating System - Frontend Architecture

## Overview
Transforming the existing application into a complete AI Career Operating System with 8 core modules.

## 1. Component Tree

```
App
├── AuthLayout
│   ├── LoginPage
│   ├── RegisterPage
│   ├── ForgotPasswordPage
│   ├── ResetPasswordPage
│   └── VerifyEmailPage
└── MainLayout
    ├── AppNavbar
    ├── AppSidebar
    └── AppContent
        ├── DashboardPage (optional overview)
        ├── MasterProfilePage
        │   ├── EducationSection
        │   ├── ExperienceSection
        │   ├── SkillsSection
        │   ├── CertificationsSection
        │   └── ResumeUploadSection
        ├── JobDiscoveryPage
        │   ├── JobListCard
        │   │   ├── MatchScoreBadge
        │   │   ├── AIInsightsCard
        │   │   └── SkillGapSummary
        │   └── JobDetailsModal
        ├── JobPipelinePage
        │   ├── PipelineColumn
        │   │   ├── SavedColumn
        │   │   ├── AppliedColumn
        │   │   ├── ScreeningColumn
        │   │   ├── InterviewColumn
        │   │   ├── OfferColumn
        │   │   └── RejectedColumn
        │   └── ApplicationCard
        ├── ResumeAIPage
        │   ├── ResumeSelector
        │   ├── ATSScoreDashboard
        │   ├── ResumeRewriteSection
        │   └── MissingSkillsSection
        ├── CoverLetterAIPage
        │   ├── CoverLetterEditor
        │   ├── AIGenerateButton
        │   └── TemplateLibrary
        ├── InterviewPrepPage
        │   ├── MockInterviewSelector
        │   ├── MockInterviewRoom
        │   ├── AIFeedbackSection
        │   └── PerformanceDashboard
        ├── CareerTwinPage
        │   ├── CareerPredictionSection
        │   ├── SalaryPredictionSection
        │   └── LearningRoadmapSection
        └── NotificationsCenterPage
            ├── NotificationList
            └── RealTimeUpdates
```

## 2. Route Map

Here are the updated routes for the 8 core pages:

| Path                          | Page Component               | Title                     | Icon          |
|-------------------------------|------------------------------|---------------------------|---------------|
| `/app/master-profile`         | MasterProfilePage            | Master Profile            | User          |
| `/app/job-discovery`          | JobDiscoveryPage             | Job Discovery             | Briefcase     |
| `/app/job-pipeline`           | JobPipelinePage              | Job Pipeline              | FolderKanban  |
| `/app/resume-ai`              | ResumeAIPage                 | Resume AI                 | FileText      |
| `/app/cover-letter-ai`        | CoverLetterAIPage            | Cover Letter AI           | MessageSquare |
| `/app/interview-preparation`  | InterviewPrepPage            | Interview Preparation     | Calendar      |
| `/app/career-twin`            | CareerTwinPage               | Career Twin               | Sparkles      |
| `/app/notifications`          | NotificationsCenterPage      | Notifications Center      | Bell          |


## 3. Zustand Stores

We will use the following Zustand stores to manage state:

### 3.1 Existing Stores
- `useAuthStore` (already exists): Authentication and user info
- `useJobStore` (already exists): Job state management
- `useApplicationStore` (already exists): Application state management
- `useUIStore` (already exists): UI state (modals, loading, etc.)

### 3.2 New/Updated Stores

#### `useMasterProfileStore.ts`
```typescript
import { create } from 'zustand';

interface Education {
  id: string;
  school: string;
  degree: string;
  fieldOfStudy: string;
  startDate: Date;
  endDate?: Date;
  description?: string;
}

interface Experience {
  id: string;
  company: string;
  position: string;
  location?: string;
  startDate: Date;
  endDate?: Date;
  description?: string;
  isCurrent: boolean;
}

interface Certification {
  id: string;
  name: string;
  issuingOrganization: string;
  issueDate: Date;
  expirationDate?: Date;
  credentialId?: string;
  credentialUrl?: string;
}

interface Skill {
  id: string;
  name: string;
  category?: string;
  proficiency: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  yearsOfExperience: number;
}

interface MasterProfileState {
  education: Education[];
  experience: Experience[];
  certifications: Certification[];
  skills: Skill[];
  resumes: any[];
  isLoading: boolean;

  // Actions
  setEducation: (education: Education[]) => void;
  addEducation: (item: Education) => void;
  updateEducation: (id: string, item: Partial<Education>) => void;
  deleteEducation: (id: string) => void;
  
  setExperience: (experience: Experience[]) => void;
  addExperience: (item: Experience) => void;
  updateExperience: (id: string, item: Partial<Experience>) => void;
  deleteExperience: (id: string) => void;
  
  setCertifications: (certifications: Certification[]) => void;
  addCertification: (item: Certification) => void;
  updateCertification: (id: string, item: Partial<Certification>) => void;
  deleteCertification: (id: string) => void;
  
  setSkills: (skills: Skill[]) => void;
  addSkill: (item: Skill) => void;
  updateSkill: (id: string, item: Partial<Skill>) => void;
  deleteSkill: (id: string) => void;
  
  setResumes: (resumes: any[]) => void;
  
  setLoading: (loading: boolean) => void;
}

export const useMasterProfileStore = create<MasterProfileState>((set) => ({
  // Initial state
  education: [],
  experience: [],
  certifications: [],
  skills: [],
  resumes: [],
  isLoading: false,

  // Actions
  setEducation: (education) => set({ education }),
  addEducation: (item) => set((state) => ({ education: [...state.education, item] })),
  updateEducation: (id, item) => set((state) => ({
    education: state.education.map(e => e.id === id ? { ...e, ...item } : e)
  })),
  deleteEducation: (id) => set((state) => ({
    education: state.education.filter(e => e.id !== id)
  })),
  
  setExperience: (experience) => set({ experience }),
  addExperience: (item) => set((state) => ({ experience: [...state.experience, item] })),
  updateExperience: (id, item) => set((state) => ({
    experience: state.experience.map(e => e.id === id ? { ...e, ...item } : e)
  })),
  deleteExperience: (id) => set((state) => ({
    experience: state.experience.filter(e => e.id !== id)
  })),
  
  setCertifications: (certifications) => set({ certifications }),
  addCertification: (item) => set((state) => ({ certifications: [...state.certifications, item] })),
  updateCertification: (id, item) => set((state) => ({
    certifications: state.certifications.map(c => c.id === id ? { ...c, ...item } : c)
  })),
  deleteCertification: (id) => set((state) => ({
    certifications: state.certifications.filter(c => c.id !== id)
  })),
  
  setSkills: (skills) => set({ skills }),
  addSkill: (item) => set((state) => ({ skills: [...state.skills, item] })),
  updateSkill: (id, item) => set((state) => ({
    skills: state.skills.map(s => s.id === id ? { ...s, ...item } : s)
  })),
  deleteSkill: (id) => set((state) => ({
    skills: state.skills.filter(s => s.id !== id)
  })),
  
  setResumes: (resumes) => set({ resumes }),
  
  setLoading: (isLoading) => set({ isLoading }),
}));
```

#### `useJobPipelineStore.ts`
```typescript
import { create } from 'zustand';

type PipelineStage = 'saved' | 'applied' | 'screening' | 'interview' | 'offer' | 'rejected';

interface Application {
  id: string;
  jobId: string;
  candidateId: string;
  stage: PipelineStage;
  jobTitle: string;
  companyName: string;
  logoUrl?: string;
  location?: string;
  salary?: string;
  appliedDate: Date;
  lastUpdated: Date;
}

interface JobPipelineState {
  applications: Application[];
  isLoading: boolean;
  isDragging: boolean;
  dragItem: Application | null;

  // Actions
  setApplications: (applications: Application[]) => void;
  updateApplicationStage: (id: string, stage: PipelineStage) => void;
  addApplication: (application: Application) => void;
  deleteApplication: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setDragging: (isDragging: boolean, item?: Application | null) => void;
}

export const useJobPipelineStore = create<JobPipelineState>((set) => ({
  applications: [],
  isLoading: false,
  isDragging: false,
  dragItem: null,

  setApplications: (applications) => set({ applications }),
  updateApplicationStage: (id, stage) => set((state) => ({
    applications: state.applications.map(a => 
      a.id === id ? { ...a, stage, lastUpdated: new Date() } : a
    )
  })),
  addApplication: (application) => set((state) => ({
    applications: [...state.applications, application]
  })),
  deleteApplication: (id) => set((state) => ({
    applications: state.applications.filter(a => a.id !== id)
  })),
  setLoading: (isLoading) => set({ isLoading }),
  setDragging: (isDragging, item = null) => set({ isDragging, dragItem: item }),
}));
```

#### `useResumeAIStore.ts`
```typescript
import { create } from 'zustand';

interface ResumeAIState {
  selectedResume: any | null;
  atsScore: number | null;
  rewriteSuggestions: string[];
  missingSkills: any[];
  isLoading: boolean;
  isGenerating: boolean;

  // Actions
  setSelectedResume: (resume: any | null) => void;
  setATSScore: (score: number) => void;
  setRewriteSuggestions: (suggestions: string[]) => void;
  setMissingSkills: (skills: any[]) => void;
  setLoading: (loading: boolean) => void;
  setGenerating: (generating: boolean) => void;
}

export const useResumeAIStore = create<ResumeAIState>((set) => ({
  selectedResume: null,
  atsScore: null,
  rewriteSuggestions: [],
  missingSkills: [],
  isLoading: false,
  isGenerating: false,

  setSelectedResume: (resume) => set({ selectedResume: resume }),
  setATSScore: (score) => set({ atsScore: score }),
  setRewriteSuggestions: (suggestions) => set({ rewriteSuggestions: suggestions }),
  setMissingSkills: (skills) => set({ missingSkills: skills }),
  setLoading: (isLoading) => set({ isLoading }),
  setGenerating: (isGenerating) => set({ isGenerating }),
}));
```

#### `useCoverLetterAIStore.ts`
```typescript
import { create } from 'zustand';

interface CoverLetter {
  id?: string;
  title: string;
  content: string;
  jobId?: string;
  isTemplate: boolean;
}

interface CoverLetterAIState {
  currentCoverLetter: CoverLetter;
  templates: CoverLetter[];
  isLoading: boolean;
  isGenerating: boolean;

  // Actions
  setCurrentCoverLetter: (letter: Partial<CoverLetter>) => void;
  setTemplates: (templates: CoverLetter[]) => void;
  addTemplate: (template: CoverLetter) => void;
  setLoading: (loading: boolean) => void;
  setGenerating: (generating: boolean) => void;
  resetCurrentLetter: () => void;
}

export const useCoverLetterAIStore = create<CoverLetterAIState>((set) => ({
  currentCoverLetter: {
    title: '',
    content: '',
    isTemplate: false
  },
  templates: [],
  isLoading: false,
  isGenerating: false,

  setCurrentCoverLetter: (letter) => set((state) => ({
    currentCoverLetter: { ...state.currentCoverLetter, ...letter }
  })),
  setTemplates: (templates) => set({ templates }),
  addTemplate: (template) => set((state) => ({
    templates: [...state.templates, template]
  })),
  setLoading: (isLoading) => set({ isLoading }),
  setGenerating: (isGenerating) => set({ isGenerating }),
  resetCurrentLetter: () => set({
    currentCoverLetter: {
      title: '',
      content: '',
      isTemplate: false
    }
  }),
}));
```

#### `useInterviewPrepStore.ts`
```typescript
import { create } from 'zustand';

interface MockInterview {
  id: string;
  title: string;
  category: string;
  duration: number;
  questions: any[];
}

interface InterviewFeedback {
  overallScore: number;
  communicationScore: number;
  technicalScore: number;
  recommendations: string[];
}

interface InterviewPrepState {
  currentInterview: MockInterview | null;
  currentQuestionIndex: number;
  isInterviewActive: boolean;
  feedback: InterviewFeedback | null;
  performanceHistory: any[];
  isLoading: boolean;

  // Actions
  setCurrentInterview: (interview: MockInterview | null) => void;
  setCurrentQuestionIndex: (index: number) => void;
  setIsInterviewActive: (active: boolean) => void;
  setFeedback: (feedback: InterviewFeedback) => void;
  setPerformanceHistory: (history: any[]) => void;
  setLoading: (loading: boolean) => void;
  resetInterview: () => void;
}

export const useInterviewPrepStore = create<InterviewPrepState>((set) => ({
  currentInterview: null,
  currentQuestionIndex: 0,
  isInterviewActive: false,
  feedback: null,
  performanceHistory: [],
  isLoading: false,

  setCurrentInterview: (interview) => set({ currentInterview: interview }),
  setCurrentQuestionIndex: (index) => set({ currentQuestionIndex: index }),
  setIsInterviewActive: (active) => set({ isInterviewActive: active }),
  setFeedback: (feedback) => set({ feedback }),
  setPerformanceHistory: (history) => set({ performanceHistory: history }),
  setLoading: (isLoading) => set({ isLoading }),
  resetInterview: () => set({
    currentInterview: null,
    currentQuestionIndex: 0,
    isInterviewActive: false,
    feedback: null
  }),
}));
```

#### `useCareerTwinStore.ts`
```typescript
import { create } from 'zustand';

interface CareerPrediction {
  nextRole: string;
  timeline: string;
  confidence: number;
}

interface SalaryPrediction {
  current: number;
  nextRole: number;
  growth: string;
  locationBased: Record<string, number>;
}

interface LearningRoadmapItem {
  id: string;
  title: string;
  description: string;
  duration: string;
  resources: string[];
  isCompleted: boolean;
}

interface CareerTwinState {
  careerPrediction: CareerPrediction | null;
  salaryPrediction: SalaryPrediction | null;
  learningRoadmap: LearningRoadmapItem[];
  isLoading: boolean;
  isGenerating: boolean;

  // Actions
  setCareerPrediction: (prediction: CareerPrediction) => void;
  setSalaryPrediction: (prediction: SalaryPrediction) => void;
  setLearningRoadmap: (roadmap: LearningRoadmapItem[]) => void;
  updateRoadmapItem: (id: string, updates: Partial<LearningRoadmapItem>) => void;
  setLoading: (loading: boolean) => void;
  setGenerating: (generating: boolean) => void;
}

export const useCareerTwinStore = create<CareerTwinState>((set) => ({
  careerPrediction: null,
  salaryPrediction: null,
  learningRoadmap: [],
  isLoading: false,
  isGenerating: false,

  setCareerPrediction: (prediction) => set({ careerPrediction: prediction }),
  setSalaryPrediction: (prediction) => set({ salaryPrediction: prediction }),
  setLearningRoadmap: (roadmap) => set({ learningRoadmap: roadmap }),
  updateRoadmapItem: (id, updates) => set((state) => ({
    learningRoadmap: state.learningRoadmap.map(item =>
      item.id === id ? { ...item, ...updates } : item
    )
  })),
  setLoading: (isLoading) => set({ isLoading }),
  setGenerating: (isGenerating) => set({ isGenerating }),
}));
```

#### `useNotificationsStore.ts`
```typescript
import { create } from 'zustand';

interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
  actionUrl?: string;
}

interface NotificationsState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;

  // Actions
  setNotifications: (notifications: Notification[]) => void;
  addNotification: (notification: Notification) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
  setLoading: (loading: boolean) => void;
}

export const useNotificationsStore = create<NotificationsState>((set) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,

  setNotifications: (notifications) => set({
    notifications,
    unreadCount: notifications.filter(n => !n.read).length
  }),
  addNotification: (notification) => set((state) => ({
    notifications: [notification, ...state.notifications],
    unreadCount: state.unreadCount + 1
  })),
  markAsRead: (id) => set((state) => ({
    notifications: state.notifications.map(n =>
      n.id === id ? { ...n, read: true } : n
    ),
    unreadCount: Math.max(0, state.unreadCount - 1)
  })),
  markAllAsRead: () => set((state) => ({
    notifications: state.notifications.map(n => ({ ...n, read: true })),
    unreadCount: 0
  })),
  deleteNotification: (id) => set((state) => {
    const deletedNotification = state.notifications.find(n => n.id === id);
    return {
      notifications: state.notifications.filter(n => n.id !== id),
      unreadCount: deletedNotification && !deletedNotification.read
        ? Math.max(0, state.unreadCount - 1)
        : state.unreadCount
    };
  }),
  setLoading: (isLoading) => set({ isLoading }),
}));
```


## 4. API Integration Layer

Check the existing API services in `frontend/src/api/services/`. They already cover most needs! Here's what we have:

| Service File                    | Purpose                                  |
|---------------------------------|------------------------------------------|
| `authService.ts`                | Authentication                           |
| `careerProfileService.ts`       | Master Profile (Education, Experience)   |
| `resumeService.ts`              | Resume management                        |
| `jobService.ts`                 | Job listings and details                 |
| `applicationService.ts`         | Applications and pipeline                |
| `coverLetterService.ts`         | Cover letters                            |
| `interviewService.ts`           | Interview simulation and prep            |
| `careerTwinService.ts`          | Career Twin features                     |
| `notificationService.ts`        | Notifications                            |


## 5. Implementation Plan

### Phase 1: Route and Basic Store Setup
- [ ] Update `appRoutes.tsx` with new route structure
- [ ] Create all new Zustand stores

### Phase 2: Core Page Implementation
- [ ] MasterProfilePage
- [ ] JobDiscoveryPage
- [ ] JobPipelinePage
- [ ] ResumeAIPage
- [ ] CoverLetterAIPage
- [ ] InterviewPrepPage
- [ ] CareerTwinPage
- [ ] NotificationsCenterPage

### Phase 3: UI/UX Enhancements
- [ ] Add drag-and-drop to Job Pipeline
- [ ] Real-time notifications via Socket.io
- [ ] AI features integration
