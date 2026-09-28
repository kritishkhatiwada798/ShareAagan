import { db } from "../database/db.js";


// =========================================================
// NOTIFICATION MODEL
// =========================================================


// Create notification
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


// Get notifications for user
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


// Mark notification as read
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