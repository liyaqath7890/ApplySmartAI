import { DataTypes } from 'sequelize';
import sequelize from '../../config/database.js';

const LearningStep = sequelize.define('LearningStep', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  learningPathId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'LearningPath',
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
  resourceUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },
  resourceType: {
    type: DataTypes.ENUM('course', 'tutorial', 'book', 'video', 'documentation', 'project'),
    defaultValue: 'course'
  },
  estimatedDuration: {
    type: DataTypes.INTEGER,
    comment: 'Hours'
  },
  orderIndex: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  isCompleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  completedAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  underscored: true,
  indexes: [
    { fields: ['learning_path_id'] },
    { fields: ['order_index'] },
    { fields: ['is_completed'] }
  ]
});

export default LearningStep;
