import { DataTypes } from 'sequelize';
import sequelize from '../../config/database.js';

const Skill = sequelize.define('Skill', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  category: {
    type: DataTypes.STRING,
    allowNull: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  synonyms: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  },
  isTechnical: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  popularity: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  underscored: true,
  indexes: [
    {
      fields: ['name']
    },
    {
      fields: ['category']
    }
  ]
});

export default Skill;