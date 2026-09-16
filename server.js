import {
    getUsers,
    addUser,
    getUserByEmail,
    addFile,
    getFiles,
    deleteFile
} from "./database/db.js";


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

    // Handle file upload
    if (url.pathname === "/upload" && request.method === "POST") {
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

        addFile(file.name);

        return new Response("File uploaded successfully!");
    }

    // Get list of uploaded files
    if (url.pathname === "/files" && request.method === "GET") {

        const files = getFiles();

        const filenames = files.map((file) => file.filename);

        return new Response(JSON.stringify(filenames), {
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
        const data = await request.json();

        const filename = data.filename;

        if (!filename) {
            return new Response("Filename is required.", {
                status: 400
            });
        }

        const filePath = "./uploads/" + filename;

        try {
            await Deno.remove(filePath);
            deleteFile(filename);

            return new Response("File deleted successfully!");
        } catch {
            return new Response("File not found.", {
                status: 404
            });
        }
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