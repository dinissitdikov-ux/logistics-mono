const express = require("express");
const router = express.Router();
const pool = require("../config/database"); // Используем общий пул PG

// Health
router.get("/health", (req, res) => {
  res.json({
    ok: true,
    service: "logistics-mono",
    ts: new Date().toISOString(),
  });
});

// GET /api/settings/i18n — чтение allowed_doc_languages и ui_locales из settings
router.get("/settings/i18n", async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT key, value FROM settings WHERE key IN ('allowed_doc_languages','ui_locales')",
    );
    const out = {};
    for (const r of rows) out[r.key] = r.value;
    // Если ключей нет — отдаём пустые заготовки
    if (!out.allowed_doc_languages)
      out.allowed_doc_languages = { languages: [] };
    if (!out.ui_locales) out.ui_locales = { supported: [], default: null };
    res.json(out);
  } catch (err) {
    console.error("GET /settings/i18n error:", err);
    res.status(500).json({ error: "db_error", details: String(err) });
  }
});

// POST /api/settings/i18n — обновление allowed_doc_languages и/или ui_locales
// Ожидаемый JSON:
// {
//   "allowed_doc_languages": { "languages": ["nb-NO","en-GB","ru-RU"] },
//   "ui_locales": { "supported": ["nb-NO","en-GB","ru-RU"], "default": "nb-NO" }
// }
router.post("/settings/i18n", async (req, res) => {
  try {
    const payload = req.body || {};
    const updates = [];

    // Валидация allowed_doc_languages
    if (payload.allowed_doc_languages) {
      const langs = payload.allowed_doc_languages.languages;
      if (
        !Array.isArray(langs) ||
        langs.some((l) => typeof l !== "string" || !l.length)
      ) {
        return res.status(400).json({ error: "invalid_allowed_doc_languages" });
      }
      updates.push({
        key: "allowed_doc_languages",
        value: { languages: Array.from(new Set(langs)) },
      });
    }

    // Валидация ui_locales
    if (payload.ui_locales) {
      const { supported, default: def } = payload.ui_locales;
      if (
        !Array.isArray(supported) ||
        supported.some((l) => typeof l !== "string" || !l.length)
      ) {
        return res.status(400).json({ error: "invalid_ui_locales_supported" });
      }
      if (def && typeof def !== "string") {
        return res.status(400).json({ error: "invalid_ui_locales_default" });
      }
      if (def && !supported.includes(def)) {
        return res.status(400).json({ error: "default_not_in_supported" });
      }
      updates.push({
        key: "ui_locales",
        value: {
          supported: Array.from(new Set(supported)),
          default: def || null,
        },
      });
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: "empty_payload" });
    }

    // Транзакционное upsert
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      for (const u of updates) {
        await client.query(
          `INSERT INTO settings(key, value) VALUES ($1, $2::jsonb)
           ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
          [u.key, JSON.stringify(u.value)],
        );
      }
      await client.query("COMMIT");
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }

    res.json({ ok: true, updated: updates.map((u) => u.key) });
  } catch (err) {
    console.error("POST /settings/i18n error:", err);
    res.status(500).json({ error: "db_error", details: String(err) });
  }
});

module.exports = router;
