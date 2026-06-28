import { DataTypes } from 'sequelize';
import sequelize from '../../config/database.js';

const ResumeVersion = sequelize.define('ResumeVersion', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  resumeId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Resume',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  versionNumber: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  content: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: {}
  },
  atsScore: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    min: 0,
    max: 100
  },
  isCurrent: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  jobId: {
    type: DataTypes.UUID,
    allowNull: true
  }
}, {
  underscored: true,
  indexes: [
    { fields: ['resume_id'] },
    { fields: ['version_number'] },
    { fields: ['is_current'] }
  ]
});

export default ResumeVersion;
