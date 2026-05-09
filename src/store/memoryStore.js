const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const config = require('../config/env');

/**
 * In-Memory Data Store
 * Manages users, refresh tokens, blacklist, reset tokens, and audit logs.
 * All data resets on server restart — intentional for learning/demo purposes.
 */
class MemoryStore {
  constructor() {
    this.users = new Map();
    this.refreshTokens = new Map();
    this.blacklist = new Map();
    this.resetTokens = new Map();
    this.auditLog = [];
    this._seedAdmin();
  }

  async _seedAdmin() {
    const hashedPassword = await bcrypt.hash('Admin123!', config.bcrypt.saltRounds);
    const adminId = this._generateId('usr');
    this.users.set(adminId, {
      id: adminId,
      name: 'Admin',
      email: 'admin@example.com',
      password: hashedPassword,
      role: 'admin',
      failedLoginAttempts: 0,
      lockedUntil: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    console.log('🔐 Seed admin created: admin@example.com / Admin123!');
  }

  _generateId(prefix = 'id') {
    return `${prefix}_${crypto.randomBytes(8).toString('hex')}`;
  }

  // ─── User Methods ───────────────────────────────────────

  findUserByEmail(email) {
    for (const user of this.users.values()) {
      if (user.email === email) return user;
    }
    return null;
  }

  findUserById(id) {
    return this.users.get(id) || null;
  }

  createUser(userData) {
    const id = this._generateId('usr');
    const user = {
      id,
      ...userData,
      role: 'user',
      failedLoginAttempts: 0,
      lockedUntil: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.users.set(id, user);
    return user;
  }

  updateUser(id, updates) {
    const user = this.users.get(id);
    if (!user) return null;
    const updated = { ...user, ...updates, updatedAt: new Date().toISOString() };
    this.users.set(id, updated);
    return updated;
  }

  getAllUsers() {
    return Array.from(this.users.values());
  }

  // ─── Refresh Token Methods ──────────────────────────────

  storeRefreshToken(jti, data) {
    this.refreshTokens.set(jti, data);
  }

  findRefreshToken(jti) {
    return this.refreshTokens.get(jti) || null;
  }

  removeRefreshToken(jti) {
    this.refreshTokens.delete(jti);
  }

  removeAllUserRefreshTokens(userId) {
    for (const [jti, data] of this.refreshTokens.entries()) {
      if (data.userId === userId) {
        this.refreshTokens.delete(jti);
      }
    }
  }

  // ─── Blacklist Methods ──────────────────────────────────

  blacklistToken(jti, data) {
    this.blacklist.set(jti, data);
  }

  isTokenBlacklisted(jti) {
    const entry = this.blacklist.get(jti);
    if (!entry) return false;
    if (new Date(entry.expiresAt) < new Date()) {
      this.blacklist.delete(jti);
      return false;
    }
    return true;
  }

  // ─── Reset Token Methods ────────────────────────────────

  storeResetToken(token, data) {
    this.resetTokens.set(token, data);
  }

  findResetToken(token) {
    const entry = this.resetTokens.get(token);
    if (!entry) return null;
    if (new Date(entry.expiresAt) < new Date()) {
      this.resetTokens.delete(token);
      return null;
    }
    return entry;
  }

  removeResetToken(token) {
    this.resetTokens.delete(token);
  }

  // ─── Audit Methods ──────────────────────────────────────

  logAudit(entry) {
    this.auditLog.push({
      id: this._generateId('aud'),
      ...entry,
      timestamp: new Date().toISOString(),
    });
  }

  getAuditByUserId(userId) {
    return this.auditLog.filter((e) => e.userId === userId);
  }
}

module.exports = new MemoryStore();
