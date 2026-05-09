const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const config = require('./config/env');
const { errorHandler } = require('./middleware/errorHandler');

// Import routes
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');

const app = express();

// ─── View Engine Setup ───
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

// ─── Global Middleware ────────────────────────────────────
app.use(cookieParser());
app.use(helmet({
  contentSecurityPolicy: false,
}));
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const { authenticate } = require('./middleware/auth');

// ─── Root Route ───────────────────────────────────────────
app.get('/', async (req, res, next) => {
  // Try to authenticate to get user info if logged in
  let user = null;
  if (req.cookies.accessToken) {
    try {
      const { verifyAccessToken } = require('./utils/token');
      const decoded = verifyAccessToken(req.cookies.accessToken);
      const store = require('./store/dbStore');
      user = await store.findUserById(decoded.sub);
    } catch (err) {
      // Ignore token errors on home page
    }
  }
  res.render('index', { user, title: 'Home' });
});

// ─── Health Check ─────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Express JWT API is running',
    data: {
      uptime: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
      environment: config.nodeEnv,
    },
  });
});

// ─── API Routes ───────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// ─── 404 Handler ──────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found.`,
  });
});

// ─── Global Error Handler ─────────────────────────────────
app.use(errorHandler);

const sequelize = require('./config/database');
const store = require('./store/dbStore');

// ─── Start Server ─────────────────────────────────────────
sequelize.sync().then(async () => {
  await store.seedAdmin();
  app.listen(config.port, () => {
    console.log(`\n🚀 Express JWT API (MySQL) running on http://localhost:${config.port}`);
    console.log(`📋 Environment: ${config.nodeEnv}`);
    console.log(`🔑 Access token expiry: ${config.jwt.accessExpiry}`);
    console.log(`🔄 Refresh token expiry: ${config.jwt.refreshExpiry}`);
    console.log(`🔒 Account locks after ${config.security.maxLoginAttempts} failed attempts\n`);
  });
}).catch(err => {
  console.error('❌ Unable to connect to the database:', err);
});
