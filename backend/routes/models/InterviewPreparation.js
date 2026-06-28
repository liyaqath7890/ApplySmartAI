import { DataTypes } from 'sequelize';
import sequelize from '../../config/database.js';

const InterviewPreparation = sequelize.define('InterviewPreparation', {
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
  interviewId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Interview',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  companyResearch: {
    type: DataTypes.JSONB,
    defaultValue: {
      summary: '',
      mission: '',
      values: [],
      recentNews: [],
      products: []
    }
  },
  jobDescriptionAnalysis: {
    type: DataTypes.JSONB,
    defaultValue: {
      keyRequirements: [],
      responsibilities: [],
      keywords: []
    }
  },
  techStackResearch: {
    type: DataTypes.JSONB,
    defaultValue: {
      frontend: [],
      backend: [],
      databases: [],
      devops: []
    }
  },
  interviewQuestions: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  answerSuggestions: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  preparationRoadmap: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  readinessScore: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    min: 0,
    max: 100
  },
  status: {
    type: DataTypes.ENUM('not_started', 'in_progress', 'completed'),
    defaultValue: 'not_started'
  }
}, {
  underscored: true,
  indexes: [
    { fields: ['candidate_id'] },
    { fields: ['interview_id'] },
    { fields: ['status'] }
  ]
});

export default InterviewPreparation;
