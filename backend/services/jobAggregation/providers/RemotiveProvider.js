import { BaseJobProvider } from './BaseProvider.js';

/**
 * Remotive API Provider
 * Documentation: https://remotive.com/api
 * Free API for remote jobs
 */
export class RemotiveProvider extends BaseJobProvider {
  constructor(adapterConfig = {}) {
    super(adapterConfig);
    this.baseUrl = adapterConfig.baseUrl || 'https://remotive.com/api';
  }

  isConfigured() {
    return true;
  }

  async fetchJobs(searchParams = {}) {
    try {
      const { keyword = 'software', category = 'software-dev', page = 1 } = searchParams;
      const url = `${this.baseUrl}/jobs`;
      const params = { search: keyword, category, page };
      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] === undefined) delete params[key];
      });

      const data = await this.requestWithRetry(url, { method: 'GET', params });
      if (data && data.jobs) {
        this.log(`Fetched ${data.jobs.length} jobs from Remotive`);
        return data.jobs;
      }
      return [];
    } catch (error) {
      this.log(`Error fetching jobs from Remotive: ${error.message}`, 'error');
      return [];
    }
  }

  normalizeJob(rawJob) {
    if (!rawJob) return null;
    const description = rawJob.description || '';
    const salaryData = this.parseSalary(rawJob.salary);

    return {
      platform: 'remotive',
      externalJobId: this.generateExternalJobId(rawJob),
      title: rawJob.title,
      company: rawJob.company_name,
      location: rawJob.candidate_required_location || 'Remote',
      description: this.cleanDescription(description),
      requirements: this.extractRequirements(description),
      responsibilities: this.extractResponsibilities(description),
      salary: rawJob.salary || null,
      salaryMin: salaryData.min,
      salaryMax: salaryData.max,
      employmentType: this.normalizeEmploymentType(rawJob.job_type || 'full-time'),
      experienceLevel: this.normalizeExperienceLevel(rawJob.title),
      workType: 'remote',
      jobUrl: rawJob.url,
      postedDate: this.parseDate(rawJob.publication_date),
      source: 'Remotive',
      raw: rawJob
    };
  }

  cleanDescription(html) {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, '\n').replace(/&nbsp;/g, ' ')
      .replace(/&/g, '&').replace(/</g, '<').replace(/>/g, '>')
      .replace(/\n{3,}/g, '\n\n').trim();
  }

  extractRequirements(description) {
    if (!description) return [];
    const lines = description.split('\n');
    const requirements = [];
    const keywords = ['require', 'must have', 'should have', 'need', 'qualif', 'experience', 'skill', 'knowledge', 'proficient'];
    for (const line of lines) {
      const lowerLine = line.toLowerCase().trim();
      if (keywords.some(kw => lowerLine.includes(kw)) && line.length > 10 && line.length < 500) {
        requirements.push(line.replace(/^[-*•]\s*/, '').trim());
      }
    }
    return requirements.slice(0, 10);
  }

  extractResponsibilities(description) {
    if (!description) return [];
    const lines = description.split('\n');
    const responsibilities = [];
    const keywords = ['responsib', 'you will', 'your role', 'duties', 'tasks', 'will be', 'expected to', 'accountable'];
    for (const line of lines) {
      const lowerLine = line.toLowerCase().trim();
      if (keywords.some(kw => lowerLine.includes(kw)) && line.length > 10 && line.length < 500) {
        responsibilities.push(line.replace(/^[-*•]\s*/, '').trim());
      }
    }
    return responsibilities.slice(0, 10);
  }
}

export default RemotiveProvider;