import {
    updateProfile
} from "../controllers/profileController.js";

export async function handleProfileRoutes(request, pathname) {

    if (pathname === "/profile" && request.method === "PUT") {
        return await updateProfile(request);
    }

    return null;
}