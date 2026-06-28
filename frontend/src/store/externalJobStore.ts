import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ExternalJob {
  id: string;
  title: string;
  company: string;
  location: string;
  locationType: 'Remote' | 'Hybrid' | 'On-site';
  salary: string;
  salaryMin: number;
  salaryMax: number;
  skills: string[];
  experience: 'Entry' | 'Junior' | 'Mid' | 'Senior' | 'Lead' | 'Principal';
  jobType: 'Full-time' | 'Part-time' | 'Contract' | 'Internship';
  category: string;
  description: string;
  postedDate: string;
  source: 'Internal' | 'LinkedIn' | 'Indeed' | 'Glassdoor' | 'Company' | 'AngelList';
  jobUrl: string;
  isSaved: boolean;
  matchScore?: number;
  missingSkills?: string[];
  atsPrediction?: number;
  interviewDifficulty?: 'Easy' | 'Medium' | 'Hard';
}

export interface JobFilters {
  search: string;
  location: string;
  locationType: string;
  experience: string;
  category: string;
  salaryMin: number;
  salaryMax: number;
  jobType: string;
  source: string;
  minMatch: number;
}

interface ExternalJobState {
  jobs: ExternalJob[];
  filters: JobFilters;
  selectedJob: ExternalJob | null;
  isLoading: boolean;

  setFilters: (f: Partial<JobFilters>) => void;
  resetFilters: () => void;
  toggleSave: (id: string) => void;
  selectJob: (job: ExternalJob | null) => void;
  computeMatchScores: (userSkills: string[], userExperience: number) => void;
  setLoading: (v: boolean) => void;
}

const DEFAULT_FILTERS: JobFilters = {
  search: '', location: '', locationType: '', experience: '',
  category: '', salaryMin: 0, salaryMax: 300000, jobType: '', source: '', minMatch: 0,
};

// ─── 500+ Realistic Jobs ──────────────────────────────────────────────────────
const COMPANIES = [
  'Google', 'Meta', 'Amazon', 'Apple', 'Microsoft', 'Netflix', 'Stripe', 'Airbnb',
  'Shopify', 'Atlassian', 'Figma', 'Notion', 'Vercel', 'Supabase', 'PlanetScale',
  'Databricks', 'Snowflake', 'HashiCorp', 'Datadog', 'New Relic', 'Twilio', 'Segment',
  'HubSpot', 'Salesforce', 'ServiceNow', 'Workday', 'Zendesk', 'Intercom', 'Mixpanel',
  'Amplitude', 'LaunchDarkly', 'Linear', 'Loom', 'Miro', 'Airtable', 'Monday.com',
  'Asana', 'Jira', 'Confluence', 'GitHub', 'GitLab', 'CircleCI', 'Render', 'Railway',
  'Fly.io', 'Cloudflare', 'Fastly', 'Akamai', 'Pagerduty', 'OpsGenie', 'Grafana',
];

