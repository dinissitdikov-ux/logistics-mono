// routes/agents.js
const { Router } = require("express");
const router = Router();

/* Простой эхо-эндпоинт для проверки CORS/JSON */
router.post("/echo", (req, res) => {
  const payload = req.body || {};
  res.json({ ok: true, output: payload, confidence: 1 });
});

module.exports = router;
