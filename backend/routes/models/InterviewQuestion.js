import { DataTypes } from 'sequelize';
import sequelize from '../../config/database.js';

const InterviewQuestion = sequelize.define('InterviewQuestion', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  interviewSessionId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'InterviewSession',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  question: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  questionType: {
    type: DataTypes.ENUM('behavioral', 'technical', 'coding', 'system_design', 'cultural'),
    defaultValue: 'behavioral'
  },
  difficultyLevel: {
    type: DataTypes.ENUM('beginner', 'intermediate', 'advanced', 'expert'),
    defaultValue: 'intermediate'
  },
  expectedAnswer: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  candidateAnswer: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  score: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0.00
  },
  feedback: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  orderIndex: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  underscored: true,
  indexes: [
    { fields: ['interview_session_id'] },
    { fields: ['order_index'] }
  ]
});

export default InterviewQuestion;
