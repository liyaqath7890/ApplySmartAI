import { DataTypes } from 'sequelize';
import sequelize from '../../config/database.js';

const RecruiterProfile = sequelize.define('RecruiterProfile', {
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

  companyName: {
    type: DataTypes.STRING,
    allowNull: false
  },

  companyWebsite: {
    type: DataTypes.STRING,
    validate: {
      isUrl: true
    }
  },

  companySize: {
    type: DataTypes.ENUM(
      '1-10',
      '11-50',
      '51-200',
      '201-500',
      '501-1000',
      '1000+'
    ),
    allowNull: true
  },

  industry: {
    type: DataTypes.STRING,
    allowNull: true
  },

  companyDescription: {
    type: DataTypes.TEXT,
    allowNull: true
  },

  companyLogo: {
    type: DataTypes.STRING,
    allowNull: true
  },

  jobTitle: {
    type: DataTypes.STRING,
    allowNull: true
  },

  linkedinUrl: {
    type: DataTypes.STRING,
    validate: {
      isUrl: true
    }
  },

  totalJobsPosted: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },

  totalHires: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },

  averageResponseTime: {
    type: DataTypes.INTEGER,
    comment: 'Hours',
    defaultValue: 0
  },

  rating: {
    type: DataTypes.DECIMAL(2, 1),
    defaultValue: 0.0
  },

  totalReviews: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },

  isVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },

  verificationDocuments: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  }

}, {
  underscored: true,
  indexes: [
    {
      fields: ['user_id'],
      unique: true
    },
    {
      fields: ['company_name']
    }
  ]
});

export default RecruiterProfile;