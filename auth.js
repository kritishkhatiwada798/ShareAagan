async function updateAuthButton() {

    const profileContainer =
        document.getElementById("profileContainer");

    if (!profileContainer) {
        return;
    }

    try {

        const response = await fetch("/me");
        const data = await response.json();

        // =====================================================
        // USER IS LOGGED IN
        // =====================================================

        if (data.loggedIn) {

            const username = data.user.username;

            // Get first letter of username
            const firstLetter =
                username.charAt(0).toUpperCase();


            // =================================================
            // PROFILE DROPDOWN
            // =================================================

            profileContainer.innerHTML = `

                <button
                    class="profile-button"
                    id="profileButton">

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


                <div
                    class="profile-menu"
                    id="profileMenu">

                    <div class="profile-menu-header">

                        <div class="profile-avatar large">
                            ${firstLetter}
                        </div>

                        <div>

                            <strong>
                                ${username}
                            </strong>

                            <small>
                                ${data.user.email}
                            </small>

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


            // =================================================
            // PROFILE BUTTON
            // =================================================

            const profileButton =
                document.getElementById("profileButton");

            const profileMenu =
                document.getElementById("profileMenu");


            profileButton.addEventListener("click", () => {

                profileMenu.classList.toggle("show");

            });


            // =================================================
            // LOGOUT
            // =================================================

            const logoutButton =
                document.getElementById("logoutButton");

            logoutButton.addEventListener(
                "click",
                async () => {

                    const logoutResponse =
                        await fetch("/logout", {
                            method: "POST"
                        });


                    if (logoutResponse.ok) {

                        globalThis.location.href =
                            "/index.html";

                    } else {

                        alert("Could not log out.");

                    }

                }
            );

        }


        // =====================================================
        // USER IS NOT LOGGED IN
        // =====================================================

        else {

            profileContainer.innerHTML = `

                <a
                    href="/login.html"
                    id="authLink">

                    Login

                </a>

            `;


            // Show welcome popup when logged out
            const welcomePopup =
                document.getElementById("welcomePopup");


            if (welcomePopup) {

                welcomePopup.classList.add("show");

            }


            const closePopup =
                document.getElementById("closePopup");


            if (closePopup) {

                closePopup.onclick = () => {

                    welcomePopup.classList.remove("show");

                };

            }


            const continueGuest =
                document.getElementById("continueGuest");


            if (continueGuest) {

                continueGuest.onclick = () => {

                    welcomePopup.classList.remove("show");

                };

            }

        }

    } catch (error) {

        console.error(
            "Could not check login status:",
            error
        );

    }
}


// =============================================================
// NOTIFICATION BUTTON
// =============================================================

function setupNotifications() {

    const notificationButton =
        document.getElementById("notificationButton");

    const notificationMenu =
        document.getElementById("notificationMenu");


    if (!notificationButton || !notificationMenu) {
        return;
    }


    notificationButton.addEventListener("click", (event) => {

        event.stopPropagation();

        notificationMenu.classList.toggle("show");

    });


    // Close notification menu when clicking elsewhere
    document.addEventListener("click", (event) => {

        if (
            !notificationMenu.contains(event.target) &&
            !notificationButton.contains(event.target)
        ) {

            notificationMenu.classList.remove("show");

        }

    });

}


updateAuthButton();

setupNotifications();