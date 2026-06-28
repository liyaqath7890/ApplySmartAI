import { DataTypes } from 'sequelize';
import sequelize from '../../config/database.js';

const CareerRoadmap = sequelize.define('CareerRoadmap', {
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
  currentRole: {
    type: DataTypes.STRING,
    allowNull: true
  },
  targetRole: {
    type: DataTypes.STRING,
    allowNull: false
  },
  timelineYears: {
    type: DataTypes.INTEGER,
    defaultValue: 3
  },
  status: {
    type: DataTypes.ENUM('draft', 'active', 'paused', 'completed'),
    defaultValue: 'draft'
  },
  progressPercentage: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    min: 0,
    max: 100
  },
  aiGenerated: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  underscored: true,
  indexes: [
    { fields: ['candidate_id'] },
    { fields: ['status'] }
  ]
});

export default CareerRoadmap;
