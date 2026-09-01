function scrollToScanner() {
    document.getElementById("scanner").scrollIntoView({
        behavior: "smooth"
    });
}


function previewImage(event) {

    const file = event.target.files[0];

    if (!file) {
        return;
    }

    const preview = document.getElementById("imagePreview");
    const uploadContent = document.getElementById("uploadContent");

    const allowedTypes = [
        "image/jpeg",
        "image/png"
    ];

    if (!allowedTypes.includes(file.type)) {

        alert("Please upload JPG or PNG image.");

        event.target.value = "";

        return;
    }


    if (file.size > 10 * 1024 * 1024) {

        alert("Image size must be less than 10 MB.");

        event.target.value = "";

        return;
    }


    const reader = new FileReader();

    reader.onload = function (e) {

        preview.src = e.target.result;

        preview.style.display = "block";

        uploadContent.style.display = "none";
    };

    reader.readAsDataURL(file);
}


function startScan() {

    const fileInput = document.getElementById("productImage");
    const message = document.getElementById("scanMessage");

    if (!fileInput.files.length) {

        message.innerHTML =
            "⚠️ Please upload a product image first.";

        message.style.color = "#dc2626";

        return;
    }


    message.innerHTML =
        "🔄 Image uploaded. Backend + OCR will be connected in the next step.";

    message.style.color = "#2563eb";
}


function showDemo() {

    alert(
        "Demo flow:\n\n" +
        "1. Upload product image\n" +
        "2. OCR extracts label text\n" +
        "3. AI identifies important fields\n" +
        "4. Rule engine checks declarations\n" +
        "5. Compliance report is generated"
    );
}