// server/routes/auth.routes.js - Secure Authentication API Routes
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { query } = require('../config/db');
const { authenticateToken, JWT_SECRET } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const { validateRegister, validateLogin, validatePinChange } = require('../middleware/validate');

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

// -------------------------------------------------------------
// POST /api/auth/register - Register New Student Account
// -------------------------------------------------------------
router.post('/register', authLimiter, validateRegister, async (req, res) => {
  try {
    const { name, email, phone, pin, password, stream, branch, semester, initialData } = req.body;

    // Check if email already registered
    const existingUser = await query.get('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'An account with this email address already exists. Please log in with your 4-digit PIN.'
      });
    }

    // Hash 4-Digit Security PIN (Cost factor 12)
    const pinHash = await bcrypt.hash(pin, 12);
    const passwordHash = password ? await bcrypt.hash(password, 12) : null;

    const userId = 'usr_' + Date.now() + '_' + crypto.randomBytes(4).toString('hex');
    const now = Date.now();

    // Insert user record with parameterized query
    await query.run(
      `INSERT INTO users (id, name, email, phone, pin_hash, password_hash, stream, branch, semester, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, name, email, phone || null, pinHash, passwordHash, stream, branch, semester || 1, now, now]
    );

    // Initialize student data store
    const initialJson = typeof initialData === 'object' && initialData !== null
      ? JSON.stringify(initialData)
      : JSON.stringify({
          profile: { name, email, phone, stream, branch, semester: semester || 1, isVerified: true, isPinEnabled: true },
          subjects: [],
          timetable: { Monday: [], Tuesday: [], Wednesday: [], Thursday: [], Friday: [], Saturday: [] },
          assignments: [],
          exams: [],
          notes: [],
          events: [],
          expenses: { monthlyBudget: 10000, currency: "₹", items: [] },
          travel: [],
          calendarActivities: [],
          gamification: { xp: 480, level: 3, title: "Curious Scholar", streak: 5 },
          dashboardWidgets: { todayHub: true, gamification: true, timetable: true, attendance: true, exams: true, assignments: true }
        });

    await query.run(
      `INSERT INTO student_data (user_id, data_json, updated_at) VALUES (?, ?, ?)`,
      [userId, initialJson, now]
    );

    // Generate Signed JWT Token
    const token = jwt.sign(
      { userId, email, name },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return res.status(201).json({
      success: true,
      message: 'Student account registered and 4-digit PIN securely hashed',
      token,
      user: {
        id: userId,
        name,
        email,
        phone,
        stream,
        branch,
        semester: semester || 1
      }
    });
  } catch (error) {
    console.error('Registration Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error during student registration'
    });
  }
});

// -------------------------------------------------------------
// POST /api/auth/login - Authenticate with Email & 4-Digit PIN
// -------------------------------------------------------------
router.post('/login', authLimiter, validateLogin, async (req, res) => {
  try {
    const { email, pin, password } = req.body;

    // Parameterized lookup
    const user = await query.get(
      `SELECT id, name, email, phone, pin_hash, password_hash, stream, branch, semester 
       FROM users WHERE email = ?`,
      [email]
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials: No account found for this email'
      });
    }

    // Verify 4-digit PIN hash or password hash
    let isMatch = false;
    if (pin && user.pin_hash) {
      isMatch = await bcrypt.compare(pin, user.pin_hash);
    } else if (password && user.password_hash) {
      isMatch = await bcrypt.compare(password, user.password_hash);
    }

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid 4-digit Security PIN or password'
      });
    }

    // Fetch student's academic data
    const dataRow = await query.get(
      'SELECT data_json, updated_at FROM student_data WHERE user_id = ?',
      [user.id]
    );

    let parsedData = null;
    if (dataRow && dataRow.data_json) {
      try {
        parsedData = JSON.parse(dataRow.data_json);
      } catch (e) {
        console.warn('Failed to parse student data JSON for user:', user.id);
      }
    }

    // Issue JWT Token
    const token = jwt.sign(
      { userId: user.id, email: user.email, name: user.name },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        stream: user.stream,
        branch: user.branch,
        semester: user.semester
      },
      data: parsedData,
      dataUpdatedAt: dataRow ? dataRow.updated_at : null
    });
  } catch (error) {
    console.error('Login Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error during authentication'
    });
  }
});

// -------------------------------------------------------------
// GET /api/auth/me - Get Current Authenticated User Profile
// -------------------------------------------------------------
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await query.get(
      'SELECT id, name, email, phone, stream, branch, semester, created_at, updated_at FROM users WHERE id = ?',
      [req.user.id]
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    return res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Fetch Profile Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// -------------------------------------------------------------
// POST /api/auth/change-pin - Update 4-Digit Security PIN
// -------------------------------------------------------------
router.post('/change-pin', authenticateToken, authLimiter, validatePinChange, async (req, res) => {
  try {
    const { currentPin, newPin } = req.body;
    const userId = req.user.id;

    const user = await query.get('SELECT pin_hash FROM users WHERE id = ?', [userId]);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const isMatch = await bcrypt.compare(currentPin, user.pin_hash);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        error: 'Current 4-digit PIN is incorrect'
      });
    }

    const newPinHash = await bcrypt.hash(newPin, 12);
    const now = Date.now();

    await query.run(
      'UPDATE users SET pin_hash = ?, updated_at = ? WHERE id = ?',
      [newPinHash, now, userId]
    );

    return res.json({
      success: true,
      message: '4-Digit Security PIN updated successfully'
    });
  } catch (error) {
    console.error('Change PIN Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update security PIN'
    });
  }
});

module.exports = router;
