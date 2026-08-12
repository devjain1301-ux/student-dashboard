// server/routes/documents.routes.js - Secure Document & PDF Management API
const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { query } = require('../config/db');
const { authenticateToken } = require('../middleware/auth');
const { upload, baseUploadDir } = require('../middleware/upload');
const { uploadLimiter } = require('../middleware/rateLimiter');

// All routes require valid JWT authentication
router.use(authenticateToken);

// -------------------------------------------------------------
// POST /api/documents/upload - Upload Study Note / Document Safely
// -------------------------------------------------------------
router.post('/upload', uploadLimiter, (req, res) => {
  upload.single('file')(req, res, async (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        error: err.message || 'File upload failed'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file was uploaded'
      });
    }

    try {
      const docId = 'doc_' + Date.now() + '_' + crypto.randomBytes(4).toString('hex');
      const userId = req.user.id;
      const now = Date.now();

      await query.run(
        `INSERT INTO documents (id, user_id, filename, original_name, mime_type, size_bytes, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [docId, userId, req.file.filename, req.file.originalname, req.file.mimetype, req.file.size, now]
      );

      return res.status(201).json({
        success: true,
        message: 'Document uploaded and stored securely',
        document: {
          id: docId,
          name: req.file.originalname,
          filename: req.file.filename,
          mimeType: req.file.mimetype,
          size: (req.file.size / 1024).toFixed(1) + ' KB',
          sizeBytes: req.file.size,
          uploadedAt: now
        }
      });
    } catch (dbErr) {
      console.error('Document DB Save Error:', dbErr);
      // Clean up uploaded file if DB insert fails
      if (req.file && req.file.path && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(500).json({
        success: false,
        error: 'Failed to record document metadata'
      });
    }
  });
});

// -------------------------------------------------------------
// GET /api/documents - List User's Uploaded Documents
// -------------------------------------------------------------
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;

    // Strict parameterized isolation by user_id
    const docs = await query.all(
      `SELECT id, original_name as name, filename, mime_type, size_bytes, created_at 
       FROM documents 
       WHERE user_id = ? 
       ORDER BY created_at DESC`,
      [userId]
    );

    const formatted = docs.map(d => ({
      id: d.id,
      name: d.name,
      filename: d.filename,
      mimeType: d.mime_type,
      size: (d.size_bytes / 1024).toFixed(1) + ' KB',
      sizeBytes: d.size_bytes,
      createdAt: d.created_at
    }));

    return res.json({
      success: true,
      documents: formatted
    });
  } catch (error) {
    console.error('List Documents Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to list documents'
    });
  }
});

// -------------------------------------------------------------
// GET /api/documents/:id - Download / Stream Document Securely
// -------------------------------------------------------------
router.get('/:id', async (req, res) => {
  try {
    const userId = req.user.id;
    const docId = req.params.id;

    // Parameterized ownership verification - strictly enforces isolation
    const doc = await query.get(
      'SELECT filename, original_name, mime_type FROM documents WHERE id = ? AND user_id = ?',
      [docId, userId]
    );

    if (!doc) {
      return res.status(404).json({
        success: false,
        error: 'Document not found or unauthorized access'
      });
    }

    const filePath = path.join(baseUploadDir, userId, doc.filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        error: 'File not found on storage server'
      });
    }

    res.setHeader('Content-Type', doc.mime_type || 'application/octet-stream');
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(doc.original_name)}"`);
    res.setHeader('X-Content-Type-Options', 'nosniff');

    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error('Download Document Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to download document'
    });
  }
});

// -------------------------------------------------------------
// DELETE /api/documents/:id - Delete Document
// -------------------------------------------------------------
router.delete('/:id', async (req, res) => {
  try {
    const userId = req.user.id;
    const docId = req.params.id;

    // Verify ownership
    const doc = await query.get(
      'SELECT filename FROM documents WHERE id = ? AND user_id = ?',
      [docId, userId]
    );

    if (!doc) {
      return res.status(404).json({
        success: false,
        error: 'Document not found or unauthorized'
      });
    }

    // Delete from database
    await query.run('DELETE FROM documents WHERE id = ? AND user_id = ?', [docId, userId]);

    // Delete physical file safely
    const filePath = path.join(baseUploadDir, userId, doc.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    return res.json({
      success: true,
      message: 'Document deleted successfully'
    });
  } catch (error) {
    console.error('Delete Document Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete document'
    });
  }
});

module.exports = router;
