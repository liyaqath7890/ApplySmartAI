import { BaseATSProvider } from './BaseATSProvider.js';
import logger from '../../../utils/logger.js';

/**
 * SmartRecruiters Career Page Adapter
 * Fetches public postings from SmartRecruiters Posting API and hydrates details.
 * Documentation: https://dev.smartrecruiters.com
 */
export class SmartRecruitersProvider extends BaseATSProvider {
  constructor(adapterConfig = {}) {
    super(adapterConfig);
    this.baseUrl = adapterConfig.baseUrl || 'https://api.smartrecruiters.com/v1';
  }

  getPlatformName() {
    return 'smartrecruiters';
  }

  isConfigured() {
    return true; // Public postings require no auth key by default
  }

  /**
   * Fetch jobs for a Company model instance (DB-driven, implements BaseATSProvider interface)
   */
  async fetchCompanyJobs(company, options = {}) {
    const companyId = company.externalCompanyId || company.name?.toLowerCase().replace(/\s+/g, '-');
    const limit = options.limit || 100;
    const page = options.page || 1;
    const offset = (page - 1) * limit;

    try {
      const url = `${this.baseUrl}/companies/${companyId}/postings`;
      
      const response = await this.requestWithRetry(url, {
        method: 'GET',
        params: {
          limit,
          offset
        }
      });

      if (!response || !response.content || !Array.isArray(response.content)) {
        return [];
      }

      const listPostings = response.content;
      this.log(`Fetched ${listPostings.length} job postings for ${company.name} (page ${page})`);

      // SmartRecruiters list endpoint doesn't contain description, we must fetch details for each posting
      const hydratedJobs = [];
      const batchSize = 5; // Concurrency limit to prevent hitting rate limits
      
      for (let i = 0; i < listPostings.length; i += batchSize) {
        const batch = listPostings.slice(i, i + batchSize);
        const detailPromises = batch.map(async (posting) => {
          try {
            // Get full details from ref endpoint
            const detailUrl = posting.ref || `${this.baseUrl}/companies/${companyId}/postings/${posting.id}`;
            const details = await this.requestWithRetry(detailUrl, { method: 'GET' });
            return {
              ...posting,
              details,
              companyDisplayName: company.name
            };
          } catch (err) {
            this.log(`Error fetching details for posting ${posting.id}: ${err.message}`, 'warn');
            // If details fetch fails, return partial listing data
            return {
              ...posting,
              companyDisplayName: company.name
            };
          }
        });

        const batchResults = await Promise.all(detailPromises);
        hydratedJobs.push(...batchResults);
        
        // Brief sleep between batches
        if (i + batchSize < listPostings.length) {
          await this.sleep(200);
        }
      }

      return hydratedJobs;
    } catch (error) {
      this.log(`Error fetching jobs from SmartRecruiters for company ${companyId}: ${error.message}`, 'error');
      return [];
    }
  }

  /**
   * Test connection by fetching 1 posting
   */
  async testConnection(company) {
    try {
      const companyId = company.externalCompanyId || company.name?.toLowerCase().replace(/\s+/g, '-');
      const url = `${this.baseUrl}/companies/${companyId}/postings`;
      
      const response = await this.requestWithRetry(url, {
        method: 'GET',
        params: { limit: 1 }
      });

      if (response && response.content) {
        return { ok: true, message: 'Connected successfully', jobCount: response.totalFound || 0 };
      }
      return { ok: false, message: 'Response contains no postings' };
    } catch (err) {
      return { ok: false, message: `Connection failed: ${err.message}` };
    }
  }

  /**
   * Normalize SmartRecruiters job to standard format
   */
  normalizeJob(rawJob) {
    if (!rawJob) return null;

    const details = rawJob.details || {};
    const jobAd = details.jobAd || {};
    
    // Combine description, qualifications, and additional info into standard format
    const companyDesc = jobAd.companyDescription || '';
    const jobDesc = jobAd.jobDescription || '';
    const qualifications = jobAd.qualifications || '';
    const additionalInfo = jobAd.additionalInformation || '';
    
    const combinedDescription = [
      companyDesc ? `### Company Description\n${companyDesc}` : '',
      jobDesc ? `### Job Description\n${jobDesc}` : '',
      qualifications ? `### Qualifications\n${qualifications}` : '',
      additionalInfo ? `### Additional Info\n${additionalInfo}` : ''
    ].filter(Boolean).join('\n\n');

    const cleanDesc = this.cleanDescription(combinedDescription);
    const requirements = this.extractBulletPoints(qualifications || cleanDesc);
    const responsibilities = this.extractBulletPoints(jobDesc || cleanDesc);

    // Extract location fields
    const loc = rawJob.location || {};
    const locationString = [loc.city, loc.region, loc.country].filter(Boolean).join(', ');

    return {
      platform: 'smartrecruiters',
      externalJobId: this.generateExternalJobId(rawJob),
      title: rawJob.name || rawJob.title,
      company: rawJob.companyDisplayName || 'Confidential',
      location: locationString || 'Remote',
      description: cleanDesc,
      requirements: requirements.length > 0 ? requirements : this.extractRequirements(cleanDesc),
      responsibilities: responsibilities.length > 0 ? responsibilities : this.extractResponsibilities(cleanDesc),
      salary: null,
      salaryMin: null,
      salaryMax: null,
      employmentType: this.normalizeEmploymentType(details.typeOfEmployment?.label || details.typeOfEmployment?.id),
      experienceLevel: this.normalizeExperienceLevel(details.experienceLevel?.label || rawJob.name),
      workType: this.inferWorkType(rawJob, cleanDesc),
      jobUrl: `https://careers.smartrecruiters.com/${rawJob.companyId || 'company'}/${rawJob.id}`,
      postedDate: this.parseDate(rawJob.releasedDate),
      source: 'SmartRecruiters',
      raw: rawJob
    };
  }

  /**
   * Clean HTML tags
   */
  cleanDescription(html) {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, '\n').replace(/&nbsp;/g, ' ')
      .replace(/&/g, '&').replace(/</g, '<').replace(/>/g, '>')
      .replace(/\n{3,}/g, '\n\n').trim();
  }

  /**
   * Extract bullet points from HTML content (used for qualifications/responsibilities)
   */
  extractBulletPoints(html) {
    if (!html) return [];
    
    // Look for lists like <li>...</li>
    const matches = html.match(/<li>(.*?)<\/li>/gi);
    if (matches && matches.length > 0) {
      return matches.map(m => this.cleanDescription(m).trim()).filter(line => line.length > 5);
    }
    
    return [];
  }

  extractRequirements(description) {
    if (!description) return [];
    const lines = description.split('\n');
    const requirements = [];
    const keywords = ['require', 'must have', 'should have', 'need', 'qualif', 
                      'experience', 'skill', 'knowledge', 'proficient', 'years of'];
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
    const keywords = ['responsib', 'you will', 'your role', 'duties', 'tasks', 
                      'will be', 'expected to', 'accountable'];
    for (const line of lines) {
      const lowerLine = line.toLowerCase().trim();
      if (keywords.some(kw => lowerLine.includes(kw)) && line.length > 10 && line.length < 500) {
        responsibilities.push(line.replace(/^[-*•]\s*/, '').trim());
      }
    }
    return responsibilities.slice(0, 10);
  }

  inferWorkType(rawJob, description) {
    const descLower = description.toLowerCase();
    if (descLower.includes('remote') || descLower.includes('work from home') || 
        descLower.includes('wfh')) {
      return 'remote';
    }
    if (descLower.includes('hybrid')) return 'hybrid';
    return 'on-site';
  }
}

export default SmartRecruitersProvider;
