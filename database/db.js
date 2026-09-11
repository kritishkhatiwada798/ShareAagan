import { Database } from "@db/sqlite";

const db = new Database("shareaagan.db");

// Create the users table if it doesn't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL,
    email TEXT NOT NULL
  )
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
export function addUser(username, email) {
    db.prepare(`
    INSERT INTO users (username, email)
    VALUES (?, ?)
  `).run(username, email);
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