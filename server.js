require("dotenv").config();
const app = require("./app");

const agentsRoutes = require("./routes/agents");
app.use("/api/agents", agentsRoutes);

const PORT = process.env.PORT || 5000;

const banner = () => `
API base URL: http://0.0.0.0:${PORT}
Available endpoints:
GET   /health
GET   /api/health
POST  /api/auth/register
POST  /api/auth/login
GET   /api/orders
GET   /api/index
GET   /api/inventory
GET   /api/vehicles
GET   /api/warehouses
POST  /api/products
GET   /api/customers
POST  /api/orch/emit
GET   /api/orch/debug?ticket_id=:id
POST  /api/agents/echo
`;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(banner());
  });
}

module.exports = app;
