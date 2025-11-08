// app.js (Replit) — полная замена

const express = require("express");
const helmet = require("helmet");

const app = express();

// CSP: разрешаем исходящие fetch только к своему домену и к Render API
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

// Health для проверки
app.get("/health", (_req, res) => {
  res.status(200).json({ ok: true, ts: new Date().toISOString() });
});

// Статичный ответ по умолчанию (чтобы страница открывалась)
app.get("/", (_req, res) => {
  res
    .status(200)
    .type("text/plain")
    .send("Replit proxy is up. Use fetch() from this origin to call Render.");
});

// 404
app.use((_req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Старт сервера
const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Replit server running at http://0.0.0.0:${PORT}`);
});
