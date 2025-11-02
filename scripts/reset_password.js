const db = require("../config/database");
const bcrypt = require("bcrypt");

(async () => {
  const email = "admin@example.com";
  const newPass = "Admin1234";
  const hash = await bcrypt.hash(newPass, 10);
  await db.query("UPDATE users SET password_hash=$1 WHERE email=$2", [
    hash,
    email,
  ]);
  console.log("ok");
  process.exit(0);
})();
