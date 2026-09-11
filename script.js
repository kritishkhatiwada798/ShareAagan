const fileInput = document.getElementById("fileInput");
const fileName = document.getElementById("fileName");
const uploadButton = document.getElementById("uploadButton");

fileInput.addEventListener("change", function () {
    const file = fileInput.files[0];

    if (file) {
        fileName.textContent = "Selected file: " + file.name;
    }
});

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

    loadFiles();
});

async function loadFiles() {
    const response = await fetch("/files");

    const files = await response.json();

    const fileList = document.getElementById("fileList");

    fileList.innerHTML = "";

    for (const file of files) {
        const listItem = document.createElement("li");

        listItem.textContent = file;

        fileList.appendChild(listItem);
    }
}

loadFiles();