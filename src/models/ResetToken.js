const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ResetToken = sequelize.define('ResetToken', {
  token: {
    type: DataTypes.STRING,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: false,
  },
}, {
  timestamps: true,
});

module.exports = ResetToken;
