import {
    addFile,
    sendFile,
    getSentFiles,
    getReceivedFiles,
    getFileById,
    getOwnedFileById,
    deleteFile
} from "../models/fileModel.js";

import {
    getUserById,
    getOtherUsers
} from "../models/userModel.js";

import {
    createNotification
} from "../models/notificationModel.js";

import {
    getLoggedInUser
} from "./authController.js";


// =========================================================
// FILE CONTROLLER
// =========================================================


// =========================================================
// UPLOAD FILE
// =========================================================

export async function uploadFile(request) {

    // Get logged-in user

    const userId =
        getLoggedInUser(request);


    if (!userId) {

        return new Response(
            "Please log in to upload files.",
            {
                status: 401
            }
        );

    }


    // Get uploaded form data

    const formData =
        await request.formData();


    const file =
        formData.get("file");


    // Check file

    if (!(file instanceof File)) {

        return new Response(
            "No file was uploaded.",
            {
                status: 400
            }
        );

    }


    // Save physical file

    const filePath =
        "./uploads/" + file.name;


    const fileData =
        await file.arrayBuffer();


    await Deno.writeFile(
        filePath,
        new Uint8Array(fileData)
    );


    // Save file information
    // to database

    addFile(
        file.name,
        userId
    );


    return new Response(
        "File uploaded successfully!"
    );
}


// =========================================================
// GET USER'S FILES
// =========================================================

export function getUserFiles(request) {

    const userId =
        getLoggedInUser(request);


    if (!userId) {

        return new Response(
            "Please log in to view your files.",
            {
                status: 401
            }
        );

    }


    /*
     * Your old server.js used getFiles().
     *
     * That function does not exist in the
     * current Model layer.
     *
     * We return the files sent by the user
     * here so the endpoint remains useful.
     */

    const files =
        getSentFiles(userId);


    return new Response(
        JSON.stringify(files),
        {
            headers: {
                "content-type":
                    "application/json"
            }
        }
    );
}


// =========================================================
// SEND FILE TO ANOTHER USER
// =========================================================

export async function sendFileToUser(request) {

    // Get sender

    const senderId =
        getLoggedInUser(request);


    if (!senderId) {

        return new Response(
            "Please log in to send files.",
            {
                status: 401
            }
        );

    }


    // Get form data

    const formData =
        await request.formData();


    const file =
        formData.get("file");


    const recipientId =
        Number(
            formData.get("recipientId")
        );


    // Check file

    if (!(file instanceof File)) {

        return new Response(
            "No file was selected.",
            {
                status: 400
            }
        );

    }


    // Check recipient

    if (!recipientId) {

        return new Response(
            "Please select a recipient.",
            {
                status: 400
            }
        );

    }


    // Prevent sending to yourself

    if (recipientId === senderId) {

        return new Response(
            "You cannot send a file to yourself.",
            {
                status: 400
            }
        );

    }


    // Check recipient exists

    const recipient =
        getUserById(recipientId);


    if (!recipient) {

        return new Response(
            "Recipient does not exist.",
            {
                status: 404
            }
        );

    }


    // Save physical file

    const filePath =
        "./uploads/" + file.name;


    const fileData =
        await file.arrayBuffer();


    await Deno.writeFile(
        filePath,
        new Uint8Array(fileData)
    );


    // Save file information

    const fileId =
        sendFile(
            file.name,
            senderId,
            recipientId
        );


    // Get sender information

    const sender =
        getUserById(senderId);


    // Create notification

    createNotification(
        recipientId,
        `${sender.username} sent you a file: ${file.name}`,
        fileId
    );


    return new Response(
        "File sent successfully!",
        {
            status: 200
        }
    );
}


// =========================================================
// GET OTHER USERS
// =========================================================

export function getUsersForFileSharing(request) {

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


    const users =
        getOtherUsers(userId);


    return new Response(
        JSON.stringify(users),
        {
            headers: {
                "content-type":
                    "application/json"
            }
        }
    );
}


// =========================================================
// DELETE FILE
// =========================================================

export async function removeFile(request) {

    const userId =
        getLoggedInUser(request);


    if (!userId) {

        return new Response(
            "Please log in to delete files.",
            {
                status: 401
            }
        );

    }


    const data =
        await request.json();


    const fileId =
        data.fileId;


    if (!fileId) {

        return new Response(
            "File ID is required.",
            {
                status: 400
            }
        );

    }


    // Check whether file belongs
    // to current user

    const file =
        getOwnedFileById(
            fileId,
            userId
        );


    if (!file) {

        return new Response(
            "You cannot delete this file.",
            {
                status: 403
            }
        );

    }


    const filename =
        file.filename;


    const filePath =
        "./uploads/" + filename;


    // Delete physical file

    try {

        await Deno.remove(
            filePath
        );

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


// =========================================================
// DOWNLOAD FILE
// =========================================================

export async function downloadFile(request) {

    const userId =
        getLoggedInUser(request);


    if (!userId) {

        return new Response(
            "Please log in to download files.",
            {
                status: 401
            }
        );

    }


    const url =
        new URL(request.url);


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


    // Find file and verify access

    const file =
        getFileById(
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
            await Deno.readFile(
                filePath
            );


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


// =========================================================
// GET RECEIVED FILES
// =========================================================

export function getReceivedFileList(request) {

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


    const files =
        getReceivedFiles(userId);


    return new Response(
        JSON.stringify(files),
        {
            headers: {
                "content-type":
                    "application/json"
            }
        }
    );
}


// =========================================================
// GET SENT FILES
// =========================================================

export function getSentFileList(request) {

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


    const files =
        getSentFiles(userId);


    return new Response(
        JSON.stringify(files),
        {
            headers: {
                "content-type":
                    "application/json"
            }
        }
    );
}