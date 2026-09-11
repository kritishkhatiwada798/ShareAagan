import { getUsers } from "./database/db.js";

import { addFile, getFiles, deleteFile } from "./database/db.js";


Deno.serve(async (request) => {
    const url = new URL(request.url);

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