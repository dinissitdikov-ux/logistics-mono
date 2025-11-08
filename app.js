const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

const app = express();

// Helmet + CSP: разрешаем fetch на Render и общие ресурсы
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
    }
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const allowlist = [
  "https://svalbard-360.com",
  "https://logisticsmono-api.replit.app",
  "https://logistics-mono-1.onrender.com"
];

app.use(
  cors({
    origin: function (origin, callback) {
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
    preflightContinue: false,
    optionsSuccessStatus: 200
  })
);
app.options("*", cors());

// health
app.get("/health", (req, res) => {
  res.status(200).json({ status: "healthy", ts: new Date().toISOString() });
});
app.get("/api/health", (req, res) => {
  res.status(200).json({ ok: true, ts: new Date().toISOString() });
});

// routes
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

// errors
app.use((err, req, res, next) => {
  console.error("Error", err);
  res.status(err.status || 500).json({
    error: err.message || "Internal server error"
  });
});

module.exports = app;
