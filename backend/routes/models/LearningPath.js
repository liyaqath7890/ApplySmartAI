import { DataTypes } from 'sequelize';
import sequelize from '../../config/database.js';

const LearningPath = sequelize.define('LearningPath', {
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
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  goal: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('planning', 'in_progress', 'completed', 'paused'),
    defaultValue: 'planning'
  },
  progressPercentage: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    min: 0,
    max: 100
  },
  startDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  targetDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  completionDate: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  underscored: true,
  indexes: [
    { fields: ['candidate_id'] },
    { fields: ['status'] }
  ]
});

export default LearningPath;
