import { jest } from '@jest/globals';
import { JobImportService } from '../services/JobImportService.js';

// Mock models and openAiService
jest.unstable_mockModule('../routes/models/index.js', () => ({
  ExternalJob: {
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn()
  },
  Company: {
    findOne: jest.fn(),
    create: jest.fn()
  },
  Application: {
    create: jest.fn(),
    findOne: jest.fn()
  }
}));

jest.unstable_mockModule('../services/openAiService.js', () => ({
  generateAIResponse: jest.fn().mockResolvedValue(JSON.stringify({
    title: 'Software Engineer',
    company: 'Acme Corp',
    location: 'Remote',
    description: 'A great engineering role',
    requirements: ['React', 'Node.js'],
    responsibilities: ['Build features', 'Deploy code'],
    salary: '$120,000'
  }))
}));

describe('JobImportService ATS and URL Detection', () => {
  let service;

  beforeEach(() => {
    service = new JobImportService();
  });

  it('should identify Greenhouse platform from job posting URLs', () => {
    const url = 'https://boards.greenhouse.io/acme/jobs/4827103';
    const result = service.detectPlatform(url);
    expect(result).toBe('greenhouse');
  });

  it('should identify Lever platform from job posting URLs', () => {
    const url = 'https://jobs.lever.co/google/d4b29f7e-128f-4cb1-80a1-8cb5d6e2467d';
    const result = service.detectPlatform(url);
    expect(result).toBe('lever');
  });

  it('should fall back to generic platform for other domains', () => {
    const url = 'https://careers.netflix.com/jobs/8391740';
    const result = service.detectPlatform(url);
    expect(result).toBe('generic');
  });
});