const ROLES: { title: string; skills: string[]; category: string; exp: ExternalJob['experience']; salMin: number; salMax: number }[] = [
  { title: 'Senior Frontend Engineer', skills: ['React', 'TypeScript', 'Next.js', 'Tailwind CSS'], category: 'Frontend', exp: 'Senior', salMin: 140000, salMax: 180000 },
  { title: 'Frontend Engineer', skills: ['React', 'JavaScript', 'CSS', 'Redux'], category: 'Frontend', exp: 'Mid', salMin: 110000, salMax: 145000 },
  { title: 'Junior Frontend Developer', skills: ['React', 'JavaScript', 'HTML', 'CSS'], category: 'Frontend', exp: 'Junior', salMin: 75000, salMax: 100000 },
  { title: 'Lead Frontend Engineer', skills: ['React', 'TypeScript', 'GraphQL', 'System Design'], category: 'Frontend', exp: 'Lead', salMin: 170000, salMax: 220000 },
  { title: 'React Native Developer', skills: ['React Native', 'TypeScript', 'iOS', 'Android'], category: 'Mobile', exp: 'Mid', salMin: 115000, salMax: 150000 },
  { title: 'Senior React Native Engineer', skills: ['React Native', 'TypeScript', 'Redux', 'Firebase'], category: 'Mobile', exp: 'Senior', salMin: 140000, salMax: 175000 },
  { title: 'Full Stack Engineer', skills: ['React', 'Node.js', 'PostgreSQL', 'AWS'], category: 'Full Stack', exp: 'Mid', salMin: 120000, salMax: 155000 },
  { title: 'Senior Full Stack Engineer', skills: ['React', 'Node.js', 'TypeScript', 'Docker', 'Kubernetes'], category: 'Full Stack', exp: 'Senior', salMin: 145000, salMax: 190000 },
  { title: 'Full Stack Developer', skills: ['Vue.js', 'Node.js', 'MongoDB', 'Redis'], category: 'Full Stack', exp: 'Mid', salMin: 110000, salMax: 145000 },
  { title: 'Backend Engineer', skills: ['Node.js', 'Python', 'PostgreSQL', 'Redis', 'AWS'], category: 'Backend', exp: 'Mid', salMin: 120000, salMax: 155000 },
  { title: 'Senior Backend Engineer', skills: ['Go', 'Python', 'PostgreSQL', 'Kafka', 'Kubernetes'], category: 'Backend', exp: 'Senior', salMin: 150000, salMax: 195000 },
  { title: 'Backend Developer (Python)', skills: ['Python', 'FastAPI', 'PostgreSQL', 'Docker'], category: 'Backend', exp: 'Mid', salMin: 115000, salMax: 150000 },
  { title: 'Node.js Engineer', skills: ['Node.js', 'Express', 'MongoDB', 'REST APIs'], category: 'Backend', exp: 'Mid', salMin: 110000, salMax: 145000 },
  { title: 'Go Backend Engineer', skills: ['Go', 'gRPC', 'PostgreSQL', 'Kubernetes'], category: 'Backend', exp: 'Senior', salMin: 155000, salMax: 200000 },
  { title: 'Java Backend Engineer', skills: ['Java', 'Spring Boot', 'PostgreSQL', 'AWS'], category: 'Backend', exp: 'Senior', salMin: 140000, salMax: 185000 },
  { title: 'DevOps Engineer', skills: ['Docker', 'Kubernetes', 'Terraform', 'AWS', 'CI/CD'], category: 'DevOps', exp: 'Mid', salMin: 125000, salMax: 165000 },
  { title: 'Senior DevOps Engineer', skills: ['Kubernetes', 'Terraform', 'AWS', 'GCP', 'Ansible'], category: 'DevOps', exp: 'Senior', salMin: 150000, salMax: 200000 },
  { title: 'Site Reliability Engineer', skills: ['Kubernetes', 'Python', 'Prometheus', 'Grafana', 'AWS'], category: 'DevOps', exp: 'Senior', salMin: 155000, salMax: 205000 },
  { title: 'Platform Engineer', skills: ['Kubernetes', 'Terraform', 'Go', 'AWS', 'Helm'], category: 'DevOps', exp: 'Senior', salMin: 150000, salMax: 195000 },
  { title: 'Cloud Architect', skills: ['AWS', 'GCP', 'Azure', 'Terraform', 'System Design'], category: 'Cloud', exp: 'Principal', salMin: 180000, salMax: 250000 },
  { title: 'AWS Solutions Architect', skills: ['AWS', 'Terraform', 'CloudFormation', 'Python'], category: 'Cloud', exp: 'Senior', salMin: 155000, salMax: 205000 },
  { title: 'Data Engineer', skills: ['Python', 'Spark', 'SQL', 'Airflow', 'Snowflake'], category: 'Data', exp: 'Mid', salMin: 130000, salMax: 170000 },
  { title: 'Senior Data Engineer', skills: ['Python', 'Spark', 'Kafka', 'dbt', 'Databricks'], category: 'Data', exp: 'Senior', salMin: 155000, salMax: 200000 },
  { title: 'Data Scientist', skills: ['Python', 'Machine Learning', 'TensorFlow', 'SQL', 'Statistics'], category: 'Data Science', exp: 'Mid', salMin: 140000, salMax: 185000 },
  { title: 'Senior Data Scientist', skills: ['Python', 'PyTorch', 'MLOps', 'Kubernetes', 'Spark'], category: 'Data Science', exp: 'Senior', salMin: 165000, salMax: 220000 },
  { title: 'ML Engineer', skills: ['Python', 'TensorFlow', 'PyTorch', 'Kubernetes', 'MLOps'], category: 'ML/AI', exp: 'Senior', salMin: 165000, salMax: 225000 },
  { title: 'AI Engineer', skills: ['Python', 'LangChain', 'OpenAI API', 'Vector DBs', 'FastAPI'], category: 'ML/AI', exp: 'Mid', salMin: 145000, salMax: 195000 },
  { title: 'Security Engineer', skills: ['Security', 'Penetration Testing', 'AWS', 'Python', 'SIEM'], category: 'Security', exp: 'Senior', salMin: 155000, salMax: 210000 },
  { title: 'iOS Developer', skills: ['Swift', 'SwiftUI', 'Xcode', 'Core Data', 'REST APIs'], category: 'Mobile', exp: 'Mid', salMin: 120000, salMax: 160000 },
  { title: 'Android Developer', skills: ['Kotlin', 'Jetpack Compose', 'Android Studio', 'REST APIs'], category: 'Mobile', exp: 'Mid', salMin: 115000, salMax: 155000 },
  { title: 'Engineering Manager', skills: ['Team Leadership', 'System Design', 'Agile', 'React', 'Node.js'], category: 'Management', exp: 'Lead', salMin: 180000, salMax: 250000 },
  { title: 'Staff Engineer', skills: ['System Design', 'React', 'Node.js', 'AWS', 'TypeScript'], category: 'Full Stack', exp: 'Principal', salMin: 190000, salMax: 270000 },
  { title: 'Principal Engineer', skills: ['System Design', 'Architecture', 'Go', 'Kubernetes', 'AWS'], category: 'Backend', exp: 'Principal', salMin: 210000, salMax: 300000 },
  { title: 'UI/UX Engineer', skills: ['React', 'Figma', 'CSS', 'Accessibility', 'Design Systems'], category: 'Frontend', exp: 'Mid', salMin: 110000, salMax: 145000 },
  { title: 'Blockchain Developer', skills: ['Solidity', 'Ethereum', 'Web3.js', 'TypeScript', 'Node.js'], category: 'Blockchain', exp: 'Mid', salMin: 130000, salMax: 175000 },
  { title: 'Embedded Systems Engineer', skills: ['C', 'C++', 'RTOS', 'Linux', 'Python'], category: 'Embedded', exp: 'Senior', salMin: 140000, salMax: 185000 },
  { title: 'GraphQL API Engineer', skills: ['GraphQL', 'Node.js', 'TypeScript', 'Apollo', 'PostgreSQL'], category: 'Backend', exp: 'Mid', salMin: 120000, salMax: 155000 },
  { title: 'Ruby on Rails Developer', skills: ['Ruby', 'Rails', 'PostgreSQL', 'Redis', 'AWS'], category: 'Backend', exp: 'Mid', salMin: 115000, salMax: 150000 },
  { title: 'Rust Engineer', skills: ['Rust', 'WebAssembly', 'Systems Programming', 'Performance'], category: 'Backend', exp: 'Senior', salMin: 160000, salMax: 215000 },
  { title: 'Technical Lead', skills: ['React', 'Node.js', 'System Design', 'TypeScript', 'AWS'], category: 'Full Stack', exp: 'Lead', salMin: 165000, salMax: 215000 },
];

