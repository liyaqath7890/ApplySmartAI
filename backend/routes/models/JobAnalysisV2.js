import { DataTypes } from 'sequelize';
import sequelize from '../../config/database.js';

const JobAnalysisV2 = sequelize.define('JobAnalysisV2', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  candidateId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'User', key: 'id' },
    onDelete: 'CASCADE'
  },
  jobId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: { model: 'Job', key: 'id' },
    onDelete: 'SET NULL'
  },
  externalJobId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: { model: 'ExternalJob', key: 'id' },
    onDelete: 'SET NULL'
  },
  requiredSkills: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  preferredSkills: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  experienceRequirements: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  educationRequirements: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  responsibilities: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  atsKeywords: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  matchScore: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  missingSkills: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  interviewProbability: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0
  },
  recruiterResponseProbability: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0
  }
}, {
  underscored: true,
  indexes: [
    { fields: ['candidate_id'] },
    { fields: ['job_id'] },
    { fields: ['external_job_id'] },
    { fields: ['match_score'] }
  ]
});

export default JobAnalysisV2;
