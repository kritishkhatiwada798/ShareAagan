import {
    getUserNotifications,
    markNotificationRead
} from "../controllers/notificationController.js";

export async function handleNotificationRoutes(request, pathname) {

    if (
        pathname === "/notifications" &&
        request.method === "GET"
    ) {
        return await getUserNotifications(request);
    }

    if (
        pathname === "/notifications/read" &&
        request.method === "POST"
    ) {
        return await markNotificationRead(request);
    }

    return null;
}