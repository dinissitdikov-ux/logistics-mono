const db = require("../config/database");

(async () => {
  try {
    const { rows } = await db.query(
      "SELECT id,email,full_name,role,password_hash FROM users WHERE email=$1",
      ["admin@example.com"],
    );
    console.log(rows);
  } catch (e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
})();
