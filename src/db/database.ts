// FutureBoxes — Database initialization & migration
// Dùng expo-sqlite với SQLiteProvider pattern.

import * as SQLite from 'expo-sqlite';

const DATABASE_NAME = 'futureboxes.db';

// Singleton instance cho direct access (dùng khi ngoài Provider context)
let _db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (_db) return _db;
  _db = await SQLite.openDatabaseAsync(DATABASE_NAME);
  await migrateDbIfNeeded(_db);
  return _db;
}

export async function initDatabase(): Promise<void> {
  await getDatabase();
}

/**
 * Migration runner dựa theo PRAGMA user_version.
 * Thêm migration mới bằng cách tăng DATABASE_VERSION và append if-block.
 * KHÔNG sửa migration cũ đã release.
 */
export async function migrateDbIfNeeded(db: SQLite.SQLiteDatabase): Promise<void> {
  const DATABASE_VERSION = 2;

  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  let currentVersion = row?.user_version ?? 0;

  if (currentVersion >= DATABASE_VERSION) return;

  if (currentVersion === 0) {
    await db.execAsync(`
      PRAGMA journal_mode = 'wal';
      PRAGMA foreign_keys = ON;

      CREATE TABLE IF NOT EXISTS box (
        id            TEXT PRIMARY KEY NOT NULL,
        box_type      TEXT NOT NULL CHECK (box_type IN ('Message','Goal','Memory','Decision')),
        title         TEXT,
        content       TEXT NOT NULL,
        opening_note  TEXT,
        image_path    TEXT,
        created_at    TEXT NOT NULL,
        unlock_date   TEXT NOT NULL,
        is_opened     INTEGER NOT NULL DEFAULT 0 CHECK (is_opened IN (0,1)),
        opened_at     TEXT,
        is_deleted    INTEGER NOT NULL DEFAULT 0 CHECK (is_deleted IN (0,1))
      );

      CREATE TABLE IF NOT EXISTS reflection_question (
        id            TEXT PRIMARY KEY NOT NULL,
        box_id        TEXT NOT NULL UNIQUE,
        question_text TEXT NOT NULL,
        answer        TEXT CHECK (answer IN ('yes','no')),
        answered_at   TEXT,
        FOREIGN KEY (box_id) REFERENCES box(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS notification_schedule (
        id                      TEXT PRIMARY KEY NOT NULL,
        box_id                  TEXT NOT NULL UNIQUE,
        notification_identifier TEXT,
        scheduled_for           TEXT NOT NULL,
        is_cancelled            INTEGER NOT NULL DEFAULT 0 CHECK (is_cancelled IN (0,1)),
        FOREIGN KEY (box_id) REFERENCES box(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_box_unlock_date ON box (unlock_date);
      CREATE INDEX IF NOT EXISTS idx_box_is_opened   ON box (is_opened);
      CREATE INDEX IF NOT EXISTS idx_box_type        ON box (box_type);
      CREATE INDEX IF NOT EXISTS idx_box_list        ON box (is_deleted, is_opened, unlock_date);
      CREATE INDEX IF NOT EXISTS idx_notif_box       ON notification_schedule (box_id);
    `);
    currentVersion = 1;
  }

  if (currentVersion === 1) {
    await db.execAsync(`
      PRAGMA foreign_keys = ON;

      CREATE TABLE IF NOT EXISTS box_teaser (
        id                   TEXT PRIMARY KEY NOT NULL,
        box_id               TEXT NOT NULL,
        teaser_text          TEXT NOT NULL,
        unlock_at            TEXT NOT NULL,
        is_system_generated  INTEGER NOT NULL DEFAULT 0 CHECK (is_system_generated IN (0,1)),
        created_at           TEXT NOT NULL,
        FOREIGN KEY (box_id) REFERENCES box(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_box_teaser_box_id   ON box_teaser (box_id);
      CREATE INDEX IF NOT EXISTS idx_box_teaser_unlock_at ON box_teaser (unlock_at);
    `);
    currentVersion = 2;
  }

  await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
}
