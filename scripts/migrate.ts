import { Pool } from "pg";
import { join } from "path";
import { runMigrations } from "../src/lib/migrate";

async function main() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : undefined,
  });

  try {
    await runMigrations(pool, join(__dirname, "..", "migrations"));
    console.log("Migrations complete.");
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
