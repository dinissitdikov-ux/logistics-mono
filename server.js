// server.js
require("dotenv").config();
const app = require("./app");

// Render передаёт порт через env.PORT
const PORT = process.env.PORT || 3000;

const banner = () => `
API base URL: http://0.0.0.0:${PORT}
Available endpoints:
GET  /            (index)
GET  /health
GET  /api/health
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/profile
GET  /api/orders
GET  /api/vehicles
GET  /api/warehouses
GET  /api/products
GET  /api/customers
POST /api/orch/emit
GET  /api/orch/debug?ticket_id=:id
POST /api/agents/echo
`;

const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(banner());
});

// корректное завершение
const shutdown = (signal) => {
  console.log(`\nReceived ${signal}, shutting down...`);
  server.close(() => {
    console.log("HTTP server closed");
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10000).unref();
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

module.exports = app;
