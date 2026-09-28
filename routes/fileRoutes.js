import {
    uploadFile,
    getUserFiles,
    sendFileToUser,
    getUsersForFileSharing,
    removeFile,
    downloadFile,
    getReceivedFileList,
    getSentFileList
} from "../controllers/fileController.js";

export async function handleFileRoutes(request, pathname) {

    if (pathname === "/upload" && request.method === "POST") {
        return await uploadFile(request);
    }

    if (pathname === "/files" && request.method === "GET") {
        return await getUserFiles(request);
    }

    if (pathname === "/send-file" && request.method === "POST") {
        return await sendFileToUser(request);
    }

    if (pathname === "/users" && request.method === "GET") {
        return await getUsersForFileSharing(request);
    }

    if (pathname === "/delete" && request.method === "POST") {
        return await removeFile(request);
    }

    if (pathname === "/download" && request.method === "GET") {
        return await downloadFile(request);
    }

    if (pathname === "/received-files" && request.method === "GET") {
        return await getReceivedFileList(request);
    }

    if (pathname === "/sent-files" && request.method === "GET") {
        return await getSentFileList(request);
    }

    return null;
}