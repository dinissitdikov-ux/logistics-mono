// routes/auth.js
const express = require("express");
const { body } = require("express-validator");
const {
  register,
  login,
  getProfile,
} = require("../controllers/authController");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

router.post(
  "/register",
  body("email").isEmail().withMessage("invalid_email"),
  body("password").isLength({ min: 6 }).withMessage("weak_password"),
  async (req, res, next) => {
    const { validationResult } = require("express-validator");
    const errs = validationResult(req);
    if (!errs.isEmpty()) {
      return res
        .status(400)
        .json({ error: "validation_error", details: errs.array() });
    }
    return register(req, res, next);
  },
);

router.post(
  "/login",
  body("email").isEmail(),
  body("password").isLength({ min: 1 }),
  async (req, res, next) => {
    const { validationResult } = require("express-validator");
    const errs = validationResult(req);
    if (!errs.isEmpty()) {
      return res
        .status(400)
        .json({ error: "validation_error", details: errs.array() });
    }
    return login(req, res, next);
  },
);

router.get("/profile", authenticateToken, getProfile);

module.exports = router;
