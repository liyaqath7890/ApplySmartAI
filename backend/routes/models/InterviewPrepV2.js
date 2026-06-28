import { DataTypes } from 'sequelize';
import sequelize from '../../config/database.js';

const InterviewPrepV2 = sequelize.define('InterviewPrepV2', {
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
  interviewId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: { model: 'Interview', key: 'id' },
    onDelete: 'CASCADE'
  },
  companyResearch: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  techStackAnalysis: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  questions: {
    type: DataTypes.JSONB,
    defaultValue: {
      react: [],
      javascript: [],
      nodejs: [],
      manualTesting: [],
      hr: [],
      behavioral: []
    }
  },
  suggestedAnswers: {
    type: DataTypes.JSONB,
    defaultValue: {}
  }
}, {
  underscored: true,
  indexes: [
    { fields: ['candidate_id'] },
    { fields: ['interview_id'] }
  ]
});

export default InterviewPrepV2;
