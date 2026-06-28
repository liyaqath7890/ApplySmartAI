import { DataTypes } from 'sequelize';
import sequelize from '../../config/database.js';

const ConversationParticipant = sequelize.define('ConversationParticipant', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  conversationId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Conversation',
      key: 'id'
    },
    onDelete: 'CASCADE'
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
  unreadCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  underscored: true,
  indexes: [
    { fields: ['conversation_id', 'user_id'], unique: true },
    { fields: ['user_id'] }
  ]
});

export default ConversationParticipant;
