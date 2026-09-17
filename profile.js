
async function loadProfile() {

    const profileName =
        document.getElementById("profileName");

    try {

        const response = await fetch("/me");

        const data = await response.json();

        // If the user is not logged in
        if (!data.loggedIn) {
            window.location.href = "/login.html";
            return;
        }

        const user = data.user;

        // Get the first letter of the username
        const firstLetter =
            user.username.charAt(0).toUpperCase();

        // Display profile information
        document.getElementById("profileAvatar")
            .textContent = firstLetter;

        profileName.textContent = user.username;

        document.getElementById("profileEmail")
            .textContent = user.email;

        document.getElementById("detailUsername")
            .textContent = user.username;

        document.getElementById("detailEmail")
            .textContent = user.email;

        document.getElementById("detailUserId")
            .textContent = user.id;

    } catch (error) {

        console.error("Error loading profile:", error);

        profileName.textContent =
            "Could not load profile";

    }
}

loadProfile();