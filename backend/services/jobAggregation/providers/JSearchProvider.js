import { BaseJobProvider } from './BaseProvider.js';
import logger from '../../../utils/logger.js';

/**
 * JSearch (RapidAPI) Provider
 * Documentation: https://rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch
 */
export class JSearchProvider extends BaseJobProvider {
  constructor(adapterConfig = {}) {
    super(adapterConfig);
    this.apiKey = adapterConfig.apiKey || process.env.RAPIDAPI_KEY;
    this.apiHost = adapterConfig.apiHost || 'jsearch.p.rapidapi.com';
    this.baseUrl = adapterConfig.baseUrl || 'https://jsearch.p.rapidapi.com';
  }

  /**
   * Check if provider is configured
   */
  isConfigured() {
    return this.apiKey;
  }

  /**
   * Fetch jobs from JSearch API
   */
  async fetchJobs(searchParams = {}) {
    if (!this.isConfigured()) {
      this.log('JSearch API credentials not configured, skipping', 'warn');
      return [];
    }

    try {
      const {
        keyword = '',
        location = '',
        jobRequirements = '',
        employmentTypes = '',
        datePosted = 'week',
        page = 1,
        numPages = 1
      } = searchParams;

      const url = `${this.baseUrl}/search`;
      
      const params = {
        query: keyword || 'software engineer',
        location: location || 'United States',
        job_requirements: jobRequirements,
        employment_types: employmentTypes,
        date_posted: datePosted,
        page: page,
        num_pages: numPages,
        excluded_terms: 'visa sponsorship only',
        remote_jobs_only: searchParams.remoteOnly || false
      };

      // Remove empty params
      Object.keys(params).forEach(key => {
        if (!params[key] && params[key] !== 0 && params[key] !== false) delete params[key];
      });

      const data = await this.requestWithRetry(url, {
        method: 'GET',
        params,
        headers: {
          'X-RapidAPI-Key': this.apiKey,
          'X-RapidAPI-Host': this.apiHost
        }
      });

      if (data && data.status === 'OK' && data.data) {
        this.log(`Fetched ${data.data.length} jobs from JSearch`);
        return data.data;
      }

      return [];
    } catch (error) {
      this.log(`Error fetching jobs from JSearch: ${error.message}`, 'error');
      return [];
    }
  }

  /**
   * Normalize a raw JSearch job to standard format
   */
  normalizeJob(rawJob) {
    if (!rawJob) return null;

    const salaryData = rawJob.estimated_salary ? {
      min: rawJob.estimated_salary.min_salary,
      max: rawJob.estimated_salary.max_salary,
      currency: rawJob.estimated_salary.currency
    } : { min: null, max: null, currency: 'USD' };

    const description = this.combineDescription(rawJob);
    
    return {
      platform: 'jsearch',
      externalJobId: this.generateExternalJobId(rawJob),
      title: rawJob.job_title,
      company: rawJob.employer?.name || rawJob.company_name || 'Confidential',
      location: rawJob.job_country ? 
        `${rawJob.job_city || ''}, ${rawJob.job_state || ''}, ${rawJob.job_country}`.replace(/,\s*,/g, ',').replace(/^,\s*/, '') : 
        rawJob.job_location || '',
      description: description,
      requirements: this.extractRequirements(rawJob),
      responsibilities: this.extractResponsibilities(rawJob),
      salary: salaryData.min ? `${salaryData.currency} ${salaryData.min} - ${salaryData.currency} ${salaryData.max}` : null,
      salaryMin: salaryData.min,
      salaryMax: salaryData.max,
      employmentType: rawJob.job_employment_type ? 
        this.normalizeEmploymentType(rawJob.job_employment_type) : null,
      experienceLevel: rawJob.job_experience_required ? 
        this.normalizeExperienceLevel(rawJob.job_experience_required) : 
        this.normalizeExperienceLevel(rawJob.job_title),
      workType: rawJob.job_is_remote ? 'remote' : this.inferWorkType(rawJob, description),
      jobUrl: rawJob.job_apply_link || rawJob.job_publisher_url,
      postedDate: this.parseDate(rawJob.job_posted_at_datetime_utc || rawJob.job_posted_at_timestamp * 1000),
      source: 'JSearch',
      raw: rawJob
    };
  }

  /**
   * Combine job descriptions from various fields
   */
  combineDescription(rawJob) {
    const parts = [];
    
    if (rawJob.job_description) parts.push(rawJob.job_description);
    if (rawJob.job_highlights) {
      if (rawJob.job_highlights.Qualifications) {
        parts.push('Qualifications:\n' + rawJob.job_highlights.Qualifications.join('\n'));
      }
      if (rawJob.job_highlights.Responsibilities) {
        parts.push('Responsibilities:\n' + rawJob.job_highlights.Responsibilities.join('\n'));
      }
      if (rawJob.job_highlights.Benefits) {
        parts.push('Benefits:\n' + rawJob.job_highlights.Benefits.join('\n'));
      }
    }
    
    return parts.join('\n\n').trim();
  }

  /**
   * Extract requirements from job data
   */
  extractRequirements(rawJob) {
    const requirements = [];
    
    if (rawJob.job_highlights?.Qualifications) {
      requirements.push(...rawJob.job_highlights.Qualifications.slice(0, 10));
    }
    
    if (rawJob.job_required_skills) {
      requirements.push(...rawJob.job_required_skills.slice(0, 5));
    }
    
    if (rawJob.job_experience_required) {
      requirements.push(`Experience: ${rawJob.job_experience_required}`);
    }
    
    if (rawJob.job_required_education) {
      requirements.push(`Education: ${rawJob.job_required_education.postgraduate_degree || rawJob.job_required_education.bachelors_degree || rawJob.job_required_education.high_school}`);
    }
    
    return requirements.slice(0, 10);
  }

  /**
   * Extract responsibilities from job data
   */
  extractResponsibilities(rawJob) {
    const responsibilities = [];
    
    if (rawJob.job_highlights?.Responsibilities) {
      responsibilities.push(...rawJob.job_highlights.Responsibilities.slice(0, 10));
    }
    
    return responsibilities.slice(0, 10);
  }

  /**
   * Infer work type from job data
   */
  inferWorkType(rawJob, description) {
    if (rawJob.job_is_remote) return 'remote';
    
    const descLower = description.toLowerCase();
    if (descLower.includes('remote') || descLower.includes('work from home') || 
        descLower.includes('wfh')) {
      return 'remote';
    }
    
    if (descLower.includes('hybrid')) {
      return 'hybrid';
    }
    
    return null;
  }
}

export default JSearchProvider;