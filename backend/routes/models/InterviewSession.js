import { DataTypes } from 'sequelize';
import sequelize from '../../config/database.js';

const InterviewSession = sequelize.define('InterviewSession', {
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
  interviewType: {
    type: DataTypes.ENUM('behavioral', 'technical', 'mixed', 'cultural'),
    defaultValue: 'mixed'
  },
  difficultyLevel: {
    type: DataTypes.ENUM('beginner', 'intermediate', 'advanced', 'expert'),
    defaultValue: 'intermediate'
  },
  status: {
    type: DataTypes.ENUM('pending', 'in_progress', 'completed', 'paused', 'cancelled'),
    defaultValue: 'pending'
  },
  totalQuestions: {
    type: DataTypes.INTEGER,
    defaultValue: 10
  },
  currentQuestionIndex: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  overallScore: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0.00
  },
  feedback: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  recordingUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },
  transcript: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  startTime: {
    type: DataTypes.DATE,
    allowNull: true
  },
  endTime: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  underscored: true,
  indexes: [
    { fields: ['candidate_id'] },
    { fields: ['job_id'] },
    { fields: ['status'] },
    { fields: ['created_at'] }
  ]
});

export default InterviewSession;
