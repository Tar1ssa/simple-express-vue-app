const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const BlacklistedToken = sequelize.define('BlacklistedToken', {
  jti: {
    type: DataTypes.STRING,
    primaryKey: true,
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: false,
  },
}, {
  timestamps: true,
  updatedAt: false,
});

module.exports = BlacklistedToken;
