import {
    getUserByEmail,
    getUserById,
    updateUser
} from "../models/userModel.js";

import {
    getLoggedInUser
} from "./authController.js";


// =========================================================
// PROFILE CONTROLLER
// =========================================================


// =========================================================
// UPDATE PROFILE
// =========================================================

export async function updateProfile(request) {

    // Get logged-in user

    const userId =
        getLoggedInUser(request);


    if (!userId) {

        return new Response(
            "Please log in to edit your profile.",
            {
                status: 401
            }
        );

    }


    // Get submitted data

    const data =
        await request.json();


    const username =
        data.username;

    const email =
        data.email;

    const newPassword =
        data.password;


    // Validate required fields

    if (
        !username ||
        !email
    ) {

        return new Response(
            "Username and email are required.",
            {
                status: 400
            }
        );

    }


    // Check whether another account
    // already uses the email

    const existingUser =
        getUserByEmail(email);


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


    // Find current user

   const currentUser = getUserById(userId);

if (!currentUser) {
    return new Response(
        JSON.stringify({
            error: "User not found."
        }),
        {
            status: 404,
            headers: {
                "Content-Type": "application/json"
            }
        }
    );
}


// Keep existing password

let passwordHash = currentUser.password_hash;

    // Change password only if
    // a new password was provided

    if (newPassword) {

        const passwordHashBuffer =
            await crypto.subtle.digest(
                "SHA-256",
                new TextEncoder().encode(
                    newPassword
                )
            );


        const hashArray =
            Array.from(
                new Uint8Array(
                    passwordHashBuffer
                )
            );


        passwordHash =
            hashArray
                .map(byte =>
                    byte.toString(16).padStart(2, "0")
                )
                .join("");

    }


    // Update database

    updateUser(
        userId,
        username,
        email,
        passwordHash
    );


    return new Response(
        JSON.stringify({
            success: true,
            message:
                "Profile updated successfully."
        }),
        {
            status: 200,

            headers: {
                "content-type":
                    "application/json"
            }
        }
    );
}