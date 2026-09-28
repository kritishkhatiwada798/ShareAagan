import { db } from "../database/db.js";


// =========================================================
// FILE MODEL
// =========================================================


// Add a normal uploaded file
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


// Send a file to another user
export function sendFile(
    filename,
    senderId,
    recipientId
) {

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


// Get files sent by user
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


// Get files received by user
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


// Get file if user is sender OR recipient
export function getFileById(
    fileId,
    userId
) {

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


// Get file owned by sender
export function getOwnedFileById(
    fileId,
    userId
) {

    return db.prepare(`
        SELECT *
        FROM files
        WHERE id = ?
        AND user_id = ?
    `).get(
        fileId,
        userId
    );

}


// Delete file
export function deleteFile(
    fileId,
    userId
) {

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