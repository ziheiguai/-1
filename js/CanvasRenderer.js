/**
 * CanvasRenderer - Pure rendering logic for watermarking.
 */
class CanvasRenderer {
    /**
     * Renders watermark on a canvas based on image and config.
     * @param {HTMLCanvasElement} canvas 
     * @param {HTMLImageElement} img 
     * @param {Object} config 
     */
    static async render(canvas, img, config) {
        const ctx = canvas.getContext('2d');

        // 1. Calculate Crop Box
        let { sX, sY, sW, sH } = this.calculateCrop(img, config.cropRatio);

        // 2. Set canvas size (based on cropped dimensions)
        canvas.width = sW;
        canvas.height = sH;

        // 3. Draw base image (cropped)
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, sX, sY, sW, sH, 0, 0, sW, sH);

        // 4. Prepare watermark style
        ctx.save();
        ctx.globalAlpha = config.opacity;

        const angleRad = (config.rotate * Math.PI) / 180;
        const diagonal = Math.sqrt(canvas.width ** 2 + canvas.height ** 2);
        const step = parseInt(config.density) * (canvas.width / 1000);

        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate(angleRad);

        if (config.type === 'text') {
            // Text Watermark
            ctx.fillStyle = config.color;
            ctx.strokeStyle = config.color;
            ctx.lineWidth = 1;

            const fontSize = parseInt(config.fontSize) * (canvas.width / 1000);
            const fontWeight = config.isBold ? 'bold' : 'normal';
            ctx.font = `${fontWeight} ${fontSize}px "Inter", sans-serif`;
            ctx.textBaseline = 'middle';
            ctx.textAlign = 'center';

            for (let x = -diagonal; x < diagonal + step; x += step) {
                for (let y = -diagonal; y < diagonal + step; y += step) {
                    if (config.hasStroke) {
                        ctx.lineWidth = Math.max(2, fontSize / 12); // Significantly more visible
                        ctx.strokeText(config.text, x, y);
                    }
                    ctx.fillText(config.text, x, y); // Draw text AFTER stroke for cleaner edges
                }
            }
        } else if (config.type === 'image' && config.logo) {
            // Image Watermark
            const logoW = (parseInt(config.fontSize) * 5) * (canvas.width / 1000);
            const ratio = config.logo.width / config.logo.height;
            const logoH = logoW / ratio;

            for (let x = -diagonal; x < diagonal + step; x += step) {
                for (let y = -diagonal; y < diagonal + step; y += step) {
                    ctx.drawImage(config.logo, x - logoW / 2, y - logoH / 2, logoW, logoH);
                }
            }
        }

        ctx.restore();
    }

    static calculateCrop(img, ratio) {
        let sX = 0, sY = 0, sW = img.width, sH = img.height;
        if (ratio === 'original') return { sX, sY, sW, sH };

        const [rW, rH] = ratio.split(':').map(Number);
        const targetRatio = rW / rH;
        const imgRatio = img.width / img.height;

        if (imgRatio > targetRatio) {
            sW = img.height * targetRatio;
            sX = (img.width - sW) / 2;
        } else {
            sH = img.width / targetRatio;
            sY = (img.height - sH) / 2;
        }
        return { sX, sY, sW, sH };
    }

    /**
     * Converts canvas content to a File/Blob.
     */
    static toBlob(canvas, type = 'image/jpeg', quality = 0.9) {
        return new Promise(resolve => canvas.toBlob(resolve, type, quality));
    }
}

window.CanvasRenderer = CanvasRenderer;
