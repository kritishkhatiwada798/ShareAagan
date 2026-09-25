import { Database } from "@db/sqlite";

const db = new Database("shareaagan.db");


// =========================================================
// DATABASE TABLES
// =========================================================


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

// Create the files table if it doesn't exist
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
// DATABASE MIGRATIONS
// =========================================================


// Check whether password_hash already exists
const userColumns = db.prepare(
  "PRAGMA table_info(users)"
).all();

const hasPasswordHash = userColumns.some(
  (column) => column.name === "password_hash"
);


// Add password_hash to an existing users table if needed
if (!hasPasswordHash) {
  db.exec(`
    ALTER TABLE users
    ADD COLUMN password_hash TEXT NOT NULL DEFAULT ''
  `);
}


// Check whether recipient_id already exists
const fileColumns = db.prepare(
  "PRAGMA table_info(files)"
).all();

const hasRecipientId = fileColumns.some(
  (column) => column.name === "recipient_id"
);


// Add recipient_id to an existing files table if needed
if (!hasRecipientId) {
  db.exec(`
    ALTER TABLE files
    ADD COLUMN recipient_id INTEGER
  `);
}


// =========================================================
// USER FUNCTIONS
// =========================================================


// Add a user
export function addUser(username, email, passwordHash) {

  db.prepare(`
    INSERT INTO users (username, email, password_hash)
    VALUES (?, ?, ?)
  `).run(
    username,
    email,
    passwordHash
  );

}


// Get user by email
export function getUserByEmail(email) {

  return db.prepare(`
    SELECT *
    FROM users
    WHERE email = ?
  `).get(email);

}


// Get all users
export function getUsers() {

  return db.prepare(`
    SELECT id, username, email
    FROM users
    ORDER BY username ASC
  `).all();

}

// Get a user by ID
export function getUserById(userId) {

  return db.prepare(`
    SELECT id, username, email
    FROM users
    WHERE id = ?
  `).get(userId);

}


// Get all users except the currently logged-in user
export function getOtherUsers(userId) {

  return db.prepare(`
    SELECT id, username, email
    FROM users
    WHERE id != ?
    ORDER BY username ASC
  `).all(userId);

}


// Update a user's profile
export function updateUser(id, username, email, passwordHash) {

  db.prepare(`
    UPDATE users
    SET username = ?,
        email = ?,
        password_hash = ?
    WHERE id = ?
  `).run(
    username,
    email,
    passwordHash,
    id
  );

}



// =========================================================
// FILE FUNCTIONS
// =========================================================


// Existing function
// Keeps compatibility with your current upload system
export function addFile(filename, userId) {

  db.prepare(`
    INSERT INTO files (
      filename,
      uploaded_at,
      user_id
    )
    VALUES (?, ?, ?)
  `).run(
    filename,
    new Date().toISOString(),
    userId
  );

}


// New function for sending a file to another user
export function sendFile(filename, senderId, recipientId) {

  const result = db.prepare(`
    INSERT INTO files (
      filename,
      uploaded_at,
      user_id,
      recipient_id
    )
    VALUES (?, ?, ?, ?)
  `).run(
    filename,
    new Date().toISOString(),
    senderId,
    recipientId
  );

  return result.lastInsertRowId;

}


// Get files sent by a specific user
export function getSentFiles(userId) {

  return db.prepare(`
    SELECT
      files.*,
      users.username AS recipient_username
    FROM files
    LEFT JOIN users
      ON files.recipient_id = users.id
    WHERE files.user_id = ?
    ORDER BY files.id DESC
  `).all(userId);

}


// Get files received by a specific user
export function getReceivedFiles(userId) {

  return db.prepare(`
    SELECT
      files.*,
      users.username AS sender_username
    FROM files
    LEFT JOIN users
      ON files.user_id = users.id
    WHERE files.recipient_id = ?
    ORDER BY files.id DESC
  `).all(userId);

}


// Get a specific file sent or received by the user
export function getFileById(fileId, userId) {
  return db.prepare(`
    SELECT *
    FROM files
    WHERE id = ?
    AND (
      user_id = ?
      OR recipient_id = ?
    )
  `).get(
    fileId,
    userId,
    userId
  );
}

// Get a specific file owned by the user (sent by the user)
export function getOwnedFileById(fileId, userId) {
  return db.prepare(`
    SELECT *
    FROM files
    WHERE id = ?
    AND user_id = ?
  `).get(fileId, userId);
}


// Delete a file only if the current user
// is the sender
export function deleteFile(fileId, userId) {

  const result = db.prepare(`
    DELETE FROM files
    WHERE id = ?
    AND user_id = ?
  `).run(
    fileId,
    userId
  );

  return result.changes;

}

// =========================================================
// NOTIFICATIONS
// =========================================================

// Create a notification
export function createNotification(
  userId,
  message,
  fileId = null
) {

  db.prepare(`
    INSERT INTO notifications (
      user_id,
      message,
      file_id,
      is_read,
      created_at
    )
    VALUES (?, ?, ?, 0, ?)
  `).run(
    userId,
    message,
    fileId,
    new Date().toISOString()
  );

}


// Get notifications for a user
export function getNotifications(userId) {

  return db.prepare(`
    SELECT *
    FROM notifications
    WHERE user_id = ?
    ORDER BY id DESC
  `).all(userId);

}


// Get unread notification count
export function getUnreadNotificationCount(userId) {

  const result = db.prepare(`
    SELECT COUNT(*) AS count
    FROM notifications
    WHERE user_id = ?
    AND is_read = 0
  `).get(userId);

  return result.count;

}


// Mark a notification as read
export function markNotificationAsRead(
  notificationId,
  userId
) {

  return db.prepare(`
    UPDATE notifications
    SET is_read = 1
    WHERE id = ?
    AND user_id = ?
  `).run(
    notificationId,
    userId
  );

}


// =========================================================
// SESSION FUNCTIONS
// =========================================================


// Create a new session
export function createSession(userId, token, expiresAt) {

  db.prepare(`
    INSERT INTO sessions (
      user_id,
      token,
      expires_at
    )
    VALUES (?, ?, ?)
  `).run(
    userId,
    token,
    expiresAt
  );

}


// Get session by token
export function getSessionByToken(token) {

  return db.prepare(`
    SELECT *
    FROM sessions
    WHERE token = ?
  `).get(token);

}


// Delete session by token
export function deleteSession(token) {

  db.prepare(`
    DELETE FROM sessions
    WHERE token = ?
  `).run(token);

}