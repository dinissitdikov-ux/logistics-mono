// Norsk: Hovedruter for API
const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// Norsk: Enkel health-sjekk
router.get('/health', (req, res) => {
  res.json({ ok: true, service: 'logistics-mono', ts: new Date().toISOString() });
});

// Norsk: Hent i18n-innstillinger fra settings-tabellen
router.get('/settings/i18n', async (req, res) => {
  try {
    const q = `SELECT key, value FROM settings WHERE key IN ('allowed_doc_languages','ui_locales')`;
    const { rows } = await pool.query(q);
    const out = {};
    for (const r of rows) out[r.key] = r.value;
    res.json(out);
  } catch (err) {
    res.status(500).json({ error: 'db_error', details: String(err) });
  }
});

module.exports = router;
