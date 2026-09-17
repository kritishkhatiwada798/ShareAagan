import {
    getUsers,
    addUser,
    getUserByEmail,
    addFile,
    getFiles,
    getFileById,
    deleteFile,
    createSession,
    getSessionByToken,
    deleteSession
} from "./database/db.js";


// Function to get the logged-in user from the request
function getLoggedInUser(request) {
    const cookie = request.headers.get("cookie");

    console.log("Cookie received:", cookie);

    if (!cookie) {
        return null;
    }

    const sessionCookie = cookie
        .split("; ")
        .find((item) => item.startsWith("session_token="));

    if (!sessionCookie) {
        return null;
    }

    const token = sessionCookie.split("=")[1];

    const session = getSessionByToken(token);

    console.log("Session found:", session);

    if (!session) {
        return null;
    }


    console.log("Session expiry:", session.expires_at);
    console.log("Current time:", Date.now());
    console.log("User ID:", session.user_id);

    if (session.expires_at < Math.floor(Date.now() / 1000)) {
        return null;
    }

    return session.user_id;
}

// Start the Deno server
Deno.serve(async (request) => {
    const url = new URL(request.url);


    // Register a new user
    if (url.pathname === "/register" && request.method === "POST") {
        const data = await request.json();

        const username = data.username;
        const email = data.email;
        const password = data.password;

        if (!username || !email || !password) {
            return new Response("All fields are required.", {
                status: 400
            });
        }

        if (getUserByEmail(email)) {
            return new Response("Email already registered.", {
                status: 409
            });
        }

        const passwordHash = await crypto.subtle.digest(
            "SHA-256",
            new TextEncoder().encode(password)
        );

        const hashArray = Array.from(new Uint8Array(passwordHash));
        const hashedPassword = hashArray
            .map(byte => byte.toString(16).padStart(2, "0"))
            .join("");

        addUser(username, email, hashedPassword);

        return new Response("Registration successful!", {
            status: 201
        });
    }

    // Login an existing user
    if (url.pathname === "/login" && request.method === "POST") {
        const data = await request.json();

        const email = data.email;
        const password = data.password;

        if (!email || !password) {
            return new Response("Email and password are required.", {
                status: 400
            });
        }

        const user = getUserByEmail(email);

        if (!user) {
            return new Response("Invalid email or password.", {
                status: 401
            });
        }

        const passwordHash = await crypto.subtle.digest(
            "SHA-256",
            new TextEncoder().encode(password)
        );

        const hashArray = Array.from(new Uint8Array(passwordHash));
        const hashedPassword = hashArray
            .map(byte => byte.toString(16).padStart(2, "0"))
            .join("");

        if (hashedPassword !== user.password_hash) {
            return new Response("Invalid email or password.", {
                status: 401
            });
        }

        const tokenBytes = crypto.getRandomValues(new Uint8Array(32));

        const token = Array.from(tokenBytes)
            .map(byte => byte.toString(16).padStart(2, "0"))
            .join("");

        const expiresAt = Math.floor(Date.now() / 1000) + 24 * 60 * 60;

        createSession(user.id, token, expiresAt);

        return new Response("Login successful!", {
            status: 200,
            headers: {
                "Set-Cookie": `session_token=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=86400`
            }

        });
    }

    // Handle file upload
    if (url.pathname === "/upload" && request.method === "POST") {

        const userId = getLoggedInUser(request);
        // Check if the user is logged in
        if (!userId) {
            return new Response("Please log in to upload files.", {
                status: 401
            });
        }

        const formData = await request.formData();

        const file = formData.get("file");

        if (!(file instanceof File)) {
            return new Response("No file was uploaded.", {
                status: 400
            });
        }

        const filePath = "./uploads/" + file.name;

        const fileData = await file.arrayBuffer();

        await Deno.writeFile(filePath, new Uint8Array(fileData));

        addFile(file.name, userId);

        return new Response("File uploaded successfully!");
    }

    // Get files uploaded by the logged-in user
    if (url.pathname === "/files" && request.method === "GET") {

        const userId = getLoggedInUser(request);

        if (!userId) {
            return new Response("Please log in to view your files.", {
                status: 401
            });
        }

        const files = getFiles(userId);

        return new Response(JSON.stringify(files), {
            headers: {
                "content-type": "application/json"
            }
        });
    }

    // Get users from database
    if (url.pathname === "/users" && request.method === "GET") {
        const users = getUsers();

        return new Response(JSON.stringify(users), {
            headers: {
                "content-type": "application/json"
            }
        });
    }

    // Delete a file
    if (url.pathname === "/delete" && request.method === "POST") {

        const userId = getLoggedInUser(request);

        if (!userId) {
            return new Response("Please log in to delete files.", {
                status: 401
            });
        }

        const data = await request.json();

        const fileId = data.fileId;

        if (!fileId) {
            return new Response("File ID is required.", {
                status: 400
            });
        }

        // Check whether the file belongs to the logged-in user
        const file = getFileById(fileId, userId);

        if (!file) {
            return new Response("You cannot delete this file.", {
                status: 403
            });
        }

        const filename = file.filename;
        const filePath = "./uploads/" + filename;

        // Delete the physical file first
        try {
            await Deno.remove(filePath);
        } catch {
            return new Response("File could not be deleted.", {
                status: 404
            });
        }

        // Delete the database record only after the physical file was deleted
        deleteFile(fileId, userId);

        return new Response("File deleted successfully!");
    }

    // Download a file
    if (url.pathname === "/download" && request.method === "GET") {

        const userId = getLoggedInUser(request);

        if (!userId) {
            return new Response("Please log in to download files.", {
                status: 401
            });
        }

        const fileId = url.searchParams.get("id");

        if (!fileId) {
            return new Response("File ID is required.", {
                status: 400
            });
        }

        // Find the file and check ownership
        const file = getFileById(fileId, userId);

        if (!file) {
            return new Response("You cannot access this file.", {
                status: 403
            });
        }

        const filePath = "./uploads/" + file.filename;

        try {
            const fileData = await Deno.readFile(filePath);

            return new Response(fileData, {
                headers: {
                    "Content-Disposition": `attachment; filename="${file.filename}"`,
                    "Content-Type": "application/octet-stream"
                }
            });

        } catch {
            return new Response("File not found.", {
                status: 404
            });
        }
    }


    // Logout
    if (url.pathname === "/logout" && request.method === "POST") {

        const cookie = request.headers.get("cookie");

        if (cookie) {
            const sessionCookie = cookie
                .split("; ")
                .find((item) =>
                    item.startsWith("session_token=")
                );

            if (sessionCookie) {
                const token = sessionCookie.split("=")[1];

                deleteSession(token);
            }
        }

        return new Response("Logged out successfully.", {
            status: 200,
            headers: {
                "Set-Cookie":
                    "session_token=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0"
            }
        });
    }

    // Endpoint to check if the user is logged in and get their information
    if (url.pathname === "/me" && request.method === "GET") {

        const userId = getLoggedInUser(request);

        if (!userId) {
            return new Response(
                JSON.stringify({
                    loggedIn: false
                }),
                {
                    headers: {
                        "content-type": "application/json"
                    }
                }
            );
        }

        // Find the logged-in user's information
        const users = getUsers();

        const user = users.find((user) => user.id === userId);

        if (!user) {
            return new Response(
                JSON.stringify({
                    loggedIn: false
                }),
                {
                    headers: {
                        "content-type": "application/json"
                    }
                }
            );
        }

        return new Response(
            JSON.stringify({
                loggedIn: true,
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email
                }
            }),
            {
                headers: {
                    "content-type": "application/json"
                }
            }
        );
    }


    // Serve files
    let filePath = url.pathname;

    if (filePath === "/") {
        filePath = "/index.html";
    }

    try {
        const file = await Deno.readFile("." + filePath);

        let contentType = "text/plain";

        if (filePath.endsWith(".html")) {
            contentType = "text/html";
        } else if (filePath.endsWith(".css")) {
            contentType = "text/css";
        } else if (filePath.endsWith(".js")) {
            contentType = "application/javascript";
        }

        return new Response(file, {
            headers: {
                "content-type": contentType
            }
        });

    } catch {
        return new Response("File not found", {
            status: 404
        });
    }
});