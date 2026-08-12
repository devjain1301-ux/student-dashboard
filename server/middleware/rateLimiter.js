// server/middleware/rateLimiter.js - Brute-force & Abuse Protection
const rateLimit = require('express-rate-limit');

// Strict limiter for authentication endpoints (prevent brute-force PIN guessing)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // max 20 login/register attempts per IP per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many authentication attempts. Please try again after 15 minutes.'
  }
});

// General limiter for API endpoints
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300, // max 300 requests per IP per 15 mins
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'API rate limit exceeded. Please slow down.'
  }
});

// Upload limiter
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Document upload limit reached. Please wait before uploading more files.'
  }
});

module.exports = { authLimiter, apiLimiter, uploadLimiter };
