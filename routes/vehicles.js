const express = require("express");
const { authenticateToken, authorizeRoles } = require("../middleware/auth");

const router = express.Router();

router.use(authenticateToken);

// GET /api/vehicles
router.get("/", async (req, res) => {
  return res.json({
    vehicles: [
      { id: 1, plate: "TRUCK-001", type: "truck", capacity_kg: 12000 },
      { id: 2, plate: "VAN-002", type: "van", capacity_kg: 1200 },
    ],
    count: 2,
  });
});

// POST /api/vehicles (пример, защищено ролями)
router.post("/", authorizeRoles("admin", "dispatcher"), async (req, res) => {
  const v = req.body || {};
  return res.status(201).json({ created: v });
});

module.exports = router;
