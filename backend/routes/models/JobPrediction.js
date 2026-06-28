import { DataTypes } from 'sequelize';
import sequelize from '../../config/database.js';

const JobPrediction = sequelize.define('JobPrediction', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  candidateId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'User',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  jobId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Job',
      key: 'id'
    },
    onDelete: 'SET NULL'
  },
  externalJobId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'ExternalJob',
      key: 'id'
    },
    onDelete: 'SET NULL'
  },
  matchScore: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    min: 0,
    max: 100
  },
  interviewProbability: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0
  },
  recruiterResponseProbability: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0
  },
  offerProbability: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0
  },
  explanation: {
    type: DataTypes.JSONB,
    defaultValue: {
      strengths: [],
      weaknesses: [],
      recommendations: []
    }
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

export default JobPrediction;
