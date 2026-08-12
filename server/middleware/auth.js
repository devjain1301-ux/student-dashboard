// server/middleware/auth.js - JWT Authentication & Authorization Middleware
const jwt = require('jsonwebtoken');
const { query } = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'unisphere_jwt_college_dashboard_secret_2026';

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.startsWith('Bearer ') 
      ? authHeader.slice(7).trim() 
      : null;

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: Access token is missing'
      });
    }

    // Verify token signature & expiration
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          error: 'Session expired: Please log in again'
        });
      }
      return res.status(401).json({
        success: false,
        error: 'Invalid authentication token'
      });
    }

    if (!decoded || !decoded.userId) {
      return res.status(401).json({
        success: false,
        error: 'Malformed authentication token'
      });
    }

    // Parameterized lookup to confirm user existence
    const user = await query.get(
      'SELECT id, name, email, stream, branch, semester FROM users WHERE id = ?',
      [decoded.userId]
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User account not found or deactivated'
      });
    }

    // Attach validated user context to request
    req.user = {
      id: user.id,
      userId: user.id,
      name: user.name,
      email: user.email,
      stream: user.stream,
      branch: user.branch,
      semester: user.semester
    };

    next();
  } catch (error) {
    console.error('Authentication Middleware Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server authentication error'
    });
  }
};

module.exports = { authenticateToken, JWT_SECRET };
