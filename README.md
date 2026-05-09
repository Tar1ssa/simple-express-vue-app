# Express JWT API (Fullstack)

A production-style fullstack application with an **Express.js** REST API and a **Vue 3** frontend. It demonstrates complete JWT authentication flows including password management, account lockout, and profile management.

## 📖 Complete Guide
For a detailed breakdown of the architecture, security features, and test cases, see the:
👉 **[Full Project Guide](./docs/guide.md)**

## 🚀 Quick Start

### 1. Backend Setup
```bash
npm install
cp .env.example .env
npm run dev
```
*Server runs at `http://localhost:3000`*

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
*UI runs at `http://localhost:5173`*


## 🔐 Seed Account

On startup, an admin account is created automatically:

| Field | Value |
|---|---|
| Email | `admin@example.com` |
| Password | `Admin123!` |
| Role | `admin` |

## 📡 API Endpoints

### Health
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/health` | ❌ | Health check |

### Auth (`/api/auth`)
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | ❌ | Register new user |
| POST | `/api/auth/login` | ❌ | Login & get tokens |
| POST | `/api/auth/refresh` | ❌ | Refresh access token |
| POST | `/api/auth/logout` | ❌ | Invalidate refresh token |
| POST | `/api/auth/change-password` | 🔒 | Change password |
| POST | `/api/auth/forgot-password` | ❌ | Request password reset |
| POST | `/api/auth/reset-password` | ❌ | Reset password with token |

### Users (`/api/users`)
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/users/profile` | 🔒 | Get own profile |
| PUT | `/api/users/profile` | 🔒 | Update own profile |
| GET | `/api/users` | 🔒👑 | List all users (admin only) |

## 📋 Usage Examples

### Register
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"John","email":"john@example.com","password":"Secure123!"}'
```

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"Secure123!"}'
```

### Access Protected Route
```bash
curl http://localhost:3000/api/users/profile \
  -H "Authorization: Bearer <your-access-token>"
```

### Change Password
```bash
curl -X POST http://localhost:3000/api/auth/change-password \
  -H "Authorization: Bearer <your-access-token>" \
  -H "Content-Type: application/json" \
  -d '{"currentPassword":"Secure123!","newPassword":"NewPass456!"}'
```

### Forgot Password
```bash
curl -X POST http://localhost:3000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com"}'
# Check server console for the reset token
```

### Reset Password
```bash
curl -X POST http://localhost:3000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{"token":"<reset-token-from-console>","newPassword":"Reset789!"}'
```

## 🔒 Security Features

- **JWT dual-token strategy** — Short-lived access tokens (15m) + long-lived refresh tokens (7d)
- **Token blacklisting** — Revoked tokens are rejected via JTI tracking
- **Password hashing** — bcrypt with configurable salt rounds
- **Account lockout** — Auto-locks after 5 failed login attempts for 15 minutes
- **Rate limiting** — Auth routes limited to 20 requests per 15 minutes per IP
- **Security headers** — Helmet.js for HTTP security headers
- **Input validation** — express-validator on all inputs
- **Anti-enumeration** — Forgot password returns same response regardless of email existence

## 🛠️ Tech Stack

Express.js • jsonwebtoken • bcryptjs • express-validator • helmet • cors • morgan

## 📝 Note

This project uses an **in-memory store** — all data resets on server restart. For production, swap with a real database.
