import { BaseATSProvider } from './BaseATSProvider.js';
import logger from '../../../utils/logger.js';

/**
 * Stub provider for Apna
 * This is a placeholder for future implementation.
 */
export class ApnaProvider extends BaseATSProvider {
  constructor(config = {}) {
    super(config);
  }

  getPlatformName() {
    return 'apna';
  }

  isConfigured() {
    return false; // Stub
  }

  async fetchCompanyJobs(company, options = {}) {
    logger.info(`[ApnaProvider] Fetching jobs for company ${company.name} - NOT IMPLEMENTED`);
    return [];
  }

  normalizeJob(rawJob) {
    throw new Error('Not implemented');
  }
}

export default ApnaProvider;
