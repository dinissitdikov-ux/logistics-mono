// config/database.js
// Инициализация пула PostgreSQL с поддержкой SSL (Neon/Cloud) и локального режима.
// Поддерживает DATABASE_URL или набор отдельных переменных окружения.

const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");

// Опционально подтягиваем .env в dev
try {
  require("dotenv").config();
} catch (_) {}

const {
  DATABASE_URL,
  PGHOST,
  PGPORT,
  PGDATABASE,
  PGUSER,
  PGPASSWORD,
  NODE_ENV,
  PGSSL, // 'require' | 'true' | 'false' (перекрывает авто)
  PGSSL_CA_PATH, // путь к CA, если нужно pin-ить сертификат
} = process.env;

function buildConfig() {
  // 1) Если есть DATABASE_URL — используем его (рекомендуется для Neon)
  if (DATABASE_URL) {
    const base = { connectionString: DATABASE_URL };

    // SSL: по умолчанию включаем для prod/Neon. Можно управлять PGSSL.
    let ssl;
    if (PGSSL && PGSSL.toLowerCase() !== "false") {
      ssl = { rejectUnauthorized: false };
    } else if (!PGSSL && NODE_ENV === "production") {
      ssl = { rejectUnauthorized: false };
    }

    // При наличии кастомного CA
    if (PGSSL_CA_PATH) {
      const ca = fs.readFileSync(path.resolve(PGSSL_CA_PATH), "utf8");
      ssl = { ca, rejectUnauthorized: true };
    }

    return ssl ? { ...base, ssl } : base;
  }

  // 2) Иначе собираем по отдельным переменным (удобно для локалки)
  const cfg = {
    host: PGHOST || "127.0.0.1",
    port: PGPORT ? Number(PGPORT) : 5432,
    database: PGDATABASE || "postgres",
    user: PGUSER || "postgres",
    password: PGPASSWORD || "",
  };

  // Для локальной разработки SSL обычно не нужен
  if (PGSSL && PGSSL.toLowerCase() !== "false") {
    cfg.ssl = { rejectUnauthorized: false };
  }

  return cfg;
}

const pool = new Pool(buildConfig());

// Лёгкий хелпер для логирования ошибок соединения
pool.on("error", (err) => {
  console.error("[pg] unexpected error on idle client:", err.message);
});

// Унифицированный хелпер запросов
async function query(text, params) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    return res;
  } finally {
    const ms = Date.now() - start;
    // При необходимости можно включить лог SQL по флагу
    if (process.env.LOG_SQL === "1") {
      console.log(`[sql ${ms}ms] ${text} :: ${JSON.stringify(params || [])}`);
    }
  }
}

module.exports = {
  pool,
  query,
};
