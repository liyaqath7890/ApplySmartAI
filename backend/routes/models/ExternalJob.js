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
    type: DataTypes.ENUM(
      // Original platforms
      'linkedin', 'naukri', 'foundit', 'wellfound', 'instahyre', 'indeed', 'cutshort', 'hirist',
      // New aggregation platforms
      'adzuna', 'jsearch', 'arbeitnow', 'remoteok', 'remotive', 'usajobs',
      'greenhouse', 'lever', 'ashby', 'rss', 'company-career'
    ),
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
    type: DataTypes.ENUM('full-time', 'part-time', 'contract', 'internship', 'freelance'),
    allowNull: true
  },
  experienceLevel: {
    type: DataTypes.ENUM('entry', 'mid', 'senior', 'lead', 'executive'),
    allowNull: true
  },
  workType: {
    type: DataTypes.ENUM('remote', 'hybrid', 'on-site'),
    allowNull: true
  },
  jobUrl: {
    type: DataTypes.STRING,
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
    { unique: true, fields: ['platform', 'external_job_id'] }
  ]
});

export default ExternalJob;
