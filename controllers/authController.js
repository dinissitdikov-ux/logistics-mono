// controllers/authController.js
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../config/database");
const { JWT_SECRET } = require("../middleware/auth");

const normEmail = (s) =>
  String(s || "")
    .trim()
    .toLowerCase();

exports.register = async (req, res) => {
  try {
    const email = normEmail(req.body.email);
    const password = String(req.body.password || "");
    const full_name = String(req.body.full_name || "").trim();
    const role = req.body.role ? String(req.body.role) : "driver";

    if (!email || !password) {
      return res.status(400).json({ error: "email_and_password_required" });
    }

    const dup = await db.query("select id from users where email=$1", [email]);
    if (dup.rows.length) {
      return res.status(409).json({ error: "email_already_registered" });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const ins = await db.query(
      `insert into users (email, password_hash, full_name, role)
       values ($1,$2,$3,$4)
       returning id, email, full_name, role, created_at`,
      [email, password_hash, full_name, role],
    );

    const user = ins.rows[0];
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "7d" },
    );

    return res.status(201).json({
      message: "registered",
      user,
      token,
    });
  } catch (e) {
    return res
      .status(500)
      .json({ error: "registration_failed", detail: e.message });
  }
};

exports.login = async (req, res) => {
  try {
    const email = normEmail(req.body.email);
    const password = String(req.body.password || "");

    if (!email || !password) {
      return res.status(400).json({ error: "email_and_password_required" });
    }

    const q = await db.query("select * from users where email=$1", [email]);
    if (!q.rows.length) {
      return res.status(401).json({ error: "invalid_credentials" });
    }

    const user = q.rows[0];
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      return res.status(401).json({ error: "invalid_credentials" });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "7d" },
    );

    return res.json({
      message: "login_ok",
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
      },
      token,
    });
  } catch (e) {
    return res.status(500).json({ error: "login_failed", detail: e.message });
  }
};

exports.getProfile = async (req, res) => {
  return res.json({ user: req.user || null });
};
