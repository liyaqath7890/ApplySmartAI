import { DataTypes } from 'sequelize';
import sequelize from '../../config/database.js';

const CandidateProfile = sequelize.define('CandidateProfile', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },

  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'User',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },

  headline: {
    type: DataTypes.STRING,
    allowNull: true
  },

  summary: {
    type: DataTypes.TEXT,
    allowNull: true
  },

  experience: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Years of experience'
  },

  experienceLevel: {
    type: DataTypes.ENUM('entry', 'mid', 'senior', 'lead', 'executive'),
    allowNull: true
  },

  expectedSalary: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },

  currentLocation: {
    type: DataTypes.STRING,
    allowNull: true
  },

  preferredLocations: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  },

  workAuthorization: {
    type: DataTypes.STRING,
    allowNull: true
  },

  noticePeriod: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Days'
  },

  isWillingToRelocate: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },

  isWillingToTravel: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },

  isLookingForRemote: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },

  isActivelyLooking: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },

  linkedinUrl: {
    type: DataTypes.STRING,
    validate: {
      isUrl: true
    }
  },

  githubUrl: {
    type: DataTypes.STRING,
    validate: {
      isUrl: true
    }
  },

  portfolioUrl: {
    type: DataTypes.STRING,
    validate: {
      isUrl: true
    }
  },

  websiteUrl: {
    type: DataTypes.STRING,
    validate: {
      isUrl: true
    }
  },

  atsScore: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },

  aiAnalysis: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },

  careerRoadmap: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },

  resumeUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },

  coverLetterUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },

  profileCompletenessScore: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }

}, {
  underscored: true,
  indexes: [
    {
      fields: ['user_id'],
      unique: true
    },
    {
      fields: ['experience_level']
    },
    {
      fields: ['is_actively_looking']
    }
  ]
});

export default CandidateProfile;