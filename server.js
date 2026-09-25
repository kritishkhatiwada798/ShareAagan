import {
    getUsers,
    getOtherUsers,
    getUserById,
    addUser,
    getUserByEmail,
    updateUser,
    addFile,
    sendFile,
    getReceivedFiles,
    getSentFiles,
    getFileById,
    getOwnedFileById,
    deleteFile,
    createSession,
    getSessionByToken,
    deleteSession
} from "./database/db.js";


// =========================================================
// FUNCTION TO GET THE LOGGED-IN USER
// =========================================================

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


// =========================================================
// START THE DENO SERVER
// =========================================================

Deno.serve(async (request) => {

    const url = new URL(request.url);


    // =====================================================
    // REGISTER A NEW USER
    // =====================================================

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


        const hashArray = Array.from(
            new Uint8Array(passwordHash)
        );


        const hashedPassword = hashArray
            .map(byte => byte.toString(16).padStart(2, "0"))
            .join("");


        addUser(
            username,
            email,
            hashedPassword
        );


        return new Response(
            "Registration successful!",
            {
                status: 201
            }
        );

    }


    // =====================================================
    // LOGIN
    // =====================================================

    if (url.pathname === "/login" && request.method === "POST") {

        const data = await request.json();

        const email = data.email;
        const password = data.password;


        if (!email || !password) {

            return new Response(
                "Email and password are required.",
                {
                    status: 400
                }
            );

        }


        const user = getUserByEmail(email);


        if (!user) {

            return new Response(
                "Invalid email or password.",
                {
                    status: 401
                }
            );

        }


        const passwordHash = await crypto.subtle.digest(
            "SHA-256",
            new TextEncoder().encode(password)
        );


        const hashArray = Array.from(
            new Uint8Array(passwordHash)
        );


        const hashedPassword = hashArray
            .map(byte => byte.toString(16).padStart(2, "0"))
            .join("");


        if (hashedPassword !== user.password_hash) {

            return new Response(
                "Invalid email or password.",
                {
                    status: 401
                }
            );

        }


        const tokenBytes = crypto.getRandomValues(
            new Uint8Array(32)
        );


        const token = Array.from(tokenBytes)
            .map(byte => byte.toString(16).padStart(2, "0"))
            .join("");


        const expiresAt =
            Math.floor(Date.now() / 1000) +
            24 * 60 * 60;


        createSession(
            user.id,
            token,
            expiresAt
        );


        return new Response(
            "Login successful!",
            {
                status: 200,

                headers: {
                    "Set-Cookie":
                        `session_token=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=86400`
                }

            }
        );

    }


    // =====================================================
    // UPDATE PROFILE
    // =====================================================

    if (
        url.pathname === "/profile" &&
        request.method === "PUT"
    ) {

        // Get the logged-in user's ID
        const userId = getLoggedInUser(request);


        // Check if the user is logged in
        if (!userId) {

            return new Response(
                "Please log in to edit your profile.",
                {
                    status: 401
                }
            );

        }


        // Get the submitted profile information
        const data = await request.json();

        const username = data.username;
        const email = data.email;
        const newPassword = data.password;


        // Check required fields
        if (!username || !email) {

            return new Response(
                "Username and email are required.",
                {
                    status: 400
                }
            );

        }


        // Check whether another user already has this email
        const existingUser = getUserByEmail(email);


        if (
            existingUser &&
            existingUser.id !== userId
        ) {

            return new Response(
                "Email is already being used by another account.",
                {
                    status: 409
                }
            );

        }


        // Get the current user's information
        const users = getUsers();

        const currentUser = users.find(
            (user) => user.id === userId
        );


        if (!currentUser) {

            return new Response(
                "User not found.",
                {
                    status: 404
                }
            );

        }


        let passwordHash = currentUser.password_hash;


        // Only change the password if the user entered a new one
        if (newPassword) {

            const passwordHashBuffer =
                await crypto.subtle.digest(
                    "SHA-256",
                    new TextEncoder().encode(newPassword)
                );


            const hashArray = Array.from(
                new Uint8Array(passwordHashBuffer)
            );


            passwordHash = hashArray
                .map(byte => byte.toString(16).padStart(2, "0"))
                .join("");

        }


        // Update the user in SQLite
        updateUser(
            userId,
            username,
            email,
            passwordHash
        );


        return new Response(
            JSON.stringify({
                success: true,
                message: "Profile updated successfully."
            }),
            {
                status: 200,

                headers: {
                    "content-type": "application/json"
                }
            }
        );

    }


    // =====================================================
    // HANDLE FILE UPLOAD
    // =====================================================

    if (
        url.pathname === "/upload" &&
        request.method === "POST"
    ) {

        const userId = getLoggedInUser(request);


        // Check if the user is logged in
        if (!userId) {

            return new Response(
                "Please log in to upload files.",
                {
                    status: 401
                }
            );

        }


        const formData = await request.formData();

        const file = formData.get("file");


        if (!(file instanceof File)) {

            return new Response(
                "No file was uploaded.",
                {
                    status: 400
                }
            );

        }


        const filePath =
            "./uploads/" + file.name;


        const fileData =
            await file.arrayBuffer();


        await Deno.writeFile(
            filePath,
            new Uint8Array(fileData)
        );


        addFile(
            file.name,
            userId
        );


        return new Response(
            "File uploaded successfully!"
        );

    }


    // =====================================================
    // GET FILES UPLOADED BY LOGGED-IN USER
    // =====================================================

    if (
        url.pathname === "/files" &&
        request.method === "GET"
    ) {

        const userId = getLoggedInUser(request);


        if (!userId) {

            return new Response(
                "Please log in to view your files.",
                {
                    status: 401
                }
            );

        }


        const files = getFiles(userId);


        return new Response(
            JSON.stringify(files),
            {
                headers: {
                    "content-type": "application/json"
                }
            }
        );

    }

    // =========================================================
    // SEND FILE TO ANOTHER USER
    // =========================================================

    if (url.pathname === "/send-file" && request.method === "POST") {

        const senderId = getLoggedInUser(request);

        if (!senderId) {
            return new Response(
                "Please log in to send files.",
                { status: 401 }
            );
        }


        const formData = await request.formData();

        const file = formData.get("file");

        const recipientId =
            Number(formData.get("recipientId"));


        // Check file
        if (!(file instanceof File)) {

            return new Response(
                "No file was selected.",
                { status: 400 }
            );
        }


        // Check recipient
        if (!recipientId) {

            return new Response(
                "Please select a recipient.",
                { status: 400 }
            );
        }


        // Prevent sending to yourself
        if (recipientId === senderId) {

            return new Response(
                "You cannot send a file to yourself.",
                { status: 400 }
            );
        }


        // Check recipient exists
        const recipient =
            getUserById(recipientId);

        if (!recipient) {

            return new Response(
                "Recipient does not exist.",
                { status: 404 }
            );
        }


        // Save the file
        const filePath =
            "./uploads/" + file.name;

        const fileData =
            await file.arrayBuffer();


        await Deno.writeFile(
            filePath,
            new Uint8Array(fileData)
        );


        // Store file information
        sendFile(
            file.name,
            senderId,
            recipientId
        );


        return new Response(
            "File sent successfully!",
            { status: 200 }
        );
    } 

    // =====================================================
    // GET USERS
    // =====================================================

    // GET OTHER USERS
    if (url.pathname === "/users" && request.method === "GET") {

        const userId = getLoggedInUser(request);

        if (!userId) {
            return new Response(
                JSON.stringify({
                    error: "Please log in."
                }),
                {
                    status: 401,
                    headers: {
                        "content-type": "application/json"
                    }
                }
            );
        }

        const users = getOtherUsers(userId);

        return new Response(
            JSON.stringify(users),
            {
                headers: {
                    "content-type": "application/json"
                }
            }
        );
    }


    // =====================================================
    // DELETE A FILE
    // =====================================================

    if (
        url.pathname === "/delete" &&
        request.method === "POST"
    ) {

        const userId = getLoggedInUser(request);


        if (!userId) {

            return new Response(
                "Please log in to delete files.",
                {
                    status: 401
                }
            );

        }


        const data = await request.json();

        const fileId = data.fileId;


        if (!fileId) {

            return new Response(
                "File ID is required.",
                {
                    status: 400
                }
            );

        }


        // Check whether the file belongs to the logged-in user
        const file = getOwnedFileById(fileId, userId);


        if (!file) {

            return new Response(
                "You cannot delete this file.",
                {
                    status: 403
                }
            );

        }


        const filename = file.filename;

        const filePath =
            "./uploads/" + filename;


        // Delete physical file first
        try {

            await Deno.remove(filePath);

        } catch {

            return new Response(
                "File could not be deleted.",
                {
                    status: 404
                }
            );

        }


        // Delete database record
        deleteFile(
            fileId,
            userId
        );


        return new Response(
            "File deleted successfully!"
        );

    }


    // =====================================================
    // DOWNLOAD A FILE
    // =====================================================

    if (
        url.pathname === "/download" &&
        request.method === "GET"
    ) {

        const userId = getLoggedInUser(request);


        if (!userId) {

            return new Response(
                "Please log in to download files.",
                {
                    status: 401
                }
            );

        }


        const fileId =
            url.searchParams.get("id");


        if (!fileId) {

            return new Response(
                "File ID is required.",
                {
                    status: 400
                }
            );

        }


        // Find the file and check ownership
        const file = getFileById(
            fileId,
            userId
        );


        if (!file) {

            return new Response(
                "You cannot access this file.",
                {
                    status: 403
                }
            );

        }


        const filePath =
            "./uploads/" + file.filename;


        try {

            const fileData =
                await Deno.readFile(filePath);


            return new Response(
                fileData,
                {
                    headers: {
                        "Content-Disposition":
                            `attachment; filename="${file.filename}"`,

                        "Content-Type":
                            "application/octet-stream"
                    }
                }
            );

        } catch {

            return new Response(
                "File not found.",
                {
                    status: 404
                }
            );

        }

    }


    // =====================================================
    // LOGOUT
    // =====================================================

    if (
        url.pathname === "/logout" &&
        request.method === "POST"
    ) {

        const cookie =
            request.headers.get("cookie");


        if (cookie) {

            const sessionCookie = cookie
                .split("; ")
                .find((item) =>
                    item.startsWith("session_token=")
                );


            if (sessionCookie) {

                const token =
                    sessionCookie.split("=")[1];


                deleteSession(token);

            }

        }


        return new Response(
            "Logged out successfully.",
            {
                status: 200,

                headers: {
                    "Set-Cookie":
                        "session_token=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0"
                }
            }
        );

    }


    // =====================================================
    // GET LOGGED-IN USER INFORMATION
    // =====================================================

    if (
        url.pathname === "/me" &&
        request.method === "GET"
    ) {

        const userId =
            getLoggedInUser(request);


        if (!userId) {

            return new Response(
                JSON.stringify({
                    loggedIn: false
                }),
                {
                    headers: {
                        "content-type":
                            "application/json"
                    }
                }
            );

        }


        // Find the logged-in user's information
        const users = getUsers();


        const user = users.find(
            (user) => user.id === userId
        );


        if (!user) {

            return new Response(
                JSON.stringify({
                    loggedIn: false
                }),
                {
                    headers: {
                        "content-type":
                            "application/json"
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
                    "content-type":
                        "application/json"
                }
            }
        );

    }


    // =====================================================
    // SERVE FILES
    // =====================================================

    let filePath = url.pathname;


    if (filePath === "/") {
        filePath = "/index.html";
    }


    try {

        const file =
            await Deno.readFile("." + filePath);


        let contentType = "text/plain";


        if (filePath.endsWith(".html")) {

            contentType = "text/html";

        } else if (filePath.endsWith(".css")) {

            contentType = "text/css";

        } else if (filePath.endsWith(".js")) {

            contentType = "application/javascript";

        }


        return new Response(
            file,
            {
                headers: {
                    "content-type":
                        contentType
                }
            }
        );

    } catch {

        return new Response(
            "File not found",
            {
                status: 404
            }
        );

    }

});