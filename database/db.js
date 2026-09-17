import { Database } from "@db/sqlite";

const db = new Database("shareaagan.db");


// Create the users table if it doesn't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL,
    email TEXT NOT NULL,
    password_hash TEXT NOT NULL DEFAULT ''
  )
`);

// Create the sessions table if it doesn't exist
db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        token TEXT NOT NULL UNIQUE,
        expires_at INTEGER NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id)
    )
`);

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
  uploaded_at TEXT NOT NULL,
  user_id INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
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
export function addFile(filename, userId) {
  db.prepare(`
    INSERT INTO files (filename, uploaded_at, user_id)
    VALUES (?, ?, ?)
  `).run(filename, new Date().toISOString(), userId);
}

// Get files uploaded by a specific user from the database
export function getFiles(userId) {
  return db.prepare(`
    SELECT * FROM files
    WHERE user_id = ?
    ORDER BY id DESC
  `).all(userId);
}

// Get a specific file by its ID and user ID from the database
export function getFileById(fileId, userId) {
  return db.prepare(`
        SELECT *
        FROM files
        WHERE id = ?
        AND user_id = ?
    `).get(fileId, userId);
}

// Delete a file only if it belongs to the user
export function deleteFile(fileId, userId) {
  const result = db.prepare(`
        DELETE FROM files
        WHERE id = ?
        AND user_id = ?
    `).run(fileId, userId);

  return result.changes;
}

// Function to create a new session in the database
export function createSession(userId, token, expiresAt) {
  db.prepare(`
        INSERT INTO sessions (user_id, token, expires_at)
        VALUES (?, ?, ?)
    `).run(userId, token, expiresAt);
}

// Function to retrieve a session by token from the database
export function getSessionByToken(token) {
  return db.prepare(`
        SELECT *
        FROM sessions
        WHERE token = ?
    `).get(token);
}

// Function to delete a session by token from the database
export function deleteSession(token) {
  db.prepare(`
        DELETE FROM sessions
        WHERE token = ?
    `).run(token);
}