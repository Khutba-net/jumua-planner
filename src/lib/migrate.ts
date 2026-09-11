import { Pool } from "pg";
import { readdir, readFile } from "fs/promises";
import { join } from "path";
import { logger } from "./logger";

export async function runMigrations(pool: Pool, migrationsDir: string) {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id SERIAL PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    const applied = await client.query("SELECT name FROM _migrations ORDER BY id");
    const appliedSet = new Set(applied.rows.map((r: { name: string }) => r.name));

    const files = (await readdir(migrationsDir))
      .filter((f) => f.endsWith(".sql"))
      .sort();

    for (const file of files) {
      if (appliedSet.has(file)) continue;

      const sql = await readFile(join(migrationsDir, file), "utf-8");
      logger.info("Running migration", { name: file });

      await client.query("BEGIN");
      try {
        await client.query(sql);
        await client.query("INSERT INTO _migrations (name) VALUES ($1)", [file]);
        await client.query("COMMIT");
        logger.info("Migration applied", { name: file });
      } catch (err) {
        await client.query("ROLLBACK");
        logger.error("Migration failed", { name: file, error: String(err) });
        throw err;
      }
    }
  } finally {
    client.release();
  }
}
