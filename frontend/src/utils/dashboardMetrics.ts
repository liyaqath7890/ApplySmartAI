import type { Application } from '@/store/jobPipelineStore';
import type { ExternalJob } from '@/store/externalJobStore';
import type { Skill } from '@/store/masterProfileStore';

const STAGE_ORDER = [
  'imported',
  'resume_generated',
  'cover_letter_generated',
  'ready_to_apply',
  'applied',
  'assessment',
  'interview_scheduled',
  'interview_completed',
  'hr_round',
  'technical_round',
  'final_round',
  'offer',
  'rejected',
  'withdrawn'
] as const;

export function computePipelineFunnel(applications: Application[]) {
  return STAGE_ORDER.map((stage) => ({
    name: stage.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
    value: applications.filter((a) => a.status === stage).length,
  })).filter((s) => s.value > 0);
}

export function computeWeeklyApplications(applications: Application[]) {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const counts = days.map((name) => ({ name, applications: 0 }));

  applications.forEach((app) => {
    const d = new Date(app.appliedDate);
    const dayIndex = d.getDay();
    counts[dayIndex].applications += 1;
  });

  return [...counts.slice(1), counts[0]];
}


export function getTopMatchedJobs(jobs: ExternalJob[], limit = 5) {
  return [...jobs]
    .filter((j) => (j.matchScore ?? 0) > 0)
    .sort((a, b) => (b.matchScore ?? 0) - (a.matchScore ?? 0))
    .slice(0, limit);
}

export function computeMonthlyAnalytics(applications: Application[]) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const now = new Date();
  const result: { month: string; applications: number; interviews: number; offers: number }[] = [];

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthApps = applications.filter((a) => {
      const ad = new Date(a.appliedDate);
      return ad.getMonth() === d.getMonth() && ad.getFullYear() === d.getFullYear();
    });
    result.push({
      month: months[d.getMonth()],
      applications: monthApps.length,
      interviews: monthApps.filter((a) => ['interview', 'offer'].includes(a.status)).length,
      offers: monthApps.filter((a) => a.status === 'offer').length,
    });
  }

  return result;
}
