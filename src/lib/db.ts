import { Pool, PoolClient, QueryResultRow } from "pg";
import { randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { join } from "path";
import { runMigrations } from "./migrate";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : undefined,
});

let initialized = false;

export async function getPool() {
  if (!initialized) {
    await runMigrations(pool, join(process.cwd(), "migrations"));
    await seedDemoUser();
    initialized = true;
  }
  return pool;
}

export async function query<T extends QueryResultRow = QueryResultRow>(
  sql: string,
  params?: unknown[]
): Promise<T[]> {
  await getPool();
  const result = await pool.query<T>(sql, params);
  return result.rows;
}

export async function queryOne<T extends QueryResultRow = QueryResultRow>(
  sql: string,
  params?: unknown[]
): Promise<T | null> {
  const rows = await query<T>(sql, params);
  return rows[0] ?? null;
}

export async function exec(sql: string, params?: unknown[]): Promise<number> {
  await getPool();
  const result = await pool.query(sql, params);
  return result.rowCount ?? 0;
}

export function cuid() {
  return randomBytes(12).toString("hex");
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const hashBuffer = Buffer.from(hash, "hex");
  const supplied = scryptSync(password, salt, 64);
  return timingSafeEqual(hashBuffer, supplied);
}

export async function withTransaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  await getPool();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

export function toJSON(row: unknown): unknown {
  if (row === undefined || row === null) return row ?? null;
  return JSON.parse(JSON.stringify(row, (_k, v) => typeof v === "bigint" ? Number(v) : v));
}

async function seedDemoUser() {
  const existing = await pool.query("SELECT id FROM users WHERE id = $1", ["demo-user"]);
  if (existing.rows.length === 0) {
    const demoPasswordHash = hashPassword("demo1234");
    await pool.query(
      "INSERT INTO users (id, firebase_uid, email, name, password_hash, role, account_type, onboarding_complete) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
      ["demo-user", "demo-firebase-uid", "ahmed@example.com", "Ahmed", demoPasswordHash, "khatib", "individual", 1]
    );
  }
}
