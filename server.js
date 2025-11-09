const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

// middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// root info
app.get("/", (req, res) => {
  res.json({
    message: "Logistics Backend API",
    status: "running",
    version: "1.0.0",
    endpoints: {
      health_root: "/health",
      health_api: "/api/health",
      i18n_settings: "/api/settings/i18n",
    },
  });
});

// health
app.get("/health", (req, res) => {
  res.json({ status: "healthy", ts: new Date().toISOString() });
});

// подключаем маршруты API (включая /api/settings/i18n)
app.use("/api", require("./routes/index"));

// доменные роуты при наличии (необязательно, оставлены как заглушки)
// try { app.use('/api/auth', require('./routes/auth')); } catch {}
// try { app.use('/api/orders', require('./routes/orders')); } catch {}

// 404
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// error handler
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res
    .status(err.status || 500)
    .json({ error: err.message || "Internal server error" });
});

// start
app.listen(PORT, "0.0.0.0", () => {
  console.log(`API running on port ${PORT}`);
});

module.exports = app;
