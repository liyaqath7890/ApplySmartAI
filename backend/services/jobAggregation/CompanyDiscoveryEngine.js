import { Company } from '../../routes/models/index.js';
import logger from '../../utils/logger.js';
import { Op } from 'sequelize';

/**
 * Company Discovery Engine
 * Automatically discovers, validates, and registers companies from job feeds
 */
export class CompanyDiscoveryEngine {
  constructor() {
    this.atsPatterns = [
      { pattern: /boards\.greenhouse\.io\/([^/\s?#]+)/i, platform: 'greenhouse' },
      { pattern: /lever\.co\/([^/\s?#]+)/i, platform: 'lever' },
      { pattern: /jobs\.ashbyhq\.com\/([^/\s?#]+)/i, platform: 'ashby' },
      { pattern: /smartrecruiters\.com\/([^/\s?#]+)/i, platform: 'smartrecruiters' },
      { pattern: /teamtailor\.com\/([^/\s?#]+)/i, platform: 'teamtailor' },
      { pattern: /myworkdayjobs\.com\/[^/\s?#]+\/([^/\s?#]+)/i, platform: 'workday' },
      { pattern: /apply\.workable\.com\/([^/\s?#]+)/i, platform: 'workable' },
      { pattern: /([^/\s?#]+)\.recruitee\.com/i, platform: 'recruitee' },
      { pattern: /([^/\s?#]+)\.bamboohr\.com/i, platform: 'bamboohr' },
      { pattern: /jobs\.jobvite\.com\/([^/\s?#]+)/i, platform: 'jobvite' },
      { pattern: /([^/\s?#]+)\.applytojob\.com/i, platform: 'jazzhr' },
      { pattern: /([^/\s?#]+)\.personio\.(de|com)/i, platform: 'personio' },
      { pattern: /([^/\s?#]+)\.breezy\.hr/i, platform: 'breezyhr' },
      { pattern: /fountain\.com\/([^/\s?#]+)/i, platform: 'fountain' },
      { pattern: /([^/\s?#]+)\.pinpointhq\.com/i, platform: 'pinpoint' },
      { pattern: /comeet\.co\/([^/\s?#]+)/i, platform: 'comeet' },
      { pattern: /recruit\.zoho\.com/i, platform: 'zohorecruit' },
      { pattern: /rippling\.com\/([^/\s?#]+)/i, platform: 'rippling' }
    ];
  }

  /**
   * Scan a job posting for ATS signatures and discover/register the company
   * @param {Object} jobData - Raw or normalized job data
   * @returns {Promise<Object|null>} Discovered and registered Company instance or null
   */
  async discoverCompanyFromJob(jobData) {
    if (!jobData || !jobData.company || !jobData.jobUrl) {
      return null;
    }

    const { company: rawName, jobUrl } = jobData;
    const cleanName = rawName.trim();

    // 1. Detect ATS signature from Job URL
    const detection = this.detectATS(jobUrl);
    if (!detection) {
      return null;
    }

    try {
      // 2. Prevent duplicate company registration
      let company = await Company.findOne({
        where: {
          [Op.or]: [
            { name: { [Op.iLike]: cleanName } },
            { 
              [Op.and]: [
                { atsPlatform: detection.platform },
                { externalCompanyId: detection.companyId }
              ]
            }
          ]
        }
      });

      if (company) {
        // Update ATS info if not set
        if (!company.atsPlatform || !company.externalCompanyId) {
          await company.update({
            atsPlatform: detection.platform,
            externalCompanyId: detection.companyId,
            hiringStatus: 'Actively Hiring'
          });
          logger.info(`[CompanyDiscoveryEngine] Updated existing company "${company.name}" with ATS "${detection.platform}"`);
        }
        return company;
      }

      // 3. Automatically register the company
      company = await Company.create({
        name: cleanName,
        atsPlatform: detection.platform,
        externalCompanyId: detection.companyId,
        careerPageUrl: jobUrl,
        activeStatus: true,
        verificationStatus: 'pending',
        hiringStatus: 'Actively Hiring',
        hiringLocations: jobData.location ? [jobData.location] : []
      });

      logger.info(`[CompanyDiscoveryEngine] Successfully registered discovered company: "${company.name}" using ATS: ${detection.platform}`);
      return company;
    } catch (err) {
      logger.error(`[CompanyDiscoveryEngine] Error registering discovered company ${cleanName}: ${err.message}`);
      return null;
    }
  }

  /**
   * Detect ATS platform and external ID from URL
   */
  detectATS(url) {
    if (!url) return null;
    
    for (const item of this.atsPatterns) {
      const match = url.match(item.pattern);
      if (match && match[1]) {
        return {
          platform: item.platform,
          companyId: match[1].toLowerCase()
        };
      }
    }
    return null;
  }
}

export default new CompanyDiscoveryEngine();
