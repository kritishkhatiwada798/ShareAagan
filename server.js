import { handleAuthRoutes } from "./routes/authRoutes.js";
import { handleProfileRoutes } from "./routes/profileRoutes.js";
import { handleFileRoutes } from "./routes/fileRoutes.js";
import { handleNotificationRoutes } from "./routes/notificationRoutes.js";


// =========================================================
// STATIC FILE CONTENT TYPES
// =========================================================

const contentTypes = {
    ".html": "text/html",
    ".css": "text/css",
    ".js": "application/javascript",
    ".json": "application/json",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".svg": "image/svg+xml",
    ".ico": "image/x-icon"
};


// =========================================================
// GET CONTENT TYPE
// =========================================================

function getContentType(pathname) {

    const extension = pathname.substring(
        pathname.lastIndexOf(".")
    );

    return contentTypes[extension] ||
        "application/octet-stream";
}


// =========================================================
// SERVE STATIC FILES
// =========================================================

async function serveStaticFile(pathname) {

    let filePath = "." + pathname;

    // Homepage
    if (pathname === "/") {
        filePath = "./index.html";
    }

    try {

        const file = await Deno.readFile(filePath);

        return new Response(file, {
            status: 200,
            headers: {
                "Content-Type": getContentType(filePath)
            }
        });

    } catch {

        return new Response(
            "404 - File Not Found",
            {
                status: 404,
                headers: {
                    "Content-Type": "text/plain"
                }
            }
        );
    }
}


// =========================================================
// MAIN SERVER
// =========================================================

Deno.serve(async (request) => {

    const url = new URL(request.url);
    const pathname = url.pathname;


    // =====================================================
    // AUTH ROUTES
    // =====================================================

    const authResponse =
        await handleAuthRoutes(request, pathname);

    if (authResponse) {
        return authResponse;
    }


    // =====================================================
    // PROFILE ROUTES
    // =====================================================

    const profileResponse =
        await handleProfileRoutes(request, pathname);

    if (profileResponse) {
        return profileResponse;
    }


    // =====================================================
    // FILE ROUTES
    // =====================================================

    const fileResponse =
        await handleFileRoutes(request, pathname);

    if (fileResponse) {
        return fileResponse;
    }


    // =====================================================
    // NOTIFICATION ROUTES
    // =====================================================

    const notificationResponse =
        await handleNotificationRoutes(
            request,
            pathname
        );

    if (notificationResponse) {
        return notificationResponse;
    }


    // =====================================================
    // STATIC FILES
    // =====================================================

    return await serveStaticFile(pathname);
});