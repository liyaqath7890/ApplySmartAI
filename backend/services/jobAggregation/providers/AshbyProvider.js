import { BaseATSProvider } from './BaseATSProvider.js';

/**
 * Ashby Career Page Adapter
 * Scrapes jobs from company career pages powered by Ashby
 * Documentation: https://ashbyhq.com/
 */
export class AshbyProvider extends BaseATSProvider {
  constructor(adapterConfig = {}) {
    super(adapterConfig);
    // Public posting API — no auth required
    this.baseUrl = adapterConfig.baseUrl || 'https://api.ashbyhq.com/posting-api/job-board';
  }

  /**
   * Check if provider is configured
   */
  isConfigured() {
    return true; // Public API for job listings
  }

  /**
   * Fetch jobs from Ashby API
   */
  async fetchJobs(searchParams = {}) {
    try {
      const {
        companyIds = [],
        keyword = ''
      } = searchParams;

      // Default to some well-known tech companies using Ashby
      const defaultCompanies = [
        'linear', 'vercel', 'supabase', 'clerk', 'resend', 
        'calcom', 'tremor', 'hanko', 'polar', 'polar-sh'
      ];
      
      const companies = companyIds.length > 0 ? companyIds : defaultCompanies;
      const allJobs = [];

      for (const companyId of companies) {
        try {
          const url = `${this.baseUrl}/${companyId}`;
          
          const data = await this.requestWithRetry(url, {
            method: 'GET'
          });

          // Ashby posting-api returns { jobs: [...] }
          const listings = data?.jobs || data?.jobPostings || [];
          if (listings.length > 0) {
            const companyJobs = listings.map(job => ({
              ...job,
              companyName: companyId,
              companyDisplayName: data.organization?.name || companyId
            }));
            allJobs.push(...companyJobs);
            this.log(`Fetched ${companyJobs.length} jobs from ${companyId}`);
          }
        } catch (error) {
          this.log(`Error fetching jobs from ${companyId}: ${error.message}`, 'warn');
        }
      }

      return allJobs;
    } catch (error) {
      this.log(`Error fetching jobs from Ashby: ${error.message}`, 'error');
      return [];
    }
  }

  /**
   * Fetch jobs for a Company model instance (DB-driven, implements BaseATSProvider interface)
   */
  async fetchCompanyJobs(company, options = {}) {
    const companyId = company.externalCompanyId || company.name?.toLowerCase().replace(/\s+/g, '-');
    try {
      const url = `${this.baseUrl}/${companyId}`;
      
      const data = await this.requestWithRetry(url, {
        method: 'GET'
      });

      // Ashby posting-api returns { jobs: [...] }
      const listings = data?.jobs || data?.jobPostings || [];
      this.log(`Ashby ${companyId}: ${listings.length} jobs returned`);

      return listings.map(job => ({
        ...job,
        companyName: companyId,
        companyDisplayName: data?.organization?.name || company.name
      }));
    } catch (error) {
      this.log(`Error fetching jobs from ${companyId}: ${error.message}`, 'error');
      return [];
    }
  }

  /**
   * Normalize a raw Ashby job to standard format
   */
  normalizeJob(rawJob) {
    if (!rawJob) return null;

    // Ashby posting-api uses descriptionHtml / descriptionPlain
    const htmlDesc = rawJob.descriptionHtml || rawJob.description || '';
    const textContent = rawJob.descriptionPlain 
      ? rawJob.descriptionPlain 
      : this.extractTextContent(htmlDesc);

    // Work type: Ashby uses workplaceType = "Remote"|"Hybrid"|"OnSite" and isRemote boolean
    let workType = 'on-site';
    const wt = rawJob.workplaceType || '';
    if (rawJob.isRemote || wt === 'Remote') workType = 'remote';
    else if (wt === 'Hybrid') workType = 'hybrid';

    return {
      platform: 'ashby',
      externalJobId: this.generateExternalJobId(rawJob),
      title: rawJob.title,
      company: rawJob.companyDisplayName || rawJob.companyName || 'Confidential',
      // Ashby posting-api has location as a string field
      location: rawJob.location || rawJob.locationName || (rawJob.address?.postalAddress?.addressCountry) || '',
      description: textContent,
      requirements: this.extractRequirements(textContent),
      responsibilities: this.extractResponsibilities(textContent),
      salary: null,
      salaryMin: null,
      salaryMax: null,
      employmentType: this.normalizeEmploymentType(rawJob.employmentType),
      experienceLevel: this.normalizeExperienceLevel(rawJob.title),
      workType,
      // Ashby posting-api returns jobUrl directly
      jobUrl: rawJob.jobUrl || rawJob.url || rawJob.applyUrl || `https://jobs.ashbyhq.com/${rawJob.companyName}/${rawJob.id}`,
      postedDate: this.parseDate(rawJob.publishedAt || rawJob.postedAt || rawJob.created_at),
      source: 'Ashby',
      raw: rawJob
    };
  }

  /**
   * Extract text content from HTML description
   */
  extractTextContent(html) {
    if (!html) return '';
    
    if (!html.includes('<')) return html;
    
    return html
      .replace(/<[^>]*>/g, '\n')
      .replace(/&nbsp;/g, ' ')
      .replace(/&/g, '&')
      .replace(/</g, '<')
      .replace(/>/g, '>')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  /**
   * Extract requirements from description
   */
  extractRequirements(description) {
    if (!description) return [];
    
    const lines = description.split('\n');
    const requirements = [];
    const keywords = ['require', 'must have', 'should have', 'need', 'qualif', 
                      'experience', 'skill', 'knowledge', 'proficient', 'years of',
                      'expertise', 'familiarity', 'background in'];
    
    for (const line of lines) {
      const lowerLine = line.toLowerCase().trim();
      if (keywords.some(kw => lowerLine.includes(kw)) && line.length > 10 && line.length < 500) {
        requirements.push(line.replace(/^[-*•]\s*/, '').trim());
      }
    }
    
    return requirements.slice(0, 10);
  }

  /**
   * Extract responsibilities from description
   */
  extractResponsibilities(description) {
    if (!description) return [];
    
    const lines = description.split('\n');
    const responsibilities = [];
    const keywords = ['responsib', 'you will', 'your role', 'duties', 'tasks', 
                      'will be', 'expected to', 'accountable', "you'll", 
                      'about the role', 'what you will do'];
    
    for (const line of lines) {
      const lowerLine = line.toLowerCase().trim();
      if (keywords.some(kw => lowerLine.includes(kw)) && line.length > 10 && line.length < 500) {
        responsibilities.push(line.replace(/^[-*•]\s*/, '').trim());
      }
    }
    
    return responsibilities.slice(0, 10);
  }

  /**
   * Infer work type from job data
   */
  inferWorkType(rawJob, description) {
    const descLower = description.toLowerCase();
    if (descLower.includes('remote') || descLower.includes('work from home') || 
        descLower.includes('wfh') || descLower.includes('distributed')) {
      return 'remote';
    }
    if (descLower.includes('hybrid')) return 'hybrid';
    if (descLower.includes('on-site') || descLower.includes('office')) return 'on-site';
    return null;
  }
}

export default AshbyProvider;