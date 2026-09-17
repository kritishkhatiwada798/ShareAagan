async function updateAuthButton() {

    const profileContainer =
        document.getElementById("profileContainer");

    if (!profileContainer) {
        return;
    }

    try {

        const response = await fetch("/me");
        const data = await response.json();

        // User is logged in
        if (data.loggedIn) {

            const username = data.user.username;

            // Get first letter of username
            const firstLetter = username.charAt(0).toUpperCase();

            profileContainer.innerHTML = `
                <button class="profile-button" id="profileButton">

                    <span class="profile-avatar">
                        ${firstLetter}
                    </span>

                    <span class="profile-name">
                        ${username}
                    </span>

                    <span class="profile-arrow">
                        ▾
                    </span>

                </button>

                <div class="profile-menu" id="profileMenu">

                    <div class="profile-menu-header">

                        <div class="profile-avatar large">
                            ${firstLetter}
                        </div>

                        <div>
                            <strong>${username}</strong>
                            <small>${data.user.email}</small>
                        </div>

                    </div>

                    <div class="profile-menu-divider"></div>

                    <a href="/profile.html">
                        👤 Profile
                    </a>

                    <a href="/files.html">
                        📁 My Files
                    </a>

                    <a href="#">
                        ⚙️ Settings
                    </a>

                    <div class="profile-menu-divider"></div>

                    <button id="logoutButton">
                        🚪 Logout
                    </button>

                </div>
            `;

            const profileButton =
                document.getElementById("profileButton");

            const profileMenu =
                document.getElementById("profileMenu");

            // Open / close profile menu
            profileButton.addEventListener("click", () => {

                profileMenu.classList.toggle("show");

            });

            // Logout
            const logoutButton =
                document.getElementById("logoutButton");

            logoutButton.addEventListener("click", async () => {

                const logoutResponse =
                    await fetch("/logout", {
                        method: "POST"
                    });

                if (logoutResponse.ok) {

                    window.location.href = "/index.html";

                } else {

                    alert("Could not log out.");

                }

            });

        }

        // User is NOT logged in
        else {

            profileContainer.innerHTML = `
                <a href="/login.html" id="authLink">
                    Login
                </a>
            `;

        }

    } catch (error) {

        console.error(
            "Could not check login status:",
            error
        );

    }
}

updateAuthButton();