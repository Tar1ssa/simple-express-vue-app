# Express JWT Monolith - Complete Project Guide

## 📌 Project Overview
**Express JWT Monolith** is a production-style full-stack application. It features a robust **Express.js** backend backed by a **MySQL** database and a server-side rendered (SSR) UI using **EJS**. Its primary goal is to demonstrate a secure authentication workflow using JSON Web Tokens (JWT) stored in secure cookies, account security, and role-based access control.

---

## 🏗️ Architecture & Folder Structure

The project is a monolithic application where the server handles both logic and UI.

```text
express-jwt-api/
├── src/               # Express.js Backend source code
│   ├── app.js         # Entry point & middleware
│   ├── config/        # Environment & Database config
│   ├── controllers/   # Business logic & Page rendering
│   ├── models/        # Sequelize models (MySQL)
│   ├── routes/        # Page and API endpoints
│   ├── store/         # Database store service
│   ├── views/         # EJS Templates (HTML UI)
│   └── middleware/    # Auth & Security interceptors
├── docs/              # Project documentation
├── .env               # Environment variables
└── package.json       # Project dependencies
```

---

## 🔐 Core Functionality & Test Cases

This project is designed to handle real-world security scenarios. Here is exactly what it can do and how you can test it:

### 1. Secure Registration & Login
*   **Feature**: Users can create accounts with validated inputs (password strength, email format).
*   **Test Case**: 
    1. Go to `/register` and create a user.
    2. Try to register again with the same email (it should fail).
    3. Login at `/login` with your new credentials.

### 2. Secure Token Storage (HttpOnly Cookies)
*   **Feature**: Uses JWT tokens stored in `HttpOnly` cookies. This prevents Cross-Site Scripting (XSS) attacks from stealing your session.
*   **Test Case**: 
    1. Login and open your browser's Developer Tools (F12).
    2. Go to the **Application** tab -> **Cookies**.
    3. You will see an `accessToken` cookie. Notice you cannot access it via `document.cookie` in the console (Security feature).

### 3. Role-Based Access Control (RBAC)
*   **Feature**: Restricts pages based on user roles (`admin` vs `user`).
*   **Test Case**: 
    1. Login with a regular user. Try to visit the `/users` page manually. You will be redirected back to the dashboard.
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
*   MySQL Server (XAMPP, etc.) running.

### 2. Setup
1. Create a database named `express_jwt_api` in your MySQL server.
2. Update `.env` with your MySQL `DB_USER` and `DB_PASSWORD`.
3. Install dependencies and run:
```bash
npm install
npm run dev
```
*The app will automatically create the tables on the first run.*

---

## 🛠️ Security Technologies Used
*   **jsonwebtoken**: For secure, stateless authentication.
*   **bcryptjs**: For industrial-grade password hashing.
*   **cookie-parser**: For secure token handling.
*   **helmet**: Sets security headers to prevent common web attacks.
*   **express-validator**: Sanitizes and validates all user inputs.
*   **Sequelize**: For safe database interaction and protection against SQL injection.
