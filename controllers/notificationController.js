import {
    getNotifications,
    markNotificationAsRead
} from "../models/notificationModel.js";

import {
    getLoggedInUser
} from "./authController.js";


// =========================================================
// NOTIFICATION CONTROLLER
// =========================================================


// =========================================================
// GET NOTIFICATIONS
// =========================================================

export function getUserNotifications(request) {

    const userId =
        getLoggedInUser(request);


    if (!userId) {

        return new Response(
            JSON.stringify({
                error: "Please log in."
            }),
            {
                status: 401,

                headers: {
                    "content-type":
                        "application/json"
                }
            }
        );

    }


    const notifications =
        getNotifications(userId);


    return new Response(
        JSON.stringify(notifications),
        {
            headers: {
                "content-type":
                    "application/json"
            }
        }
    );
}


// =========================================================
// MARK NOTIFICATION AS READ
// =========================================================

export async function markNotificationRead(request) {

    const userId =
        getLoggedInUser(request);


    if (!userId) {

        return new Response(
            "Please log in.",
            {
                status: 401
            }
        );

    }


    const data =
        await request.json();


    const notificationId =
        data.notificationId;


    if (!notificationId) {

        return new Response(
            "Notification ID is required.",
            {
                status: 400
            }
        );

    }


    markNotificationAsRead(
        notificationId,
        userId
    );


    return new Response(
        "Notification marked as read."
    );
}