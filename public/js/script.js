const fileInput = document.getElementById("fileInput");
const fileName = document.getElementById("fileName");
const uploadButton = document.getElementById("uploadButton");
const fileList = document.getElementById("fileList");

if (fileInput && fileName) {
    // Display the selected file name when a file is chosen
    fileInput.addEventListener("change", function () {
        const file = fileInput.files[0];

        if (file) {
            fileName.textContent = "Selected file: " + file.name;
        }
    });
}

if (uploadButton && fileInput) {
    // Handle the file upload when the upload button is clicked
    uploadButton.addEventListener("click", async function () {
        const file = fileInput.files[0];

        if (!file) {
            alert("Please choose a file first.");
            return;
        }

        const formData = new FormData();

        formData.append("file", file);

        const response = await fetch("/upload", {
            method: "POST",
            body: formData
        });

        const result = await response.text();

        alert(result);

        if (typeof loadFiles === "function") {
            loadFiles();
        }
    });
}

// Function to load the list of uploaded files from the server
async function loadFiles() {
    if (!fileList) {
        return;
    }

    fileList.innerHTML = "";

    try {
        const response = await fetch("/files");

        if (!response.ok) {
            throw new Error("Failed to load files");
        }

        const files = await response.json();

        if (!files.length) {
            fileList.innerHTML = "<li>No files uploaded yet.</li>";
            return;
        }

        for (const file of files) {
            const listItem = document.createElement("li");
            listItem.className = "file-item";

            const fileLink = document.createElement("a");
            fileLink.href = "/uploads/" + file;
            fileLink.textContent = file;
            fileLink.target = "_blank";

            const actions = document.createElement("div");
            actions.className = "file-actions";

            const downloadButton = document.createElement("a");
            downloadButton.href = "/uploads/" + file;
            downloadButton.textContent = "Download";
            downloadButton.className = "download-btn";
            downloadButton.download = file;

            const deleteButton = document.createElement("button");
            deleteButton.textContent = "Delete";
            deleteButton.className = "delete-btn";
            deleteButton.addEventListener("click", async function () {
                const confirmed = confirm("Delete this file?");

                if (!confirmed) {
                    return;
                }

                try {
                    const response = await fetch("/delete", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({ filename: file })
                    });

                    const result = await response.text();
                    alert(result);
                    loadFiles();
                } catch (error) {
                    console.error(error);
                    alert("Could not delete file.");
                }
            });

            actions.appendChild(downloadButton);
            actions.appendChild(deleteButton);

            listItem.appendChild(fileLink);
            listItem.appendChild(actions);
            fileList.appendChild(listItem);
        }
    } catch (error) {
        console.error(error);
        fileList.innerHTML = "<li>Could not load files.</li>";
    }
}

if (fileList) {
    loadFiles();
}