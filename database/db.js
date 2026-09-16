import { Database } from "@db/sqlite";

const db = new Database("shareaagan.db");

// Create the users table if it doesn't exist

// Create the users table if it doesn't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL,
    email TEXT NOT NULL,
    password_hash TEXT NOT NULL DEFAULT ''
  )
`);

// Check whether password_hash already exists
const columns = db.prepare("PRAGMA table_info(users)").all();

const hasPasswordHash = columns.some(
  (column) => column.name === "password_hash"
);

// Add password_hash to an existing table if needed
if (!hasPasswordHash) {
  db.exec(`
    ALTER TABLE users
    ADD COLUMN password_hash TEXT NOT NULL DEFAULT ''
  `);
}

// Prevent duplicate email addresses
db.exec(`
  CREATE UNIQUE INDEX IF NOT EXISTS
  idx_users_email ON users(email)
`);

// Create the files table if it doesn't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS files (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT NOT NULL,
    uploaded_at TEXT NOT NULL
  )
`);

// Function to add a user to the database
export function addUser(username, email, passwordHash) {
  db.prepare(`
        INSERT INTO users (username, email, password_hash)
        VALUES (?, ?, ?)
    `).run(username, email, passwordHash);
}

// Function to retrieve a user by email from the database
export function getUserByEmail(email) {
  return db.prepare(`
        SELECT * FROM users
        WHERE email = ?
    `).get(email);
}

// Function to retrieve all users from the database
export function getUsers() {
    return db.prepare("SELECT * FROM users").all();
}

// Function to add a file to the database
export function addFile(filename) {
    db.prepare(`
    INSERT INTO files (filename, uploaded_at)
    VALUES (?, ?)
  `).run(filename, new Date().toISOString());
}

// Function to retrieve all files from the database
export function getFiles() {
    return db.prepare(`
    SELECT * FROM files
    ORDER BY id DESC
  `).all();
}

// Function to delete a file from the database
export function deleteFile(filename) {
    db.prepare(`
        DELETE FROM files
        WHERE filename = ?
    `).run(filename);
}

