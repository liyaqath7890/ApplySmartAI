import { DataTypes } from 'sequelize';
import sequelize from '../../config/database.js';

const Resume = sequelize.define('Resume', {
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
  fileName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  fileUrl: {
    type: DataTypes.STRING,
    allowNull: false
  },
  fileSize: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  fileType: {
    type: DataTypes.STRING,
    defaultValue: 'pdf'
  },
  parsedContent: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  atsScore: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    min: 0,
    max: 100
  },
  aiAnalysis: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  extractedSkills: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  },
  extractedExperience: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  extractedEducation: {
    type: DataTypes.ARRAY(DataTypes.JSONB),
    defaultValue: []
  },
  extractedCertifications: {
    type: DataTypes.ARRAY(DataTypes.JSONB),
    defaultValue: []
  },
  extractedProjects: {
    type: DataTypes.ARRAY(DataTypes.JSONB),
    defaultValue: []
  },
  missingSkills: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  },
  improvementSuggestions: {
    type: DataTypes.ARRAY(DataTypes.TEXT),
    defaultValue: []
  },
  isPrimary: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  isProcessed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  underscored: true,
  indexes: [
    {
      fields: ['candidate_id']
    },
    {
      fields: ['is_primary']
    },
    {
      fields: ['ats_score']
    }
  ]
});

export default Resume;