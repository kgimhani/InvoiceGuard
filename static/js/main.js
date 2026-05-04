document.addEventListener('DOMContentLoaded', function() {
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const imagePreview = document.getElementById('imagePreview');
    const previewContainer = document.querySelector('.preview-container');
    const classifyButton = document.getElementById('classifyButton');
    const resultsContainer = document.querySelector('.results-container');
    const resetButton = document.getElementById('resetButton');
    const predictedCategory = document.getElementById('predictedCategory');
    const confidenceFill = document.getElementById('confidenceFill');
    const confidenceValue = document.getElementById('confidenceValue');
    const probabilityBars = document.getElementById('probabilityBars');

    // Handle drag and drop
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, highlight, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, unhighlight, false);
    });

    function highlight() {
        dropZone.classList.add('highlight');
    }

    function unhighlight() {
        dropZone.classList.remove('highlight');
    }

    // Handle dropped files
    dropZone.addEventListener('drop', handleDrop, false);

    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        handleFiles(files);
    }

    // Handle file input change
    fileInput.addEventListener('change', function() {
        handleFiles(this.files);
    });    function handleFiles(files) {
        if (files.length > 0) {
            const file = files[0];
            if (validateFile(file)) {
                // Create a new FileList object
                const dataTransfer = new DataTransfer();
                dataTransfer.items.add(file);
                fileInput.files = dataTransfer.files;
                displayPreview(file);
            } else {
                alert('Please upload an image file (PNG, JPG, JPEG)');
            }
        }
    }

    function validateFile(file) {
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
        return validTypes.includes(file.type);
    }

    function displayPreview(file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            imagePreview.src = e.target.result;
            imagePreview.hidden = false;
            previewContainer.hidden = false;
            classifyButton.disabled = false;
            resultsContainer.hidden = true;
        }
        reader.readAsDataURL(file);
    }

    // Handle classification
    classifyButton.addEventListener('click', function() {
        const formData = new FormData();
        formData.append('file', fileInput.files[0]);

        classifyButton.disabled = true;
        classifyButton.textContent = 'Classifying...';

        fetch('/classify', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                throw new Error(data.error);
            }
            displayResults(data);
        })
        .catch(error => {
            alert('Error: ' + error.message);
        })
        .finally(() => {
            classifyButton.disabled = false;
            classifyButton.textContent = 'Classify Invoice';
        });
    });

    function displayResults(data) {
        // Display predicted category
        predictedCategory.textContent = data.category;
        
        // Update confidence meter
        const confidence = data.confidence * 100;
        confidenceFill.style.width = `${confidence}%`;
        confidenceValue.textContent = `${confidence.toFixed(1)}% Confidence`;

        // Display probability bars
        probabilityBars.innerHTML = '';
        Object.entries(data.probabilities).forEach(([category, probability]) => {
            const prob = probability * 100;
            probabilityBars.innerHTML += `
                <div class="probability-bar">
                    <div class="probability-label">
                        <span>${category}</span>
                        <span>${prob.toFixed(1)}%</span>
                    </div>
                    <div class="confidence-bar">
                        <div class="confidence-fill" style="width: ${prob}%"></div>
                    </div>
                </div>
            `;
        });

        resultsContainer.hidden = false;
    }

    // Handle reset
    resetButton.addEventListener('click', function() {
        fileInput.value = '';
        imagePreview.src = '';
        imagePreview.hidden = true;
        previewContainer.hidden = true;
        resultsContainer.hidden = true;
        classifyButton.disabled = true;
    });
});
