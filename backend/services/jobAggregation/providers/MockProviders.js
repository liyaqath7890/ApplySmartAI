import { BaseJobProvider } from './BaseProvider.js';

class MockJobProvider extends BaseJobProvider {
  constructor(platformName) {
    super();
    this.platformName = platformName;
  }

  async fetchJobs(searchParams) {
    // Generate mock jobs based on the search params
    const keyword = searchParams.keyword || 'Software Engineer';
    const location = searchParams.location || 'Remote';

    return Array.from({ length: 5 }).map((_, i) => ({
      id: `${this.platformName.toLowerCase()}-${Date.now()}-${i}`,
      jobTitle: `${keyword} - ${i + 1}`,
      companyName: `TechCorp ${this.platformName} ${i}`,
      jobLocation: location,
      url: `https://${this.platformName.toLowerCase()}.com/jobs/${i}`,
      fullDescription: `This is a mock description for ${keyword} at ${this.platformName}. We are looking for experienced developers with skills in React, Node.js, and Cloud.`,
      experienceLevel: 'mid',
      salaryRange: '$100k - $150k',
      workType: 'remote'
    }));
  }

  normalizeJob(rawJob) {
    return {
      platform: this.platformName.toLowerCase(),
      externalJobId: rawJob.id,
      title: rawJob.jobTitle,
      company: rawJob.companyName,
      location: rawJob.jobLocation,
      description: rawJob.fullDescription,
      jobUrl: rawJob.url,
      experienceLevel: rawJob.experienceLevel,
      salaryInfo: rawJob.salaryRange,
      workType: rawJob.workType,
      postedDate: new Date(),
      status: 'active'
    };
  }
}

export class NaukriProvider extends MockJobProvider { constructor() { super('Naukri'); } }
export class WellfoundProvider extends MockJobProvider { constructor() { super('Wellfound'); } }
export class FounditProvider extends MockJobProvider { constructor() { super('Foundit'); } }
export class ApnaProvider extends MockJobProvider { constructor() { super('Apna'); } }
export class InternshalaProvider extends MockJobProvider { constructor() { super('Internshala'); } }
export class GlassdoorProvider extends MockJobProvider { constructor() { super('Glassdoor'); } }
export class MonsterProvider extends MockJobProvider { constructor() { super('Monster'); } }
export class CutshortProvider extends MockJobProvider { constructor() { super('Cutshort'); } }
