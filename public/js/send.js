
const sendFileForm =
    document.getElementById("sendFileForm");

const recipientSelect =
    document.getElementById("recipient");

const message =
    document.getElementById("message");


// =====================================================
// LOAD USERS
// =====================================================

async function loadUsers() {

    try {

        const response =
            await fetch("/users", {
                credentials: "same-origin"
            });


        if (!response.ok) {

            message.textContent =
                "Please log in to send a file.";

            return;
        }


        const users =
            await response.json();


        users.forEach(user => {

            const option =
                document.createElement("option");

            option.value = user.id;

            option.textContent =
                `${user.username} (${user.email})`;

            recipientSelect.appendChild(option);

        });

    }

    catch (error) {

        console.error(error);

        message.textContent =
            "Could not load users.";

    }

}


loadUsers();


// =====================================================
// SEND FILE
// =====================================================

sendFileForm.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();


        const fileInput =
            document.getElementById("file");

        const file =
            fileInput.files[0];

        const recipientId =
            recipientSelect.value;


        if (!recipientId) {

            message.textContent =
                "Please select a recipient.";

            return;

        }


        if (!file) {

            message.textContent =
                "Please select a file.";

            return;

        }


        const formData =
            new FormData();


        formData.append(
            "file",
            file
        );


        formData.append(
            "recipientId",
            recipientId
        );


        try {

            const response =
                await fetch(
                    "/send-file",
                    {
                        method: "POST",
                        credentials: "same-origin",
                        body: formData
                    }
                );


            const result =
                await response.text();


            message.textContent =
                result;


            if (response.ok) {

                sendFileForm.reset();

            }

        }

        catch (error) {

            console.error(error);

            message.textContent =
                "Could not connect to the server.";

        }

    }
);