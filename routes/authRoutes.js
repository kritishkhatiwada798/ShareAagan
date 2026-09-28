import {
    register,
    login,
    logout,
    getCurrentUser
} from "../controllers/authController.js";

export async function handleAuthRoutes(request, pathname) {

    if (pathname === "/register" && request.method === "POST") {
        return await register(request);
    }

    if (pathname === "/login" && request.method === "POST") {
        return await login(request);
    }

    if (pathname === "/logout" && request.method === "POST") {
        return await logout(request);
    }

    if (pathname === "/me" && request.method === "GET") {
        return await getCurrentUser(request);
    }

    return null;
}