// app.js — единая инициализация Express и роутов
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

const app = express();

// Базовые middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Служебные и доменные роуты
app.use("/api", require("./routes/index"));
app.use("/api/auth", require("./routes/auth"));
app.use("/api/orders", require("./routes/orders"));
app.use("/api/deliveries", require("./routes/deliveries"));
app.use("/api/inventory", require("./routes/inventory"));
app.use("/api/vehicles", require("./routes/vehicles"));
app.use("/api/warehouses", require("./routes/warehouses"));
app.use("/api/products", require("./routes/products"));
app.use("/api/customers", require("./routes/customers"));
app.use("/api/agents", require("./routes/agents")); // новый маршрут агентов

// 404
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Ошибки
app.use((err, req, res, next) => {
  res
    .status(err.status || 500)
    .json({ error: err.message || "Internal server error" });
});

module.exports = app;
