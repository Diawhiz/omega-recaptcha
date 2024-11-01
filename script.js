class CustomReCAPTCHA {
    constructor() {
        this.selectedImages = new Set();
        this.data = [];
        this.requiredSelections = 3;
        this.correctGroupId = null;
        this.verifyButton = document.getElementById('verify-button');
    }

    init() {
        fetch('images.json')
            .then(response => {
                if (!response.ok) throw new Error('Failed to fetch images');
                return response.json();
            })
            .then(data => {
                this.data = data.faces;
                this.generateNewChallenge();
                this.renderImages();
                this.setupEventListeners();
            })
            .catch(error => console.error('Error initializing reCAPTCHA:', error));
    }

    generateNewChallenge() {
    // Randomly select a face group
    const randomGroupIndex = Math.floor(Math.random() * this.data.length);
    const selectedGroup = this.data[randomGroupIndex];
    this.correctGroupId = selectedGroup.groupId;

    // Create a pool of all images
    let allImages = [];
    this.data.forEach(group => {
        allImages = allImages.concat(group.images);
    });

    const correctImages = selectedGroup.images;
    const requiredCorrectImages = Math.min(3, correctImages.length);
    const selectedCorrectImages = this.shuffleArray(correctImages)
        .slice(0, requiredCorrectImages);

    const incorrectImages = allImages.filter(img => 
        !correctImages.find(correctImg => correctImg.id === img.id)
    );  
    
    // Ensure we only select a total of 6 images
    const requiredIncorrectImages = 6 - selectedCorrectImages.length;
    const selectedIncorrectImages = this.shuffleArray(incorrectImages)
        .slice(0, requiredIncorrectImages);

    // Combine and shuffle all selected images
    this.challengeImages = this.shuffleArray([
        ...selectedCorrectImages,
        ...selectedIncorrectImages
    ]);
}

    shuffleArray(array) {
        const newArray = [...array];
        for (let i = newArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
        }
        return newArray;
    }

    updateSelectionCount() {
        const selectionCounter = document.getElementById('selection-counter');
        if (selectionCounter) {
            selectionCounter.textContent = `Selected ${this.selectedImages.size} of ${this.requiredSelections}`;
        }
    }

    updateVerifyButton() {
        if (this.verifyButton) {
            this.verifyButton.disabled = this.selectedImages.size !== this.requiredSelections;
        }
    }

    handleImageClick(event) {
        const container = event.target.closest('.image-container');
        const imageId = event.target.dataset.imageId;

        if (container) {
            if (container.classList.contains('selected')) {
                container.classList.remove('selected');
                this.selectedImages.delete(imageId);
            } else {
                if (this.selectedImages.size < this.requiredSelections) {
                    container.classList.add('selected');
                    this.selectedImages.add(imageId);
                }
            }
            this.updateSelectionCount();
            this.updateVerifyButton();
        }
    }

    renderImages() {
        const imageGrid = document.getElementById('image-grid');
        imageGrid.innerHTML = '';

        // Add instructions
        const instructions = document.createElement('div');
        instructions.className = 'captcha-instructions';
        instructions.innerHTML = `
            <h3>Verify that you're human</h3>
            <p>Select all images of the same person</p>
            <div id="selection-counter">Selected 0 of ${this.requiredSelections}</div>
        `;
        imageGrid.insertAdjacentElement('beforebegin', instructions);

        // Create grid container
        const gridContainer = document.createElement('div');
        gridContainer.className = 'grid-container';

        this.challengeImages.forEach(image => {
            const imgContainer = document.createElement('div');
            imgContainer.className = 'image-container';
            
            const img = document.createElement('img');
            img.src = image.url;
            img.alt = image.label;
            img.className = 'image';
            img.dataset.imageId = image.id;
            img.dataset.groupId = this.data.find(group => 
                group.images.some(img => img.id === image.id)
            ).groupId;

            imgContainer.appendChild(img);
            gridContainer.appendChild(imgContainer);
        });

        imageGrid.appendChild(gridContainer);
        this.updateSelectionCount();
        this.updateVerifyButton();
    }

    verify() {
        const selectedImages = Array.from(document.querySelectorAll('.image-container.selected img'));
        const isCorrect = selectedImages.every(img => 
            parseInt(img.dataset.groupId) === this.correctGroupId
        );

        if (isCorrect && selectedImages.length >= 2) {
            this.onSuccess();
        } else {
            this.onFailure();
        }
    }

    onSuccess() {
        document.querySelector('.success').style.display = 'block';
        setTimeout(() => {
            document.querySelector('.success').style.display = 'none';
        }, 3000);  //clear the message after 3 seconds

        this.reset();
    }

    onFailure() {
        document.querySelector('.failure').style.display = 'block';
        setInterval(() => {
            document.querySelector('.failure').style.display = 'none';
        }, 3000); //clear the message after 3 seconds

        this.reset();
        this.generateNewChallenge();
        // this.renderImages();
    }

    reset() {
        this.selectedImages.clear();
        document.querySelectorAll('.image-container').forEach(container => {
            container.classList.remove('selected');
        });
        this.updateSelectionCount();
        this.updateVerifyButton();
    }

    setupEventListeners() {
        const imageGrid = document.getElementById('image-grid');
        imageGrid.addEventListener('click', (event) => {
            if (event.target.tagName === 'IMG') {
                this.handleImageClick(event);
            }
        });

        this.verifyButton.addEventListener('click', () => {
            if (this.selectedImages.size === this.requiredSelections) {
                this.verify();
            }
        });

        // Initially disable verify button
        this.verifyButton.disabled = true;
    }
}

// Initialize the CAPTCHA
document.addEventListener('DOMContentLoaded', () => {
    const captcha = new CustomReCAPTCHA();
    captcha.init();
});