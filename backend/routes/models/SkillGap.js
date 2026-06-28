import { DataTypes } from 'sequelize';
import sequelize from '../../config/database.js';

const SkillGap = sequelize.define('SkillGap', {
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
  skillName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  currentProficiency: {
    type: DataTypes.ENUM('none', 'beginner', 'intermediate', 'advanced', 'expert'),
    defaultValue: 'none'
  },
  requiredProficiency: {
    type: DataTypes.ENUM('beginner', 'intermediate', 'advanced', 'expert'),
    defaultValue: 'intermediate'
  },
  gapLevel: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
    defaultValue: 'medium'
  },
  learningResources: {
    type: DataTypes.ARRAY(DataTypes.JSONB),
    defaultValue: []
  },
  estimatedTimeToLearn: {
    type: DataTypes.INTEGER,
    comment: 'Days'
  },
  priority: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  }
}, {
  underscored: true,
  indexes: [
    { fields: ['candidate_id'] },
    { fields: ['job_id'] },
    { fields: ['priority'] }
  ]
});

export default SkillGap;
