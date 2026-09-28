const loginTab = document.getElementById("loginTab");
const registerTab = document.getElementById("registerTab");

const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");

const formTitle = document.getElementById("formTitle");
const message = document.getElementById("message");

// Show login form
loginTab.addEventListener("click", () => {
    loginForm.hidden = false;
    registerForm.hidden = true;

    formTitle.textContent = "Welcome Back!";

    loginTab.className = "btn";
    registerTab.className = "btn btn-secondary";

    message.textContent = "";
});

// Show registration form
registerTab.addEventListener("click", () => {
    loginForm.hidden = true;
    registerForm.hidden = false;

    formTitle.textContent = "Create an Account";

    registerTab.className = "btn";
    loginTab.className = "btn btn-secondary";

    message.textContent = "";
});

// Registration form submission
registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const username =
        document.getElementById("username").value;

    const email =
        document.getElementById("registerEmail").value;

    const password =
        document.getElementById("registerPassword").value;

    const confirmPassword = document.getElementById("confirmPassword").value;

    if (password !== confirmPassword) {
        alert("Passwords do not match!");
        return;
    }

    try {
        const response = await fetch("/register", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                username,
                email,
                password
            })
        });

        const result = await response.text();

        message.textContent = result;

        if (response.ok) {
            registerForm.reset();

            // Switch to login after registration
            loginTab.click();

            message.textContent =
                "Registration successful! You can now log in.";
        }
    } catch {
        message.textContent =
            "Could not connect to the server.";
    }
});

// Login form submission
loginForm.addEventListener("submit", async (event) => {

    event.preventDefault();

    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;

    try {
        const response = await fetch("/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email,
                password
            })
        });

        const message = await response.text();

        if (response.ok) {
            window.location.href = "/index.html";
        } else {
            const message = await response.text();
            alert(message);
        }
    } catch (error) {
        console.error(error);
        alert("Could not connect to the server.");
    }
});