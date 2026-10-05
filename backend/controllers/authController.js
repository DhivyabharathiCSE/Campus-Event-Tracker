const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');
const { success, error } = require('../utils/response');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function generateToken(user) {
  return jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });
}

function sanitizeUser(user) {
  const { password, ...rest } = user;
  return rest;
}

// POST /api/auth/register
async function register(req, res, next) {
  try {
    const { name, email, password, department, year, phone } = req.body;

    if (!name || !email || !password) {
      return error(res, 'Name, email and password are required.', 400);
    }
    if (!EMAIL_REGEX.test(email)) {
      return error(res, 'Please provide a valid email address.', 400);
    }
    if (password.length < 6) {
      return error(res, 'Password must be at least 6 characters long.', 400);
    }

    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return error(res, 'An account with this email already exists.', 409);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Public registration always creates a student account.
    const [result] = await pool.query(
      `INSERT INTO users (name, email, password, department, year, phone, role)
       VALUES (?, ?, ?, ?, ?, ?, 'student')`,
      [name, email, hashedPassword, department || null, year || null, phone || null]
    );

    const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [result.insertId]);
    const user = sanitizeUser(rows[0]);
    const token = generateToken(user);

    return success(res, 'Registration successful.', { user, token }, 201);
  } catch (err) {
    next(err);
  }
}

// POST /api/auth/login
async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return error(res, 'Email and password are required.', 400);
    }

    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length === 0) {
      return error(res, 'Invalid email or password.', 401);
    }

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return error(res, 'Invalid email or password.', 401);
    }

    const token = generateToken(user);
    return success(res, 'Login successful.', { user: sanitizeUser(user), token });
  } catch (err) {
    next(err);
  }
}

// GET /api/auth/me
async function getMe(req, res, next) {
  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [req.user.id]);
    if (rows.length === 0) {
      return error(res, 'User not found.', 404);
    }
    return success(res, 'User fetched.', { user: sanitizeUser(rows[0]) });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, getMe };
