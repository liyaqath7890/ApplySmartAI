import { BaseATSProvider } from './BaseATSProvider.js';
import logger from '../../../utils/logger.js';

/**
 * Oracle Recruiting Cloud (ORC) Provider
 * Fetches public postings from Oracle's hcmRestApi recruiting job requisitions endpoint.
 * Endpoint: https://<tenant>.fa.<region>.oraclecloud.com/hcmRestApi/resources/11.13.18.05/recruitingJobRequisitions
 */
export class OracleProvider extends BaseATSProvider {
  constructor(config = {}) {
    super(config);
    this.defaultRegion = config.defaultRegion || 'us2';
  }

  getPlatformName() {
    return 'oracle';
  }

  isConfigured() {
    return true;
  }

  /**
   * Fetch company jobs using Oracle's recruiting endpoint.
   */
  async fetchCompanyJobs(company, options = {}) {
    const tenant = company.externalCompanyId || company.name?.toLowerCase().replace(/\s+/g, '');
    const region = company.socialLinks?.oracleRegion || this.defaultRegion;
    const limit = options.limit || 50;
    const page = options.page || 1;
    const offset = (page - 1) * limit;

    try {
      // Build standard ORC URL
      const url = `https://${tenant}.fa.${region}.oraclecloud.com/hcmRestApi/resources/11.13.18.05/recruitingJobRequisitions`;
      
      const response = await this.requestWithRetry(url, {
        method: 'GET',
        params: {
          limit,
          offset,
          onlyData: true,
          q: options.keyword ? `Title LIKE '%${options.keyword}%'` : ''
        }
      });

      if (!response || !response.items || !Array.isArray(response.items)) {
        return [];
      }

      this.log(`Fetched ${response.items.length} postings for ${company.name} (page ${page})`);

      return response.items.map(item => ({
        ...item,
        companyDisplayName: company.name,
        tenant,
        region
      }));
    } catch (error) {
      this.log(`Error fetching Oracle ORC jobs for ${tenant}: ${error.message}`, 'error');
      return [];
    }
  }

  /**
   * Normalize Oracle ORC job object
   */
  normalizeJob(rawJob) {
    if (!rawJob) return null;

    const description = rawJob.JobDescription || rawJob.ShortDescription || '';
    
    let workType = 'on-site';
    const descLower = description.toLowerCase();
    if (descLower.includes('remote') || descLower.includes('work from home') || descLower.includes('wfh')) {
      workType = 'remote';
    } else if (descLower.includes('hybrid')) {
      workType = 'hybrid';
    }

    const tenant = rawJob.tenant || 'company';
    const region = rawJob.region || 'us2';
    const jobUrl = `https://${tenant}.fa.${region}.oraclecloud.com/hcmUI/CandidateExperience/en/sites/CX_1/requisitions/preview/${rawJob.RequisitionNumber || rawJob.Id}`;

    return {
      platform: 'oracle',
      externalJobId: this.generateExternalJobId(rawJob),
      title: rawJob.Title || rawJob.RequisitionName || 'Job Requisition',
      company: rawJob.companyDisplayName || 'Confidential',
      location: rawJob.PrimaryLocation || rawJob.Location || '',
      description: this.cleanDescription(description),
      requirements: this.extractRequirements(description),
      responsibilities: this.extractResponsibilities(description),
      salary: null,
      salaryMin: rawJob.MinimumSalary || null,
      salaryMax: rawJob.MaximumSalary || null,
      employmentType: this.normalizeEmploymentType(rawJob.EmploymentStatus || 'full-time'),
      experienceLevel: this.normalizeExperienceLevel(rawJob.Title),
      workType,
      jobUrl,
      postedDate: this.parseDate(rawJob.PostedDate || rawJob.CreationDate),
      source: 'Oracle Recruiting',
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
    const keywords = ['require', 'must have', 'should have', 'need', 'qualif', 'experience', 'skill', 'knowledge'];
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
    const keywords = ['responsib', 'you will', 'your role', 'duties', 'tasks'];
    for (const line of lines) {
      const lower = line.toLowerCase();
      if (keywords.some(k => lower.includes(k)) && line.length > 10 && line.length < 500) {
        responsibilities.push(line.replace(/^[-*•]\s*/, '').trim());
      }
    }
    return responsibilities.slice(0, 10);
  }
}

export default OracleProvider;
