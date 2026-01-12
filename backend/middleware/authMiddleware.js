const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;

const parseToken = (req, res, next) => {
  const rawAuth = req.headers && (req.headers.authorization || req.headers.Authorization);
  if (!rawAuth || typeof rawAuth !== 'string') {
    return next();
  }

  const authHeader = rawAuth.trim();
  if (!authHeader.startsWith('Bearer ')) {
    return next();
  }

  const parts = authHeader.split(' ');
  if (!Array.isArray(parts) || parts.length < 2) {
    return next();
  }

  const token = parts[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
  } catch (err) {
    console.warn('Invalid token provided:', err.message);
  }

  return next();
};

// Require a valid token
const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authorization required' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    return next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

module.exports = { parseToken, requireAuth };
