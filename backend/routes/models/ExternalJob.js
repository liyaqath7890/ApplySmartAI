import { DataTypes } from 'sequelize';
import sequelize from '../../config/database.js';

const ExternalJob = sequelize.define('ExternalJob', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  candidateId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'User',
      key: 'id'
    },
    onDelete: 'SET NULL'
  },
  platform: {
    type: DataTypes.STRING,
    allowNull: false
  },
  externalJobId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  company: {
    type: DataTypes.STRING,
    allowNull: false
  },
  location: {
    type: DataTypes.STRING,
    allowNull: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  requirements: {
    type: DataTypes.ARRAY(DataTypes.TEXT),
    defaultValue: []
  },
  responsibilities: {
    type: DataTypes.ARRAY(DataTypes.TEXT),
    defaultValue: []
  },
  salary: {
    type: DataTypes.STRING,
    allowNull: true
  },
  salaryMin: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true
  },
  salaryMax: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true
  },
  employmentType: {
    type: DataTypes.STRING,
    allowNull: true
  },
  experienceLevel: {
    type: DataTypes.STRING,
    allowNull: true
  },
  workType: {
    type: DataTypes.STRING,
    allowNull: true
  },
  jobUrl: {
    type: DataTypes.STRING(1000),
    allowNull: false,
    validate: {
      isUrl: true
    }
  },
  postedDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  expiredDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  isExpired: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  matchScore: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    min: 0,
    max: 100
  },
  missingSkills: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  },
  aiAnalysis: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  freshnessScore: {
    type: DataTypes.INTEGER,
    defaultValue: 100,
    min: 0,
    max: 100
  },
  source: {
    type: DataTypes.STRING,
    allowNull: true
  },

  // Version 1.1 Metadata
  jobRole: {
    type: DataTypes.STRING,
    allowNull: true
  },
  department: {
    type: DataTypes.STRING,
    allowNull: true
  },
  skills: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  },
  experience: {
    type: DataTypes.STRING,
    allowNull: true
  },
  education: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  },
  city: {
    type: DataTypes.STRING,
    allowNull: true
  },
  state: {
    type: DataTypes.STRING,
    allowNull: true
  },
  country: {
    type: DataTypes.STRING,
    allowNull: true
  },
  fresherEligible: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  internship: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  applicationDeadline: {
    type: DataTypes.DATE,
    allowNull: true
  },
  lastUpdated: {
    type: DataTypes.DATE,
    allowNull: true
  },
  hiringStatus: {
    type: DataTypes.STRING,
    defaultValue: 'active'
  },
  numberOfVacancies: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  atsPlatform: {
    type: DataTypes.STRING,
    allowNull: true
  },
  companyId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Company',
      key: 'id'
    },
    onDelete: 'SET NULL'
  },
  originalJobUrl: {
    type: DataTypes.STRING(1000),
    allowNull: true
  }
}, {
  underscored: true,
  indexes: [
    { fields: ['candidate_id'] },
    { fields: ['platform'] },
    { fields: ['external_job_id'] },
    { fields: ['is_expired'] },
    { fields: ['match_score'] },
    { fields: ['posted_date'] },
    { fields: ['company_id'] },
    { fields: ['city', 'state', 'country'] },
    { fields: ['fresher_eligible'] },
    { fields: ['internship'] },
    { fields: ['ats_platform'] },
    { unique: true, fields: ['platform', 'external_job_id'] }
  ]
});

export default ExternalJob;
