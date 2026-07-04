import { BaseATSProvider } from './BaseATSProvider.js';
import logger from '../../../utils/logger.js';

/**
 * Stub provider for SAPSuccessFactors
 * This is a placeholder for future implementation.
 */
export class SAPSuccessFactorsProvider extends BaseATSProvider {
  constructor(config = {}) {
    super(config);
  }

  getPlatformName() {
    return 'sap';
  }

  isConfigured() {
    return false; // Stub
  }

  async fetchCompanyJobs(company, options = {}) {
    logger.info(`[SAPSuccessFactorsProvider] Fetching jobs for company ${company.name} - NOT IMPLEMENTED`);
    return [];
  }

  normalizeJob(rawJob) {
    throw new Error('Not implemented');
  }
}

export default SAPSuccessFactorsProvider;
