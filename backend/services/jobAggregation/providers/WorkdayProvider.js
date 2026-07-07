import { BaseATSProvider } from './BaseATSProvider.js';
import logger from '../../../utils/logger.js';

/**
 * Workday Careers API Adapter
 * Fetches public postings from Workday's client-side search API (cxs).
 * Endpoint: https://<company>.myworkdayjobs.com/wday/cxs/<company>/<careerSite>/jobs
 */
export class WorkdayProvider extends BaseATSProvider {
  constructor(config = {}) {
    super(config);
    this.defaultCareerSite = config.defaultCareerSite || 'External';
  }

  getPlatformName() {
    return 'workday';
  }

  isConfigured() {
    return true; // Public listings via tenant subdomains
  }

  /**
   * Fetch company jobs using Workday's standard cxs endpoint.
   */
  async fetchCompanyJobs(company, options = {}) {
    const tenant = company.externalCompanyId || company.name?.toLowerCase().replace(/\s+/g, '');
    const careerSite = company.socialLinks?.workdayCareerSite || this.defaultCareerSite;
    const page = options.page || 1;
    const limit = options.limit || 20;
    const offset = (page - 1) * limit;

    try {
      const url = `https://${tenant}.myworkdayjobs.com/wday/cxs/${tenant}/${careerSite}/jobs`;
      
      const payload = {
        appliedFacets: {},
        limit,
        offset,
        searchText: options.keyword || ''
      };

      const response = await this.requestWithRetry(url, {
        method: 'POST',
        data: payload,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      if (!response || !response.jobPostings || !Array.isArray(response.jobPostings)) {
        return [];
      }

      this.log(`Fetched ${response.jobPostings.length} postings for ${company.name} (page ${page})`);

      // Hydrate descriptions by calling each job's details endpoint
      const hydratedJobs = [];
      for (const posting of response.jobPostings) {
        try {
          const detailPath = posting.externalPath || '';
          if (detailPath) {
            const detailUrl = `https://${tenant}.myworkdayjobs.com/wday/cxs/${tenant}/${careerSite}${detailPath}`;
            const details = await this.requestWithRetry(detailUrl, { method: 'GET' });
            hydratedJobs.push({
              ...posting,
              details,
              companyDisplayName: company.name,
              tenant
            });
          } else {
            hydratedJobs.push({
              ...posting,
              companyDisplayName: company.name,
              tenant
            });
          }
        } catch (detailErr) {
          this.log(`Error getting details for ${posting.title}: ${detailErr.message}`, 'warn');
          hydratedJobs.push({
            ...posting,
            companyDisplayName: company.name,
            tenant
          });
        }
      }

      return hydratedJobs;
    } catch (error) {
      this.log(`Error fetching workday jobs for company ${tenant}: ${error.message}`, 'error');
      return [];
    }
  }

  /**
   * Normalize Workday job object
   */
  normalizeJob(rawJob) {
    if (!rawJob) return null;

    const details = rawJob.details || {};
    const description = details.jobDescription || rawJob.description || '';
    
    // Workday location parsing
    let location = rawJob.location || '';
    if (details.locationOfJob) location = details.locationOfJob;

    let workType = 'on-site';
    const wt = (details.timeType || '').toLowerCase();
    if (wt.includes('remote') || description.toLowerCase().includes('remote')) {
      workType = 'remote';
    } else if (wt.includes('hybrid')) {
      workType = 'hybrid';
    }

    const tenant = rawJob.tenant || 'company';
    const externalPath = rawJob.externalPath || '';
    const jobUrl = externalPath 
      ? `https://${tenant}.myworkdayjobs.com/en-US/${tenant}/job/${externalPath.split('/').pop()}`
      : `https://${tenant}.myworkdayjobs.com`;

    return {
      platform: 'workday',
      externalJobId: this.generateExternalJobId(rawJob),
      title: rawJob.title,
      company: rawJob.companyDisplayName || 'Confidential',
      location,
      description: this.cleanDescription(description),
      requirements: this.extractRequirements(description),
      responsibilities: this.extractResponsibilities(description),
      salary: null,
      salaryMin: null,
      salaryMax: null,
      employmentType: this.normalizeEmploymentType(details.timeType || 'full-time'),
      experienceLevel: this.normalizeExperienceLevel(rawJob.title),
      workType,
      jobUrl,
      postedDate: this.parseDate(rawJob.postedOn || rawJob.startDate),
      source: 'Workday',
      raw: rawJob
    };
  }

  cleanDescription(html) {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, '\n').replace(/&nbsp;/g, ' ')
      .replace(/\n{3,}/g, '\n\n').trim();
  }

  extractRequirements(description) {
    if (!description) return [];
    const lines = description.split('\n');
    const requirements = [];
    const keywords = ['require', 'must have', 'should have', 'need', 'qualif', 'experience', 'skill', 'knowledge', 'years of'];
    for (const line of lines) {
      const lower = line.toLowerCase();
      if (keywords.some(k => lower.includes(k)) && line.length > 10 && line.length < 500) {
        requirements.push(line.replace(/^[-*•]\s*/, '').trim());
      }
    }
    return requirements.slice(0, 10);
  }

  extractResponsibilities(description) {
    if (!description) return [];
    const lines = description.split('\n');
    const responsibilities = [];
    const keywords = ['responsib', 'you will', 'your role', 'duties', 'tasks', 'will be'];
    for (const line of lines) {
      const lower = line.toLowerCase();
      if (keywords.some(k => lower.includes(k)) && line.length > 10 && line.length < 500) {
        responsibilities.push(line.replace(/^[-*•]\s*/, '').trim());
      }
    }
    return responsibilities.slice(0, 10);
  }
}

export default WorkdayProvider;
