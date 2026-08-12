import Database from "better-sqlite3";
import path from "path";
import { randomBytes, scryptSync, timingSafeEqual } from "crypto";

const dbPath = process.env.DB_PATH || path.join(process.cwd(), "jumua.db");

const globalForDb = globalThis as unknown as { db: Database.Database };

export const db: Database.Database =
  globalForDb.db ||
  (() => {
    const instance = new Database(dbPath);
    instance.pragma("journal_mode = WAL");
    instance.pragma("foreign_keys = ON");
    initTables(instance);
    return instance;
  })();

if (process.env.NODE_ENV !== "production") globalForDb.db = db;

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

export function toJSON(row: unknown): unknown {
  if (row === undefined || row === null) return row ?? null;
  return JSON.parse(JSON.stringify(row, (_k, v) => typeof v === "bigint" ? Number(v) : v));
}

function initTables(db: Database.Database) {
  db.exec(`
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
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
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
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS mosques (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      address TEXT,
      city TEXT,
      country TEXT,
      capacity INTEGER,
      organization_id TEXT REFERENCES organizations(id),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
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
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS sub_topics (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      week_number INTEGER NOT NULL,
      theme_id TEXT NOT NULL REFERENCES themes(id) ON DELETE CASCADE,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
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
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
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
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS feedback (
      id TEXT PRIMARY KEY,
      rating INTEGER,
      comment TEXT,
      attendance INTEGER,
      sermon_id TEXT NOT NULL REFERENCES sermons(id) ON DELETE CASCADE,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS references_ (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      source TEXT,
      url TEXT,
      content TEXT,
      sermon_id TEXT NOT NULL REFERENCES sermons(id) ON DELETE CASCADE,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_sermons_author_id ON sermons(author_id);
    CREATE INDEX IF NOT EXISTS idx_sermons_theme_id ON sermons(theme_id);
    CREATE INDEX IF NOT EXISTS idx_sermons_sub_topic_id ON sermons(sub_topic_id);
    CREATE INDEX IF NOT EXISTS idx_sermons_status ON sermons(status);
    CREATE INDEX IF NOT EXISTS idx_sermons_scheduled_date ON sermons(scheduled_date);
    CREATE INDEX IF NOT EXISTS idx_themes_owner_id ON themes(owner_id);
    CREATE INDEX IF NOT EXISTS idx_sub_topics_theme_id ON sub_topics(theme_id);
    CREATE INDEX IF NOT EXISTS idx_references_sermon_id ON references_(sermon_id);
    CREATE INDEX IF NOT EXISTS idx_feedback_sermon_id ON feedback(sermon_id);
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
  `);

  // Add columns to existing databases
  try { db.exec("ALTER TABLE users ADD COLUMN onboarding_complete INTEGER NOT NULL DEFAULT 0"); } catch {}
  try { db.exec("ALTER TABLE users ADD COLUMN planning_year INTEGER"); } catch {}
  try { db.exec("ALTER TABLE users ADD COLUMN password_hash TEXT"); } catch {}
  try { db.exec("ALTER TABLE sermons ADD COLUMN type TEXT NOT NULL DEFAULT 'friday'"); } catch {}

  // Remove UNIQUE constraint on sub_topic_id by recreating table if needed
  try {
    const tblSql = (db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='sermons'").get() as { sql: string } | undefined)?.sql ?? "";
    if (tblSql.includes("sub_topic_id TEXT UNIQUE")) {
      db.exec(`
        CREATE TABLE sermons_new (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          content TEXT DEFAULT '',
          outline TEXT DEFAULT '',
          status TEXT NOT NULL DEFAULT 'draft',
          scheduled_date TEXT,
          delivered_date TEXT,
          duration INTEGER,
          notes TEXT DEFAULT '',
          author_id TEXT NOT NULL REFERENCES users(id),
          mosque_id TEXT REFERENCES mosques(id),
          theme_id TEXT REFERENCES themes(id),
          sub_topic_id TEXT REFERENCES sub_topics(id),
          created_at TEXT NOT NULL DEFAULT (datetime('now')),
          updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        );
        INSERT INTO sermons_new SELECT * FROM sermons;
        DROP TABLE sermons;
        ALTER TABLE sermons_new RENAME TO sermons;
      `);
    }
  } catch {}

  // Seed demo user if not exists
  const demoPasswordHash = hashPassword("demo1234");
  const existing = db.prepare("SELECT id FROM users WHERE id = ?").get("demo-user");
  if (!existing) {
    db.prepare(
      "INSERT INTO users (id, firebase_uid, email, name, password_hash, role, account_type, onboarding_complete) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
    ).run("demo-user", "demo-firebase-uid", "ahmed@example.com", "Ahmed", demoPasswordHash, "khatib", "individual", 1);
  } else {
    db.prepare("UPDATE users SET email = 'ahmed@example.com', name = 'Ahmed', onboarding_complete = 1, password_hash = ? WHERE id = ?").run(demoPasswordHash, "demo-user");
  }
}
