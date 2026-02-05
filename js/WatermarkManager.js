/**
 * WatermarkManager - Manages the collection of images and the shared configurations.
 */
class WatermarkManager {
    constructor() {
        this.images = []; // Array of { id, originalFile, thumbnailBase64, processedBlob }
        this.activeIndex = -1;
        this.config = {
            type: "text", // 'text' or 'image'
            text: "仅供内部使用",
            logo: null, // Image object
            fontFamily: "'Inter', sans-serif",
            isBold: false,
            hasStroke: false,
            mode: "tile",
            opacity: 0.3,
            rotate: -45,
            density: 200,
            color: "#ffffff",
            fontSize: 24,
            cropRatio: "original" // 'original', '1:1', '4:3', '16:9'
        };
        this.onImagesChanged = null;
        this.onConfigChanged = null;
    }

    async addImages(files) {
        const fileList = Array.from(files); // Ensure it's an array
        for (const file of fileList) {
            const id = Date.now() + Math.random().toString(36).substring(2, 9);
            const thumbnail = await this.generateThumbnail(file);
            this.images.push({
                id,
                file,
                thumbnail,
                processed: false
            });
        }

        if (this.activeIndex === -1 && this.images.length > 0) {
            this.activeIndex = 0;
        }

        if (this.onImagesChanged) this.onImagesChanged(this.images);
    }

    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        if (this.onConfigChanged) this.onConfigChanged(this.config);
    }

    setActiveImage(index) {
        if (index >= 0 && index < this.images.length) {
            this.activeIndex = index;
            if (this.onImagesChanged) this.onImagesChanged(this.images);
        }
    }

    getActiveImage() {
        return this.images[this.activeIndex] || null;
    }

    clearImages() {
        this.images = [];
        this.activeIndex = -1;
        if (this.onImagesChanged) this.onImagesChanged(this.images);
    }

    generateThumbnail(file) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    const maxDim = 200;
                    let w = img.width;
                    let h = img.height;

                    if (w > h) {
                        if (w > maxDim) {
                            h *= maxDim / w;
                            w = maxDim;
                        }
                    } else {
                        if (h > maxDim) {
                            w *= maxDim / h;
                            h = maxDim;
                        }
                    }

                    canvas.width = w;
                    canvas.height = h;
                    ctx.drawImage(img, 0, 0, w, h);
                    resolve(canvas.toDataURL('image/jpeg', 0.7));
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        });
    }
}

window.WatermarkManager = WatermarkManager;
