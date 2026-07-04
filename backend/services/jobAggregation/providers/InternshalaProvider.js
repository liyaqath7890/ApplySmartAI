import { BaseATSProvider } from './BaseATSProvider.js';
import logger from '../../../utils/logger.js';

/**
 * Stub provider for Internshala
 * This is a placeholder for future implementation.
 */
export class InternshalaProvider extends BaseATSProvider {
  constructor(config = {}) {
    super(config);
  }

  getPlatformName() {
    return 'internshala';
  }

  isConfigured() {
    return false; // Stub
  }

  async fetchCompanyJobs(company, options = {}) {
    logger.info(`[InternshalaProvider] Fetching jobs for company ${company.name} - NOT IMPLEMENTED`);
    return [];
  }

  normalizeJob(rawJob) {
    throw new Error('Not implemented');
  }
}

export default InternshalaProvider;
