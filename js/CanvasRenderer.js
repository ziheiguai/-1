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
    static async render(canvas, img, config, isHighRes = false) {
        const ctx = canvas.getContext('2d');

        // 1. Set canvas size
        canvas.width = img.width;
        canvas.height = img.height;

        // 2. Clear and Draw base image
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);

        // 3. Prepare watermark style
        ctx.save();
        ctx.globalAlpha = config.opacity;
        ctx.fillStyle = config.color;

        // Responsive font size for high-res output
        const scaleFactor = isHighRes ? 1 : 1;
        const fontSize = parseInt(config.fontSize) * (canvas.width / 1000) * scaleFactor;
        ctx.font = `${fontSize}px "Inter", sans-serif`;
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'center';

        const text = config.text;
        const angleRad = (config.rotate * Math.PI) / 180;

        if (config.mode === 'tile') {
            // Tiled Rendering
            const step = parseInt(config.density) * (canvas.width / 1000);
            const diagonal = Math.sqrt(canvas.width ** 2 + canvas.height ** 2);

            ctx.save();
            ctx.translate(canvas.width / 2, canvas.height / 2);
            ctx.rotate(angleRad);

            for (let x = -diagonal; x < diagonal + step; x += step) {
                for (let y = -diagonal; y < diagonal + step; y += step) {
                    ctx.fillText(text, x, y);
                }
            }
            ctx.restore();
        } else {
            // Single Placement (Center for MVP, expand to 9-grid in V1.1)
            ctx.translate(canvas.width / 2, canvas.height / 2);
            ctx.rotate(angleRad);
            ctx.fillText(text, 0, 0);
        }

        ctx.restore();
    }

    /**
     * Converts canvas content to a File/Blob.
     */
    static toBlob(canvas, type = 'image/jpeg', quality = 0.9) {
        return new Promise(resolve => canvas.toBlob(resolve, type, quality));
    }
}

window.CanvasRenderer = CanvasRenderer;
