import { Pool, PoolClient, QueryResultRow } from "pg";
import { randomBytes, scryptSync, timingSafeEqual } from "crypto";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : undefined,
});

let initialized = false;

export async function getPool() {
  if (!initialized) {
    await initTables();
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

async function initTables() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        firebase_uid TEXT UNIQUE,
        email TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        password_hash TEXT,
        role TEXT NOT NULL DEFAULT 'khatib',
        account_type TEXT NOT NULL DEFAULT 'individual',
        avatar_url TEXT,
        phone TEXT,
        bio TEXT,
        organization_id TEXT,
        onboarding_complete INTEGER NOT NULL DEFAULT 0,
        planning_year INTEGER,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS organizations (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL DEFAULT 'organization',
        address TEXT,
        city TEXT,
        country TEXT,
        website TEXT,
        phone TEXT,
        description TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS mosques (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        address TEXT,
        city TEXT,
        country TEXT,
        capacity INTEGER,
        organization_id TEXT REFERENCES organizations(id),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS themes (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        month INTEGER NOT NULL,
        year INTEGER NOT NULL,
        color TEXT,
        organization_id TEXT REFERENCES organizations(id),
        owner_id TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS sub_topics (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        week_number INTEGER NOT NULL,
        theme_id TEXT NOT NULL REFERENCES themes(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS sermons (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        content TEXT DEFAULT '',
        outline TEXT DEFAULT '',
        status TEXT NOT NULL DEFAULT 'draft',
        type TEXT NOT NULL DEFAULT 'friday',
        scheduled_date TEXT,
        delivered_date TEXT,
        duration INTEGER,
        notes TEXT DEFAULT '',
        author_id TEXT NOT NULL REFERENCES users(id),
        mosque_id TEXT REFERENCES mosques(id),
        theme_id TEXT REFERENCES themes(id),
        sub_topic_id TEXT REFERENCES sub_topics(id),
        original_theme_id TEXT REFERENCES themes(id),
        is_override INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS user_settings (
        user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        default_language TEXT NOT NULL DEFAULT 'ar-first',
        word_target INTEGER NOT NULL DEFAULT 2500,
        theme_mode TEXT NOT NULL DEFAULT 'light',
        editor_font_size INTEGER NOT NULL DEFAULT 16,
        friday_reminder TEXT NOT NULL DEFAULT '3',
        email_assigned INTEGER NOT NULL DEFAULT 1,
        weekly_digest INTEGER NOT NULL DEFAULT 1,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS feedback (
        id TEXT PRIMARY KEY,
        rating INTEGER,
        comment TEXT,
        attendance INTEGER,
        sermon_id TEXT NOT NULL REFERENCES sermons(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS references_ (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        source TEXT,
        url TEXT,
        content TEXT,
        sermon_id TEXT NOT NULL REFERENCES sermons(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS org_members (
        id TEXT PRIMARY KEY,
        organization_id TEXT NOT NULL REFERENCES organizations(id),
        user_id TEXT REFERENCES users(id),
        mosque_id TEXT REFERENCES mosques(id),
        name TEXT NOT NULL,
        email TEXT,
        role TEXT NOT NULL DEFAULT 'khatib',
        status TEXT NOT NULL DEFAULT 'invited',
        invite_code TEXT UNIQUE,
        invite_expires_at TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token TEXT UNIQUE NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token TEXT UNIQUE NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL,
        used INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS friday_assignments (
        id TEXT PRIMARY KEY,
        organization_id TEXT NOT NULL REFERENCES organizations(id),
        mosque_id TEXT REFERENCES mosques(id),
        member_id TEXT REFERENCES org_members(id),
        friday_date TEXT NOT NULL,
        guest_name TEXT,
        status TEXT NOT NULL DEFAULT 'assigned',
        swap_reason TEXT,
        notes TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE(organization_id, mosque_id, friday_date)
      );
    `);

    // Add mosque_id columns to existing tables (safe to run multiple times)
    await client.query(`ALTER TABLE org_members ADD COLUMN IF NOT EXISTS mosque_id TEXT REFERENCES mosques(id)`).catch(() => {});
    await client.query(`ALTER TABLE friday_assignments ADD COLUMN IF NOT EXISTS mosque_id TEXT REFERENCES mosques(id)`).catch(() => {});
    await client.query(`ALTER TABLE themes ADD COLUMN IF NOT EXISTS mosque_id TEXT REFERENCES mosques(id)`).catch(() => {});
    await client.query(`ALTER TABLE sermons ADD COLUMN IF NOT EXISTS original_theme_id TEXT REFERENCES themes(id)`).catch(() => {});
    await client.query(`ALTER TABLE sermons ADD COLUMN IF NOT EXISTS is_override INTEGER NOT NULL DEFAULT 0`).catch(() => {});
    await client.query(`ALTER TABLE sermons ADD COLUMN IF NOT EXISTS language TEXT NOT NULL DEFAULT 'ar'`).catch(() => {});
    await client.query(`ALTER TABLE sermons ADD COLUMN IF NOT EXISTS translation_of TEXT REFERENCES sermons(id)`).catch(() => {});
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified INTEGER NOT NULL DEFAULT 0`).catch(() => {});

    await client.query(`
      CREATE TABLE IF NOT EXISTS email_verification_tokens (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        code TEXT NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL,
        used INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `).catch(() => {});

    await client.query(`CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_sermons_author_id ON sermons(author_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_sermons_theme_id ON sermons(theme_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_sermons_sub_topic_id ON sermons(sub_topic_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_sermons_status ON sermons(status)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_sermons_scheduled_date ON sermons(scheduled_date)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_themes_owner_id ON themes(owner_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_sub_topics_theme_id ON sub_topics(theme_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_references_sermon_id ON references_(sermon_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_feedback_sermon_id ON feedback(sermon_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_org_members_org_id ON org_members(organization_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_org_members_user_id ON org_members(user_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_org_members_invite_code ON org_members(invite_code)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_friday_assignments_org_date ON friday_assignments(organization_id, friday_date)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_friday_assignments_member ON friday_assignments(member_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_org_members_mosque_id ON org_members(mosque_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_friday_assignments_mosque_id ON friday_assignments(mosque_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_mosques_org_id ON mosques(organization_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at)`);

    // Seed demo user if not exists
    const demoPasswordHash = hashPassword("demo1234");
    const existing = await client.query("SELECT id FROM users WHERE id = $1", ["demo-user"]);
    if (existing.rows.length === 0) {
      await client.query(
        "INSERT INTO users (id, firebase_uid, email, name, password_hash, role, account_type, onboarding_complete) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
        ["demo-user", "demo-firebase-uid", "ahmed@example.com", "Ahmed", demoPasswordHash, "khatib", "individual", 1]
      );
    }
  } finally {
    client.release();
  }
}
