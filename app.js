// app.js
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

const app = express();

/**
 * Helmet + CSP
 * CSP влияет только на ответы с ЭТОГО домена (Render).
 * Разрешаем подключение только к самому API-домену.
 */
app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        "default-src": ["'self'"],
        "connect-src": [
          "'self'",
          "https://logistics-mono-1.onrender.com"
        ],
        "script-src": ["'self'", "'unsafe-inline'", "https:"],
        "style-src": ["'self'", "'unsafe-inline'", "https:"],
        "img-src": ["'self'", "data:", "https:"],
        "font-src": ["'self'", "https:"]
      }
    },
    crossOriginOpenerPolicy: { policy: "same-origin" },
    crossOriginResourcePolicy: { policy: "same-origin" },
    referrerPolicy: { policy: "no-referrer" }
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/**
 * CORS: разрешённые фронтенд-ориджины
 */
const allowlist = [
  "https://svalbard-360.com",
  "https://logisticsmono-api.replit.app",
  "https://logistics-mono-1.onrender.com"
];

app.use(
  cors({
    origin(origin, callback) {
      // прямой запрос без Origin (curl/сервер) — разрешаем
      if (!origin) return callback(null, true);
      if (allowlist.includes(origin)) return callback(null, true);
      return callback(new Error("Blocked by CORS"));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Origin",
      "Accept"
    ],
    credentials: true,
    optionsSuccessStatus: 200
  })
);
// preflight на любые пути
app.options("*", cors());

/**
 * Служебные эндпоинты
 */
app.get("/", (req, res) => {
  res.status(200).json({
    base: "https://logistics-mono-1.onrender.com",
    endpoints: [
      "GET  /health",
      "GET  /api/health",
      "POST /api/auth/register",
      "POST /api/auth/login",
      "GET  /api/auth/profile",
      "GET  /api/orders",
      "GET  /api/vehicles",
      "GET  /api/warehouses",
      "GET  /api/products",
      "GET  /api/customers",
      "POST /api/orch/emit",
      "GET  /api/orch/debug?ticket_id=:id",
      "POST /api/agents/echo"
    ],
    ts: new Date().toISOString()
  });
});

app.get("/health", (req, res) => {
  res.status(200).json({ status: "healthy", ts: new Date().toISOString() });
});

app.get("/api/health", (req, res) => {
  res.status(200).json({ ok: true, ts: new Date().toISOString() });
});

/**
 * Бизнес-маршруты
 */
app.use("/api/auth", require("./routes/auth"));
app.use("/api/orders", require("./routes/orders"));
app.use("/api/deliveries", require("./routes/deliveries"));
app.use("/api/inventory", require("./routes/inventory"));
app.use("/api/vehicles", require("./routes/vehicles"));
app.use("/api/warehouses", require("./routes/warehouses"));
app.use("/api/products", require("./routes/products"));
app.use("/api/customers", require("./routes/customers"));
app.use("/api/agents", require("./routes/agents"));

/**
 * 404 и ошибки
 */
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

app.use((err, req, res, next) => {
  console.error("Error", err);
  res.status(err.status || 500).json({
    error: err.message || "Internal server error"
  });
});

module.exports = app;
