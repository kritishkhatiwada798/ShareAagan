async function loadProfile() {

    const profileName =
        document.getElementById("profileName");

    try {

        const response = await fetch("/me");

        const data = await response.json();


        // If the user is not logged in
        if (!data.loggedIn) {

            globalThis.location.href = "/login.html";

            return;
        }


        const user = data.user;


        // Get the first letter of the username
        const firstLetter =
            user.username.charAt(0).toUpperCase();


        // Display profile information
        document.getElementById("profileAvatar")
            .textContent = firstLetter;

        profileName.textContent =
            user.username;

        document.getElementById("profileEmail")
            .textContent = user.email;

        document.getElementById("detailUsername")
            .textContent = user.username;

        document.getElementById("detailEmail")
            .textContent = user.email;

        document.getElementById("detailUserId")
            .textContent = user.id;


        // Put current information into the edit fields
        document.getElementById("editUsername")
            .value = user.username;

        document.getElementById("editEmail")
            .value = user.email;


    } catch (error) {

        console.error(
            "Error loading profile:",
            error
        );

        profileName.textContent =
            "Could not load profile";

    }

}


// =========================================================
// EDIT PROFILE
// =========================================================

const editProfileBtn =
    document.getElementById("editProfileBtn");

const editProfileForm =
    document.getElementById("editProfileForm");

const cancelEditBtn =
    document.getElementById("cancelEditBtn");

const saveProfileBtn =
    document.getElementById("saveProfileBtn");

const editProfileMessage =
    document.getElementById("editProfileMessage");


// =========================================================
// OPEN EDIT PROFILE FORM
// =========================================================

editProfileBtn.addEventListener(
    "click",
    () => {

        // Show the edit form
        editProfileForm.style.display =
            "block";

        // Clear any previous message
        editProfileMessage.textContent = "";

        // Scroll to the edit form
        editProfileForm.scrollIntoView({
            behavior: "smooth"
        });

    }
);


// =========================================================
// CANCEL EDIT
// =========================================================

cancelEditBtn.addEventListener(
    "click",
    () => {

        // Hide the edit form
        editProfileForm.style.display =
            "none";

        // Clear the password field
        document.getElementById("editPassword")
            .value = "";

        // Clear any message
        editProfileMessage.textContent = "";

    }
);


// =========================================================
// SAVE PROFILE CHANGES
// =========================================================

saveProfileBtn.addEventListener(
    "click",
    async () => {

        const username =
            document.getElementById("editUsername")
                .value.trim();

        const email =
            document.getElementById("editEmail")
                .value.trim();

        const password =
            document.getElementById("editPassword")
                .value;


        // Clear previous message
        editProfileMessage.textContent = "";


        // Check username and email
        if (!username || !email) {

            editProfileMessage.textContent =
                "Username and email are required.";

            return;
        }


        // Disable button while saving
        saveProfileBtn.disabled = true;

        saveProfileBtn.textContent =
            "Saving...";


        try {

            const response = await fetch(
                "/profile",
                {
                    method: "PUT",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        username: username,
                        email: email,
                        password: password
                    })
                }
            );


            const data =
                await response.json();


            // If the update failed
            if (!response.ok) {

                editProfileMessage.textContent =
                    data.message ||
                    "Could not update profile.";

                return;
            }


            // Profile was updated successfully
            editProfileMessage.textContent =
                "Profile updated successfully!";


            // Update the information displayed on the page
            document.getElementById("profileName")
                .textContent = username;

            document.getElementById("profileEmail")
                .textContent = email;

            document.getElementById("detailUsername")
                .textContent = username;

            document.getElementById("detailEmail")
                .textContent = email;


            // Update avatar
            document.getElementById("profileAvatar")
                .textContent =
                username.charAt(0).toUpperCase();


            // Clear password field
            document.getElementById("editPassword")
                .value = "";


            // Hide the edit form after a short delay
            setTimeout(() => {

                editProfileForm.style.display =
                    "none";

                editProfileMessage.textContent =
                    "";

            }, 1500);


        } catch (error) {

            console.error(
                "Error updating profile:",
                error
            );

            editProfileMessage.textContent =
                "Something went wrong. Please try again.";

        } finally {

            // Enable button again
            saveProfileBtn.disabled = false;

            saveProfileBtn.textContent =
                "Save Changes";

        }

    }
);


// =========================================================
// LOAD PROFILE WHEN PAGE OPENS
// =========================================================

loadProfile();