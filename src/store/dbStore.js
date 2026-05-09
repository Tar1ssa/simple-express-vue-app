const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const config = require('../config/env');
const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');
const ResetToken = require('../models/ResetToken');
const AuditLog = require('../models/AuditLog');
const BlacklistedToken = require('../models/BlacklistedToken');
const { Op } = require('sequelize');

class DbStore {
  constructor() {}

  async seedAdmin() {
    const admin = await User.findOne({ where: { email: 'admin@example.com' } });
    if (!admin) {
      const hashedPassword = await bcrypt.hash('Admin123!', config.bcrypt.saltRounds);
      const adminId = this._generateId('usr');
      await User.create({
        id: adminId,
        name: 'Admin',
        email: 'admin@example.com',
        password: hashedPassword,
        role: 'admin',
      });
      console.log('🔐 Seed admin created in MySQL: admin@example.com / Admin123!');
    }
  }

  _generateId(prefix = 'id') {
    return `${prefix}_${crypto.randomBytes(8).toString('hex')}`;
  }

  // ─── User Methods ───────────────────────────────────────

  async findUserByEmail(email) {
    const user = await User.findOne({ where: { email } });
    return user ? user.toJSON() : null;
  }

  async findUserById(id) {
    const user = await User.findByPk(id);
    return user ? user.toJSON() : null;
  }

  async createUser(userData) {
    const id = this._generateId('usr');
    const user = await User.create({
      id,
      ...userData,
      role: 'user',
    });
    return user.toJSON();
  }

  async updateUser(id, updates) {
    const user = await User.findByPk(id);
    if (!user) return null;
    await user.update(updates);
    return user.toJSON();
  }

  async getAllUsers() {
    const users = await User.findAll();
    return users.map(u => u.toJSON());
  }

  // ─── Refresh Token Methods ──────────────────────────────

  async storeRefreshToken(jti, data) {
    await RefreshToken.create({
      jti,
      userId: data.userId,
      expiresAt: data.expiresAt,
    });
  }

  async findRefreshToken(jti) {
    const token = await RefreshToken.findByPk(jti);
    return token ? token.toJSON() : null;
  }

  async removeRefreshToken(jti) {
    await RefreshToken.destroy({ where: { jti } });
  }

  async removeAllUserRefreshTokens(userId) {
    await RefreshToken.destroy({ where: { userId } });
  }

  // ─── Blacklist Methods ──────────────────────────────────

  async blacklistToken(jti, data) {
    await BlacklistedToken.create({
      jti,
      expiresAt: data.expiresAt,
    });
  }

  async isTokenBlacklisted(jti) {
    const entry = await BlacklistedToken.findByPk(jti);
    if (!entry) return false;
    if (new Date(entry.expiresAt) < new Date()) {
      await BlacklistedToken.destroy({ where: { jti } });
      return false;
    }
    return true;
  }

  // ─── Reset Token Methods ────────────────────────────────

  async storeResetToken(token, data) {
    await ResetToken.create({
      token,
      userId: data.userId,
      expiresAt: data.expiresAt,
    });
  }

  async findResetToken(token) {
    const entry = await ResetToken.findByPk(token);
    if (!entry) return null;
    if (new Date(entry.expiresAt) < new Date()) {
      await ResetToken.destroy({ where: { token } });
      return null;
    }
    return entry.toJSON();
  }

  async removeResetToken(token) {
    await ResetToken.destroy({ where: { token } });
  }

  // ─── Audit Methods ──────────────────────────────────────

  async logAudit(entry) {
    await AuditLog.create({
      id: this._generateId('aud'),
      userId: entry.userId,
      event: entry.event,
      ipAddress: entry.ipAddress,
      userAgent: entry.userAgent,
      metadata: entry.metadata,
    });
  }

  async getAuditByUserId(userId) {
    const logs = await AuditLog.findAll({ where: { userId } });
    return logs.map(l => l.toJSON());
  }
}

module.exports = new DbStore();
