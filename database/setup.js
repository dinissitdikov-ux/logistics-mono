// Norsk: Enkel migrasjonskjører for PostgreSQL
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function run() {
  // Norsk: Finn og sorter SQL-filer
  const dir = path.join(__dirname, 'migrations');
  const files = fs.readdirSync(dir)
    .filter(f => f.endsWith('.sql'))
    .sort(); // 0001_..., 0002_...

  console.log('Migrations:', files);

  const client = await pool.connect();
  try {
    for (const f of files) {
      const sql = fs.readFileSync(path.join(dir, f), 'utf8');
      console.log(`Kjører: ${f}`);
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('COMMIT');
      console.log(`OK: ${f}`);
    }
  } catch (e) {
    console.error('Feil:', e);
    try { await client.query('ROLLBACK'); } catch {}
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

run();
