import { DataTypes } from 'sequelize';
import sequelize from '../../config/database.js';

const Subscription = sequelize.define('Subscription', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'user_id',
    references: {
      model: 'User',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  planId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Plan',
      key: 'id'
    },
    onDelete: 'SET NULL'
  },
  stripeSubscriptionId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  stripeCustomerId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('active', 'past_due', 'canceled', 'incomplete', 'incomplete_expired', 'trialing', 'unpaid'),
    defaultValue: 'active'
  },
  currentPeriodStart: {
    type: DataTypes.DATE,
    allowNull: true
  },
  currentPeriodEnd: {
    type: DataTypes.DATE,
    allowNull: true
  },
  cancelAtPeriodEnd: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  underscored: true,
  indexes: [
    { fields: ['user_id'], unique: true },
    { fields: ['status'] },
    { fields: ['stripe_subscription_id'], unique: true }
  ]
});

export default Subscription;
