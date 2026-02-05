/**
 * app.js - Main entry point and UI controller.
 */
document.addEventListener('DOMContentLoaded', () => {
    const manager = new WatermarkManager();
    const mainCanvas = document.getElementById('main-canvas');
    const thumbnailsContainer = document.getElementById('thumbnails-container');
    const fileInput = document.getElementById('file-input');

    // UI Elements
    const elements = {
        wmText: document.getElementById('wm-text'),
        wmOpacity: document.getElementById('wm-opacity'),
        wmRotate: document.getElementById('wm-rotate'),
        wmDensity: document.getElementById('wm-density'),
        wmColor: document.getElementById('wm-color'),
        wmSize: document.getElementById('wm-size'),
        opacityVal: document.getElementById('opacity-val'),
        rotateVal: document.getElementById('rotate-val'),
        densityVal: document.getElementById('density-val'),
        imageCount: document.getElementById('image-count'),
        exportBtn: document.getElementById('export-all-btn'),
        clearBtn: document.getElementById('clear-all-btn'),
        addBtn: document.getElementById('add-images-btn'),
        dropZone: document.getElementById('drop-zone'),
        emptyState: document.getElementById('empty-state'),
        previewContainer: document.getElementById('main-preview-container'),
        modeBtns: document.querySelectorAll('.control-btn')
    };

    // --- initialization ---

    // Handle Image Loading
    manager.onImagesChanged = (images) => {
        renderThumbnails(images);
        elements.imageCount.textContent = images.length;
        elements.exportBtn.disabled = images.length === 0;

        if (images.length > 0) {
            elements.emptyState.classList.add('hidden');
            elements.previewContainer.classList.remove('hidden');
            refreshMainPreview();
        } else {
            elements.emptyState.classList.remove('hidden');
            elements.previewContainer.classList.add('hidden');
        }
    };

    // Handle Config Changes
    manager.onConfigChanged = () => {
        refreshMainPreview();
    };

    // --- Render Logic ---

    async function refreshMainPreview() {
        const activeItem = manager.getActiveImage();
        if (!activeItem) return;

        // Load image object
        const img = new Image();
        img.src = URL.createObjectURL(activeItem.file);
        img.onload = async () => {
            await CanvasRenderer.render(mainCanvas, img, manager.config);
            URL.revokeObjectURL(img.src);
        };
    }

    function renderThumbnails(images) {
        thumbnailsContainer.innerHTML = '';
        images.forEach((imgData, index) => {
            const card = document.createElement('div');
            card.className = `thumb-card ${index === manager.activeIndex ? 'active' : ''}`;
            card.innerHTML = `<img src="${imgData.thumbnail}" alt="thumb">`;
            card.onclick = () => manager.setActiveImage(index);
            thumbnailsContainer.appendChild(card);
        });
    }

    // --- UI Events ---

    // File selection
    elements.addBtn.onclick = () => fileInput.click();
    fileInput.onchange = (e) => manager.addImages(e.target.files);

    // Text & Color
    elements.wmText.oninput = (e) => manager.updateConfig({ text: e.target.value });
    elements.wmColor.oninput = (e) => manager.updateConfig({ color: e.target.value });
    elements.wmSize.oninput = (e) => manager.updateConfig({ fontSize: e.target.value });

    // Range Sliders
    elements.wmOpacity.oninput = (e) => {
        const val = e.target.value;
        elements.opacityVal.textContent = Math.round(val * 100) + '%';
        manager.updateConfig({ opacity: parseFloat(val) });
    };

    elements.wmRotate.oninput = (e) => {
        const val = e.target.value;
        elements.rotateVal.textContent = val + '°';
        manager.updateConfig({ rotate: parseInt(val) });
    };

    elements.wmDensity.oninput = (e) => {
        const val = parseInt(e.target.value);
        let label = "中";
        if (val < 150) label = "低";
        else if (val > 350) label = "高";
        elements.densityVal.textContent = label;
        manager.updateConfig({ density: 600 - val });
    };

    // Mode Toggle
    elements.modeBtns.forEach(btn => {
        btn.onclick = () => {
            elements.modeBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const mode = btn.dataset.mode;
            document.getElementById('section-density').style.display = mode === 'tile' ? 'block' : 'none';
            manager.updateConfig({ mode });
        };
    });

    elements.clearBtn.onclick = () => manager.clearImages();

    // Export Action
    elements.exportBtn.onclick = async () => {
        const status = elements.exportBtn.textContent;
        elements.exportBtn.textContent = '处理中...';
        elements.exportBtn.disabled = true;

        const zip = new JSZip();
        const offscreenCanvas = document.createElement('canvas');

        for (const item of manager.images) {
            const img = await loadImage(item.file);
            await CanvasRenderer.render(offscreenCanvas, img, manager.config, true);
            const blob = await CanvasRenderer.toBlob(offscreenCanvas, item.file.type);
            zip.file(`watermarked_${item.file.name}`, blob);
        }

        const content = await zip.generateAsync({ type: "blob" });
        const url = URL.createObjectURL(content);
        const a = document.createElement('a');
        a.href = url;
        a.download = "watermarked_images.zip";
        document.body.appendChild(a);
        a.click();

        // Cleanup
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);

        elements.exportBtn.textContent = status;
        elements.exportBtn.disabled = false;
    };

    // Helper: Promisified Image Loading
    function loadImage(file) {
        return new Promise(resolve => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.src = URL.createObjectURL(file);
        });
    }

    // Drag & Drop
    elements.dropZone.ondragover = (e) => {
        e.preventDefault();
        elements.dropZone.style.borderColor = 'var(--primary-color)';
    };

    elements.dropZone.ondragleave = () => {
        elements.dropZone.style.borderColor = 'var(--border-color)';
    };

    elements.dropZone.ondrop = (e) => {
        e.preventDefault();
        elements.dropZone.style.borderColor = 'var(--border-color)';
        if (e.dataTransfer.files.length > 0) {
            manager.addImages(e.dataTransfer.files);
        }
    };
});
