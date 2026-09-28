import { Database } from "@db/sqlite";


// =========================================================
// DATABASE CONNECTION
// =========================================================

export const db = new Database("shareaagan.db");


// =========================================================
// DATABASE TABLES
// =========================================================


// =========================================================
// USERS TABLE
// =========================================================

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL,
    email TEXT NOT NULL,
    password_hash TEXT NOT NULL DEFAULT ''
  )
`);


// =========================================================
// SESSIONS TABLE
// =========================================================

db.exec(`
  CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    token TEXT NOT NULL UNIQUE,
    expires_at INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )
`);


// =========================================================
// FILES TABLE
// =========================================================

db.exec(`
  CREATE TABLE IF NOT EXISTS files (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT NOT NULL,
    uploaded_at TEXT NOT NULL,
    user_id INTEGER NOT NULL,
    recipient_id INTEGER,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (recipient_id) REFERENCES users(id)
  )
`);


// =========================================================
// NOTIFICATIONS TABLE
// =========================================================

db.exec(`
  CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    message TEXT NOT NULL,
    file_id INTEGER,
    is_read INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (file_id) REFERENCES files(id)
  )
`);


// =========================================================
// DATABASE INDEXES
// =========================================================

// Prevent duplicate email addresses

db.exec(`
  CREATE UNIQUE INDEX IF NOT EXISTS
  idx_users_email ON users(email)
`);


// =========================================================
// DATABASE MIGRATIONS
// =========================================================


// ---------------------------------------------------------
// Check users table
// ---------------------------------------------------------

const userColumns = db.prepare(
  "PRAGMA table_info(users)"
).all();

const hasPasswordHash = userColumns.some(
  (column) => column.name === "password_hash"
);


// Add password_hash if it doesn't exist

if (!hasPasswordHash) {

  db.exec(`
    ALTER TABLE users
    ADD COLUMN password_hash TEXT NOT NULL DEFAULT ''
  `);

}


// ---------------------------------------------------------
// Check files table
// ---------------------------------------------------------

const fileColumns = db.prepare(
  "PRAGMA table_info(files)"
).all();

const hasRecipientId = fileColumns.some(
  (column) => column.name === "recipient_id"
);


// Add recipient_id if it doesn't exist

if (!hasRecipientId) {

  db.exec(`
    ALTER TABLE files
    ADD COLUMN recipient_id INTEGER
  `);

}