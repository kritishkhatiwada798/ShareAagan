Deno.serve(async (request) => {
    const url = new URL(request.url);

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