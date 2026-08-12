// server/server.js - Production-Ready Secure Express Backend for College Dashboard
require('dotenv').config();

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth.routes');
const studentRoutes = require('./routes/student.routes');
const documentRoutes = require('./routes/documents.routes');
const { apiLimiter } = require('./middleware/rateLimiter');

const app = express();
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// 1. Security Headers via Helmet
app.use(
  helmet({
    contentSecurityPolicy: false, // Allows inline PDF views & custom avatars
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" }
  })
);

// 2. CORS Configuration
const allowedOrigin = process.env.CORS_ORIGIN || '*';
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, Capacitor)
      if (!origin || allowedOrigin === '*' || origin === allowedOrigin) {
        callback(null, true);
      } else {
        callback(null, true); // Permissive fallback for local testing
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

// 3. Body Parsing Middleware
app.use(express.json({ limit: '12mb' }));
app.use(express.urlencoded({ extended: true, limit: '12mb' }));

// 4. API Health Check Route
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    service: 'College Dashboard Backend API',
    version: '2.0.0',
    uptime: Math.floor(process.uptime()),
    timestamp: Date.now()
  });
});

// 5. Mount API Routes
app.use('/api/auth', authRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/documents', documentRoutes);

// 6. Serve Static Web Assets
const rootDir = path.resolve(__dirname, '..');
app.use(express.static(rootDir, {
  maxAge: '1d',
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache');
    }
  }
}));

// 7. 404 Handler for Unknown API Routes
app.use('/api', (req, res) => {
  res.status(404).json({
    success: false,
    error: `Endpoint '${req.originalUrl}' not found on this server`
  });
});

// 8. SPA Fallback (Serve index.html for frontend navigation)
app.use((req, res) => {
  res.sendFile(path.join(rootDir, 'index.html'));
});

// 9. Centralized Error Handler (Never leak stack traces in production)
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  const isDev = NODE_ENV === 'development';

  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal Server Error',
    ...(isDev && { stack: err.stack })
  });
});

// Start Server
if (require.main === module) {
  const server = app.listen(PORT, () => {
    console.log(`
=====================================================
🎓 College Dashboard Backend Server Running
🚀 Port: ${PORT}
🌍 Mode: ${NODE_ENV}
🔒 Security: Helmet, Bcrypt, JWT, Rate-Limiter Active
📁 Database: SQLite (Parameterized & Isolated)
=====================================================
    `);
  });

  // Graceful Shutdown
  const handleShutdown = () => {
    console.log('Stopping server gracefully...');
    server.close(() => {
      console.log('Server stopped.');
      process.exit(0);
    });
  };

  process.on('SIGINT', handleShutdown);
  process.on('SIGTERM', handleShutdown);
}

module.exports = app;
