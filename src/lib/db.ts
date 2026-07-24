import Database from "better-sqlite3";
import path from "path";
import { randomBytes } from "crypto";

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
      role TEXT NOT NULL DEFAULT 'khatib',
      account_type TEXT NOT NULL DEFAULT 'individual',
      avatar_url TEXT,
      phone TEXT,
      bio TEXT,
      organization_id TEXT,
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
      scheduled_date TEXT,
      delivered_date TEXT,
      duration INTEGER,
      notes TEXT DEFAULT '',
      author_id TEXT NOT NULL REFERENCES users(id),
      mosque_id TEXT REFERENCES mosques(id),
      theme_id TEXT REFERENCES themes(id),
      sub_topic_id TEXT UNIQUE REFERENCES sub_topics(id),
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
  `);

  // Seed demo user if not exists
  const existing = db.prepare("SELECT id FROM users WHERE id = ?").get("demo-user");
  if (!existing) {
    db.prepare(
      "INSERT INTO users (id, firebase_uid, email, name, role, account_type) VALUES (?, ?, ?, ?, ?, ?)"
    ).run("demo-user", "demo-firebase-uid", "ahmed@example.com", "Ahmed", "khatib", "individual");
  }
}
