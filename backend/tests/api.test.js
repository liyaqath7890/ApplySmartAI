import { jest } from '@jest/globals';
import request from 'supertest';
import jwt from 'jsonwebtoken';

// 1. Setup ESM Mocks with explicit return blocks
jest.unstable_mockModule('ioredis', () => {
  return {
    default: jest.fn().mockImplementation(() => {
      return {
        on: jest.fn(),
        connect: jest.fn().mockResolvedValue('OK'),
        ping: jest.fn().mockResolvedValue('PONG'),
        quit: jest.fn().mockResolvedValue('OK'),
      };
    })
  };
});

jest.unstable_mockModule('bullmq', () => {
  return {
    Queue: jest.fn().mockImplementation(() => {
      return {
        add: jest.fn().mockResolvedValue({ id: 'mock-job-id' }),
        on: jest.fn(),
      };
    }),
    Worker: jest.fn().mockImplementation(() => {
      return {
        on: jest.fn(),
      };
    }),
    QueueEvents: jest.fn().mockImplementation(() => {
      return {
        on: jest.fn(),
      };
    }),
  };
});

jest.unstable_mockModule('nodemailer', () => {
  return {
    default: {
      createTransport: jest.fn().mockReturnValue({
        sendMail: jest.fn().mockResolvedValue({ messageId: 'mock-email-id' }),
        verify: jest.fn().mockResolvedValue(true)
      })
    }
  };
});

jest.unstable_mockModule('openai', () => {
  return {
    default: jest.fn().mockImplementation(() => {
      return {
        chat: {
          completions: {
            create: jest.fn().mockResolvedValue({
              choices: [{
                message: {
                  content: JSON.stringify({
                    title: 'Staff Engineer',
                    company: 'Vercel',
                    matchPercentage: 88,
                    atsScore: 92,
                    missingSkills: ['Go'],
                    strengths: ['Expert Next.js developer'],
                    resumeSuggestions: 'Emphasize ISR details.',
                    coverLetterSuggestions: 'Mention edge functions.',
                    skillGapAnalysis: ['Learn Go', 'Rust basics'],
                    salary: '$180,000'
                  })
                }
              }]
            })
          }
        }
      };
    })
  };
});

// Mock Database Models
const mockUser = {
  id: 'd3b07384-d113-4e4e-9d29-cb6cb1f9c3ff',
  email: 'candidate@test.com',
  password: 'hashedpassword',
  role: 'candidate',
  save: jest.fn().mockResolvedValue(true)
};
const mockCandidateProfile = {
  id: 'c4b07384-d113-4e4e-9d29-cb6cb1f9c3ff',
  candidateId: 'd3b07384-d113-4e4e-9d29-cb6cb1f9c3ff',
  skills: ['Node.js', 'React'],
  experience: [],
};
const mockApplication = {
  id: 'a1b07384-d113-4e4e-9d29-cb6cb1f9c3ff',
  status: 'imported',
  jobId: 'j1b07384-d113-4e4e-9d29-cb6cb1f9c3ff',
  save: jest.fn().mockResolvedValue(true)
};
const mockJob = {
  id: 'j1b07384-d113-4e4e-9d29-cb6cb1f9c3ff',
  title: 'Staff Engineer',
  company: 'Vercel',
};
const mockCompany = {
  id: 'com123',
  name: 'Vercel'
};

const genericMockModel = {
  findOne: jest.fn().mockResolvedValue(null),
  findAll: jest.fn().mockResolvedValue([]),
  create: jest.fn().mockResolvedValue({}),
  update: jest.fn().mockResolvedValue([1]),
  destroy: jest.fn().mockResolvedValue(1),
  findByPk: jest.fn().mockResolvedValue(null)
};

