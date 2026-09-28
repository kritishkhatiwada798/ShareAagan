import {
    addUser,
    getUserByEmail,
    getUsers
} from "../models/userModel.js";

import {
    createSession,
    getSessionByToken,
    deleteSession
} from "../models/sessionModel.js";


// =========================================================
// AUTHENTICATION CONTROLLER
// =========================================================


// =========================================================
// GET LOGGED-IN USER
// =========================================================

export function getLoggedInUser(request) {

    const cookie = request.headers.get("cookie");

    if (!cookie) {
        return null;
    }


    const sessionCookie = cookie
        .split("; ")
        .find((item) =>
            item.startsWith("session_token=")
        );


    if (!sessionCookie) {
        return null;
    }


    const token = sessionCookie.split("=")[1];


    const session =
        getSessionByToken(token);


    if (!session) {
        return null;
    }


    // Check session expiry

    if (
        session.expires_at <
        Math.floor(Date.now() / 1000)
    ) {
        return null;
    }


    return session.user_id;
}


// =========================================================
// HASH PASSWORD
// =========================================================

async function hashPassword(password) {

    const passwordHash =
        await crypto.subtle.digest(
            "SHA-256",
            new TextEncoder().encode(password)
        );


    const hashArray =
        Array.from(
            new Uint8Array(passwordHash)
        );


    return hashArray
        .map(byte =>
            byte.toString(16).padStart(2, "0")
        )
        .join("");
}


// =========================================================
// REGISTER
// =========================================================

export async function register(request) {

    const data =
        await request.json();


    const username =
        data.username;

    const email =
        data.email;

    const password =
        data.password;


    // Check required fields

    if (
        !username ||
        !email ||
        !password
    ) {

        return new Response(
            "All fields are required.",
            {
                status: 400
            }
        );

    }


    // Check whether email already exists

    if (getUserByEmail(email)) {

        return new Response(
            "Email already registered.",
            {
                status: 409
            }
        );

    }


    // Hash password

    const passwordHash =
        await hashPassword(password);


    // Save user

    addUser(
        username,
        email,
        passwordHash
    );


    return new Response(
        "Registration successful!",
        {
            status: 201
        }
    );
}


// =========================================================
// LOGIN
// =========================================================

export async function login(request) {

    const data =
        await request.json();


    const email =
        data.email;

    const password =
        data.password;


    // Validate input

    if (
        !email ||
        !password
    ) {

        return new Response(
            "Email and password are required.",
            {
                status: 400
            }
        );

    }


    // Find user

    const user =
        getUserByEmail(email);


    if (!user) {

        return new Response(
            "Invalid email or password.",
            {
                status: 401
            }
        );

    }


    // Hash submitted password

    const hashedPassword =
        await hashPassword(password);


    // Compare passwords

    if (
        hashedPassword !==
        user.password_hash
    ) {

        return new Response(
            "Invalid email or password.",
            {
                status: 401
            }
        );

    }


    // Generate session token

    const tokenBytes =
        crypto.getRandomValues(
            new Uint8Array(32)
        );


    const token =
        Array.from(tokenBytes)
            .map(byte =>
                byte.toString(16).padStart(2, "0")
            )
            .join("");


    // Session expires after 24 hours

    const expiresAt =
        Math.floor(Date.now() / 1000) +
        24 * 60 * 60;


    // Save session

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


// =========================================================
// LOGOUT
// =========================================================

export function logout(request) {

    const cookie =
        request.headers.get("cookie");


    if (cookie) {

        const sessionCookie =
            cookie
                .split("; ")
                .find((item) =>
                    item.startsWith(
                        "session_token="
                    )
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


// =========================================================
// GET CURRENT USER
// =========================================================

export function getCurrentUser(request) {

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


    const users =
        getUsers();


    const user =
        users.find(
            (user) =>
                user.id === userId
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