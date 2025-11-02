const express = require("express");
const { authenticateToken, authorizeRoles } = require("../middleware/auth");

const router = express.Router();

router.use(authenticateToken);

// GET /api/customers
router.get("/", async (req, res) => {
  return res.json({
    customers: [{ id: 1, name: "Tech Solutions Inc" }],
    count: 1,
  });
});

// POST /api/customers (пример, защищено ролями)
router.post("/", authorizeRoles("admin", "dispatcher"), async (req, res) => {
  const c = req.body || {};
  return res.status(201).json({ created: c });
});

module.exports = router;