const LOCATIONS = [
  { city: 'San Francisco, CA', type: 'Hybrid' as const },
  { city: 'New York, NY', type: 'Hybrid' as const },
  { city: 'Seattle, WA', type: 'Hybrid' as const },
  { city: 'Austin, TX', type: 'Hybrid' as const },
  { city: 'Boston, MA', type: 'On-site' as const },
  { city: 'Chicago, IL', type: 'Hybrid' as const },
  { city: 'Los Angeles, CA', type: 'Hybrid' as const },
  { city: 'Denver, CO', type: 'Remote' as const },
  { city: 'Atlanta, GA', type: 'Hybrid' as const },
  { city: 'Remote', type: 'Remote' as const },
  { city: 'Remote', type: 'Remote' as const },
  { city: 'Remote', type: 'Remote' as const },
];

const SOURCES: ExternalJob['source'][] = ['LinkedIn', 'Indeed', 'Glassdoor', 'Company', 'AngelList', 'Internal'];
const DAYS_AGO = ['Today', '1 day ago', '2 days ago', '3 days ago', '4 days ago', '5 days ago', '1 week ago', '2 weeks ago', '3 weeks ago'];

const generateJobs = (): ExternalJob[] => {
  const jobs: ExternalJob[] = [];
  let id = 1;

  // Generate ~500 jobs by cycling roles x companies x locations
  for (let r = 0; r < ROLES.length; r++) {
    const role = ROLES[r];
    const companyCount = Math.ceil(500 / ROLES.length);
    for (let c = 0; c < companyCount; c++) {
      const company = COMPANIES[(r * companyCount + c) % COMPANIES.length];
      const loc = LOCATIONS[(r + c) % LOCATIONS.length];
      const source = SOURCES[(r + c) % SOURCES.length];
      const salaryVariation = Math.floor((Math.random() - 0.5) * 10000);
      const salMin = role.salMin + salaryVariation;
      const salMax = role.salMax + salaryVariation;

      jobs.push({
        id: `job-${id++}`,
        title: role.title,
        company,
        location: loc.city,
        locationType: loc.type,
        salary: `$${Math.round(salMin / 1000)}k - $${Math.round(salMax / 1000)}k`,
        salaryMin: salMin,
        salaryMax: salMax,
        skills: role.skills,
        experience: role.exp,
        jobType: 'Full-time',
        category: role.category,
        description: `${company} is looking for a ${role.title} to join our growing engineering team. You will work on ${role.category} systems serving millions of users. Strong experience with ${role.skills.slice(0, 3).join(', ')} required.`,
        postedDate: DAYS_AGO[(r + c) % DAYS_AGO.length],
        source,
        jobUrl: `https://${source.toLowerCase()}.com/jobs/${id}`,
        isSaved: false,
      });

      if (jobs.length >= 500) break;
    }
    if (jobs.length >= 500) break;
  }

  return jobs;
};

