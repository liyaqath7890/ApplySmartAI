import { BaseJobProvider } from './BaseProvider.js';

/**
 * BaseATSProvider
 *
 * A formal interface extension of BaseJobProvider for ATS (Applicant Tracking System)
 * connectors that pull jobs from company career pages.
 *
 * All ATS adapters (Greenhouse, Lever, Ashby, Workday, etc.) MUST extend this class.
 * New providers can be added without modifying any existing business logic.
 *
 * Standard ATS providers:
 *  - Greenhouse    (greenhouse)
 *  - Lever         (lever)
 *  - Ashby         (ashby)
 *  - Workday       (workday)       — future
 *  - Oracle/Taleo  (oracle)        — future
 *  - SAP SuccessFactors (sap)      — future
 *  - iCIMS         (icims)         — future
 *  - SmartRecruiters (smartrecruiters) — future
 */
export class BaseATSProvider extends BaseJobProvider {
  constructor(config = {}) {
    super(config);
    this.providerType = 'ats';
  }

  /**
   * Fetch jobs for a specific Company database record.
   * Must be implemented by all ATS provider subclasses.
   *
   * @param {Object} company  - Company Sequelize model instance
   * @param {Object} options  - Fetch options (page, limit, keyword, forceRefresh)
   * @returns {Promise<Object[]>} Array of raw job objects from the ATS API
   */
  async fetchCompanyJobs(company, options = {}) {
    throw new Error(`fetchCompanyJobs() must be implemented by ${this.constructor.name}`);
  }

  /**
   * Test connectivity to the ATS for a given company.
   * Should return { ok: boolean, message: string, jobCount?: number }
   *
   * @param {Object} company - Company Sequelize model instance
   * @returns {Promise<Object>}
   */
  async testConnection(company) {
    try {
      const jobs = await this.fetchCompanyJobs(company, { limit: 1 });
      return { ok: true, message: 'Connected successfully', jobCount: jobs.length };
    } catch (err) {
      return { ok: false, message: err.message };
    }
  }

  /**
   * Get platform type identifier.
   * Overrides BaseJobProvider to always return 'ats'.
   */
  getProviderType() {
    return 'ats';
  }

  /**
   * Get a standardized job source label for this ATS.
   * Subclasses should override if they want a custom display name.
   */
  getSourceLabel() {
    return this.getPlatformName();
  }
}

export default BaseATSProvider;
