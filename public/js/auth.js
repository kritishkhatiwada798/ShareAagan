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
// NOTIFICATIONS
// =============================================================

function setupNotifications() {

    const notificationButton =
        document.getElementById("notificationButton");

    const notificationMenu =
        document.getElementById("notificationMenu");

    if (!notificationButton || !notificationMenu) {
        return;
    }

    // Open / close notification panel
    notificationButton.addEventListener("click", async (event) => {

        event.stopPropagation();

        notificationMenu.classList.toggle("show");

        // Load notifications when panel is opened
        if (notificationMenu.classList.contains("show")) {
            await loadNotifications();
        }
    });

    // Close when clicking outside
    document.addEventListener("click", (event) => {

        if (
            !notificationMenu.contains(event.target) &&
            !notificationButton.contains(event.target)
        ) {
            notificationMenu.classList.remove("show");
        }

    });
}

//function checkForNewNotifications() {
async function loadNotifications() {

    const notificationMenu =
        document.getElementById("notificationMenu");

    if (!notificationMenu) {
        return [];
    }

    try {

        const response = await fetch("/notifications");

        if (!response.ok) {
            console.log("Could not load notifications.");
            return [];
        }

        const notifications = await response.json();

        console.log("Notifications:", notifications);

        const unreadNotifications = notifications.filter(
            notification => Number(notification.is_read) === 0
        );

        // Create notification content
        let content = "";

        if (unreadNotifications.length === 0) {

            content = `
                <div class="no-notifications">
                    <span>🔔</span>
                    <p>No new notifications</p>
                </div>
            `;

        } else {

            content = unreadNotifications.map(notification => {

                return `
                    <div class="notification-item ${notification.is_read === 0
                        ? "unread"
                        : ""
                    }"
                    data-id="${notification.id}"
                    data-file-id="${notification.file_id || ""}">

                        <span>🔔</span>

                        <div>
                            <p>${notification.message}</p>
                            <small>${new Date(
                        notification.created_at
                    ).toLocaleString()}</small>
                        </div>

                    </div>
                `;

            }).join("");
        }

        notificationMenu.innerHTML = `
            <div class="notification-header">
                <strong>Notifications</strong>
            </div>

            <div class="notification-divider"></div>

            <div class="notification-content">
                ${content}
            </div>
        `;

        // Add click events
        const items =
            notificationMenu.querySelectorAll(".notification-item");

        items.forEach(item => {

            item.addEventListener("click", async () => {

                const notificationId =
                    item.dataset.id;

                const fileId =
                    item.dataset.fileId;

                const response = await fetch("/notifications/read", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        notificationId
                    })
                });

                if (!response.ok) {
                    return;
                }

                item.remove();

                const notificationContent =
                    notificationMenu.querySelector(".notification-content");

                if (!notificationContent.querySelector(".notification-item")) {
                    notificationContent.innerHTML = `
                        <div class="no-notifications">
                            <span>🔔</span>
                            <p>No new notifications</p>
                        </div>
                    `;
                }

                // If notification belongs to a file,
                // open the files page
                if (fileId) {
                    window.location.href = "/files.html";
                }

            });

        });

        return unreadNotifications;

    } catch (error) {

        console.error(
            "Error loading notifications:",
            error
        );

        return [];

    }
}

async function checkForNewNotifications() {

    const notificationMenu =
        document.getElementById("notificationMenu");

    const sessionKey = "shareAaganNotificationsAutoOpened";

    if (
        !notificationMenu ||
        sessionStorage.getItem(sessionKey)
    ) {
        return;
    }

    const unreadNotifications =
        await loadNotifications();

    if (unreadNotifications.length > 0) {
        sessionStorage.setItem(sessionKey, "true");
        notificationMenu.classList.add("show");
    }
}

updateAuthButton();
setupNotifications();

setTimeout(() => {
    checkForNewNotifications();
}, 500)