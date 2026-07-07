import { jest } from '@jest/globals';
import CompanyDiscoveryEngine from '../services/jobAggregation/CompanyDiscoveryEngine.js';
import RecommendationEngineV2 from '../services/RecommendationEngineV2.js';

// Mock models
jest.unstable_mockModule('../routes/models/index.js', () => ({
  Company: {
    findOne: jest.fn(),
    create: jest.fn()
  },
  User: {
    findByPk: jest.fn()
  },
  CandidateProfile: {
    findOne: jest.fn()
  }
}));

describe('CompanyDiscoveryEngine Unit Tests', () => {
  it('should correctly detect Greenhouse boards URL and company ID', () => {
    const url = 'https://boards.greenhouse.io/spacex/jobs/12345';
    const detection = CompanyDiscoveryEngine.detectATS(url);
    expect(detection).not.toBeNull();
    expect(detection?.platform).toBe('greenhouse');
    expect(detection?.companyId).toBe('spacex');
  });

  it('should correctly detect Lever jobs URL and company ID', () => {
    const url = 'https://lever.co/netflix/67890/apply';
    const detection = CompanyDiscoveryEngine.detectATS(url);
    expect(detection).not.toBeNull();
    expect(detection?.platform).toBe('lever');
    expect(detection?.companyId).toBe('netflix');
  });

  it('should return null for unrecognized URL structures', () => {
    const url = 'https://example.com/careers';
    const detection = CompanyDiscoveryEngine.detectATS(url);
    expect(detection).toBeNull();
  });
});

describe('RecommendationEngineV2 Unit Tests', () => {
  const dummyCandidate = {
    id: 1,
    candidateProfile: {
      preferredCities: ['San Francisco'],
      preferredCountries: ['United States'],
      remoteAvailability: 'remote',
      expectedSalaryMin: 120000
    },
    skills: [
      { name: 'JavaScript' },
      { name: 'Node.js' },
      { name: 'React' }
    ],
    workExperience: [],
    education: [],
    certifications: [],
    careerRoadmaps: []
  };

  const dummyJob = {
    title: 'Senior Node.js Developer',
    description: 'Looking for a Senior Developer with Node.js and React skills.',
    location: 'San Francisco, CA, United States',
    workType: 'remote',
    salaryMin: 130000,
    skills: ['Node.js', 'React']
  };

  it('should compute high match scores when skills and preferences align', async () => {
    const evaluation = await RecommendationEngineV2.evaluate(dummyCandidate, dummyJob);
    expect(evaluation.matchPercentage).toBeGreaterThanOrEqual(80);
    expect(evaluation.interviewProbability).toBeGreaterThan(60);
    expect(evaluation.atsSuccessProbability).toBeGreaterThan(70);
  });
});
