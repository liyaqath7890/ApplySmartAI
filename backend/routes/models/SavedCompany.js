import { DataTypes } from 'sequelize';
import sequelize from '../../config/database.js';

const SavedCompany = sequelize.define('SavedCompany', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  candidateProfileId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'CandidateProfile',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  companyId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Company',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  isFollowing: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  isBookmarked: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  isHidden: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  isFavorite: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  notificationPreferences: {
    type: DataTypes.JSONB,
    defaultValue: {
      location: [],
      role: [],
      salary: null,
      workMode: [],
      experienceLevel: [],
      internships: true,
      graduates: true
    }
  }
}, {
  underscored: true,
  tableName: 'SavedCompanies',
  indexes: [
    { unique: true, fields: ['candidate_profile_id', 'company_id'] }
  ]
});

export default SavedCompany;