jest.unstable_mockModule('../routes/models/index.js', () => {
  return {
    User: {
      findOne: jest.fn().mockResolvedValue(mockUser),
      create: jest.fn().mockResolvedValue(mockUser),
      findByPk: jest.fn().mockResolvedValue(mockUser),
    },
    CandidateProfile: {
      findOne: jest.fn().mockResolvedValue(mockCandidateProfile),
      create: jest.fn().mockResolvedValue(mockCandidateProfile),
    },
    Application: {
      create: jest.fn().mockResolvedValue(mockApplication),
      findOne: jest.fn().mockResolvedValue(mockApplication),
      findAll: jest.fn().mockResolvedValue([mockApplication]),
    },
    ExternalJob: {
      create: jest.fn().mockResolvedValue(mockJob),
      findOne: jest.fn().mockResolvedValue(null),
      findAll: jest.fn().mockResolvedValue([mockJob]),
    },
    Job: {
      create: jest.fn().mockResolvedValue(mockJob),
      findOne: jest.fn().mockResolvedValue(mockJob),
      findByPk: jest.fn().mockResolvedValue(mockJob),
      findAll: jest.fn().mockResolvedValue([mockJob]),
    },
    Company: {
      findOne: jest.fn().mockResolvedValue(mockCompany),
      create: jest.fn().mockResolvedValue(mockCompany),
    },
    SavedCompany: {
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({}),
    },
    Skill: {
      findAll: jest.fn().mockResolvedValue([]),
    },
    RecruiterProfile: genericMockModel,
    CandidateSkills: genericMockModel,
    JobSkills: genericMockModel,
    Resume: genericMockModel,
    Interview: genericMockModel,
    ResumeTemplate: genericMockModel,
    ResumeVersion: genericMockModel,
    CoverLetter: genericMockModel,
    InterviewSession: genericMockModel,
    InterviewQuestion: genericMockModel,
    SkillGap: genericMockModel,
    LearningPath: genericMockModel,
    LearningStep: genericMockModel,
    CareerRoadmap: genericMockModel,
    CareerMilestone: genericMockModel,
    JobEmbedding: genericMockModel,
    ResumeEmbedding: genericMockModel,
    AutonomousAgent: genericMockModel,
    AgentActivity: genericMockModel,
    AgentTask: genericMockModel,
    Portfolio: genericMockModel,
    PortfolioProject: genericMockModel,
    PersonalBrand: genericMockModel,
    Subscription: genericMockModel,
    Plan: genericMockModel,
    Conversation: genericMockModel,
    ConversationParticipant: genericMockModel,
    Message: genericMockModel,
    Notification: genericMockModel,
    Analytics: genericMockModel,
    Certification: genericMockModel,
    WorkExperience: genericMockModel,
    Education: genericMockModel,
    JobPlatformCredential: genericMockModel,
    CareerTwin: genericMockModel,
    Recruiter: genericMockModel,
    RecruiterInteraction: genericMockModel,
    InterviewPreparation: genericMockModel,
    JobPrediction: genericMockModel,
    AgentMemory: genericMockModel,
    CandidateIntelligenceProfile: genericMockModel,
    ResumeVersionV2: genericMockModel,
    JobAnalysisV2: genericMockModel,
    InterviewPrepV2: genericMockModel,
    ApplicationPackage: genericMockModel,
    
    sequelize: {
      authenticate: jest.fn().mockResolvedValue(true),
      sync: jest.fn().mockResolvedValue(true),
      query: jest.fn().mockResolvedValue([]),
    },
    sequelizeInstance: {
      authenticate: jest.fn().mockResolvedValue(true),
      sync: jest.fn().mockResolvedValue(true),
      query: jest.fn().mockResolvedValue([]),
    },
    default: {
      authenticate: jest.fn().mockResolvedValue(true),
      sync: jest.fn().mockResolvedValue(true),
    }
  };
});

let app;
let testToken;

beforeAll(async () => {
  const serverModule = await import('../../src/server.js');
  app = serverModule.app;

  testToken = jwt.sign(
    { id: mockUser.id, role: mockUser.role },
    process.env.JWT_SECRET || 'secret-key-12345',
    { expiresIn: '1h' }
  );
});

describe('Backend API Endpoints Integration Tests', () => {
  it('GET /api/health/live should return server status', async () => {
    const res = await request(app).get('/api/health/live');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('POST /api/auth/login with valid inputs should return user details', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'candidate@test.com', password: 'password123' });
    
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
  });

  it('POST /api/jobs/import should succeed with authorized token', async () => {
    const res = await request(app)
      .post('/api/jobs/import')
      .set('Authorization', `Bearer ${testToken}`)
      .send({ jobUrl: 'https://jobs.lever.co/vercel/staff-engineer' });
    
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
  });

  it('GET /api/applications/pipeline should return list of columns', async () => {
    const res = await request(app)
      .get('/api/applications/pipeline')
      .set('Authorization', `Bearer ${testToken}`);
    
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
  });

  it('POST /api/applications/save should store job into wishlist', async () => {
    const res = await request(app)
      .post('/api/applications/save')
      .set('Authorization', `Bearer ${testToken}`)
      .send({ jobId: 'j1b07384-d113-4e4e-9d29-cb6cb1f9c3ff' });
    
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
