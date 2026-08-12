// server/routes/student.routes.js - Isolated Student Academic Data API
const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { query } = require('../config/db');
const { authenticateToken } = require('../middleware/auth');
const { apiLimiter } = require('../middleware/rateLimiter');

// All routes require valid JWT authentication
router.use(authenticateToken);
router.use(apiLimiter);

// -------------------------------------------------------------
// GET /api/student/data - Fetch Authenticated User's Academic Data
// -------------------------------------------------------------
router.get('/data', async (req, res) => {
  try {
    const userId = req.user.id;

    // Strict parameterized isolation by user_id
    const row = await query.get(
      'SELECT data_json, updated_at FROM student_data WHERE user_id = ?',
      [userId]
    );

    if (!row || !row.data_json) {
      return res.status(404).json({
        success: false,
        error: 'No academic data found for this account'
      });
    }

    const data = JSON.parse(row.data_json);

    return res.json({
      success: true,
      data,
      updatedAt: row.updated_at
    });
  } catch (error) {
    console.error('Fetch Student Data Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve academic data'
    });
  }
});

// -------------------------------------------------------------
// PUT /api/student/data - Save / Update Full Student Data
// -------------------------------------------------------------
router.put('/data', async (req, res) => {
  try {
    const userId = req.user.id;
    const { data } = req.body;

    if (!data || typeof data !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'Invalid student data payload'
      });
    }

    const dataJson = JSON.stringify(data);
    const now = Date.now();

    // Parameterized Upsert strictly scoped to req.user.id
    await query.run(
      `INSERT INTO student_data (user_id, data_json, updated_at)
       VALUES (?, ?, ?)
       ON CONFLICT(user_id) DO UPDATE SET
         data_json = excluded.data_json,
         updated_at = excluded.updated_at`,
      [userId, dataJson, now]
    );

    // Also update profile summary on users table if present
    if (data.profile) {
      const p = data.profile;
      await query.run(
        `UPDATE users SET 
           name = COALESCE(?, name),
           phone = COALESCE(?, phone),
           stream = COALESCE(?, stream),
           branch = COALESCE(?, branch),
           semester = COALESCE(?, semester),
           updated_at = ?
         WHERE id = ?`,
        [p.name || null, p.phone || null, p.stream || null, p.branch || null, p.semester || null, now, userId]
      );
    }

    return res.json({
      success: true,
      message: 'Student data saved securely',
      updatedAt: now
    });
  } catch (error) {
    console.error('Save Student Data Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to save student data'
    });
  }
});

// -------------------------------------------------------------
// POST /api/student/sync - Non-Destructive Two-Way Sync
// -------------------------------------------------------------
router.post('/sync', async (req, res) => {
  try {
    const userId = req.user.id;
    const { clientData, clientUpdatedAt } = req.body;

    const row = await query.get(
      'SELECT data_json, updated_at FROM student_data WHERE user_id = ?',
      [userId]
    );

    const now = Date.now();
    const serverUpdatedAt = row ? row.updated_at : 0;
    const clientTime = parseInt(clientUpdatedAt, 10) || 0;

    // Case 1: Client has never saved, or server has newer data
    if (row && serverUpdatedAt > clientTime && row.data_json) {
      const serverData = JSON.parse(row.data_json);
      return res.json({
        success: true,
        action: 'server_to_client',
        data: serverData,
        updatedAt: serverUpdatedAt
      });
    }

    // Case 2: Client has newer data, save to server
    if (clientData && typeof clientData === 'object') {
      const dataJson = JSON.stringify(clientData);
      await query.run(
        `INSERT INTO student_data (user_id, data_json, updated_at)
         VALUES (?, ?, ?)
         ON CONFLICT(user_id) DO UPDATE SET
           data_json = excluded.data_json,
           updated_at = excluded.updated_at`,
        [userId, dataJson, now]
      );

      return res.json({
        success: true,
        action: 'client_to_server',
        updatedAt: now
      });
    }

    // Default: No change needed
    return res.json({
      success: true,
      action: 'in_sync',
      updatedAt: serverUpdatedAt
    });
  } catch (error) {
    console.error('Sync Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Synchronization failed'
    });
  }
});

// -------------------------------------------------------------
// POST /api/student/study-session - Log Focus Study & XP
// -------------------------------------------------------------
router.post('/study-session', async (req, res) => {
  try {
    const userId = req.user.id;
    const { subject, durationMins, xpEarned, notes } = req.body;

    if (!subject || !durationMins) {
      return res.status(400).json({
        success: false,
        error: 'Subject and duration are required'
      });
    }

    const sessionId = 'ses_' + Date.now() + '_' + crypto.randomBytes(3).toString('hex');
    const now = Date.now();

    await query.run(
      `INSERT INTO study_sessions (id, user_id, subject, duration_mins, xp_earned, notes, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [sessionId, userId, subject.trim(), parseInt(durationMins, 10), parseInt(xpEarned, 10) || 30, notes ? notes.trim() : null, now]
    );

    return res.status(201).json({
      success: true,
      message: 'Study session logged securely',
      sessionId
    });
  } catch (error) {
    console.error('Study Session Log Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to log study session'
    });
  }
});

module.exports = router;
