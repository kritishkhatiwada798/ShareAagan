import { db } from "../database/db.js";


// =========================================================
// USER MODEL
// =========================================================


// Add a new user
export function addUser(username, email, passwordHash) {

    db.prepare(`
        INSERT INTO users (
            username,
            email,
            password_hash
        )
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


// Get user by ID
export function getUserById(userId) {
    return db.prepare(`
        SELECT *
        FROM users
        WHERE id = ?
    `).get(userId);
}

// Get all users except current user
export function getOtherUsers(userId) {

    return db.prepare(`
        SELECT id, username, email
        FROM users
        WHERE id != ?
        ORDER BY username ASC
    `).all(userId);

}


// Update user profile
export function updateUser(
    id,
    username,
    email,
    passwordHash
) {

    db.prepare(`
        UPDATE users
        SET
            username = ?,
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