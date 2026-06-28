import { DataTypes } from 'sequelize';
import sequelize from '../../config/database.js';

const ResumeTemplate = sequelize.define('ResumeTemplate', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  templateType: {
    type: DataTypes.ENUM('modern', 'classic', 'creative', 'professional', 'minimal'),
    defaultValue: 'professional'
  },
  thumbnailUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },
  isPublic: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  config: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  createdBy: {
    type: DataTypes.UUID,
    allowNull: true
  }
}, {
  underscored: true,
  indexes: [
    { fields: ['template_type'] },
    { fields: ['is_public'] }
  ]
});

export default ResumeTemplate;
