# Express JWT API - Complete Project Guide

## 📌 Project Overview
**Express JWT API** is a production-style full-stack application. It features a robust **Express.js** backend backed by a **MySQL** database and a modern **Vue 3** frontend. Its primary goal is to demonstrate a secure authentication workflow using JSON Web Tokens (JWT), including dual-token strategy, account security, and role-based access control.

---

## 🏗️ Architecture & Folder Structure

The project is split into a backend API and a frontend UI.

```text
express-jwt-api/
├── frontend/          # Vue 3 Single Page Application (UI)
│   ├── src/           # Frontend source code (Views, Stores, Services)
│   └── vite.config.js # Frontend build & proxy configuration
├── src/               # Express.js Backend source code
│   ├── app.js         # Entry point & middleware
│   ├── config/        # Environment & Database config
│   ├── controllers/   # Business logic
│   ├── models/        # Sequelize models (MySQL)
│   ├── routes/        # API endpoints
│   ├── store/         # Database store service
│   └── middleware/    # Auth & Security interceptors
├── docs/              # Project documentation
├── .env               # Environment variables
└── package.json       # Backend dependencies
```

---

## 🔐 Core Functionality & Test Cases

This project is designed to handle real-world security scenarios. Here is exactly what it can do and how you can test it:

### 1. Secure Registration & Login
*   **Feature**: Users can create accounts with validated inputs (password strength, email format).
*   **Test Case**: 
    1. Go to `/register` and create a user.
    2. Try to register again with the same email (it should fail).
    3. Login at `/login` with your new credentials to receive your JWT tokens.

### 2. Dual-Token Strategy (Access & Refresh)
*   **Feature**: Uses short-lived Access Tokens (15m) and long-lived Refresh Tokens (7d).
*   **Test Case**: 
    1. Login and watch the `localStorage` in your browser.
    2. The frontend `api.js` service will automatically use the `refreshToken` to get a new `accessToken` if the old one expires or is deleted.

### 3. Role-Based Access Control (RBAC)
*   **Feature**: Restricts certain pages/endpoints based on user roles (`admin` vs `user`).
*   **Test Case**: 
    1. Login with a regular user. Try to visit the `/users` page. You will be redirected back to the dashboard.
    2. Login with the default admin (`admin@example.com` / `Admin123!`). Now you can access the `/users` management table.

### 4. Account Lockout Protection
*   **Feature**: Prevents brute-force attacks by locking accounts after multiple failed attempts.
*   **Test Case**: 
    1. Try to login with a correct email but wrong password 5 times in a row.
    2. On the 6th attempt, the account will be locked for 15 minutes.

### 5. Profile Management
*   **Feature**: Users can update their personal info and change their password.
*   **Test Case**: 
    1. Go to `/profile` and change your name.
    2. Use the "Change Password" feature. Note that changing your password will invalidate all your other active sessions (Token Revocation).

### 6. Password Recovery
*   **Feature**: Secure "Forgot Password" flow with one-time use reset tokens.
*   **Test Case**: 
    1. Click "Forgot Password" and enter your email.
    2. Check the **Backend Console** to see the generated Reset Token (simulating an email).
    3. Use that token at `/reset-password` to set a new password.

---

## 🚀 How to Run

### 1. Prerequisites
*   Node.js (v18+) installed.

### 2. Setup Backend
1. Create a database named `express_jwt_api` in your MySQL server.
2. Update `.env` with your MySQL `DB_USER` and `DB_PASSWORD`.
3. Install dependencies and run:
```bash
npm install
npm run dev
```
*The app will automatically create the tables on the first run.*
*Backend runs on `http://localhost:3000`*

### 3. Setup Frontend
```bash
cd frontend
npm install
npm run dev
```
*Frontend runs on `http://localhost:5173`*

---

## 🛠️ Security Technologies Used
*   **jsonwebtoken**: For secure, stateless authentication.
*   **bcryptjs**: For industrial-grade password hashing.
*   **helmet**: Sets security headers to prevent common web attacks.
*   **express-validator**: Sanitizes and validates all user inputs.
*   **Pinia**: For secure frontend state management.