const ALL_JOBS = generateJobs();

export const useExternalJobStore = create<ExternalJobState>()(
  persist(
    (set, get) => ({
      jobs: ALL_JOBS,
      filters: DEFAULT_FILTERS,
      selectedJob: null,
      isLoading: false,

      setFilters: (f) => set((state) => ({ filters: { ...state.filters, ...f } })),
      resetFilters: () => set({ filters: DEFAULT_FILTERS }),

      toggleSave: (id) => set((state) => ({
        jobs: state.jobs.map(j => j.id === id ? { ...j, isSaved: !j.isSaved } : j),
      })),

      selectJob: (job) => set({ selectedJob: job }),

      computeMatchScores: (userSkills, userExperience) => {
        const userSkillsLower = userSkills.map(s => s.toLowerCase());
        const expLevels: Record<string, number> = { Entry: 0, Junior: 1, Mid: 2, Senior: 3, Lead: 4, Principal: 5 };
        const userExpLevel = userExperience >= 8 ? 4 : userExperience >= 5 ? 3 : userExperience >= 3 ? 2 : userExperience >= 1 ? 1 : 0;

        set((state) => ({
          jobs: state.jobs.map(job => {
            const jobSkillsLower = job.skills.map(s => s.toLowerCase());
            const matched = jobSkillsLower.filter(s => userSkillsLower.includes(s));
            const missing = job.skills.filter(s => !userSkillsLower.includes(s.toLowerCase()));
            const skillMatch = Math.round((matched.length / Math.max(jobSkillsLower.length, 1)) * 100);

            const jobExpLevel = expLevels[job.experience] ?? 2;
            const expDiff = Math.abs(userExpLevel - jobExpLevel);
            const expMatch = Math.max(0, 100 - expDiff * 25);

            const locationMatch = job.locationType === 'Remote' ? 100 : 70;
            const matchScore = Math.round(skillMatch * 0.5 + expMatch * 0.3 + locationMatch * 0.2);

            return {
              ...job,
              matchScore: Math.min(99, Math.max(10, matchScore)),
              missingSkills: missing,
              atsPrediction: Math.min(99, matchScore + Math.floor(Math.random() * 10) - 5),
              interviewDifficulty: matchScore >= 75 ? 'Easy' : matchScore >= 50 ? 'Medium' : 'Hard',
            } as ExternalJob;
          }),
        }));
      },

      setLoading: (v) => set({ isLoading: v }),
    }),
    {
      name: 'external-job-store',
      partialize: (state) => ({ jobs: state.jobs.map(j => ({ ...j, matchScore: j.matchScore, isSaved: j.isSaved })) }),
    }
  )
);
