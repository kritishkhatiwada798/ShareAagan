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

        return new Response("File uploaded successfully!");
    }

    // Get list of uploaded files
    if (url.pathname === "/files" && request.method === "GET") {

        const files = [];

        for await (const entry of Deno.readDir("./uploads")) {
            if (entry.isFile) {
                files.push(entry.name);
            }
        }

        return new Response(JSON.stringify(files), {
            headers: {
                "content-type": "application/json"
            }
        });
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