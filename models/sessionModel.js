import { db } from "../database/db.js";


// =========================================================
// SESSION MODEL
// =========================================================


// Create session
export function createSession(
    userId,
    token,
    expiresAt
) {

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


// Delete session
export function deleteSession(token) {

    db.prepare(`
        DELETE FROM sessions
        WHERE token = ?
    `).run(token);

}