# Express JWT Monolith

A production-style monolithic application built with **Express.js**, **EJS**, and **MySQL**. It demonstrates complete JWT authentication flows (using HttpOnly cookies) including password management, account lockout, and profile management—all within a single server-side rendered application.

## 📖 Complete Guide
For a detailed breakdown of the architecture, security features, and test cases, see the:
👉 **[Full Project Guide](./docs/guide.md)**

## 🚀 Quick Start

1. **Create the Database**: 
   ```sql
   CREATE DATABASE express_jwt_api;
   ```

2. **Configure Credentials**: 
   Update `.env` with your MySQL `DB_USER` and `DB_PASSWORD`.

3. **Install & Run**:
   ```bash
   npm install
   npm run dev
   ```

Server runs at `http://localhost:3000`

## 🔐 Seed Account

On startup, an admin account is created automatically:

| Field | Value |
|---|---|
| Email | `admin@example.com` |
| Password | `Admin123!` |
| Role | `admin` |

## 📡 Key Pages

- **Home**: `/`
- **Login**: `/login`
- **Register**: `/register`
- **Dashboard**: `/dashboard`
- **User Management**: `/users` (Admin only)
- **Profile**: `/profile`

## 🔒 Security Features

- **JWT-over-Cookies** — Secure HttpOnly cookies protect tokens from XSS.
- **Account lockout** — Auto-locks after 5 failed login attempts for 15 minutes.
- **Password hashing** — industrial-grade bcrypt hashing.
- **CSRF Protection** — (Recommended for production: add `csurf`).
- **Input validation** — express-validator on all forms.

## 🛠️ Tech Stack

Express.js • EJS • MySQL • Sequelize • jsonwebtoken • bcryptjs • helmet

