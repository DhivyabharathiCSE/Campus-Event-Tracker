const jwt = require('jsonwebtoken');
const { error } = require('../utils/response');

// Verifies the JWT and attaches { id, role } to req.user
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return error(res, 'Authentication required. Please log in.', 401);
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.id, role: decoded.role };
    next();
  } catch (err) {
    return error(res, 'Session expired or invalid token. Please log in again.', 401);
  }
}

// Must be used AFTER authenticate. Only allows role === 'admin'.
function authorizeAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return error(res, 'Access denied. Admin privileges required.', 403);
  }
  next();
}

// Must be used AFTER authenticate. Only allows role === 'student'.
function authorizeStudent(req, res, next) {
  if (!req.user || req.user.role !== 'student') {
    return error(res, 'Access denied. This action is only available to students.', 403);
  }
  next();
}

module.exports = { authenticate, authorizeAdmin, authorizeStudent };
