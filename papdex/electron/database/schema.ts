import database from "./connection";

database.exec(`
    CREATE TABLE IF NOT EXISTS academic_years (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        name        TEXT NOT NULL,
        start_date  TEXT,
        end_date    TEXT,
        created_at  TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS semesters (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        year_id     INTEGER NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
        name        TEXT NOT NULL,
        start_date  TEXT,
        end_date    TEXT,
        created_at  TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS subjects (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        semester_id INTEGER NOT NULL REFERENCES semesters(id) ON DELETE CASCADE,
        name        TEXT NOT NULL,
        is_favorite INTEGER NOT NULL DEFAULT 0,
        created_at  TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS virtual_folders (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        subject_id  INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
        name        TEXT NOT NULL,
        created_at  TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS files (
        id              INTEGER PRIMARY KEY AUTOINCREMENT,
        subject_id      INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
        folder_id       INTEGER REFERENCES virtual_folders(id) ON DELETE SET NULL,
        file_name       TEXT NOT NULL,
        file_path       TEXT NOT NULL UNIQUE,
        file_type       TEXT NOT NULL,
        file_size       INTEGER,
        created_at      TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS user (
        id           INTEGER PRIMARY KEY DEFAULT 1,
        display_name TEXT NOT NULL DEFAULT 'Student',
        avatar_path  TEXT,
        theme        TEXT NOT NULL DEFAULT 'dark'
    );
`)

database.prepare("INSERT OR IGNORE INTO user (id) VALUES (1)").run()
