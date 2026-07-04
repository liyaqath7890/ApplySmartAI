import { BaseATSProvider } from './BaseATSProvider.js';
import logger from '../../../utils/logger.js';

/**
 * Stub provider for Teamtailor
 * This is a placeholder for future implementation.
 */
export class TeamtailorProvider extends BaseATSProvider {
  constructor(config = {}) {
    super(config);
  }

  getPlatformName() {
    return 'teamtailor';
  }

  isConfigured() {
    return false; // Stub
  }

  async fetchCompanyJobs(company, options = {}) {
    logger.info(`[TeamtailorProvider] Fetching jobs for company ${company.name} - NOT IMPLEMENTED`);
    return [];
  }

  normalizeJob(rawJob) {
    throw new Error('Not implemented');
  }
}

export default TeamtailorProvider;
