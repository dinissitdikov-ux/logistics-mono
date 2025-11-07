const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

const app = express();

// CORS: читаем список доменов из переменной окружения (через запятую)
const allowed = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map(s => s.trim())
  .filter(Boolean);
const allowAll = allowed.length === 0;

const corsOptions = {
  origin: function (origin, cb) {
    if (!origin) return cb(null, true);               // локальные запросы/скрипты
    if (allowAll) return cb(null, true);              // если список пуст — разрешаем всё
    if (allowed.includes(origin)) return cb(null, true);
    return cb(null, false);
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Origin", "Accept"],
  exposedHeaders: ["Content-Length", "ETag"],
  credentials: true,
  maxAge: 86400
};

// Безопасность и парсинг
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Базовые и служебные маршруты
app.get("/health", (req, res) =>
  res.json({ status: "healthy", timestamp: new Date().toISOString() })
);
app.use("/api", require("./routes/index"));
app.get("/api/health", (req, res) =>
  res.json({ ok: true, service: "logistics-mono", ts: new Date().toISOString() })
);

// Доменные модули
app.use("/api/auth", require("./routes/auth"));
app.use("/api/orders", require("./routes/orders"));
app.use("/api/deliveries", require("./routes/deliveries"));
app.use("/api/inventory", require("./routes/inventory"));
app.use("/api/vehicles", require("./routes/vehicles"));
app.use("/api/warehouses", require("./routes/warehouses"));
app.use("/api/products", require("./routes/products"));
app.use("/api/customers", require("./routes/customers"));
app.use("/api/agents", require("./routes/agents"));

// 404
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Ошибки
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(err.status || 500).json({
    error: err.message || "Internal server error"
  });
});

module.exports = app;
