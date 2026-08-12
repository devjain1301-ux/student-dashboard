// server/middleware/upload.js - Safe File Upload Middleware with Strict Validation
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const baseUploadDir = path.resolve(__dirname, '../uploads');
if (!fs.existsSync(baseUploadDir)) {
  fs.mkdirSync(baseUploadDir, { recursive: true });
}

// Allowed MIME types and extensions
const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp'
]);

const ALLOWED_EXTENSIONS = new Set([
  '.pdf',
  '.jpg',
  '.jpeg',
  '.png',
  '.webp'
]);

const DANGEROUS_EXTENSIONS = new Set([
  '.exe', '.bat', '.cmd', '.sh', '.php', '.phtml', '.js', '.ts', 
  '.py', '.rb', '.pl', '.cgi', '.jar', '.vbs', '.scr', '.html', '.htm', '.svg'
]);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const userId = req.user ? req.user.id : 'temp';
    const userDir = path.join(baseUploadDir, userId);
    
    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir, { recursive: true });
    }
    cb(null, userDir);
  },
  filename: (req, file, cb) => {
    // Generate safe random hex filename to prevent path traversal & overwrites
    const randomName = crypto.randomBytes(16).toString('hex');
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${randomName}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();

  // 1. Block dangerous executable extensions
  if (DANGEROUS_EXTENSIONS.has(ext)) {
    return cb(new Error('Security Error: Uploading executable or script files is strictly prohibited.'), false);
  }

  // 2. Verify allowed extension
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return cb(new Error('Validation Error: Only PDF documents and standard images (JPEG, PNG, WebP) are allowed.'), false);
  }

  // 3. Verify MIME type
  if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
    return cb(new Error('Validation Error: Invalid file content type.'), false);
  }

  cb(null, true);
};

const maxSizeBytes = parseInt(process.env.MAX_UPLOAD_BYTES, 10) || 15 * 1024 * 1024; // 15MB

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: maxSizeBytes,
    files: 1 // Single file per upload request
  }
});

module.exports = { upload, baseUploadDir };
