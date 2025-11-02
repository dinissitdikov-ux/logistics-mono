const db = require("../config/database");
const bcrypt = require("bcrypt");

(async () => {
  try {
    const { rows } = await db.query(
      "SELECT password_hash FROM users WHERE email=$1",
      ["admin@example.com"],
    );
    const ok = await bcrypt.compare("Admin1234", rows[0].password_hash);
    console.log({ match: ok });
  } catch (e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
})();
