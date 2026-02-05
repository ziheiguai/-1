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
        wmFont: document.getElementById('wm-font-family'),
        wmBold: document.getElementById('wm-bold'),
        wmStroke: document.getElementById('wm-stroke'),
        logoUpload: document.getElementById('logo-upload-box'),
        logoInput: document.getElementById('logo-input'),
        logoStatus: document.getElementById('logo-status'),
        removeLogoBtn: document.getElementById('remove-logo-btn'),

        typeGroupText: document.getElementById('text-config-group'),
        typeGroupImage: document.getElementById('image-config-group'),

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
        typeBtns: document.querySelectorAll('.mode-selector .control-btn'),
        cropBtns: document.querySelectorAll('.crop-selector .control-btn')
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
            card.innerHTML = `
                <img src="${imgData.thumbnail}" alt="thumb">
                <button class="thumb-download-btn" title="立即下载当前图">💾</button>
            `;

            // Thumbnail click to switch active
            card.onclick = (e) => {
                if (e.target.classList.contains('thumb-download-btn')) {
                    downloadSingle(imgData);
                } else {
                    manager.setActiveImage(index);
                }
            };
            thumbnailsContainer.appendChild(card);
        });
    }

    async function downloadSingle(item) {
        const offscreen = document.createElement('canvas');
        const img = await loadImage(item.file);
        await CanvasRenderer.render(offscreen, img, manager.config, true);
        const blob = await CanvasRenderer.toBlob(offscreen, item.file.type);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `watermarked_${item.file.name}`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 100);
    }

    // --- UI Events ---

    // File selection
    elements.addBtn.onclick = () => fileInput.click();
    fileInput.onchange = (e) => manager.addImages(e.target.files);

    // Font & Styling
    elements.wmFont.onchange = (e) => manager.updateConfig({ fontFamily: e.target.value });
    elements.wmBold.onchange = (e) => manager.updateConfig({ isBold: e.target.checked });
    elements.wmStroke.onchange = (e) => manager.updateConfig({ hasStroke: e.target.checked });

    // Logo Upload
    elements.logoUpload.onclick = () => elements.logoInput.click();
    elements.logoInput.onchange = async (e) => {
        if (e.target.files.length > 0) {
            const file = e.target.files[0];
            const img = await loadImage(file);
            manager.updateConfig({ logo: img });
            elements.logoStatus.textContent = "✅ Logo 已就绪";
            elements.removeLogoBtn.classList.remove('hidden');
        }
    };
    elements.removeLogoBtn.onclick = () => {
        manager.updateConfig({ logo: null });
        elements.logoStatus.textContent = "点击上传 Logo";
        elements.removeLogoBtn.classList.add('hidden');
        elements.logoInput.value = '';
    };

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

    // Type Toggle (Text / Image)
    elements.typeBtns.forEach(btn => {
        btn.onclick = () => {
            elements.typeBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const type = btn.dataset.type;
            elements.typeGroupText.classList.toggle('hidden', type !== 'text');
            elements.typeGroupImage.classList.toggle('hidden', type !== 'image');
            manager.updateConfig({ type });
        };
    });

    // Crop Selector
    elements.cropBtns.forEach(btn => {
        btn.onclick = () => {
            elements.cropBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            manager.updateConfig({ cropRatio: btn.dataset.ratio });
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
