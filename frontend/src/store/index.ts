// Export all existing stores
export { useAuthStore } from './authStore';
export { useJobStore } from './jobStore';
export { useApplicationStore } from './applicationStore';
export { useUIStore } from './uiStore';

// Export new stores and their types
export { useMasterProfileStore } from './masterProfileStore';
export type {
  PersonalInfo,
  Education,
  Experience,
  Certification,
  Skill,
} from './masterProfileStore';
export { useJobPipelineStore } from './jobPipelineStore';
export type {
  Application,
  PipelineStage,
} from './jobPipelineStore';
export { useResumeAIStore } from './resumeAIStore';
export { useCoverLetterAIStore } from './coverLetterAIStore';
export { useInterviewPrepStore } from './interviewPrepStore';
export type { InterviewQuestion, SessionAnswer, InterviewSession } from './interviewPrepStore';
export { useCareerTwinStore } from './careerTwinStore';
export type { CareerPlan, CareerMilestone } from './careerTwinStore';
export { useNotificationsStore } from './notificationsStore';
export type { Notification } from './notificationsStore';
export { useExternalJobStore } from './externalJobStore';
export type { ExternalJob, JobFilters } from './externalJobStore';
export { useRecruitersStore } from './recruitersStore';
export type { Recruiter } from './recruitersStore';
export { useCompaniesStore } from './companiesStore';
export type { Company } from './companiesStore';
export { useReferralsStore } from './referralsStore';
export type { Referral, ReferralStatus } from './referralsStore';
export { useNetworkingStore } from './networkingStore';
export type { NetworkingContact } from './networkingStore';
export { useCoachStore } from './coachStore';
export type { CoachReport, CoachReportContent, CoachChecklistItem } from './coachStore';
export { useCalendarStore } from './calendarStore';
export type { CalendarEvent } from './calendarStore';
