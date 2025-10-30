// server.js — hovedserver for LogisticsMono
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root-info
app.get("/", (req, res) => {
  res.json({
    message: "Logistics Backend API",
    version: "1.0.0",
    status: "running",
    endpoints: {
      health_root: "/health",
      health_api: "/api/health",
      i18n_settings: "/api/settings/i18n",
      auth: "/api/auth (register, login, profile)",
      orders: "/api/orders",
      deliveries: "/api/deliveries",
      inventory: "/api/inventory",
      vehicles: "/api/vehicles",
      warehouses: "/api/warehouses",
      products: "/api/products",
      customers: "/api/customers",
      orchestrator: "/api/orch/emit",
    },
    documentation: {
      setup: "Run npm run db:setup to initialize the database",
      authentication:
        'Most endpoints require JWT token in Authorization header as "Bearer <token)"',
      roles: ["admin", "dispatcher", "driver", "warehouse_manager"],
    },
  });
});

// Health (root)
app.get("/health", (req, res) => {
  res.json({ status: "healthy", timestamp: new Date().toISOString() });
});

// API router (health + i18n settings)
app.use("/api", require("./routes/index"));

// Domain routers
const authRoutes = require("./routes/auth");
const ordersRoutes = require("./routes/orders");
const deliveriesRoutes = require("./routes/deliveries");
const inventoryRoutes = require("./routes/inventory");
const vehiclesRoutes = require("./routes/vehicles");
const warehousesRoutes = require("./routes/warehouses");
const productsRoutes = require("./routes/products");
const customersRoutes = require("./routes/customers");

// Orchestrator router
const orchRouter = require("./routes/orchestrator");

app.use("/api/auth", authRoutes);
app.use("/api/orders", ordersRoutes);
app.use("/api/deliveries", deliveriesRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/vehicles", vehiclesRoutes);
app.use("/api/warehouses", warehousesRoutes);
app.use("/api/products", productsRoutes);
app.use("/api/customers", customersRoutes);
app.use("/api/orch", orchRouter);

// Errors
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(err.status || 500).json({
    error: err.message || "Internal server error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

// 404
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Start
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Logistics Backend API running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`API Base URL: http://0.0.0.0:${PORT}`);
  console.log(`API Documentation: http://0.0.0.0:${PORT}/`);
  console.log("Available endpoints:");
  console.log("   - GET  /health");
  console.log("   - GET  /api/health");
  console.log("   - GET  /api/settings/i18n");
  console.log("   - POST /api/auth/register");
  console.log("   - POST /api/auth/login");
  console.log("   - GET  /api/auth/profile");
  console.log("   - GET  /api/orders");
  console.log("   - GET  /api/deliveries");
  console.log("   - GET  /api/inventory");
  console.log("   - GET  /api/vehicles");
  console.log("   - GET  /api/warehouses");
  console.log("   - GET  /api/products");
  console.log("   - GET  /api/customers");
  console.log("   - POST /api/orch/emit");
  console.log('Run "npm run db:setup" to initialize the database schema');
});

module.exports = app;
