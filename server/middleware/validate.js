// server/middleware/validate.js - Input Validation and Sanitization
const validateRegister = (req, res, next) => {
  const { name, email, pin, stream, branch } = req.body;

  if (!name || typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 100) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error: Name must be between 2 and 100 characters'
    });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || typeof email !== 'string' || !emailRegex.test(email.trim()) || email.trim().length > 150) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error: Please provide a valid email address'
    });
  }

  if (!pin || typeof pin !== 'string' || !/^\d{4}$/.test(pin.trim())) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error: Security PIN must be exactly 4 numeric digits (e.g. 1234)'
    });
  }

  // Sanitize fields
  req.body.name = name.trim();
  req.body.email = email.trim().toLowerCase();
  req.body.pin = pin.trim();
  req.body.phone = req.body.phone ? String(req.body.phone).trim().substring(0, 20) : '';
  req.body.stream = stream ? String(stream).trim().substring(0, 100) : 'Engineering & Technology (B.Tech / BE)';
  req.body.branch = branch ? String(branch).trim().substring(0, 100) : 'Computer Science & Engineering';

  next();
};

const validateLogin = (req, res, next) => {
  const { email, pin, password } = req.body;

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || typeof email !== 'string' || !emailRegex.test(email.trim())) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error: A valid email address is required to log in'
    });
  }

  if (!pin && !password) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error: 4-digit PIN or password is required'
    });
  }

  if (pin && (typeof pin !== 'string' || !/^\d{4}$/.test(pin.trim()))) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error: PIN must be 4 numeric digits'
    });
  }

  req.body.email = email.trim().toLowerCase();
  if (pin) req.body.pin = String(pin).trim();

  next();
};

const validatePinChange = (req, res, next) => {
  const { currentPin, newPin } = req.body;

  if (!currentPin || typeof currentPin !== 'string' || !/^\d{4}$/.test(currentPin.trim())) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error: Current PIN must be 4 numeric digits'
    });
  }

  if (!newPin || typeof newPin !== 'string' || !/^\d{4}$/.test(newPin.trim())) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error: New PIN must be exactly 4 numeric digits'
    });
  }

  req.body.currentPin = currentPin.trim();
  req.body.newPin = newPin.trim();

  next();
};

module.exports = {
  validateRegister,
  validateLogin,
  validatePinChange
};
