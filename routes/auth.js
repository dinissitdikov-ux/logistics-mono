// routes/auth.js — аутентификация
const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');

const { authenticateToken } = require('../middleware/auth');
const { register, login, getProfile } = require('../controllers/authController');

// POST /api/auth/register
router.post(
  '/register',
  body('email').isEmail(),
  body('password').isLength({ min: 6 }).withMessage('weak_password'),
  body('full_name').isString().isLength({ min: 1 }),
  async (req, res, next) => {
    const errs = validationResult(req);
    if (!errs.isEmpty()) {
      return res.status(400).json({ error: 'validation_error', details: errs.array() });
    }
    return register(req, res, next);
  }
);

// POST /api/auth/login
router.post(
  '/login',
  body('email').isEmail(),
  body('password').isLength({ min: 1 }),
  async (req, res, next) => {
    const errs = validationResult(req);
    if (!errs.isEmpty()) {
      return res.status(400).json({ error: 'validation_error', details: errs.array() });
    }
    return login(req, res, next);
  }
);

// GET /api/auth/profile
router.get('/profile', authenticateToken, getProfile);

module.exports = router;
