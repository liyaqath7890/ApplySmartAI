import { BaseATSProvider } from './BaseATSProvider.js';
import logger from '../../../utils/logger.js';

/**
 * Stub provider for iCIMS
 * This is a placeholder for future implementation.
 */
export class iCIMSProvider extends BaseATSProvider {
  constructor(config = {}) {
    super(config);
  }

  getPlatformName() {
    return 'icims';
  }

  isConfigured() {
    return false; // Stub
  }

  async fetchCompanyJobs(company, options = {}) {
    logger.info(`[iCIMSProvider] Fetching jobs for company ${company.name} - NOT IMPLEMENTED`);
    return [];
  }

  normalizeJob(rawJob) {
    throw new Error('Not implemented');
  }
}

export default iCIMSProvider;
