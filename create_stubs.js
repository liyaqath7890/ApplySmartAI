import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const providers = [
  { name: 'WorkdayProvider', platform: 'workday' },
  { name: 'SmartRecruitersProvider', platform: 'smartrecruiters' },
  { name: 'TeamtailorProvider', platform: 'teamtailor' },
  { name: 'OracleProvider', platform: 'oracle' },
  { name: 'SAPSuccessFactorsProvider', platform: 'sap' },
  { name: 'DarwinboxProvider', platform: 'darwinbox' },
  { name: 'iCIMSProvider', platform: 'icims' },
  { name: 'TaleoProvider', platform: 'taleo' },
  { name: 'InternshalaProvider', platform: 'internshala' },
  { name: 'NaukriProvider', platform: 'naukri' },
  { name: 'FounditProvider', platform: 'foundit' },
  { name: 'ApnaProvider', platform: 'apna' },
  { name: 'GlassdoorProvider', platform: 'glassdoor' }
];

const template = (name, platform) => `import { BaseATSProvider } from './BaseATSProvider.js';
import logger from '../../../utils/logger.js';

/**
 * Stub provider for ${name.replace('Provider', '')}
 * This is a placeholder for future implementation.
 */
export class ${name} extends BaseATSProvider {
  constructor(config = {}) {
    super(config);
  }

  getPlatformName() {
    return '${platform}';
  }

  isConfigured() {
    return false; // Stub
  }

  async fetchCompanyJobs(company, options = {}) {
    logger.info(\`[${name}] Fetching jobs for company \${company.name} - NOT IMPLEMENTED\`);
    return [];
  }

  normalizeJob(rawJob) {
    throw new Error('Not implemented');
  }
}

export default ${name};
`;

const providersDir = path.join(__dirname, 'backend', 'services', 'jobAggregation', 'providers');

providers.forEach(p => {
  const filePath = path.join(providersDir, p.name + '.js');
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, template(p.name, p.platform));
    console.log("Created " + p.name + ".js");
  }
});
