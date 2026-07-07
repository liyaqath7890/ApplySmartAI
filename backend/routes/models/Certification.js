import { DataTypes } from 'sequelize';
import sequelize from '../../config/database.js';

const Certification = sequelize.define('Certification', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  candidateId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'candidate_id',
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
  issuingOrganization: {
    type: DataTypes.STRING,
    allowNull: false
  },
  issueDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  expirationDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  credentialId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  credentialUrl: {
    type: DataTypes.STRING,
    allowNull: true,
    set(value) {
      this.setDataValue('credentialUrl', value === '' ? null : value);
    },
    validate: {
      isUrl: true
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  skills: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  },
  isVerified: {
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
    { fields: ['candidate_id'] },
    { fields: ['issuing_organization'] },
    { fields: ['order_index'] }
  ]
});

export default Certification;
