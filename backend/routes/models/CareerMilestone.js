import { DataTypes } from 'sequelize';
import sequelize from '../../config/database.js';

const CareerMilestone = sequelize.define('CareerMilestone', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  careerRoadmapId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'CareerRoadmap',
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
  milestoneType: {
    type: DataTypes.ENUM('skill', 'role', 'certification', 'project', 'networking'),
    defaultValue: 'skill'
  },
  targetDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  completedDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  isCompleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  orderIndex: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  underscored: true,
  indexes: [
    { fields: ['career_roadmap_id'] },
    { fields: ['is_completed'] },
    { fields: ['order_index'] }
  ]
});

export default CareerMilestone;
