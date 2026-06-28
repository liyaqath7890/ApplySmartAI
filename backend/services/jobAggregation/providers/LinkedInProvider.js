import { BaseJobProvider } from './BaseProvider.js';

export class LinkedInProvider extends BaseJobProvider {
  constructor(config) {
    super(config);
    this.name = 'linkedin';
  }

  async fetchJobs(searchParams) {
    console.log('Fetching jobs from LinkedIn with params:', searchParams);

    return [
      {
        externalJobId: 'linkedin-job-1',
        title: 'Senior Full Stack Developer',
        company: 'TechCorp',
        location: 'San Francisco, CA',
        description: 'We are looking for a senior full stack developer with experience in React and Node.js',
        requirements: ['React', 'Node.js', 'PostgreSQL', 'Docker'],
        responsibilities: ['Develop features', 'Mentor junior devs'],
        salary: '$150k-$200k',
        employmentType: 'full-time',
        experienceLevel: 'senior',
        workType: 'hybrid',
        jobUrl: 'https://linkedin.com/jobs/view/1',
        postedDate: new Date()
      },
      {
        externalJobId: 'linkedin-job-2',
        title: 'Frontend Engineer',
        company: 'StartupXYZ',
        location: 'Remote',
        description: 'Build amazing web apps with React',
        requirements: ['React', 'TypeScript', 'CSS'],
        responsibilities: ['Write code'],
        employmentType: 'full-time',
        experienceLevel: 'mid',
        workType: 'remote',
        jobUrl: 'https://linkedin.com/jobs/view/2',
        postedDate: new Date()
      }
    ];
  }

  normalizeJob(rawJob) {
    return {
      platform: this.name,
      externalJobId: rawJob.externalJobId,
      title: rawJob.title,
      company: rawJob.company,
      location: rawJob.location,
      description: rawJob.description,
      requirements: rawJob.requirements || [],
      responsibilities: rawJob.responsibilities || [],
      salary: rawJob.salary,
      employmentType: rawJob.employmentType,
      experienceLevel: rawJob.experienceLevel,
      workType: rawJob.workType,
      jobUrl: rawJob.jobUrl,
      postedDate: rawJob.postedDate,
      source: this.name
    };
  }
}
