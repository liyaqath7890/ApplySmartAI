import { BaseJobProvider } from './BaseProvider.js';

export class IndeedProvider extends BaseJobProvider {
  constructor(config) {
    super(config);
    this.name = 'indeed';
  }

  async fetchJobs(searchParams) {
    console.log('Fetching jobs from Indeed with params:', searchParams);

    return [
      {
        externalJobId: 'indeed-job-1',
        title: 'Software Engineer',
        company: 'BigTech Inc',
        location: 'New York, NY',
        description: 'Join our engineering team',
        requirements: ['Java', 'Spring Boot', 'AWS'],
        salary: '$120k-$180k',
        employmentType: 'full-time',
        experienceLevel: 'mid',
        workType: 'on-site',
        jobUrl: 'https://indeed.com/viewjob?jk=1',
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
