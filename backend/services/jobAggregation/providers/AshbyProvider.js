import { BaseJobProvider } from './BaseProvider.js';

/**
 * Ashby Career Page Adapter
 * Scrapes jobs from company career pages powered by Ashby
 * Documentation: https://ashbyhq.com/
 */
export class AshbyProvider extends BaseJobProvider {
  constructor(adapterConfig = {}) {
    super(adapterConfig);
    this.baseUrl = adapterConfig.baseUrl || 'https://jobs.ashbyhq.com';
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
          const url = `${this.baseUrl}/${companyId}/api`;
          
          const data = await this.requestWithRetry(url, {
            method: 'GET'
          });

          if (data && data.jobPostings) {
            const companyJobs = data.jobPostings.map(job => ({
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
   * Fetch jobs from a specific company's Ashby board
   */
  async fetchCompanyJobs(companyId, searchParams = {}) {
    try {
      const url = `${this.baseUrl}/${companyId}/api`;
      
      const data = await this.requestWithRetry(url, {
        method: 'GET'
      });

      if (data && data.jobPostings) {
        return data.jobPostings.map(job => ({
          ...job,
          companyName: companyId,
          companyDisplayName: data.organization?.name || companyId
        }));
      }

      return [];
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

    const description = rawJob.description || '';
    const textContent = this.extractTextContent(description);

    return {
      platform: 'ashby',
      externalJobId: this.generateExternalJobId(rawJob),
      title: rawJob.title,
      company: rawJob.companyDisplayName || rawJob.companyName || 'Confidential',
      location: rawJob.locationName || rawJob.location || '',
      description: textContent,
      requirements: this.extractRequirements(textContent),
      responsibilities: this.extractResponsibilities(textContent),
      salary: null,
      salaryMin: null,
      salaryMax: null,
      employmentType: this.normalizeEmploymentType(rawJob.employmentType),
      experienceLevel: this.normalizeExperienceLevel(rawJob.title),
      workType: this.inferWorkType(rawJob, textContent),
      jobUrl: rawJob.url || `https://jobs.ashbyhq.com/${rawJob.companyName}/${rawJob.id}`,
      postedDate: this.parseDate(rawJob.postedAt || rawJob.created_at),
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