// routes/index.js — API root router
const express = require("express");
const router = express.Router();
const pool = require("../config/database");

// Health для /api/health
router.get("/health", (req, res) => {
  res.json({
    ok: true,
    service: "logistics-mono",
    ts: new Date().toISOString(),
  });
});

// Настройки i18n из таблицы settings
router.get("/settings/i18n", async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT key, value FROM settings WHERE key IN ('allowed_doc_languages','ui_locales')",
    );
    const out = {};
    for (const r of rows) out[r.key] = r.value;
    res.json(out);
  } catch (err) {
    res.status(500).json({ error: "db_error", details: String(err) });
  }
});

module.exports = router;
