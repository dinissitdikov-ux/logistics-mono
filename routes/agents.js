const express = require("express");
const router = express.Router();
const agents = require("../agents");

router.post("/echo", async (req, res) => {
  try {
    const result = await agents.echo(req.body);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: "agent_error" });
  }
});

module.exports = router;
