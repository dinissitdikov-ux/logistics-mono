const express = require("express");
const router = express.Router();
const agents = require("../agents");

router.get("/health", (req, res) => {
  res.json({ ok: true, service: "agents", ts: Date.now() });
});

router.post("/echo", async (req, res) => {
  try {
    const result = await agents.echo(req.body);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: "agent_error" });
  }
});

module.exports = router;
