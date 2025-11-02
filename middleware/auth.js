// middleware/auth.js
const jwt = require("jsonwebtoken");
const db = require("../config/database");

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_change_me";

function parseBearer(header) {
  if (!header) return null;
  const [type, token] = header.split(" ");
  if (type !== "Bearer" || !token) return null;
  return token.trim();
}

const authenticateToken = async (req, res, next) => {
  try {
    const token = parseBearer(req.headers.authorization);
    if (!token) return res.status(401).json({ error: "auth_token_required" });

    const payload = jwt.verify(token, JWT_SECRET);
    // загрузим пользователя (по желанию)
    const u = await db.query(
      "select id, email, full_name, role from users where id=$1",
      [payload.userId],
    );
    if (!u.rows.length)
      return res.status(401).json({ error: "user_not_found" });

    req.user = u.rows[0];
    next();
  } catch (e) {
    return res.status(401).json({ error: "auth_invalid", detail: e.message });
  }
};

const authorizeRoles =
  (...roles) =>
  (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: "forbidden" });
    }
    next();
  };

module.exports = {
  JWT_SECRET,
  authenticateToken,
  authorizeRoles,
};
