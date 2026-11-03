const API_BASE = (window.location.protocol === 'file:') ? 'http://localhost:3000' : '';
const API_URL = `${API_BASE}/api/products`;

let allProductsData = [];

// Fetch and display products with live search & department filtering
async function loadProducts() {
    const tbody = document.getElementById('product-table-body');
    try {
        const response = await fetch(API_URL);
        allProductsData = await response.json();
        
        const badge = document.getElementById('products-count-badge');
        if (badge) badge.textContent = allProductsData.length;
        
        filterProductsCatalog();
    } catch (err) {
        if (tbody) tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: red;">Failed to load products. Is the server running?</td></tr>';
        console.error(err);
    }
}

function filterProductsCatalog() {
    const tbody = document.getElementById('product-table-body');
    if (!tbody) return;
    
    const searchInput = document.getElementById('product-search');
    const catSelect = document.getElementById('product-category-filter');
    const query = searchInput ? searchInput.value.toLowerCase().trim() : '';
    const selectedCat = catSelect ? catSelect.value : 'all';
    
    let filtered = allProductsData.filter(p => {
        // Department / Category filter
        if (selectedCat !== 'all') {
            const pCat = (p.category || '').toLowerCase();
            const sCat = selectedCat.toLowerCase();
            if (sCat === 'kids') {
                if (!pCat.includes('kid')) return false;
            } else if (!pCat.includes(sCat) && !sCat.includes(pCat)) {
                return false;
            }
        }
        
        // Search query filter (matches name, SKU, sizes, subcategory, color)
        if (query) {
            const matchName = (p.name || '').toLowerCase().includes(query);
            const matchSku = (p.sku || '').toLowerCase().includes(query);
            const matchSub = (p.subcategory || '').toLowerCase().includes(query);
            const matchSizes = (p.sizes || '').toLowerCase().includes(query);
            const matchColor = (p.color || '').toLowerCase().includes(query);
            if (!matchName && !matchSku && !matchSub && !matchSizes && !matchColor) return false;
        }
        
        return true;
    });
    
    const badge = document.getElementById('products-count-badge');
    if (badge) {
        badge.textContent = (query || selectedCat !== 'all') 
            ? `${filtered.length} of ${allProductsData.length}` 
            : allProductsData.length;
    }
    
    renderProductsTable(filtered);
}

function renderProductsTable(products) {
    const tbody = document.getElementById('product-table-body');
    if (!tbody) return;
    
    if (products.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 40px; color: #888;">No matching garments found.</td></tr>';
        return;
    }

    tbody.innerHTML = '';
    products.forEach(p => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><img src="${p.image}" alt="${p.name}" style="width: 48px; height: 58px; object-fit: cover; border-radius: 6px; border: 1px solid var(--border);"></td>
            <td style="font-weight: 500;">
                <div style="font-weight: 600; color: var(--ink);">${p.name}</div>
                <div style="display: flex; gap: 6px; align-items: center; margin-top: 4px; flex-wrap: wrap;">
                    ${p.sku ? `<span style="display: inline-block; font-size: 10px; font-weight: 600; color: #9C523A; background: rgba(156,82,58,0.1); padding: 2px 6px; border-radius: 4px; letter-spacing: 0.05em;">${p.sku}</span>` : ''}
                    ${p.sizes ? `<span style="font-size: 11px; color: #64748B;">Sizes: ${p.sizes}</span>` : ''}
                </div>
            </td>
            <td><span style="background: #f0f2f5; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 500;">${p.category}${p.subcategory ? ' &rarr; ' + p.subcategory : ''}</span></td>
            <td>
                <div>
                    <span style="font-weight: 600; color: ${p.original_price && Number(p.original_price) > Number(p.price) ? '#b45309' : 'inherit'};">₹${Number(p.price).toFixed(2)}</span>
                    ${p.original_price && Number(p.original_price) > Number(p.price) ? `<span style="text-decoration: line-through; color: #94a3b8; font-size: 11px; margin-left: 4px;">₹${Number(p.original_price).toFixed(2)}</span>` : ''}
                </div>
                ${p.offer_tag ? `<span style="display: inline-block; font-size: 10px; font-weight: 700; color: #92400e; background: #fef3c7; border: 1px solid #fde68a; padding: 2px 6px; border-radius: 4px; margin-top: 3px;">${p.offer_tag}</span>` : ''}
            </td>
            <td style="color: #888; font-size: 12px;">${new Date(p.created_at).toLocaleDateString()}</td>
            <td>
                <div style="display: flex; gap: 6px;">
                    <button class="btn-secondary" style="padding: 6px 12px; font-size: 11px;" onclick="openEditProductModal(${p.id})">Edit</button>
                    <button class="btn-danger" style="padding: 6px 12px; font-size: 11px;" onclick="deleteProduct(${p.id})">Delete</button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function exportProductsCSV() {
    if (allProductsData.length === 0) return alert('No products to export.');
    
    const headers = ['ID', 'SKU', 'Name', 'Category', 'Subcategory', 'Price', 'Date Added'];
    const rows = allProductsData.map(p => [
        p.id, 
        `"${p.sku || ''}"`,
        `"${p.name}"`, 
        `"${p.category}"`, 
        `"${p.subcategory || ''}"`, 
        p.price, 
        `"${new Date(p.created_at).toLocaleDateString()}"`
    ]);
    
    let csvContent = "data:text/csv;charset=utf-8," + headers.join(',') + "\n" + rows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "products_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// --- Import CSV Logic ---
function parseCSVRow(str) {
    const regex = /(?:\"([^\"]*)\"|([^,]+))/g;
    let matches;
    const result = [];
    while ((matches = regex.exec(str)) !== null) {
        result.push(matches[1] || matches[2]);
    }
    return result.map(s => s ? s.trim() : '');
}

async function handleImportProducts(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async function(e) {
        const text = e.target.result;
        const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        if(lines.length <= 1) return alert("CSV is empty or missing data.");
        
        let successCount = 0;
        let failCount = 0;
        const dummyImage = new File([new Blob([''])], 'placeholder.png', { type: 'image/png' });
        
        for(let i = 1; i < lines.length; i++) {
            const cols = parseCSVRow(lines[i]);
            if(cols.length < 5) { failCount++; continue; }
            
            const name = cols[1];
            const category = cols[2];
            const subcategory = cols[3] || '';
            const price = parseFloat(cols[4]);
            
            if(!name || !category || isNaN(price)) { failCount++; continue; }
            
            const formData = new FormData();
            formData.append('name', name);
            formData.append('category', category);
            formData.append('subcategory', subcategory);
            formData.append('price', price);
            formData.append('description', 'Imported from CSV');
            formData.append('images', dummyImage);
            
            try {
                const res = await fetch(`${API_BASE}/api/products`, {
                    method: 'POST',
                    body: formData
                });
                if(res.ok) successCount++;
                else failCount++;
            } catch (err) { failCount++; }
        }
        alert(`Import complete! ${successCount} imported, ${failCount} failed.`);
        loadProducts();
    };
    reader.readAsText(file);
    event.target.value = '';
}

async function handleImportCustomers(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async function(e) {
        const text = e.target.result;
        const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        if(lines.length <= 1) return alert("CSV is empty or missing data.");
        
        let successCount = 0;
        let failCount = 0;
        
        for(let i = 1; i < lines.length; i++) {
            const cols = parseCSVRow(lines[i]);
            if(cols.length < 4) { failCount++; continue; }
            
            const first_name = cols[1];
            const last_name = cols[2];
            const email = cols[3];
            const phone = cols[4] || '';
            
            if(!first_name || !email) { failCount++; continue; }
            
            try {
                const res = await fetch(`${API_BASE}/api/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ first_name, last_name, email, phone, password: 'changeme123' })
                });
                if(res.ok) successCount++;
                else failCount++;
            } catch (err) { failCount++; }
        }
        alert(`Import complete! ${successCount} imported, ${failCount} failed.`);
        loadCustomers();
    };
    reader.readAsText(file);
    event.target.value = '';
}

// ============================================================
// Multi-Angle Photography Studio & Auto-Generator Engine
// ============================================================
window.studioAngles = []; // Array of { id, label, role, blob, dataUrl, filename }
let replacingAngleIndex = -1;
let activeAiSlotIndex = -1;

function closeAddProductModal() {
    const modal = document.getElementById('add-product-modal');
    if (modal) modal.style.display = 'none';
    resetAngleStudio();
}

function resetAngleStudio() {
    window.studioAngles = [];
    replacingAngleIndex = -1;
    activeAiSlotIndex = -1;
    const fileInput = document.getElementById('p-image');
    if (fileInput) fileInput.value = '';
    const dropzone = document.getElementById('angle-dropzone');
    if (dropzone) dropzone.style.display = 'block';
    const previewGrid = document.getElementById('angle-preview-grid');
    if (previewGrid) {
        previewGrid.innerHTML = '';
        previewGrid.style.display = 'none';
    }
    const generatingBar = document.getElementById('angle-generating-bar');
    if (generatingBar) generatingBar.style.display = 'none';
    const footer = document.getElementById('angle-studio-footer');
    if (footer) footer.style.display = 'none';
}

function handleDragOver(e) {
    e.preventDefault();
    const dropzone = document.getElementById('angle-dropzone');
    if (dropzone) dropzone.classList.add('dragover');
}

function handleDragLeave(e) {
    e.preventDefault();
    const dropzone = document.getElementById('angle-dropzone');
    if (dropzone) dropzone.classList.remove('dragover');
}

function handleDrop(e) {
    e.preventDefault();
    const dropzone = document.getElementById('angle-dropzone');
    if (dropzone) dropzone.classList.remove('dragover');
    if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        processStudioFiles(e.dataTransfer.files);
    }
}

function handleProductImageUpload(event) {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    processStudioFiles(files);
}

async function processStudioFiles(files) {
    const generatingBar = document.getElementById('angle-generating-bar');
    const dropzone = document.getElementById('angle-dropzone');
    
    if (files.length === 1) {
        // Single front image uploaded -> Automatically synthesize 4 angles!
        if (generatingBar) generatingBar.style.display = 'flex';
        if (dropzone) dropzone.style.display = 'none';
        
        try {
            const angles = await generate4StudioAngles(files[0]);
            window.studioAngles = angles;
            renderAnglePreviews();
        } catch (err) {
            console.error('Error generating studio angles:', err);
            alert('Failed to process image. Please try another image.');
            resetAngleStudio();
        } finally {
            if (generatingBar) generatingBar.style.display = 'none';
        }
    } else {
        // Multiple images chosen (e.g. 2, 3, 4 files chosen directly)
        if (generatingBar) generatingBar.style.display = 'flex';
        if (dropzone) dropzone.style.display = 'none';
        
        const angles = [];
        const roleNames = ['Angle 1: Front Hero', 'Angle 2: Back View', 'Angle 3: Side Profile', 'Angle 4: Macro Detail', 'Angle 5: Alternate'];
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const dataUrl = await readFileAsDataURL(file);
            angles.push({
                id: Date.now() + i,
                label: roleNames[i] || `Angle ${i+1}`,
                role: `angle_${i+1}`,
                blob: file,
                dataUrl: dataUrl,
                filename: file.name
            });
        }
        window.studioAngles = angles;
        renderAnglePreviews();
        if (generatingBar) generatingBar.style.display = 'none';
    }
}

function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = e => resolve(e.target.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

function loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
    });
}

function canvasToBlob(canvas, quality = 0.92) {
    return new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', quality));
}

// Smart Canvas Multi-Angle Synthesizer
async function generate4StudioAngles(file) {
    const dataUrl = await readFileAsDataURL(file);
    const img = await loadImage(dataUrl);

    const baseW = img.naturalWidth || img.width;
    const baseH = img.naturalHeight || img.height;

    // Target dimensions (4:5 high-res ratio)
    const outW = Math.min(1200, Math.max(800, baseW));
    const outH = Math.round(outW * 1.25);

    // ---- Angle 1: Full Front (Hero) ----
    const c1 = document.createElement('canvas');
    c1.width = outW;
    c1.height = outH;
    const ctx1 = c1.getContext('2d');
    ctx1.fillStyle = '#ffffff';
    ctx1.fillRect(0, 0, outW, outH);
    drawImageCover(ctx1, img, 0, 0, outW, outH);
    const b1 = await canvasToBlob(c1);
    const u1 = c1.toDataURL('image/jpeg', 0.92);

    // ---- Angle 2: Synthesized Back View (with high collar and smoothed yoke) ----
    const c2 = document.createElement('canvas');
    c2.width = outW;
    c2.height = outH;
    const ctx2 = c2.getContext('2d');
    ctx2.fillStyle = '#ffffff';
    ctx2.fillRect(0, 0, outW, outH);
    ctx2.save();
    ctx2.translate(outW, 0);
    ctx2.scale(-1, 1);
    drawImageCover(ctx2, img, 0, 0, outW, outH);
    ctx2.restore();

    // Inpaint/close the front neckline to simulate rear high collar
    const neckY = outH * 0.22;
    const neckRadiusX = outW * 0.16;
    const neckRadiusY = outH * 0.05;
    
    // Sample garment shoulder/fabric color
    const pixel = ctx2.getImageData(Math.round(outW * 0.35), Math.round(outH * 0.35), 1, 1).data;
    const garmentR = pixel[0] || 200, garmentG = pixel[1] || 200, garmentB = pixel[2] || 200;

    // Smooth over chest placket/buttons
    const chestW = outW * 0.20;
    const chestH = outH * 0.28;
    const chestX = (outW - chestW) / 2;
    const chestY = outH * 0.22;
    
    const chestGrad = ctx2.createLinearGradient(chestX, chestY, chestX + chestW, chestY);
    chestGrad.addColorStop(0, `rgba(${garmentR}, ${garmentG}, ${garmentB}, 0.85)`);
    chestGrad.addColorStop(0.5, `rgba(${garmentR}, ${garmentG}, ${garmentB}, 0.95)`);
    chestGrad.addColorStop(1, `rgba(${garmentR}, ${garmentG}, ${garmentB}, 0.85)`);
    ctx2.fillStyle = chestGrad;
    ctx2.beginPath();
    if (ctx2.roundRect) ctx2.roundRect(chestX, chestY, chestW, chestH, 12);
    else ctx2.rect(chestX, chestY, chestW, chestH);
    ctx2.fill();

    // High back collar seam line
    ctx2.strokeStyle = `rgba(${Math.max(0, garmentR - 40)}, ${Math.max(0, garmentG - 40)}, ${Math.max(0, garmentB - 40)}, 0.45)`;
    ctx2.lineWidth = 2;
    ctx2.beginPath();
    ctx2.ellipse(outW / 2, neckY, neckRadiusX, neckRadiusY, 0, 0, Math.PI);
    ctx2.stroke();

    // Upper back horizontal yoke seam
    ctx2.beginPath();
    ctx2.moveTo(outW * 0.28, outH * 0.32);
    ctx2.lineTo(outW * 0.72, outH * 0.32);
    ctx2.stroke();

    const b2 = await canvasToBlob(c2);
    const u2 = c2.toDataURL('image/jpeg', 0.92);

    // ---- Angle 3: Fabric & Texture Detail (Macro Center Zoom) ----
    const c3 = document.createElement('canvas');
    c3.width = outW;
    c3.height = outH;
    const ctx3 = c3.getContext('2d');
    ctx3.fillStyle = '#ffffff';
    ctx3.fillRect(0, 0, outW, outH);
    const cropW3 = baseW * 0.42;
    const cropH3 = baseH * 0.42;
    const cropX3 = (baseW - cropW3) / 2;
    const cropY3 = baseH * 0.26;
    ctx3.filter = 'contrast(1.08) saturate(1.03) brightness(1.01)';
    ctx3.drawImage(img, cropX3, cropY3, cropW3, cropH3, 0, 0, outW, outH);
    ctx3.filter = 'none';
    const b3 = await canvasToBlob(c3);
    const u3 = c3.toDataURL('image/jpeg', 0.92);

    // ---- Angle 4: Fit & Silhouette (Half-Body Styling Crop) ----
    const c4 = document.createElement('canvas');
    c4.width = outW;
    c4.height = outH;
    const ctx4 = c4.getContext('2d');
    ctx4.fillStyle = '#ffffff';
    ctx4.fillRect(0, 0, outW, outH);
    const cropW4 = baseW * 0.72;
    const cropH4 = baseH * 0.65;
    const cropX4 = (baseW - cropW4) / 2;
    const cropY4 = baseH * 0.12;
    ctx4.drawImage(img, cropX4, cropY4, cropW4, cropH4, 0, 0, outW, outH);
    const b4 = await canvasToBlob(c4);
    const u4 = c4.toDataURL('image/jpeg', 0.92);

    return [
        { id: 1, label: 'Angle 1 · Front View', role: 'front', blob: b1, dataUrl: u1, filename: 'angle_1_front.jpg' },
        { id: 2, label: 'Angle 2 · Back View', role: 'back', blob: b2, dataUrl: u2, filename: 'angle_2_back.jpg' },
        { id: 3, label: 'Angle 3 · Fabric Macro', role: 'detail', blob: b3, dataUrl: u3, filename: 'angle_3_detail.jpg' },
        { id: 4, label: 'Angle 4 · Fit & Drape', role: 'fit', blob: b4, dataUrl: u4, filename: 'angle_4_fit.jpg' }
    ];
}

function drawImageCover(ctx, img, x, y, w, h) {
    const imgRatio = img.width / img.height;
    const targetRatio = w / h;
    let sW, sH, sX, sY;
    if (imgRatio > targetRatio) {
        sH = img.height;
        sW = img.height * targetRatio;
        sX = (img.width - sW) / 2;
        sY = 0;
    } else {
        sW = img.width;
        sH = img.width / targetRatio;
        sX = 0;
        sY = (img.height - sH) / 2;
    }
    ctx.drawImage(img, sX, sY, sW, sH, x, y, w, h);
}

function renderAnglePreviews() {
    const grid = document.getElementById('angle-preview-grid');
    const footer = document.getElementById('angle-studio-footer');
    if (!grid) return;

    if (!window.studioAngles || window.studioAngles.length === 0) {
        grid.style.display = 'none';
        if (footer) footer.style.display = 'none';
        const dropzone = document.getElementById('angle-dropzone');
        if (dropzone) dropzone.style.display = 'block';
        return;
    }

    grid.style.display = 'grid';
    if (footer) footer.style.display = 'flex';

    grid.innerHTML = window.studioAngles.map((angle, idx) => `
        <div class="angle-card" id="angle-card-${idx}">
            <div class="angle-card-thumb-wrap">
                <img src="${angle.dataUrl}" class="angle-card-thumb" alt="${angle.label}">
                <div class="angle-card-pill">${angle.label.split('·')[0].trim()}</div>
                <button type="button" class="angle-card-del" onclick="removeStudioAngle(${idx})" title="Remove this angle">&times;</button>
            </div>
            <div class="angle-card-info">
                <div class="angle-card-title">${angle.label}</div>
                <div class="angle-card-actions">
                    <button type="button" class="angle-btn-sm" style="${idx === 1 ? 'background: #eef2ff; color: #3730a3; font-weight: 700;' : ''}" onclick="triggerReplaceAngle(${idx})">
                        ${idx === 1 ? '📷 Upload Back' : 'Replace'}
                    </button>
                    <button type="button" class="angle-btn-sm angle-btn-ai" onclick="openAiAngleModalForSlot(${idx})">✨ AI</button>
                </div>
            </div>
        </div>
    `).join('');
}

function triggerReplaceAngle(index) {
    replacingAngleIndex = index;
    const input = document.getElementById('angle-replace-input');
    if (input) {
        input.value = '';
        input.click();
    }
}

async function handleAngleReplaceFile(event) {
    const file = event.target.files[0];
    if (!file || replacingAngleIndex < 0 || replacingAngleIndex >= window.studioAngles.length) return;
    const dataUrl = await readFileAsDataURL(file);
    window.studioAngles[replacingAngleIndex].blob = file;
    window.studioAngles[replacingAngleIndex].dataUrl = dataUrl;
    window.studioAngles[replacingAngleIndex].filename = file.name;
    renderAnglePreviews();
    replacingAngleIndex = -1;
}

async function handleAddAngleFile(event) {
    const file = event.target.files[0];
    if (!file) return;
    const dataUrl = await readFileAsDataURL(file);
    const newIdx = window.studioAngles.length + 1;
    window.studioAngles.push({
        id: Date.now(),
        label: `Angle ${newIdx}: Custom`,
        role: `custom_${newIdx}`,
        blob: file,
        dataUrl: dataUrl,
        filename: file.name
    });
    renderAnglePreviews();
    event.target.value = '';
}

function removeStudioAngle(index) {
    if (window.studioAngles.length <= 1) {
        resetAngleStudio();
        return;
    }
    window.studioAngles.splice(index, 1);
    window.studioAngles.forEach((a, idx) => {
        const parts = a.label.split(':');
        const role = parts[1] ? parts[1].trim() : 'View';
        a.label = `Angle ${idx + 1}: ${role}`;
    });
    renderAnglePreviews();
}

function openAiAngleModal() {
    activeAiSlotIndex = -1;
    const modal = document.getElementById('ai-angle-modal');
    if (modal) modal.style.display = 'flex';
}
function openAiAngleModalForSlot(idx) {
    activeAiSlotIndex = idx;
    const modal = document.getElementById('ai-angle-modal');
    if (modal) modal.style.display = 'flex';
}

async function executeAiAngleGeneration() {
    const angleType = document.getElementById('ai-target-angle').value;
    const extraPrompt = document.getElementById('ai-prompt-extra').value;
    const apiKey = document.getElementById('ai-api-key').value;
    const btn = document.getElementById('btn-run-ai-angle');

    if (!window.studioAngles || window.studioAngles.length === 0) {
        alert('Please upload a front face photo first so the AI has a reference image.');
        return;
    }

    const frontDataUrl = window.studioAngles[0].dataUrl;

    btn.textContent = 'Generating AI Angle...';
    btn.disabled = true;

    try {
        const response = await fetch('/api/generate-ai-angle', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                angleType,
                prompt: extraPrompt,
                apiKey,
                imageBase64: frontDataUrl
            })
        });

        const data = await response.json();
        if (response.ok && data.imageUrl) {
            const resp = await fetch(data.imageUrl);
            const blob = await resp.blob();
            const angleObj = {
                id: Date.now(),
                label: `AI Angle: ${angleType.toUpperCase()}`,
                role: angleType,
                blob: blob,
                dataUrl: data.imageUrl,
                filename: `ai_${angleType}_${Date.now()}.jpg`
            };

            if (activeAiSlotIndex >= 0 && activeAiSlotIndex < window.studioAngles.length) {
                window.studioAngles[activeAiSlotIndex] = angleObj;
            } else {
                window.studioAngles.push(angleObj);
            }
            renderAnglePreviews();
            document.getElementById('ai-angle-modal').style.display = 'none';
        } else {
            // Smart local fallback
            const synthesizedBlob = await generateLocalSmartAngle(angleType);
            const url = URL.createObjectURL(synthesizedBlob);
            const angleObj = {
                id: Date.now(),
                label: `AI ${capitalize(angleType)} View`,
                role: angleType,
                blob: synthesizedBlob,
                dataUrl: url,
                filename: `ai_${angleType}.jpg`
            };
            if (activeAiSlotIndex >= 0 && activeAiSlotIndex < window.studioAngles.length) {
                window.studioAngles[activeAiSlotIndex] = angleObj;
            } else {
                window.studioAngles.push(angleObj);
            }
            renderAnglePreviews();
            document.getElementById('ai-angle-modal').style.display = 'none';
        }
    } catch (err) {
        console.error('AI generation fallback:', err);
        const synthesizedBlob = await generateLocalSmartAngle(angleType);
        const url = URL.createObjectURL(synthesizedBlob);
        const angleObj = {
            id: Date.now(),
            label: `Smart ${capitalize(angleType)} View`,
            role: angleType,
            blob: synthesizedBlob,
            dataUrl: url,
            filename: `smart_${angleType}.jpg`
        };
        if (activeAiSlotIndex >= 0 && activeAiSlotIndex < window.studioAngles.length) {
            window.studioAngles[activeAiSlotIndex] = angleObj;
        } else {
            window.studioAngles.push(angleObj);
        }
        renderAnglePreviews();
        document.getElementById('ai-angle-modal').style.display = 'none';
    } finally {
        btn.textContent = 'Generate & Add Angle';
        btn.disabled = false;
        activeAiSlotIndex = -1;
    }
}

function capitalize(s) {
    return s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
}

async function generateLocalSmartAngle(angleType) {
    const frontUrl = window.studioAngles[0].dataUrl;
    const img = await loadImage(frontUrl);
    const canvas = document.createElement('canvas');
    const w = 1000;
    const h = 1250;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);

    if (angleType === 'back') {
        // Mirrored silhouette with soft studio shadow to represent rear perspective
        ctx.save();
        ctx.translate(w, 0);
        ctx.scale(-1, 1);
        ctx.filter = 'brightness(0.96) contrast(1.04)';
        drawImageCover(ctx, img, 0, 0, w, h);
        ctx.restore();
    } else if (angleType === 'side') {
        // 3D side profile perspective
        ctx.save();
        ctx.transform(0.93, 0.05, -0.04, 1.0, 30, -10);
        drawImageCover(ctx, img, 0, 0, w, h);
        ctx.restore();
    } else if (angleType === 'macro') {
        // Extreme macro texture zoom
        const cropW = img.width * 0.28;
        const cropH = img.height * 0.28;
        const cropX = (img.width - cropW) / 2;
        const cropY = img.height * 0.32;
        ctx.filter = 'contrast(1.15) saturate(1.08) brightness(1.02)';
        ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, w, h);
        ctx.filter = 'none';
    } else {
        drawImageCover(ctx, img, 0, 0, w, h);
    }
    return await canvasToBlob(canvas);
}

// Add new product
document.getElementById('add-product-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const pFiles = document.getElementById('p-image').files;
    if ((!window.studioAngles || window.studioAngles.length === 0) && (!pFiles || pFiles.length === 0)) {
        alert('Please upload a product photo to generate angles.');
        return;
    }

    const btn = document.getElementById('submit-btn');
    btn.textContent = 'Saving to Catalog...';
    btn.disabled = true;

    const formData = new FormData();
    formData.append('name', document.getElementById('p-name').value);
    formData.append('price', document.getElementById('p-price').value);
    formData.append('original_price', document.getElementById('p-orig-price') ? document.getElementById('p-orig-price').value : '');
    formData.append('offer_tag', document.getElementById('p-offer-tag') ? document.getElementById('p-offer-tag').value : '');
    formData.append('category', document.getElementById('p-category').value);
    formData.append('subcategory', document.getElementById('p-subcategory').value);
    formData.append('description', document.getElementById('p-desc').value);
    formData.append('color', document.getElementById('p-color').value);
    formData.append('material', document.getElementById('p-material').value);

    // Attach all studio angles as files!
    if (window.studioAngles && window.studioAngles.length > 0) {
        for (let i = 0; i < window.studioAngles.length; i++) {
            const item = window.studioAngles[i];
            formData.append('images', item.blob, item.filename || `angle_${i+1}.jpg`);
        }
    } else {
        for(let i=0; i<pFiles.length; i++) {
            formData.append('images', pFiles[i]);
        }
    }

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            body: formData
        });

        if (response.ok) {
            document.getElementById('add-product-form').reset();
            closeAddProductModal();
            loadProducts(); // refresh table
        } else {
            const err = await response.json();
            alert('Error: ' + err.error);
        }
    } catch (err) {
        alert('Failed to connect to the server.');
    } finally {
        btn.textContent = 'Save to Catalog';
        btn.disabled = false;
    }
});

// Delete product
async function deleteProduct(id) {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
        const response = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
        if (response.ok) {
            loadProducts();
        } else {
            alert('Failed to delete product.');
        }
    } catch (err) {
        console.error(err);
    }
}

// ============================================================
// Edit Product Management & Angle Editor
// ============================================================
window.editStudioAngles = [];
let replacingEditAngleIndex = -1;

function closeEditProductModal() {
    const modal = document.getElementById('edit-product-modal');
    if (modal) modal.style.display = 'none';
    window.editStudioAngles = [];
    replacingEditAngleIndex = -1;
}

window.filterEditSubcategories = function() {
    const catEl = document.getElementById('edit-p-category');
    const parentVal = catEl ? catEl.value : '';
    const subSelect = document.getElementById('edit-p-subcategory');
    if (!subSelect) return;
    
    subSelect.innerHTML = '<option value="" selected>None</option>';
    if (window.allCategories && window.allCategories.length > 0) {
        const subcategories = window.allCategories.filter(c => c.parent_category === parentVal);
        subcategories.forEach(sub => {
            const opt = document.createElement('option');
            opt.value = sub.name;
            opt.innerText = sub.name;
            subSelect.appendChild(opt);
        });
    }
};

async function openEditProductModal(id) {
    let product = allProductsData.find(p => p.id == id);
    if (!product && typeof allInventoryProducts !== 'undefined' && Array.isArray(allInventoryProducts)) {
        product = allInventoryProducts.find(p => p.id == id);
    }
    if (!product) {
        try {
            const r = await fetch(`${API_URL}/${id}`);
            if (r.ok) product = await r.json();
        } catch(e) {
            console.error('Error fetching product for edit:', e);
        }
    }
    if (!product) return alert('Product not found (ID: ' + id + ').');

    document.getElementById('edit-p-id').value = product.id;
    document.getElementById('edit-p-name').value = product.name || '';
    document.getElementById('edit-p-price').value = product.price !== undefined ? product.price : '';
    const origInput = document.getElementById('edit-p-orig-price');
    if (origInput) origInput.value = product.original_price !== undefined && product.original_price !== null ? product.original_price : '';
    const tagInput = document.getElementById('edit-p-offer-tag');
    if (tagInput) tagInput.value = product.offer_tag || '';
    document.getElementById('edit-p-color').value = product.color || '';
    
    // Populate Sizes & Setup Size Studio
    const editSizesInput = document.getElementById('edit-p-sizes');
    const currentSizes = (product.sizes || 'XS, S, M, L, XL').trim();
    if (editSizesInput) editSizesInput.value = currentSizes;

    let presetToUse = 'standard';
    const lowerSizes = currentSizes.toLowerCase();
    if (lowerSizes.includes('free') || lowerSizes.includes('one')) {
        presetToUse = 'free';
    } else if (currentSizes.includes('38') || currentSizes.includes('40')) {
        presetToUse = 'numeric';
    } else if (lowerSizes.includes('y') || lowerSizes.includes('year')) {
        presetToUse = 'kids';
    }

    // Set preset button active
    const editPresetBtns = document.querySelectorAll('#edit-product-modal .btn-size-preset');
    editPresetBtns.forEach(b => {
        b.classList.remove('active');
        b.style.background = 'white';
        b.style.color = '#334155';
        b.style.borderColor = '#cbd5e1';
    });
    const activeBtn = Array.from(editPresetBtns).find(b => b.getAttribute('onclick') && b.getAttribute('onclick').includes("'" + presetToUse + "'"));
    if (activeBtn) {
        activeBtn.classList.add('active');
        activeBtn.style.background = '#9C523A';
        activeBtn.style.color = 'white';
        activeBtn.style.borderColor = '#9C523A';
    }
    const currentSizeArray = currentSizes.split(',').map(s => s.trim());
    renderSizeChips('edit', presetToUse, currentSizeArray);

    // Populate Color Mode
    const isMultiColor = (product.color || '').includes(',');
    const colorRadios = document.getElementsByName('edit-color-mode');
    colorRadios.forEach(r => {
        if (r.value === (isMultiColor ? 'multi' : 'single')) r.checked = true;
    });
    toggleColorMode('edit');
    document.getElementById('edit-p-material').value = product.material || '';
    document.getElementById('edit-p-desc').value = product.description || '';

    // Populate categories in edit-p-category
    const catSelect = document.getElementById('edit-p-category');
    catSelect.innerHTML = '<option value="" disabled>Select a category...</option>';
    let matched = false;
    if (window.allCategories && window.allCategories.length > 0) {
        window.allCategories.forEach(c => {
            if (!c.parent_category) {
                const opt = document.createElement('option');
                opt.value = c.name;
                opt.innerText = c.name;
                if (c.name === product.category) {
                    opt.selected = true;
                    matched = true;
                }
                catSelect.appendChild(opt);
            }
        });
    }
    // If product category wasn't in current category list, add it as selected option
    if (!matched && product.category) {
        const opt = document.createElement('option');
        opt.value = product.category;
        opt.innerText = product.category;
        opt.selected = true;
        catSelect.appendChild(opt);
    }
    if (product.category) {
        catSelect.value = product.category;
    }

    // Populate subcategories
    filterEditSubcategories();
    const subSelect = document.getElementById('edit-p-subcategory');
    if (product.subcategory && subSelect) {
        let subFound = false;
        for (let i = 0; i < subSelect.options.length; i++) {
            if (subSelect.options[i].value === product.subcategory) {
                subFound = true;
                break;
            }
        }
        if (!subFound) {
            const opt = document.createElement('option');
            opt.value = product.subcategory;
            opt.innerText = product.subcategory;
            subSelect.appendChild(opt);
        }
        subSelect.value = product.subcategory;
    }

    // Parse gallery angles
    let galleryList = [];
    if (product.gallery) {
        try {
            galleryList = JSON.parse(product.gallery);
            if (!Array.isArray(galleryList)) galleryList = [galleryList];
        } catch(e) {
            galleryList = [product.image];
        }
    } else if (product.image) {
        galleryList = [product.image];
    }

    const angleRoleNames = ['Front View', 'Back View', 'Macro Texture Detail', 'Fit & Styling Drape', 'Extra Angle'];
    window.editStudioAngles = galleryList.map((url, idx) => ({
        id: Date.now() + idx,
        url: url,
        blob: null,
        isNew: false,
        label: `Angle ${idx + 1} · ${angleRoleNames[idx] || 'View'}`
    }));

    renderEditAnglePreviews();
    
    // Explicitly open modal
    const modal = document.getElementById('edit-product-modal');
    if (modal) {
        modal.style.display = 'flex';
    }
}

function renderEditAnglePreviews() {
    const grid = document.getElementById('edit-angle-preview-grid');
    if (!grid) return;

    if (!window.editStudioAngles || window.editStudioAngles.length === 0) {
        grid.innerHTML = '<div style="grid-column: span 4; text-align: center; padding: 20px; color: #888;">No angles currently. Click "+ Add Angle" or "🔄 Regenerate 4 Angles" below.</div>';
        return;
    }

    grid.innerHTML = window.editStudioAngles.map((angle, idx) => `
        <div class="angle-card" id="edit-angle-card-${idx}">
            <div class="angle-card-thumb-wrap">
                <img src="${angle.url}" class="angle-card-thumb" alt="${angle.label}">
                <div class="angle-card-pill">${angle.label.split('·')[0].trim()}</div>
                <button type="button" class="angle-card-del" onclick="removeEditStudioAngle(${idx})" title="Remove this angle">&times;</button>
            </div>
            <div class="angle-card-info">
                <div class="angle-card-title">${angle.label}</div>
                <div class="angle-card-actions">
                    <button type="button" class="angle-btn-sm" style="background: #eef2ff; color: #3730a3; font-weight: 700;" onclick="triggerEditReplaceAngle(${idx})">
                        ${idx === 1 ? '📷 Replace with Real Back' : '📷 Replace Photo'}
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

function triggerEditReplaceAngle(index) {
    replacingEditAngleIndex = index;
    const input = document.getElementById('edit-angle-replace-input');
    if (input) {
        input.value = '';
        input.click();
    }
}

async function handleEditAngleReplaceFile(event) {
    const file = event.target.files[0];
    if (!file || replacingEditAngleIndex < 0 || replacingEditAngleIndex >= window.editStudioAngles.length) return;
    const dataUrl = await readFileAsDataURL(file);
    window.editStudioAngles[replacingEditAngleIndex].blob = file;
    window.editStudioAngles[replacingEditAngleIndex].url = dataUrl;
    window.editStudioAngles[replacingEditAngleIndex].isNew = true;
    window.editStudioAngles[replacingEditAngleIndex].filename = file.name;
    renderEditAnglePreviews();
    replacingEditAngleIndex = -1;
}

async function handleEditAddAngleFile(event) {
    const file = event.target.files[0];
    if (!file) return;
    const dataUrl = await readFileAsDataURL(file);
    const newIdx = window.editStudioAngles.length + 1;
    window.editStudioAngles.push({
        id: Date.now(),
        url: dataUrl,
        blob: file,
        isNew: true,
        label: `Angle ${newIdx} · Additional Shot`,
        filename: file.name
    });
    renderEditAnglePreviews();
    event.target.value = '';
}

async function handleEditRegenerateAngles(event) {
    const file = event.target.files[0];
    if (!file) return;
    try {
        const angles = await generate4StudioAngles(file);
        window.editStudioAngles = angles.map(a => ({
            id: a.id,
            url: a.url,
            blob: a.blob,
            isNew: true,
            label: a.label,
            filename: `${a.role}_angle.jpg`
        }));
        renderEditAnglePreviews();
        if (typeof showAdminToast === 'function') {
            showAdminToast('Generated 4 new studio angles from photo!', 'success');
        }
    } catch (err) {
        console.error('Regenerate angles error:', err);
        alert('Failed to regenerate angles: ' + err.message);
    }
    event.target.value = '';
}

function removeEditStudioAngle(index) {
    if (window.editStudioAngles.length <= 1) {
        return alert('A product must have at least 1 image.');
    }
    window.editStudioAngles.splice(index, 1);
    window.editStudioAngles.forEach((a, idx) => {
        const parts = a.label.split('·');
        const role = parts[1] ? parts[1].trim() : 'View';
        a.label = `Angle ${idx + 1} · ${role}`;
    });
    renderEditAnglePreviews();
}

async function handleEditProductSubmit(e) {
    if (e && e.preventDefault) e.preventDefault();
    const id = document.getElementById('edit-p-id').value;
    const btn = document.getElementById('edit-submit-btn');
    if (btn) {
        btn.textContent = 'Saving Changes...';
        btn.disabled = true;
    }

    const formData = new FormData();
    formData.append('name', document.getElementById('edit-p-name').value);
    formData.append('price', document.getElementById('edit-p-price').value);
    formData.append('original_price', document.getElementById('edit-p-orig-price') ? document.getElementById('edit-p-orig-price').value : '');
    formData.append('offer_tag', document.getElementById('edit-p-offer-tag') ? document.getElementById('edit-p-offer-tag').value : '');
    formData.append('category', document.getElementById('edit-p-category').value);
    formData.append('subcategory', document.getElementById('edit-p-subcategory').value);
    formData.append('description', document.getElementById('edit-p-desc').value);
    formData.append('color', document.getElementById('edit-p-color').value);
    formData.append('material', document.getElementById('edit-p-material').value);
    const sizesInput = document.getElementById('edit-p-sizes');
    formData.append('sizes', sizesInput ? sizesInput.value : 'Free Size');

    // Separate existing images vs newly uploaded files
    const keptExistingImages = [];
    if (window.editStudioAngles && window.editStudioAngles.length > 0) {
        for (let i = 0; i < window.editStudioAngles.length; i++) {
            const angle = window.editStudioAngles[i];
            if (angle.isNew && angle.blob) {
                formData.append('images', angle.blob, angle.filename || `angle_${i+1}.jpg`);
            } else if (!angle.isNew && angle.url) {
                keptExistingImages.push(angle.url);
            }
        }
    }
    formData.append('existingGallery', JSON.stringify(keptExistingImages));

    try {
        const res = await fetch(`${API_URL}/${id}`, {
            method: 'PUT',
            body: formData
        });

        if (res.ok) {
            closeEditProductModal();
            await loadProducts();
            if (typeof loadInventory === 'function') loadInventory();
            if (typeof showAdminToast === 'function') {
                showAdminToast('Product updated successfully!', 'success');
            } else {
                alert('Product updated successfully!');
            }
        } else {
            const err = await res.json().catch(() => ({}));
            alert('Error updating product: ' + (err.error || 'Server error ' + res.status));
        }
    } catch (err) {
        console.error('Save edit error:', err);
        alert('Failed to connect to the server: ' + err.message);
    } finally {
        if (btn) {
            btn.textContent = 'Save Changes';
            btn.disabled = false;
        }
    }
}

// Global window exposure for all inline onclick calls
window.openEditProductModal = openEditProductModal;
window.closeEditProductModal = closeEditProductModal;
window.renderEditAnglePreviews = renderEditAnglePreviews;
window.triggerEditReplaceAngle = triggerEditReplaceAngle;
window.handleEditAngleReplaceFile = handleEditAngleReplaceFile;
window.handleEditAddAngleFile = handleEditAddAngleFile;
window.handleEditRegenerateAngles = handleEditRegenerateAngles;
window.removeEditStudioAngle = removeEditStudioAngle;
window.handleEditProductSubmit = handleEditProductSubmit;

// Form Submit Handler
function setupEditProductForm() {
    const editForm = document.getElementById('edit-product-form');
    if (!editForm) return;
    editForm.onsubmit = handleEditProductSubmit;
}
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupEditProductForm);
} else {
    setupEditProductForm();
    if (typeof renderSizeChips === 'function') renderSizeChips('add', 'standard');
}

// ---- Orders Management ----
let allOrdersData = [];

let currentOrderStatusFilter = 'all';

async function loadOrders() {
    const tbody = document.getElementById('order-table-body');
    try {
        const response = await fetch(`${API_BASE}/api/orders`);
        allOrdersData = await response.json();
        
        // Update total and status badges
        const total = allOrdersData.length;
        const setBadge = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.textContent = val;
        };
        
        setBadge('orders-total-count', total);
        setBadge('cnt-orders-all', total);
        setBadge('cnt-orders-pending', allOrdersData.filter(o => o.status === 'Pending').length);
        setBadge('cnt-orders-proc', allOrdersData.filter(o => o.status === 'Processing').length);
        setBadge('cnt-orders-ship', allOrdersData.filter(o => o.status === 'Shipped').length);
        setBadge('cnt-orders-del', allOrdersData.filter(o => o.status === 'Delivered').length);
        setBadge('cnt-orders-canc', allOrdersData.filter(o => o.status === 'Cancelled').length);
        
        filterOrdersList();
    } catch (err) {
        if (tbody) tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; color: red;">Failed to load orders.</td></tr>';
        console.error(err);
    }
}

function filterOrdersByStatus(status, btn) {
    currentOrderStatusFilter = status;
    document.querySelectorAll('.order-filter-btn').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    filterOrdersList();
}

function filterOrdersList() {
    const tbody = document.getElementById('order-table-body');
    if (!tbody) return;
    
    const searchInput = document.getElementById('order-search');
    const query = searchInput ? searchInput.value.toLowerCase().trim() : '';
    
    let filtered = allOrdersData.filter(o => {
        // Status filter
        if (currentOrderStatusFilter !== 'all' && o.status !== currentOrderStatusFilter) {
            return false;
        }
        
        // Search query filter
        if (query) {
            const idStr = String(o.id || '');
            const nameStr = (o.customer_name || '').toLowerCase();
            const emailStr = (o.email || '').toLowerCase();
            const phoneStr = (o.phone || '').toLowerCase();
            const cityStr = (o.city || '').toLowerCase();
            const addrStr = (o.address || '').toLowerCase();
            let itemsStr = '';
            try {
                const itemsObj = typeof o.items === 'string' ? JSON.parse(o.items) : o.items;
                itemsStr = itemsObj.map(i => i.name).join(' ').toLowerCase();
            } catch(e) {}
            
            const match = idStr.includes(query) || 
                          ('#' + idStr).includes(query) ||
                          nameStr.includes(query) || 
                          emailStr.includes(query) || 
                          phoneStr.includes(query) || 
                          cityStr.includes(query) || 
                          addrStr.includes(query) ||
                          itemsStr.includes(query);
            if (!match) return false;
        }
        
        return true;
    });
    
    renderOrdersTable(filtered);
}

function renderOrdersTable(orders) {
    const tbody = document.getElementById('order-table-body');
    if (!tbody) return;
    
    if (orders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 40px; color: #888;">No matching orders found.</td></tr>';
        return;
    }

    tbody.innerHTML = '';
    orders.forEach(o => {
        let itemsStr = '';
        try {
            const itemsObj = typeof o.items === 'string' ? JSON.parse(o.items) : o.items;
            itemsStr = itemsObj.map(i => {
                const q = i.qty || i.quantity || 1;
                return `${i.name} (${q}${i.size ? ', ' + i.size : ''})`;
            }).join(', ');
        } catch(e) {
            itemsStr = String(o.items || '');
        }

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong style="color: var(--ink);">#${o.id}</strong></td>
            <td style="font-weight: 500;">
                <div>${o.customer_name || 'Guest'}</div>
                <span style="font-size:11px; color:#64748b;">${o.email || ''}</span>
                ${o.phone ? `<br><span style="font-size:11px; color:#15803d; font-weight:600;"><i class="ri-phone-line"></i> ${o.phone}</span>` : ''}
            </td>
            <td style="font-size:12px;">
                <div>${o.address || ''}</div>
                ${(o.city || o.pincode) ? `<span style="font-size:11px; color:#64748b; font-weight:500;">${[o.city, o.pincode].filter(Boolean).join(', ')}</span><br>` : ''}
                ${o.payment_method ? `<span style="display:inline-block; margin-top:3px; padding:2px 6px; font-size:10px; font-weight:700; border-radius:3px; background:#f1f5f9; color:#475569; text-transform:uppercase;">${o.payment_method}</span>` : ''}
            </td>
            <td style="font-size:12px; max-width: 220px; color: #334155;">${itemsStr}</td>
            <td style="font-weight: 700; color: var(--ink);">₹${Number(o.total_price || 0).toFixed(2)}</td>
            <td>
                <select onchange="updateOrderStatus(${o.id}, this.value)" class="status-pill status-${o.status}">
                    <option value="Pending" ${o.status === 'Pending' ? 'selected' : ''}>Pending</option>
                    <option value="Processing" ${o.status === 'Processing' ? 'selected' : ''}>Processing</option>
                    <option value="Shipped" ${o.status === 'Shipped' ? 'selected' : ''}>Shipped</option>
                    <option value="Delivered" ${o.status === 'Delivered' ? 'selected' : ''}>Delivered</option>
                    <option value="Cancelled" ${o.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
                </select>
            </td>
            <td style="color: #888; font-size: 12px;">${new Date(o.created_at).toLocaleDateString()}</td>
            <td>
                <div style="display: flex; gap: 6px; align-items: center;">
                    <button class="btn-primary" style="padding: 6px 12px; font-size: 12px;" onclick="viewOrderDetails(${o.id})">View</button>
                    <button class="btn-danger" style="padding: 6px 10px; font-size: 12px; border-radius: 4px;" onclick="deleteOrder(${o.id})" title="Delete Order"><i class="ri-delete-bin-line"></i></button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function exportOrdersCSV() {
    if (!allOrdersData || allOrdersData.length === 0) return alert('No orders to export.');
    
    const headers = ['Order ID', 'Customer Name', 'Email', 'Phone', 'Address', 'City', 'Pincode', 'Payment Method', 'Total Amount', 'Status', 'Date'];
    const rows = allOrdersData.map(o => [
        o.id,
        `"${o.customer_name || ''}"`,
        `"${o.email || ''}"`,
        `"${o.phone || ''}"`,
        `"${(o.address || '').replace(/"/g, '""')}"`,
        `"${o.city || ''}"`,
        `"${o.pincode || ''}"`,
        `"${o.payment_method || ''}"`,
        Number(o.total_price || 0).toFixed(2),
        `"${o.status || ''}"`,
        `"${new Date(o.created_at).toLocaleDateString()}"`
    ]);
    
    let csvContent = "data:text/csv;charset=utf-8," + headers.join(',') + "\n" + rows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "jp_cotton_orders.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

let currentViewingOrderId = null;
let previousSectionBeforeOrderDetails = 'dashboard';

async function viewOrderDetails(id, fromSection) {
    if (fromSection) previousSectionBeforeOrderDetails = fromSection;
    const numId = Number(id);
    currentViewingOrderId = numId;
    
    let order = (allOrdersData || []).find(o => o.id === numId || o.id == id) ||
                (allDashboardOrders || []).find(o => o.id === numId || o.id == id);
    
    if (!order) {
        try {
            const res = await fetch(`${API_BASE}/api/orders`);
            if (res.ok) {
                const orders = await res.json();
                allOrdersData = orders;
                allDashboardOrders = orders;
                order = orders.find(o => o.id === numId || o.id == id);
            }
        } catch(e) {
            console.error('Error fetching order for details view:', e);
        }
    }
    
    if (!order) {
        showAdminToast(`Could not load details for Order #${id}`, 'error');
        return;
    }
    
    document.getElementById('details-order-title').textContent = `Order #${order.id}`;
    document.getElementById('details-customer-name').textContent = order.customer_name || 'Anonymous Customer';
    document.getElementById('details-customer-email').textContent = order.email || 'No email provided';
    
    const phoneEl = document.getElementById('details-customer-phone');
    if (phoneEl) {
        if (order.phone) {
            const cleanPhone = String(order.phone).replace(/\D/g, '');
            phoneEl.innerHTML = `<span>📞 ${order.phone}</span> <a href="https://wa.me/91${cleanPhone.slice(-10)}" target="_blank" style="margin-left:8px; display:inline-flex; align-items:center; gap:4px; padding:2px 8px; font-size:11px; background:#25D366; color:white; border-radius:4px; text-decoration:none; font-weight:700;">💬 WhatsApp</a> <a href="tel:${order.phone}" style="margin-left:4px; display:inline-flex; align-items:center; gap:4px; padding:2px 8px; font-size:11px; background:#0284C7; color:white; border-radius:4px; text-decoration:none; font-weight:700;">📱 Call</a>`;
        } else {
            phoneEl.textContent = 'Phone: Not provided';
        }
    }
    
    document.getElementById('details-customer-address').textContent = order.address || 'Standard Shipping';
    const cityPinEl = document.getElementById('details-customer-city-pincode');
    if (cityPinEl) cityPinEl.textContent = [order.city, order.pincode].filter(Boolean).join(', ') || '';
    
    const payEl = document.getElementById('details-payment-method');
    if (payEl) {
        const isCod = (order.payment_method || '').toLowerCase().includes('cash');
        payEl.innerHTML = `
            <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap; margin-top:6px;">
                <span style="display:inline-block; padding:4px 8px; font-size:11px; font-weight:700; border-radius:4px; background:${isCod ? '#FEF3C7' : '#ECFDF5'}; color:${isCod ? '#92400E' : '#047857'}; text-transform:uppercase; border:1px solid ${isCod ? '#FDE68A' : '#A7F3D0'};">
                    ${isCod ? '💵 Cash on Delivery' : '💳 Prepaid Online'}
                </span>
                <span style="font-size:11px; color:#64748B;">Placed: ${order.created_at || 'Recently'} (${timeAgo(order.created_at)})</span>
            </div>`;
    }
    
    let items = [];
    try {
        items = typeof order.items === 'string' ? JSON.parse(order.items) : (order.items || []);
    } catch(e) {
        items = [];
    }
    
    const tbody = document.getElementById('details-products-body');
    tbody.innerHTML = '';
    
    let subtotal = 0;
    items.forEach(item => {
        const qty = item.qty || item.quantity || 1;
        const price = Number(item.price || 0);
        const itemTotal = price * qty;
        subtotal += itemTotal;
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="display: flex; align-items: center; gap: 12px;">
                <img src="${item.image || 'assets/placeholder.jpg'}" alt="${item.name}" style="width: 44px; height: 50px; object-fit: cover; border-radius: 4px; border: 1px solid var(--border);" onerror="this.src='assets/product_kurta_ivory.jpg'">
                <div>
                    <div style="font-weight: 600; color: var(--ink);">${item.name}</div>
                    <div style="display: flex; gap: 6px; margin-top: 3px; flex-wrap: wrap;">
                        ${item.size ? `<span style="display:inline-block; padding:1px 6px; font-size:11px; background:#EEF2F6; color:#334155; border-radius:3px; font-weight:600;">Size: ${item.size}</span>` : ''}
                        ${item.color ? `<span style="display:inline-block; padding:1px 6px; font-size:11px; background:#F8FAFC; color:#64748B; border:1px solid #E2E8F0; border-radius:3px;">Color: ${item.color}</span>` : ''}
                    </div>
                </div>
            </td>
            <td>₹${price.toFixed(2)}</td>
            <td><strong>${qty}</strong></td>
            <td style="font-weight: 700; color: var(--ink);">₹${itemTotal.toFixed(2)}</td>
        `;
        tbody.appendChild(tr);
    });
    
    document.getElementById('details-subtotal').textContent = `₹${subtotal.toFixed(2)}`;
    document.getElementById('details-total').textContent = `₹${Number(order.total_price || 0).toFixed(2)}`;
    
    const statusSelect = document.getElementById('details-status-select');
    if (statusSelect) statusSelect.value = order.status;
    
    const btn = document.querySelector('#section-order-details button[onclick^="updateOrderStatus"]');
    if (btn) {
        btn.onclick = () => {
            const newStatus = document.getElementById('details-status-select').value;
            updateOrderStatus(id, newStatus);
        };
    }
    
    document.querySelectorAll('.content-section').forEach(sec => sec.style.display = 'none');
    document.getElementById('section-order-details').style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function updateOrderStatus(id, status) {
    const targetId = id || currentViewingOrderId;
    const targetStatus = status || (document.getElementById('details-status-select') ? document.getElementById('details-status-select').value : null);
    if (!targetId || !targetStatus) return;
    if (!confirm(`Update Order #${targetId} status to "${targetStatus}"?`)) return;
    try {
        const response = await fetch(`${API_BASE}/api/orders/${targetId}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: targetStatus })
        });
        if (response.ok) {
            showAdminToast(`Order #${targetId} status updated to ${targetStatus}`, 'success');
            await loadOrders();
            await loadDashboard();
            await loadInventorySummary();
            // Re-render open details if active
            const detailsSection = document.getElementById('section-order-details');
            if (detailsSection && detailsSection.style.display !== 'none' && currentViewingOrderId === targetId) {
                viewOrderDetails(targetId);
            }
        } else {
            alert('Failed to update order status.');
        }
    } catch (err) {
        console.error(err);
    }
}

async function quickUpdateStatus(status) {
    if (!currentViewingOrderId) return;
    await updateOrderStatus(currentViewingOrderId, status);
}

function openOrderTrackingPublic() {
    if (!currentViewingOrderId) return;
    window.open(`track-order.html?q=${currentViewingOrderId}`, '_blank');
}

function printOrderInvoice() {
    if (!currentViewingOrderId) return;
    const order = (allOrdersData || []).find(o => o.id === currentViewingOrderId) ||
                  (allDashboardOrders || []).find(o => o.id === currentViewingOrderId);
    if (!order) return;
    
    let items = [];
    try { items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items; } catch(e){}

    const printWin = window.open('', '_blank', 'width=800,height=900');
    printWin.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Invoice #${order.id} - JP Cotton</title>
            <style>
                body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #111; padding: 40px; margin: 0; }
                .inv-header { display: flex; justify-content: space-between; border-bottom: 2px solid #111; padding-bottom: 20px; }
                .inv-brand { font-size: 26px; font-weight: 800; letter-spacing: -0.02em; }
                .inv-meta { text-align: right; font-size: 13px; color: #555; line-height: 1.6; }
                .inv-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin: 30px 0; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th { text-align: left; padding: 10px 8px; border-bottom: 2px solid #e2e8f0; font-size: 12px; text-transform: uppercase; color: #64748b; }
                td { padding: 12px 8px; border-bottom: 1px solid #e2e8f0; font-size: 13px; }
                .total-box { text-align: right; margin-top: 30px; font-size: 18px; font-weight: 800; }
                @media print { body { padding: 20px; } }
            </style>
        </head>
        <body>
            <div class="inv-header">
                <div>
                    <div class="inv-brand">JP Cotton</div>
                    <div style="font-size: 12px; color: #666; margin-top: 4px;">Authentic Handloom &amp; Pure Cotton Textiles &bull; Estd. 1994, Punjab</div>
                </div>
                <div class="inv-meta">
                    <strong style="font-size: 16px; color: #111;">TAX INVOICE / PACKING SLIP</strong><br>
                    <strong>Invoice #:</strong> JPC-${order.id}<br>
                    <strong>Date:</strong> ${order.created_at || new Date().toLocaleDateString('en-IN')}<br>
                    <strong>Status:</strong> ${order.status}
                </div>
            </div>
            <div class="inv-grid">
                <div>
                    <strong style="font-size: 12px; text-transform: uppercase; color: #64748b; letter-spacing: 0.05em;">Billed / Shipped To:</strong>
                    <div style="font-weight: 700; margin-top: 6px; font-size: 15px;">${order.customer_name}</div>
                    <div style="font-size: 13px; color: #444; margin-top: 4px; line-height: 1.4;">${order.address}</div>
                    ${order.city ? `<div style="font-size: 13px; color: #444;">${order.city} ${order.pincode || ''}</div>` : ''}
                    <div style="font-size: 13px; color: #444; margin-top: 4px;">Phone: ${order.phone || 'N/A'}</div>
                    <div style="font-size: 13px; color: #444;">Email: ${order.email}</div>
                </div>
                <div>
                    <strong style="font-size: 12px; text-transform: uppercase; color: #64748b; letter-spacing: 0.05em;">Order Details:</strong>
                    <div style="margin-top: 6px; font-size: 13px;">Payment Method: <strong>${order.payment_method || 'Cash on Delivery'}</strong></div>
                    <div style="margin-top: 4px; font-size: 13px;">Fulfillment: Standard Delivery (Complimentary)</div>
                    <div style="margin-top: 4px; font-size: 13px;">Online Tracking: track-order.html?q=${order.id}</div>
                </div>
            </div>
            <table>
                <thead>
                    <tr>
                        <th>Item Details</th>
                        <th>Size</th>
                        <th>Qty</th>
                        <th style="text-align: right;">Unit Price</th>
                        <th style="text-align: right;">Total Amount</th>
                    </tr>
                </thead>
                <tbody>
                    ${(items || []).map(it => `
                        <tr>
                            <td><strong>${it.name}</strong>${it.color ? `<div style="font-size:11px; color:#666;">Color: ${it.color}</div>` : ''}</td>
                            <td>${it.size || 'Free Size'}</td>
                            <td>${it.qty || it.quantity || 1}</td>
                            <td style="text-align: right;">₹${Number(it.price || 0).toFixed(2)}</td>
                            <td style="text-align: right;">₹${((it.qty || it.quantity || 1) * Number(it.price || 0)).toFixed(2)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            <div class="total-box">
                Total Amount Paid / Payable: ₹${Number(order.total_price || 0).toFixed(2)}
            </div>
            <div style="margin-top: 50px; font-size: 12px; color: #777; border-top: 1px solid #e2e8f0; padding-top: 15px; text-align: center;">
                Thank you for patronizing authentic Indian textile heritage &bull; JP Cotton, Punjab &bull; support@jpcotton.com
            </div>
            <script>window.onload = function() { window.print(); };<\/script>
        </body>
        </html>
    `);
    printWin.document.close();
}

async function deleteOrder(id) {
    if (!confirm(`Are you sure you want to permanently delete Order #${id}? This cannot be undone.`)) return;
    try {
        const res = await fetch(`${API_BASE}/api/orders/${id}`, { method: 'DELETE' });
        const data = await res.json();
        if (res.ok) {
            showAdminToast(`Order #${id} removed`, 'success');
            loadOrders();
            loadDashboard();
        } else {
            alert(data.error || 'Failed to delete order.');
        }
    } catch(err) {
        alert('Network error deleting order.');
    }
}

async function clearDemoOrders() {
    if (!confirm('Are you sure you want to clear all fake/demo orders? Genuine customer orders will be preserved.')) return;
    try {
        const res = await fetch(`${API_BASE}/api/admin/clear-demo-orders`, { method: 'POST' });
        const data = await res.json();
        if (res.ok) {
            alert(`✓ ${data.message || 'Demo orders cleared.'}`);
            loadOrders();
            loadDashboard();
        } else {
            alert(data.error || 'Failed to clear demo orders.');
        }
    } catch(err) {
        alert('Network error connecting to backend.');
    }
}

// ==========================================
// Real-Time Live Order Stream Polling
// ==========================================
let lastKnownMaxOrderId = 0;
let liveOrdersPollTimer = null;

function startLiveOrdersPolling() {
    if (liveOrdersPollTimer) return;
    // Initial max ID
    if (allOrdersData && allOrdersData.length > 0) {
        lastKnownMaxOrderId = Math.max(...allOrdersData.map(o => o.id));
    }
    liveOrdersPollTimer = setInterval(async () => {
        try {
            const res = await fetch(`${API_BASE}/api/orders`);
            if (!res.ok) return;
            const orders = await res.json();
            if (!Array.isArray(orders)) return;

            const currentMaxId = orders.length > 0 ? Math.max(...orders.map(o => o.id)) : 0;

            if (lastKnownMaxOrderId > 0 && currentMaxId > lastKnownMaxOrderId) {
                // A NEW ORDER HAS ARRIVED!
                const newOrders = orders.filter(o => o.id > lastKnownMaxOrderId);
                const latest = newOrders[0];
                if (typeof playOrderChime === 'function') playOrderChime();
                showAdminToast(`🛍️ New Order Received: #${latest.id} from ${latest.customer_name || 'Customer'} (₹${Number(latest.total_price || 0).toFixed(2)})`, 'success');

                allOrdersData = orders;
                allDashboardOrders = orders;
                loadOrders();
                loadDashboard();
                loadInventorySummary();
            } else if (orders.length !== allOrdersData.length) {
                allOrdersData = orders;
                allDashboardOrders = orders;
                loadOrders();
                loadDashboard();
                loadInventorySummary();
            }

            lastKnownMaxOrderId = Math.max(lastKnownMaxOrderId, currentMaxId);
        } catch(e) {}
    }, 3000); // Check every 3 seconds for new orders!
}
startLiveOrdersPolling();

// ---- Customers Management ----
let allCustomersData = [];

async function loadCustomers() {
    const tbody = document.getElementById('customer-table-body');
    try {
        const response = await fetch(`${API_BASE}/api/users`);
        allCustomersData = await response.json();
        renderCustomersTable(allCustomersData);
    } catch (err) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: red;">Failed to load customers.</td></tr>';
    }
}

function renderCustomersTable(data) {
    const tbody = document.getElementById('customer-table-body');
    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 40px; color: #888;">No customers found.</td></tr>';
        return;
    }
    
    tbody.innerHTML = '';
    data.forEach(u => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="text-align: center;"><input type="checkbox" class="customer-checkbox" value="${u.id}"></td>
            <td>#${u.id}</td>
            <td style="font-weight: 500;">${u.first_name} ${u.last_name}</td>
            <td><a href="mailto:${u.email}" style="color:var(--indigo-d);">${u.email}</a></td>
            <td>${u.phone || '-'}</td>
            <td style="color: #888; font-size: 12px;">${new Date(u.created_at).toLocaleDateString()}</td>
            <td>
                <div style="display: flex; gap: 6px;">
                    <button class="btn-primary" style="padding: 6px 12px; font-size: 12px;" onclick="viewCustomerDetails(${u.id})">View</button>
                    <button class="btn-danger" style="padding: 6px 10px; font-size: 12px;" onclick="deleteCustomer(${u.id})"><i class="ri-delete-bin-line"></i></button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function viewCustomerDetails(id) {
    const customer = allCustomersData.find(c => c.id === id);
    if (!customer) return;
    
    document.getElementById('customer-profile-initial').textContent = customer.first_name.charAt(0).toUpperCase();
    document.getElementById('customer-profile-name').textContent = `${customer.first_name} ${customer.last_name}`;
    document.getElementById('customer-profile-email').textContent = customer.email;
    document.getElementById('customer-profile-phone').textContent = customer.phone || 'N/A';
    document.getElementById('customer-profile-joined').textContent = new Date(customer.created_at).toLocaleDateString();
    
    if (allOrdersData.length === 0) {
        fetch(`${API_BASE}/api/orders`)
            .then(res => res.json())
            .then(orders => {
                allOrdersData = orders;
                renderCustomerOrders(customer.email);
            });
    } else {
        renderCustomerOrders(customer.email);
    }
    
    document.querySelectorAll('.content-section').forEach(sec => sec.style.display = 'none');
    document.getElementById('section-customer-details').style.display = 'block';
}

function renderCustomerOrders(email) {
    const tbody = document.getElementById('customer-orders-body');
    const customerOrders = allOrdersData.filter(o => o.email.toLowerCase() === email.toLowerCase());
    
    if (customerOrders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 40px; color: #888;">No orders found for this customer.</td></tr>';
        return;
    }
    
    tbody.innerHTML = '';
    customerOrders.forEach(o => {
        let itemsObj = JSON.parse(o.items);
        let itemsStr = itemsObj.map(i => i.name).join(', ');
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>#${o.id}</td>
            <td style="color: #888; font-size: 12px;">${new Date(o.created_at).toLocaleDateString()}</td>
            <td style="font-size:12px;">${itemsStr}</td>
            <td style="font-weight: 600;">₹${o.total_price.toFixed(2)}</td>
            <td><span class="status-pill status-${o.status.toLowerCase()}">${o.status}</span></td>
        `;
        tbody.appendChild(tr);
    });
}

function filterCustomers() {
    const query = document.getElementById('customer-search').value.toLowerCase();
    const filtered = allCustomersData.filter(u => 
        `${u.first_name} ${u.last_name}`.toLowerCase().includes(query) || 
        u.email.toLowerCase().includes(query)
    );
    renderCustomersTable(filtered);
}

function toggleAllCustomers(source) {
    const checkboxes = document.querySelectorAll('.customer-checkbox');
    checkboxes.forEach(cb => cb.checked = source.checked);
}

function exportCustomersCSV() {
    if (allCustomersData.length === 0) return alert('No customers to export.');
    
    const headers = ['ID', 'First Name', 'Last Name', 'Email', 'Phone', 'Date Registered'];
    const rows = allCustomersData.map(u => [
        u.id, 
        `"${u.first_name}"`, 
        `"${u.last_name}"`, 
        `"${u.email}"`, 
        `"${u.phone || ''}"`, 
        `"${new Date(u.created_at).toLocaleDateString()}"`
    ]);
    
    let csvContent = "data:text/csv;charset=utf-8," + headers.join(',') + "\n" + rows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "customers_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

async function handleCreateCustomer(event) {
    event.preventDefault();
    const firstName = document.getElementById('cust-first-name').value.trim();
    const lastName = document.getElementById('cust-last-name').value.trim();
    const email = document.getElementById('cust-email').value.trim();
    const phone = document.getElementById('cust-phone').value.trim();
    const password = document.getElementById('cust-password') ? document.getElementById('cust-password').value : '';

    if (!firstName || !email) {
        return alert('Please enter customer first name and email.');
    }

    try {
        const res = await fetch(`${API_BASE}/api/customers`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                first_name: firstName,
                last_name: lastName,
                email: email,
                phone: phone,
                password: password || 'jpcotton123'
            })
        });

        const data = await res.json();
        if (res.ok) {
            alert('✓ Customer ' + firstName + ' added successfully!');
            document.getElementById('add-customer-form').reset();
            document.getElementById('add-customer-modal').style.display = 'none';
            loadCustomers();
        } else {
            alert('Error: ' + (data.error || 'Failed to create customer.'));
        }
    } catch (err) {
        alert('Server connection error. Please verify the backend is running.');
        console.error(err);
    }
}

async function deleteCustomer(id) {
    if (!confirm(`Are you sure you want to delete customer patron #${id}? This action cannot be undone.`)) return;
    try {
        const res = await fetch(`${API_BASE}/api/customers/${id}`, { method: 'DELETE' });
        if (res.ok) {
            alert('Customer removed.');
            loadCustomers();
        } else {
            alert('Failed to delete customer.');
        }
    } catch(err) {
        alert('Network error deleting customer.');
    }
}

let revenueChartInstance = null;
let statusChartInstance = null;
let allDashboardOrders = [];
let allDashboardCustomers = 0;

async function loadDashboard() {
    try {
        const statRes = await fetch(`${API_BASE}/api/stats`);
        const stats = await statRes.json();
        allDashboardCustomers = stats.customers;

        const orderRes = await fetch(`${API_BASE}/api/orders`);
        allDashboardOrders = await orderRes.json();

        try {
            updateDashboardCharts();
        } catch (chartErr) {
            console.error('Error updating charts:', chartErr);
        }
        await loadInventorySummary();

        if (!inventoryPollTimer) {
            inventoryPollTimer = setInterval(() => {
                const dash = document.getElementById('section-dashboard');
                const inv = document.getElementById('section-inventory');
                const dashVisible = dash && dash.style.display !== 'none';
                const invVisible = inv && inv.style.display !== 'none';
                if (dashVisible || invVisible) {
                    loadInventorySummary();
                    if (invVisible) loadInventory();
                }
            }, 12000);
        }
    } catch (err) {
        console.error('Failed to load dashboard', err);
    }
}


// ==========================================
// Toast Notification Utility
// ==========================================
function showAdminToast(message, type = 'success') {
    let container = document.querySelector('.admin-toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'admin-toast-container';
        document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = 'admin-toast ' + type;
    const icon = type === 'error' ? '⚠️' : type === 'warning' ? '🔔' : '⚡';
    toast.innerHTML = '<span style="font-size:16px;">' + icon + '</span> <span>' + message + '</span>';
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

// ==========================================
// Live Stock & Inventory Dashboard Logic
// ==========================================
let allInventoryProducts = [];
let currentInventoryFilter = 'all';
let inventoryPollTimer = null;

// Format relative time helper
function timeAgo(dateString) {
    if (!dateString) return 'Just now';
    let dStr = String(dateString).trim();
    if (dStr.includes(' ') && !dStr.includes('T')) dStr = dStr.replace(' ', 'T') + 'Z';
    const date = new Date(dStr);
    if (isNaN(date.getTime())) {
        const fallback = new Date(dateString);
        if (isNaN(fallback.getTime())) return 'Recently';
        return fallback.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
    }
    const now = new Date();
    const diffSec = Math.floor((now - date) / 1000);
    if (diffSec < 45) return 'Just now';
    if (diffSec < 3600) return Math.floor(diffSec / 60) + 'm ago';
    if (diffSec < 86400) return Math.floor(diffSec / 3600) + 'h ago';
    return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
}

// Load inventory summary for top metrics & live activity stream
async function loadInventorySummary() {
    try {
        const res = await fetch(`${API_BASE}/api/inventory/summary`);
        if (!res.ok) return;
        const data = await res.json();
        
        // 1. Update Live Sales & Stock KPI metrics in Dashboard
        const statLiveTodayRev = document.getElementById('stat-live-today-rev');
        const statLiveTodayOrders = document.getElementById('stat-live-today-orders');
        const statTotalStockUnits = document.getElementById('stat-total-stock-units');
        const statStockValuation = document.getElementById('stat-stock-valuation');
        const statLowStockCount = document.getElementById('stat-low-stock-count');
        const statOutStockSub = document.getElementById('stat-out-stock-sub');

        if (statLiveTodayRev) statLiveTodayRev.innerText = '₹' + Number(data.today_revenue || 0).toFixed(2);
        if (statLiveTodayOrders) statLiveTodayOrders.innerText = (data.today_orders_count || 0) + ' orders today';
        if (statTotalStockUnits) statTotalStockUnits.innerText = data.total_units || 0;
        if (statStockValuation) statStockValuation.innerText = '₹' + Number(data.total_valuation || 0).toFixed(2);
        if (statLowStockCount) statLowStockCount.innerText = data.low_stock_count || 0;
        if (statOutStockSub) statOutStockSub.innerText = (data.out_of_stock_count || 0) + ' out of stock';

        // 2. Update Inventory View KPIs if on Inventory Section
        const invStatSkus = document.getElementById('inv-stat-skus');
        const invStatUnits = document.getElementById('inv-stat-units');
        const invStatVal = document.getElementById('inv-stat-val');
        const invStatLow = document.getElementById('inv-stat-low');
        const invStatOut = document.getElementById('inv-stat-out');

        if (invStatSkus) invStatSkus.innerText = data.products ? data.products.length : 0;
        if (invStatUnits) invStatUnits.innerText = data.total_units || 0;
        if (invStatVal) invStatVal.innerText = '₹' + Number(data.total_valuation || 0).toFixed(2);
        if (invStatLow) invStatLow.innerText = data.low_stock_count || 0;
        if (invStatOut) invStatOut.innerText = data.out_of_stock_count || 0;

        // 3. Render Live Sales Stream & sync orders
        if (data.recent_live_orders && data.recent_live_orders.length > 0) {
            data.recent_live_orders.forEach(ro => {
                if (!allOrdersData.some(o => o.id === ro.id)) allOrdersData.unshift(ro);
                if (!allDashboardOrders.some(o => o.id === ro.id)) allDashboardOrders.unshift(ro);
            });
        }
        renderLiveSalesStream(data.recent_live_orders || []);

        // 4. Render Low Stock Action Center Cards
        renderLowStockActionCenter(data.low_stock_items || []);

        // Cache products
        if (data.products) {
            allInventoryProducts = data.products;
        }
    } catch (err) {
        console.error('Error fetching inventory summary:', err);
    }
}

// Order Chime Sound State & Toggle
let orderChimeEnabled = localStorage.getItem('jp_order_chime') !== 'false';

function toggleOrderChime() {
    orderChimeEnabled = !orderChimeEnabled;
    localStorage.setItem('jp_order_chime', orderChimeEnabled);
    updateOrderChimeBtn();
    if (orderChimeEnabled) {
        playOrderChime();
        showAdminToast('🔔 Sound alert enabled for incoming live orders', 'info');
    } else {
        showAdminToast('🔕 Sound alerts muted', 'info');
    }
}

function updateOrderChimeBtn() {
    const btn = document.getElementById('btn-toggle-chime');
    if (btn) {
        btn.innerHTML = orderChimeEnabled ? '🔔 Sound: ON' : '🔕 Sound: OFF';
        btn.style.color = orderChimeEnabled ? '#15803d' : '#94a3b8';
    }
}

function playOrderChime() {
    if (!orderChimeEnabled) return;
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
        osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15); // A5
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.5);
    } catch(e) {}
}

// Render real-time live sales stream
function renderLiveSalesStream(orders) {
    const streamContainer = document.getElementById('live-sales-stream');
    if (!streamContainer) return;

    if (!orders || orders.length === 0) {
        streamContainer.innerHTML = '<div style="text-align: center; color: #64748B; padding: 36px 20px;"><div style="font-size:32px; margin-bottom:8px;">🛍️</div><strong style="color:var(--ink); font-size:14px;">No Sales Activity Yet Today</strong><p style="font-size:12px; margin:4px 0 0; color:#94A3B8;">Incoming transactions from customer checkouts will appear here instantly in real time.</p></div>';
        return;
    }

    const badgeStyles = {
        'Pending': 'background: #FEF3C7; color: #92400E; border: 1px solid #FDE68A;',
        'Processing': 'background: #EFF6FF; color: #1D4ED8; border: 1px solid #BFDBFE;',
        'Shipped': 'background: #F3E8FF; color: #6B21A8; border: 1px solid #E9D5FF;',
        'Delivered': 'background: #DCFCE7; color: #15803D; border: 1px solid #BBF7D0;',
        'Cancelled': 'background: #FEE2E2; color: #991B1B; border: 1px solid #FECACA;'
    };

    streamContainer.innerHTML = orders.slice(0, 8).map(order => {
        const initials = (order.customer_name || 'Customer')
            .split(' ')
            .filter(Boolean)
            .map(n => n[0])
            .join('')
            .substring(0, 2)
            .toUpperCase() || 'CU';
        
        let itemsDesc = 'Apparel Purchase';
        let itemCount = 0;
        try {
            const parsed = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
            if (Array.isArray(parsed) && parsed.length > 0) {
                itemCount = parsed.reduce((sum, it) => sum + (it.qty || it.quantity || 1), 0);
                itemsDesc = parsed.map(it => `${it.qty || it.quantity || 1}x ${it.name}${it.size ? ` (${it.size})` : ''}`).join(', ');
            }
        } catch(e) {
            itemsDesc = 'Handloom apparel purchase';
        }

        const city = order.city || (order.address ? order.address.split(',')[1] : null);
        const status = order.status || 'Pending';
        const stStyle = badgeStyles[status] || 'background: #F1F5F9; color: #475569; border: 1px solid #E2E8F0;';
        
        const isCod = (order.payment_method || '').toLowerCase().includes('cash');
        const payPill = isCod 
            ? `<span style="font-size: 10px; font-weight: 700; background: #FFFBEB; color: #B45309; border: 1px solid #FCD34D; padding: 1px 6px; border-radius: 4px;">COD</span>`
            : `<span style="font-size: 10px; font-weight: 700; background: #ECFDF5; color: #047857; border: 1px solid #A7F3D0; padding: 1px 6px; border-radius: 4px;">PAID</span>`;

        return `
        <div class="live-order-card" onclick="viewOrderDetails(${order.id}, 'dashboard')" style="cursor: pointer; display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; background: #FFFFFF; border: 1px solid var(--border); border-radius: 8px; margin-bottom: 8px; transition: all 0.2s ease; position: relative;" title="Click to view full Order #${order.id} details & packing slip">
            <div class="live-order-customer" style="display: flex; align-items: center; gap: 12px; min-width: 0;">
                <div class="live-order-avatar" style="width: 38px; height: 38px; border-radius: 50%; background: #EDE9FE; color: #7C3AED; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 13px; flex-shrink: 0;">${initials}</div>
                <div style="min-width: 0;">
                    <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
                        <span style="font-weight: 700; font-size: 13px; color: var(--ink);">${order.customer_name || 'Customer'}</span>
                        <span style="font-size: 10px; font-weight: 700; color: #64748B; background: #F1F5F9; padding: 1px 6px; border-radius: 4px;">#${order.id}</span>
                        ${payPill}
                        ${city ? `<span style="font-size: 11px; color: #94A3B8;">&bull; ${city.trim()}</span>` : ''}
                    </div>
                    <div style="font-size: 11px; color: #64748B; max-width: 320px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin-top: 3px;" title="${itemsDesc}">
                        📦 ${itemCount > 0 ? `<strong>${itemCount} item${itemCount > 1 ? 's' : ''}:</strong> ` : ''}${itemsDesc}
                    </div>
                </div>
            </div>
            <div style="text-align: right; flex-shrink: 0; margin-left: 14px;">
                <div style="font-weight: 800; font-size: 14px; color: #16A34A;">₹${Number(order.total_price || 0).toFixed(2)}</div>
                <div style="display: flex; align-items: center; justify-content: flex-end; gap: 6px; font-size: 11px; margin-top: 3px;">
                    <span style="display: inline-block; padding: 1px 7px; border-radius: 4px; font-size: 10px; font-weight: 700; text-transform: uppercase; ${stStyle}">${status}</span>
                    <span style="color: #94A3B8;">&bull;</span>
                    <span style="color: #64748B; font-weight: 500;">${timeAgo(order.created_at)}</span>
                </div>
            </div>
        </div>`;
    }).join('');
}
// Render low stock cards in Action Center
function renderLowStockActionCenter(lowStockItems) {
    const container = document.getElementById('low-stock-cards-container');
    if (!container) return;

    if (!lowStockItems || lowStockItems.length === 0) {
        container.innerHTML = '<div style="text-align: center; color: #27AE60; padding: 30px 20px; background: #F0FDF4; border-radius: 8px; border: 1px dashed #86EFAC;">' +
            '<div style="font-size: 24px; margin-bottom: 6px;">✓</div>' +
            '<div style="font-weight: 700; font-size: 13px;">Stock Health Excellent</div>' +
            '<div style="font-size: 11px; color: #166534; margin-top: 4px;">All warehouse catalog products have &gt; 10 units in stock.</div>' +
        '</div>';
        return;
    }

    container.innerHTML = lowStockItems.map(item => {
        const isDepleted = item.stock <= 0;
        const badgeColor = isDepleted ? '#DC2626' : '#EA580C';
        const badgeBg = isDepleted ? '#FEF2F2' : '#FFF7ED';
        const statusLabel = isDepleted ? '0 units (OUT)' : item.stock + ' units remaining';

        return '<div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; background: #FFFFFF; border: 1px solid var(--border); border-radius: 8px;">' +
            '<div style="display: flex; align-items: center; gap: 10px;">' +
                '<img src="' + (item.image || 'assets/placeholder.jpg') + '" style="width: 38px; height: 38px; object-fit: cover; border-radius: 6px; border: 1px solid #E2E8F0;" alt="' + item.name + '">' +
                '<div>' +
                    '<div style="font-weight: 600; font-size: 13px; color: var(--ink);">' + item.name + '</div>' +
                    '<div style="display: flex; align-items: center; gap: 6px; margin-top: 2px;">' +
                        (item.sku ? '<span style="font-size: 10px; color: #64748B;">' + item.sku + '</span>' : '') +
                        '<span style="font-size: 10px; font-weight: 700; color: ' + badgeColor + '; background: ' + badgeBg + '; padding: 1px 6px; border-radius: 4px;">' + statusLabel + '</span>' +
                    '</div>' +
                '</div>' +
            '</div>' +
            '<button class="btn-restock-quick" onclick="adjustStock(' + item.id + ', 25)">' +
                '+25 Restock' +
            '</button>' +
        '</div>';
    }).join('');
}

// Adjust stock relative (+/-)
window.adjustStock = async function(id, delta) {
    try {
        const res = await fetch(`${API_BASE}/api/products/` + id + '/stock', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ delta })
        });
        if (res.ok) {
            const result = await res.json();
            showAdminToast('Stock updated for ' + result.product.name + ': <b>' + result.product.stock + ' units</b>');
            loadInventorySummary();
            renderLiveInventoryRows();
        } else {
            showAdminToast('Failed to update stock', 'error');
        }
    } catch (err) {
        console.error(err);
        showAdminToast('Network error updating stock', 'error');
    }
};

// Set stock direct via input change
window.setStockDirect = async function(id, inputElement) {
    const val = parseInt(inputElement.value);
    if (isNaN(val) || val < 0) {
        inputElement.value = 0;
        return;
    }
    try {
        const res = await fetch(`${API_BASE}/api/products/` + id + '/stock', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ stock: val })
        });
        if (res.ok) {
            const result = await res.json();
            showAdminToast('Stock set to ' + result.product.stock + ' units for ' + result.product.name);
            loadInventorySummary();
            renderLiveInventoryRows();
        } else {
            showAdminToast('Failed to save stock', 'error');
        }
    } catch (err) {
        console.error(err);
        showAdminToast('Network error setting stock', 'error');
    }
};

// Quick Restock all low stock products (+25 each)
window.quickRestockAllLow = async function() {
    try {
        const summaryRes = await fetch(`${API_BASE}/api/inventory/summary`);
        const summary = await summaryRes.json();
        const lowItems = summary.low_stock_items || [];
        
        if (lowItems.length === 0) {
            showAdminToast('All products are currently well stocked (> 10 units).', 'warning');
            return;
        }

        let updated = 0;
        for (const item of lowItems) {
            await fetch(`${API_BASE}/api/products/` + item.id + '/stock', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ delta: 25 })
            });
            updated++;
        }

        showAdminToast('⚡ Restocked ' + updated + ' low inventory item(s) by +25 units each!');
        await loadInventorySummary();
        renderLiveInventoryRows();
    } catch (err) {
        console.error(err);
        showAdminToast('Failed to restock low items', 'error');
    }
};

// Simulate a live customer purchase in real time
window.simulateLiveOrder = async function() {
    try {
        const res = await fetch(`${API_BASE}/api/orders/simulate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        if (res.ok) {
            const data = await res.json();
            showAdminToast('⚡ Live Sale: ' + data.item.name + ' purchased by ' + data.order.customer_name + ' (₹' + data.order.total_price.toFixed(2) + ')!');
            
            // Reload all live dashboards
            await loadInventorySummary();
            await loadDashboard();
            renderLiveInventoryRows();
        } else {
            const err = await res.json();
            showAdminToast(err.error || 'Failed to simulate sale', 'error');
        }
    } catch (err) {
        console.error(err);
        showAdminToast('Network error simulating live order', 'error');
    }
};

// ==========================================
// Modern Flexible Inventory Management Engine
// ==========================================
let selectedInventoryIds = new Set();
let currentInventoryViewMode = 'table'; // 'table' or 'grid'
let currentInventoryDept = 'all';       // 'all', 'Women', 'Men', 'Kids'
let currentInventorySort = 'stock-asc';  // Default to lowest stock first (urgent restock)

// Load and Render Inventory Management Page
window.loadInventory = async function() {
    try {
        const res = await fetch(`${API_BASE}/api/products`);
        if (res.ok) {
            allInventoryProducts = await res.json();
            renderLiveInventoryRows();
        }
    } catch (err) {
        console.error('Failed to load inventory products:', err);
    }
};

// Toggle View Mode: Table vs Grid
window.setInventoryViewMode = function(mode) {
    currentInventoryViewMode = mode;
    const btnTable = document.getElementById('btn-view-table');
    const btnGrid = document.getElementById('btn-view-grid');
    const tableWrap = document.getElementById('inv-table-view-wrap');
    const gridWrap = document.getElementById('inv-grid-view-wrap');

    if (btnTable) btnTable.classList.toggle('active', mode === 'table');
    if (btnGrid) btnGrid.classList.toggle('active', mode === 'grid');

    if (tableWrap) tableWrap.style.display = (mode === 'table') ? 'block' : 'none';
    if (gridWrap) gridWrap.style.display = (mode === 'grid') ? 'grid' : 'none';

    renderLiveInventoryRows();
};

// Apply filter buttons (all, low, out, healthy)
window.filterInventoryByStatus = function(status, btn) {
    currentInventoryFilter = status;
    document.querySelectorAll('.inv-filter-btn').forEach(b => {
        b.classList.remove('active');
        b.style.background = 'white';
        b.style.color = 'var(--ink)';
        b.style.border = '1px solid var(--border)';
    });
    if (btn) {
        btn.classList.add('active');
        btn.style.background = 'var(--primary)';
        btn.style.color = 'white';
        btn.style.border = '1px solid var(--primary)';
    }
    renderLiveInventoryRows();
};

// Filter by Department (All, Women, Men, Kids)
window.filterInventoryDepartment = function(dept) {
    currentInventoryDept = dept || 'all';
    renderLiveInventoryRows();
};

// Sort Inventory items
window.sortInventoryProducts = function(criteria) {
    currentInventorySort = criteria || 'stock-asc';
    renderLiveInventoryRows();
};

// Live search input
window.filterInventorySearch = function() {
    renderLiveInventoryRows();
};

// Reset all filters to default
window.resetInventoryFilters = function() {
    currentInventoryFilter = 'all';
    currentInventoryDept = 'all';
    currentInventorySort = 'stock-asc';
    const sInput = document.getElementById('inventory-search');
    if (sInput) sInput.value = '';
    const deptSelect = document.getElementById('inv-dept-filter');
    if (deptSelect) deptSelect.value = 'all';
    const sortSelect = document.getElementById('inv-sort-select');
    if (sortSelect) sortSelect.value = 'stock-asc';

    document.querySelectorAll('.inv-filter-btn').forEach(b => {
        b.classList.remove('active');
        b.style.background = 'white';
        b.style.color = 'var(--ink)';
        b.style.border = '1px solid var(--border)';
    });
    const allBtn = document.querySelector('.inv-filter-btn');
    if (allBtn) {
        allBtn.classList.add('active');
        allBtn.style.background = 'var(--primary)';
        allBtn.style.color = 'white';
        allBtn.style.border = '1px solid var(--primary)';
    }

    renderLiveInventoryRows();
};

// Toggle Select All Visible Items
window.toggleSelectAllInventory = function(checked) {
    const visibleIds = getFilteredInventoryProducts().map(p => p.id);
    if (checked) {
        visibleIds.forEach(id => selectedInventoryIds.add(id));
    } else {
        visibleIds.forEach(id => selectedInventoryIds.delete(id));
    }
    updateBulkToolbar();
    updateRowSelections();
};

// Toggle Single Item Selection
window.toggleSelectInventoryItem = function(id, checked) {
    if (checked) {
        selectedInventoryIds.add(id);
    } else {
        selectedInventoryIds.delete(id);
    }
    updateBulkToolbar();
    updateRowSelections();
};

// Clear All Selections
window.clearInventorySelection = function() {
    selectedInventoryIds.clear();
    updateBulkToolbar();
    updateRowSelections();
};

// Update bulk toolbar UI
function updateBulkToolbar() {
    const toolbar = document.getElementById('inv-bulk-toolbar');
    const countEl = document.getElementById('inv-selected-count');
    const headerCb = document.getElementById('inv-header-checkbox');
    const floatingCb = document.getElementById('bulk-select-all-floating');

    const totalSelected = selectedInventoryIds.size;
    if (toolbar) {
        toolbar.style.display = totalSelected > 0 ? 'flex' : 'none';
    }
    if (countEl) {
        countEl.innerText = `${totalSelected} item${totalSelected === 1 ? '' : 's'} selected`;
    }

    const visibleItems = getFilteredInventoryProducts();
    const allChecked = visibleItems.length > 0 && visibleItems.every(p => selectedInventoryIds.has(p.id));
    if (headerCb) headerCb.checked = allChecked;
    if (floatingCb) floatingCb.checked = allChecked;
}

// Highlight selected rows in table and cards
function updateRowSelections() {
    document.querySelectorAll('.inv-row-cb').forEach(cb => {
        const id = parseInt(cb.dataset.id);
        const isChecked = selectedInventoryIds.has(id);
        cb.checked = isChecked;
        const row = cb.closest('tr');
        if (row) row.classList.toggle('row-selected', isChecked);
    });
    document.querySelectorAll('.inv-card-cb').forEach(cb => {
        const id = parseInt(cb.dataset.id);
        const isChecked = selectedInventoryIds.has(id);
        cb.checked = isChecked;
        const card = cb.closest('.inv-grid-card');
        if (card) card.classList.toggle('card-selected', isChecked);
    });
}

// Apply Bulk Stock Update (single network request)
window.applyBulkStock = async function(action, value) {
    if (selectedInventoryIds.size === 0) {
        showAdminToast('Please select at least one garment first', 'warning');
        return;
    }
    const ids = Array.from(selectedInventoryIds);
    try {
        const res = await fetch(`${API_BASE}/api/inventory/bulk-stock`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids, action, value })
        });
        if (res.ok) {
            const data = await res.json();
            const actionLabel = action === 'set' ? `Set stock to ${value} units` : `Added +${value} units`;
            showAdminToast(`⚡ Bulk Updated: ${actionLabel} across ${data.updated} garments!`, 'success');
            
            // Reload and refresh
            const pRes = await fetch(`${API_BASE}/api/products`);
            if (pRes.ok) allInventoryProducts = await pRes.json();
            await loadInventorySummary();
            renderLiveInventoryRows();
        } else {
            const err = await res.json().catch(() => ({}));
            showAdminToast(err.error || 'Failed to update selected garments', 'error');
        }
    } catch (err) {
        console.error(err);
        showAdminToast('Network error performing bulk stock update', 'error');
    }
};

// Prompt for custom stock quantity in bulk
window.promptBulkCustomStock = function() {
    if (selectedInventoryIds.size === 0) {
        showAdminToast('Please select at least one garment first', 'warning');
        return;
    }
    const qtyStr = prompt(`Enter exact stock quantity for the ${selectedInventoryIds.size} selected item(s):`, '30');
    if (qtyStr === null) return;
    const qty = parseInt(qtyStr);
    if (isNaN(qty) || qty < 0) {
        alert('Please enter a valid non-negative number.');
        return;
    }
    applyBulkStock('set', qty);
};

// Export Inventory to CSV
window.exportInventoryCSV = function() {
    const list = getFilteredInventoryProducts();
    if (list.length === 0) {
        showAdminToast('No inventory items to export', 'warning');
        return;
    }
    let csv = 'Product ID,SKU,Product Name,Category,Subcategory,Price (INR),Stock Units,Total Asset Value (INR),Sizes,Color,Status\n';
    list.forEach(p => {
        const stock = p.stock !== undefined ? p.stock : 0;
        const val = (p.price * stock).toFixed(2);
        const status = stock <= 0 ? 'Out of Stock' : (stock <= 10 ? 'Low Stock' : 'Optimal');
        const cleanName = (p.name || '').replace(/"/g, '""');
        const cleanCat = (p.category || '').replace(/"/g, '""');
        const cleanSub = (p.subcategory || '').replace(/"/g, '""');
        const cleanSizes = (p.sizes || 'Standard').replace(/"/g, '""');
        const cleanColor = (p.color || '').replace(/"/g, '""');

        csv += `"${p.id}","${p.sku || ''}","${cleanName}","${cleanCat}","${cleanSub}","${p.price}","${stock}","${val}","${cleanSizes}","${cleanColor}","${status}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `JP_Cotton_Inventory_Report_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showAdminToast('📥 Exported inventory report to CSV successfully!');
};

// Filter helper
function getFilteredInventoryProducts() {
    const searchInput = document.getElementById('inventory-search');
    const searchTerm = (searchInput ? searchInput.value : '').toLowerCase().trim();

    return allInventoryProducts.filter(p => {
        // 1. Search filter
        const matchesSearch = !searchTerm || 
            (p.name && p.name.toLowerCase().includes(searchTerm)) ||
            (p.sku && p.sku.toLowerCase().includes(searchTerm)) ||
            (p.category && p.category.toLowerCase().includes(searchTerm)) ||
            (p.subcategory && p.subcategory.toLowerCase().includes(searchTerm)) ||
            (p.color && p.color.toLowerCase().includes(searchTerm)) ||
            (p.material && p.material.toLowerCase().includes(searchTerm)) ||
            (p.sizes && p.sizes.toLowerCase().includes(searchTerm));
        
        if (!matchesSearch) return false;

        // 2. Department filter
        if (currentInventoryDept !== 'all') {
            const pCat = (p.category || '').toLowerCase();
            const deptLower = currentInventoryDept.toLowerCase();
            if (deptLower === 'women' && !pCat.includes('women')) return false;
            if (deptLower === 'men' && (!pCat.includes('men') || pCat.includes('women'))) return false;
            if (deptLower === 'kids' && !pCat.includes('kid')) return false;
        }

        // 3. Stock status filter
        const stock = p.stock !== undefined ? p.stock : 0;
        if (currentInventoryFilter === 'low') return stock <= 10 && stock > 0;
        if (currentInventoryFilter === 'out') return stock <= 0;
        if (currentInventoryFilter === 'healthy') return stock > 20;
        return true;
    });
}

// Render inventory items in either Table or Grid mode
function renderLiveInventoryRows() {
    const tbody = document.getElementById('inventory-table-body');
    const gridWrap = document.getElementById('inv-grid-view-wrap');
    const emptyState = document.getElementById('inv-empty-state');
    const tableWrap = document.getElementById('inv-table-view-wrap');

    // 1. Calculate overall metrics across ALL products for health bar & counts
    let totalAll = allInventoryProducts.length;
    let countHealthy = 0;
    let countLow = 0;
    let countOut = 0;
    let totalUnits = 0;
    let totalVal = 0;

    allInventoryProducts.forEach(p => {
        const s = p.stock !== undefined ? p.stock : 0;
        totalUnits += s;
        totalVal += s * (Number(p.price) || 0);
        if (s <= 0) countOut++;
        else if (s <= 10) countLow++;
        else countHealthy++;
    });

    // Update filter counts
    const elCountAll = document.getElementById('inv-count-all');
    const elCountLow = document.getElementById('inv-count-low');
    const elCountOut = document.getElementById('inv-count-out');
    const elCountHealthy = document.getElementById('inv-count-healthy');

    if (elCountAll) elCountAll.innerText = totalAll;
    if (elCountLow) elCountLow.innerText = countLow;
    if (elCountOut) elCountOut.innerText = countOut;
    if (elCountHealthy) elCountHealthy.innerText = countHealthy;

    // Update stock health bar
    const barHealthy = document.getElementById('health-bar-healthy');
    const barLow = document.getElementById('health-bar-low');
    const barOut = document.getElementById('health-bar-out');
    const healthBadge = document.getElementById('inv-health-badge');
    const healthSummary = document.getElementById('inv-health-summary-text');

    if (totalAll > 0) {
        const pctHealthy = Math.round((countHealthy / totalAll) * 100);
        const pctLow = Math.round((countLow / totalAll) * 100);
        const pctOut = Math.round((countOut / totalAll) * 100);

        if (barHealthy) barHealthy.style.width = pctHealthy + '%';
        if (barLow) barLow.style.width = pctLow + '%';
        if (barOut) barOut.style.width = pctOut + '%';

        if (healthSummary) {
            healthSummary.innerHTML = `<b>${countHealthy}</b> optimal (${pctHealthy}%) &bull; <b>${countLow}</b> low (&le;10) &bull; <b>${countOut}</b> depleted`;
        }
        if (healthBadge) {
            if (countOut > 0) {
                healthBadge.innerText = 'Out of Stock Alert';
                healthBadge.style.background = '#FEE2E2';
                healthBadge.style.color = '#DC2626';
            } else if (countLow > 0) {
                healthBadge.innerText = `${countLow} Low Stock Item${countLow > 1 ? 's' : ''}`;
                healthBadge.style.background = '#FEF3C7';
                healthBadge.style.color = '#D97706';
            } else {
                healthBadge.innerText = '100% Stock Healthy';
                healthBadge.style.background = '#DCFCE7';
                healthBadge.style.color = '#15803D';
            }
        }
    }

    // 2. Filter & Sort visible items
    let filtered = getFilteredInventoryProducts();

    filtered.sort((a, b) => {
        const stockA = a.stock !== undefined ? a.stock : 0;
        const stockB = b.stock !== undefined ? b.stock : 0;
        const valA = stockA * (a.price || 0);
        const valB = stockB * (b.price || 0);

        switch (currentInventorySort) {
            case 'stock-asc': return stockA - stockB;
            case 'stock-desc': return stockB - stockA;
            case 'val-desc': return valB - valA;
            case 'price-desc': return (b.price || 0) - (a.price || 0);
            case 'price-asc': return (a.price || 0) - (b.price || 0);
            case 'name-asc': return (a.name || '').localeCompare(b.name || '');
            case 'id-desc': default: return b.id - a.id;
        }
    });

    // 3. Show/Hide Empty State
    if (filtered.length === 0) {
        if (emptyState) emptyState.style.display = 'block';
        if (tbody) tbody.innerHTML = '';
        if (gridWrap) gridWrap.innerHTML = '';
        updateBulkToolbar();
        return;
    }
    if (emptyState) emptyState.style.display = 'none';

    // 4. Render TABLE VIEW
    if (tbody) {
        tbody.innerHTML = filtered.map(p => {
            const stock = p.stock !== undefined ? p.stock : 0;
            const assetVal = (Number(p.price) * stock).toFixed(2);
            const isSelected = selectedInventoryIds.has(p.id);

            let statusBadge = '';
            let barClass = 'stock-fill-healthy';
            const percent = Math.min(100, Math.max(5, Math.round((stock / 50) * 100)));

            if (stock <= 0) {
                statusBadge = '<span class="badge-stock badge-stock-out">Depleted (0)</span>';
                barClass = 'stock-fill-low';
            } else if (stock <= 10) {
                statusBadge = '<span class="badge-stock badge-stock-low">Low Stock (' + stock + ')</span>';
                barClass = 'stock-fill-moderate';
            } else {
                statusBadge = '<span class="badge-stock badge-stock-healthy">Optimal (' + stock + ')</span>';
                barClass = 'stock-fill-healthy';
            }

            // Parse size_stock map
            let sizeStockMap = {};
            try {
                sizeStockMap = typeof p.size_stock === 'string' ? JSON.parse(p.size_stock) : (p.size_stock || {});
            } catch(e) {
                sizeStockMap = {};
            }

            // Render Size chips with real stock per size (e.g. S: 20 pcs)
            const sizesArr = (p.sizes || 'Standard').split(',').map(s => s.trim()).filter(Boolean);
            const sizeChipsHtml = sizesArr.map(sz => {
                const qty = sizeStockMap[sz] !== undefined ? sizeStockMap[sz] : 0;
                const statusCls = qty <= 0 ? 'size-out' : (qty <= 5 ? 'size-low' : 'size-healthy');
                return `<span class="inv-size-stock-chip ${statusCls}" onclick="openSizeStockModal(${p.id})" title="Click to adjust Size ${sz} stock (Current: ${qty} units)">
                    <b>${sz}:</b> ${qty}
                </span>`;
            }).join('');

            return `
            <tr id="inv-row-${p.id}" class="${isSelected ? 'row-selected' : ''}">
                <td style="text-align: center;">
                    <input type="checkbox" class="inv-row-cb" data-id="${p.id}" ${isSelected ? 'checked' : ''} onchange="toggleSelectInventoryItem(${p.id}, this.checked)">
                </td>
                <td>
                    <img src="${p.image || 'assets/placeholder.jpg'}" alt="${p.name}" style="width: 44px; height: 44px; object-fit: cover; border-radius: 6px; border: 1px solid var(--border);" onerror="this.src='assets/product_kurta_ivory.jpg'">
                </td>
                <td>
                    <div style="font-weight: 600; font-size: 13px; color: var(--ink);">${p.name}</div>
                    <div style="display: flex; align-items: center; gap: 6px; margin-top: 3px;">
                        ${p.sku ? `<span style="font-size: 10px; font-weight: 700; color: #9C523A; background: rgba(156,82,58,0.1); padding: 1px 6px; border-radius: 4px;">${p.sku}</span>` : ''}
                        ${p.color ? `<span style="font-size: 11px; color: #64748B;">&bull; ${p.color}</span>` : ''}
                    </div>
                </td>
                <td>
                    <div style="font-size: 12px; font-weight: 500; color: var(--ink);">${p.category || 'Apparel'}</div>
                    <div style="font-size: 11px; color: #64748B;">${p.subcategory || 'Standard'}</div>
                </td>
                <td>
                    <div style="display: flex; flex-wrap: wrap; align-items: center; gap: 2px;">
                        ${sizeChipsHtml}
                    </div>
                    <button type="button" class="btn-secondary" style="padding: 2px 8px; font-size: 10px; font-weight: 600; margin-top: 4px; display: inline-flex; align-items: center; gap: 4px;" onclick="toggleInlineSizeDrawer(${p.id})">
                        <span>📏 Edit per Size</span>
                    </button>
                </td>
                <td style="font-weight: 600; font-size: 13px;">₹${Number(p.price).toFixed(2)}</td>
                <td style="width: 130px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 3px;">
                        ${statusBadge}
                    </div>
                    <div class="stock-bar-wrap" style="height: 6px; background: #E2E8F0; border-radius: 4px; overflow: hidden;">
                        <div class="stock-bar-fill ${barClass}" style="width: ${percent}%;"></div>
                    </div>
                </td>
                <td style="text-align: center;">
                    <div class="stock-adjust-group" style="display: inline-flex;">
                        <button class="stock-adjust-btn" onclick="adjustStock(${p.id}, -1)" title="Decrease total by 1">&minus;</button>
                        <input type="number" id="stock-input-${p.id}" class="stock-qty-input" value="${stock}" min="0" onchange="setStockDirect(${p.id}, this)">
                        <button class="stock-adjust-btn" onclick="adjustStock(${p.id}, 1)" title="Increase total by 1">&#43;</button>
                    </div>
                </td>
                <td>
                    <div style="display: flex; gap: 4px; align-items: center;">
                        <button class="btn-preset-pill" onclick="adjustStock(${p.id}, 5)" title="Add +5 units">+5</button>
                        <button class="btn-preset-pill" onclick="adjustStock(${p.id}, 10)" title="Add +10 units">+10</button>
                        <button class="btn-preset-pill" onclick="adjustStock(${p.id}, 25)" title="Add +25 units">+25</button>
                        <button class="btn-preset-pill deplete" onclick="setStockDirect(${p.id}, {value: 0})" title="Set stock to 0" style="color: #DC2626;">0</button>
                    </div>
                </td>
                <td style="font-weight: 700; color: #3874FF; font-size: 13px;" id="inv-val-${p.id}">₹${assetVal}</td>
                <td style="text-align: right;">
                    <div style="display: flex; gap: 4px; justify-content: flex-end;">
                        <button class="btn-secondary" style="padding: 4px 8px; font-size: 11px;" onclick="openSizeStockModal(${p.id})" title="Manage size breakdown">Sizes</button>
                        <button class="btn-secondary" style="padding: 4px 8px; font-size: 11px;" onclick="openEditProductModal(${p.id})" title="Edit garment details">Edit</button>
                    </div>
                </td>
            </tr>
            <!-- Inline Expandable Size Breakdown Drawer -->
            <tr class="inline-size-drawer-tr" id="size-drawer-${p.id}" style="display: none;">
                <td colspan="11" style="padding: 0 16px 16px;">
                    <div class="inline-size-drawer-wrap">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; border-bottom: 1px solid #E2E8F0; padding-bottom: 8px;">
                            <div style="font-size: 12px; font-weight: 700; color: var(--ink); display: flex; align-items: center; gap: 6px;">
                                <span>📏 Size-Wise Stock Breakdown &bull; ${p.name}</span>
                                <span style="font-size: 11px; font-weight: normal; color: #64748B;">(Total: <span id="inline-total-${p.id}" style="font-weight: 700; color: #27AE60;">${stock} units</span>)</span>
                            </div>
                            <div style="display: flex; gap: 6px;">
                                <button type="button" class="btn-preset-pill" onclick="quickApplyInlineAllSizes(${p.id}, 5)">+5 All Sizes</button>
                                <button type="button" class="btn-preset-pill" onclick="quickApplyInlineAllSizes(${p.id}, 10)">+10 All Sizes</button>
                                <button type="button" class="btn-secondary" style="padding: 3px 8px; font-size: 11px;" onclick="toggleInlineSizeDrawer(${p.id})">Close &times;</button>
                            </div>
                        </div>
                        <div style="display: flex; gap: 12px; overflow-x: auto; padding-bottom: 6px;">
                            ${sizesArr.map(sz => {
                                const sQty = sizeStockMap[sz] !== undefined ? sizeStockMap[sz] : 0;
                                return `
                                <div class="size-stepper-box ${sQty <= 0 ? 'depleted' : ''}">
                                    <div style="font-weight: 700; font-size: 13px; color: var(--ink); margin-bottom: 4px;">Size ${sz}</div>
                                    <div class="stock-adjust-group" style="margin-bottom: 6px;">
                                        <button class="stock-adjust-btn" onclick="adjustInlineSize(${p.id}, '${sz}', -1)">&minus;</button>
                                        <input type="number" id="inline-input-${p.id}-${sz}" class="stock-qty-input" value="${sQty}" min="0" onchange="setInlineSizeDirect(${p.id}, '${sz}', this.value)">
                                        <button class="stock-adjust-btn" onclick="adjustInlineSize(${p.id}, '${sz}', 1)">&#43;</button>
                                    </div>
                                    <div style="display: flex; gap: 4px;">
                                        <button class="btn-preset-pill" style="padding: 2px 6px; font-size: 10px;" onclick="adjustInlineSize(${p.id}, '${sz}', 5)">+5</button>
                                        <button class="btn-preset-pill" style="padding: 2px 6px; font-size: 10px;" onclick="adjustInlineSize(${p.id}, '${sz}', 10)">+10</button>
                                    </div>
                                </div>`;
                            }).join('')}
                        </div>
                    </div>
                </td>
            </tr>`;
        }).join('');
    }

    // 5. Render GRID VIEW
    if (gridWrap) {
        gridWrap.innerHTML = filtered.map(p => {
            const stock = p.stock !== undefined ? p.stock : 0;
            const assetVal = (Number(p.price) * stock).toFixed(2);
            const isSelected = selectedInventoryIds.has(p.id);

            let statusBadge = '';
            let barColor = '#10B981';
            const percent = Math.min(100, Math.max(5, Math.round((stock / 50) * 100)));

            if (stock <= 0) {
                statusBadge = '<span class="badge-stock badge-stock-out">Depleted (0)</span>';
                barColor = '#EF4444';
            } else if (stock <= 10) {
                statusBadge = '<span class="badge-stock badge-stock-low">Low Stock (' + stock + ')</span>';
                barColor = '#F59E0B';
            } else {
                statusBadge = '<span class="badge-stock badge-stock-healthy">Optimal (' + stock + ')</span>';
                barColor = '#10B981';
            }

            // Parse size_stock map
            let sizeStockMap = {};
            try {
                sizeStockMap = typeof p.size_stock === 'string' ? JSON.parse(p.size_stock) : (p.size_stock || {});
            } catch(e) {
                sizeStockMap = {};
            }

            const sizesArr = (p.sizes || 'Standard').split(',').map(s => s.trim()).filter(Boolean);
            const sizeChipsHtml = sizesArr.map(sz => {
                const qty = sizeStockMap[sz] !== undefined ? sizeStockMap[sz] : 0;
                const statusCls = qty <= 0 ? 'size-out' : (qty <= 5 ? 'size-low' : 'size-healthy');
                return `<span class="inv-size-stock-chip ${statusCls}" onclick="openSizeStockModal(${p.id})" title="Adjust Size ${sz}"><b>${sz}:</b> ${qty}</span>`;
            }).join('');

            return `
            <div class="inv-grid-card ${isSelected ? 'card-selected' : ''}" id="inv-card-${p.id}">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <input type="checkbox" class="inv-card-cb" data-id="${p.id}" ${isSelected ? 'checked' : ''} onchange="toggleSelectInventoryItem(${p.id}, this.checked)">
                        ${p.sku ? `<span style="font-size: 10px; font-weight: 700; color: #9C523A; background: rgba(156,82,58,0.1); padding: 2px 6px; border-radius: 4px;">${p.sku}</span>` : ''}
                    </div>
                    ${statusBadge}
                </div>

                <div style="display: flex; gap: 12px; margin-bottom: 12px;">
                    <img src="${p.image || 'assets/placeholder.jpg'}" alt="${p.name}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px; border: 1px solid var(--border);" onerror="this.src='assets/product_kurta_ivory.jpg'">
                    <div style="flex: 1; min-width: 0;">
                        <div style="font-weight: 600; font-size: 13px; color: var(--ink); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${p.name}</div>
                        <div style="font-size: 11px; color: #64748B; margin-top: 2px;">${p.category || 'Apparel'}</div>
                        <div style="font-weight: 700; font-size: 13px; color: var(--ink); margin-top: 4px;">₹${Number(p.price).toFixed(2)}</div>
                    </div>
                </div>

                <!-- Size Stock Pills in Card -->
                <div style="margin-bottom: 10px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                        <span style="font-size: 11px; font-weight: 600; color: #64748B;">Sizes in Stock:</span>
                        <button type="button" class="btn-secondary" style="padding: 1px 6px; font-size: 10px;" onclick="openSizeStockModal(${p.id})">Edit Sizes</button>
                    </div>
                    <div style="display: flex; flex-wrap: wrap; gap: 2px; margin-bottom: 8px;">
                        ${sizeChipsHtml}
                    </div>
                    <div style="height: 6px; background: #E2E8F0; border-radius: 4px; overflow: hidden;">
                        <div style="height: 100%; width: ${percent}%; background: ${barColor};"></div>
                    </div>
                </div>

                <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 10px; border-top: 1px solid #F1F5F9; margin-top: auto;">
                    <div>
                        <div style="font-size: 10px; color: #64748B;">Total Units</div>
                        <div class="stock-adjust-group" style="margin-top: 2px;">
                            <button class="stock-adjust-btn" onclick="adjustStock(${p.id}, -1)">&minus;</button>
                            <input type="number" class="stock-qty-input" value="${stock}" min="0" onchange="setStockDirect(${p.id}, this)">
                            <button class="stock-adjust-btn" onclick="adjustStock(${p.id}, 1)">&#43;</button>
                        </div>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-size: 10px; color: #64748B;">Asset Value</div>
                        <div style="font-weight: 700; color: #3874FF; font-size: 13px;">₹${assetVal}</div>
                        <div style="display: flex; gap: 3px; margin-top: 4px; justify-content: flex-end;">
                            <button class="btn-preset-pill" onclick="adjustStock(${p.id}, 10)">+10</button>
                            <button class="btn-preset-pill" onclick="adjustStock(${p.id}, 25)">+25</button>
                        </div>
                    </div>
                </div>
            </div>`;
        }).join('');
    }

    updateBulkToolbar();
}

// Adjust stock relative (+/-)
window.adjustStock = async function(id, delta) {
    try {
        const res = await fetch(`${API_BASE}/api/products/` + id + '/stock', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ delta })
        });
        if (res.ok) {
            const result = await res.json();
            showAdminToast(`Stock updated for ${result.product.name}: <b>${result.product.stock} units</b>`);
            
            // Update local memory product
            const item = allInventoryProducts.find(p => p.id === id);
            if (item) item.stock = result.product.stock;

            renderLiveInventoryRows();
            loadInventorySummary();

            // Visual pulse on row
            const row = document.getElementById(`inv-row-${id}`);
            if (row) {
                row.classList.add('stock-pulse-saved');
                setTimeout(() => row.classList.remove('stock-pulse-saved'), 1000);
            }
        } else {
            showAdminToast('Failed to update stock', 'error');
        }
    } catch (err) {
        console.error(err);
        showAdminToast('Network error updating stock', 'error');
    }
};

// Set stock direct via input change
window.setStockDirect = async function(id, inputElement) {
    const val = parseInt(inputElement.value);
    if (isNaN(val) || val < 0) {
        inputElement.value = 0;
        return;
    }
    try {
        const res = await fetch(`${API_BASE}/api/products/` + id + '/stock', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ stock: val })
        });
        if (res.ok) {
            const result = await res.json();
            showAdminToast(`Stock set to ${result.product.stock} units for ${result.product.name}`);
            
            const item = allInventoryProducts.find(p => p.id === id);
            if (item) item.stock = result.product.stock;

            renderLiveInventoryRows();
            loadInventorySummary();

            const row = document.getElementById(`inv-row-${id}`);
            if (row) {
                row.classList.add('stock-pulse-saved');
                setTimeout(() => row.classList.remove('stock-pulse-saved'), 1000);
            }
        } else {
            showAdminToast('Failed to save stock', 'error');
        }
    } catch (err) {
        console.error(err);
        showAdminToast('Network error setting stock', 'error');
    }
};

// ==========================================
// Size-Wise Stock Management Suite (e.g. S: 20 pcs, L: 8 pcs)
// ==========================================
let currentModalProductId = null;

// Open Dedicated Size Inventory Modal
window.openSizeStockModal = function(id) {
    const product = allInventoryProducts.find(p => p.id === id);
    if (!product) return;
    currentModalProductId = id;

    const modal = document.getElementById('size-stock-modal');
    const titleEl = document.getElementById('modal-size-stock-title');
    const imgEl = document.getElementById('modal-size-stock-img');
    const subEl = document.getElementById('modal-size-stock-sub');

    if (titleEl) titleEl.innerText = product.name;
    if (imgEl) imgEl.src = product.image || 'assets/placeholder.jpg';
    if (subEl) subEl.innerHTML = `${product.sku ? `<b>${product.sku}</b> &bull; ` : ''}${product.category || ''} &bull; ₹${Number(product.price).toFixed(2)}`;

    // Parse or build size_stock map
    let sizeMap = {};
    try {
        sizeMap = typeof product.size_stock === 'string' ? JSON.parse(product.size_stock) : (product.size_stock || {});
    } catch(e) {}

    const sizesArr = (product.sizes || 'Standard').split(',').map(s => s.trim()).filter(Boolean);
    if (sizesArr.length === 0) sizesArr.push('Free Size');

    // Ensure all sizes exist in map
    sizesArr.forEach(sz => {
        if (sizeMap[sz] === undefined) sizeMap[sz] = 0;
    });

    renderSizeModalRows(product, sizesArr, sizeMap);

    if (modal) modal.style.display = 'flex';
};

function renderSizeModalRows(product, sizesArr, sizeMap) {
    const container = document.getElementById('modal-size-rows-container');
    const totalEl = document.getElementById('modal-size-stock-total');
    if (!container) return;

    let totalUnits = 0;

    container.innerHTML = sizesArr.map(sz => {
        const qty = parseInt(sizeMap[sz]) || 0;
        totalUnits += qty;
        const isDepleted = qty <= 0;
        const isLow = qty > 0 && qty <= 5;
        const badgeColor = isDepleted ? '#DC2626' : (isLow ? '#D97706' : '#16A34A');
        const badgeBg = isDepleted ? '#FEF2F2' : (isLow ? '#FFFBEB' : '#DCFCE7');
        const statusLabel = isDepleted ? '0 (Out of stock)' : (isLow ? `${qty} (Low stock)` : `${qty} in stock`);

        return `
        <div class="modal-size-card" id="modal-size-row-${sz}">
            <div style="display: flex; align-items: center; gap: 14px;">
                <div style="width: 60px; height: 38px; display: flex; align-items: center; justify-content: center; background: #0F172A; color: white; border-radius: 6px; font-weight: 800; font-size: 14px; letter-spacing: 0.05em;">
                    ${sz}
                </div>
                <div>
                    <div style="font-weight: 700; font-size: 13px; color: var(--ink);">Size ${sz}</div>
                    <span style="font-size: 11px; font-weight: 700; color: ${badgeColor}; background: ${badgeBg}; padding: 1px 6px; border-radius: 4px; display: inline-block; margin-top: 2px;">
                        ${statusLabel}
                    </span>
                </div>
            </div>

            <div style="display: flex; align-items: center; gap: 8px;">
                <div class="stock-adjust-group">
                    <button type="button" class="stock-adjust-btn" onclick="adjustSizeStockModal('${sz}', -1)">&minus;</button>
                    <input type="number" id="modal-size-input-${sz}" class="stock-qty-input" value="${qty}" min="0" onchange="setSizeStockModalDirect('${sz}', this.value)">
                    <button type="button" class="stock-adjust-btn" onclick="adjustSizeStockModal('${sz}', 1)">&#43;</button>
                </div>
                <button type="button" class="btn-preset-pill" onclick="adjustSizeStockModal('${sz}', 5)">+5</button>
                <button type="button" class="btn-preset-pill" onclick="adjustSizeStockModal('${sz}', 10)">+10</button>
                <button type="button" class="btn-preset-pill deplete" onclick="setSizeStockModalDirect('${sz}', 0)" title="Deplete this size">0</button>
            </div>
        </div>`;
    }).join('');

    if (totalEl) totalEl.innerText = `${totalUnits} units`;
}

window.closeSizeStockModal = function() {
    const modal = document.getElementById('size-stock-modal');
    if (modal) modal.style.display = 'none';
    currentModalProductId = null;
    renderLiveInventoryRows();
    loadInventorySummary();
};

window.adjustSizeStockModal = async function(size, delta) {
    if (!currentModalProductId) return;
    try {
        const res = await fetch(`${API_BASE}/api/products/${currentModalProductId}/size-stock`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ size, delta })
        });
        if (res.ok) {
            const data = await res.json();
            const product = allInventoryProducts.find(p => p.id === currentModalProductId);
            if (product) {
                product.stock = data.totalStock;
                product.size_stock = JSON.stringify(data.size_stock);
                const sizesArr = (product.sizes || 'Standard').split(',').map(s => s.trim()).filter(Boolean);
                renderSizeModalRows(product, sizesArr, data.size_stock);
            }
            showAdminToast(`Size ${size} updated: <b>${data.size_stock[size]} units</b> (${data.totalStock} total)`);
        }
    } catch(e) {
        console.error(e);
        showAdminToast('Failed to update size stock', 'error');
    }
};

window.setSizeStockModalDirect = async function(size, val) {
    if (!currentModalProductId) return;
    const qty = Math.max(0, parseInt(val) || 0);
    try {
        const res = await fetch(`${API_BASE}/api/products/${currentModalProductId}/size-stock`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ size, stock: qty })
        });
        if (res.ok) {
            const data = await res.json();
            const product = allInventoryProducts.find(p => p.id === currentModalProductId);
            if (product) {
                product.stock = data.totalStock;
                product.size_stock = JSON.stringify(data.size_stock);
                const sizesArr = (product.sizes || 'Standard').split(',').map(s => s.trim()).filter(Boolean);
                renderSizeModalRows(product, sizesArr, data.size_stock);
            }
            showAdminToast(`Size ${size} set to <b>${qty} units</b> (${data.totalStock} total)`);
        }
    } catch(e) {
        console.error(e);
        showAdminToast('Failed to save size stock', 'error');
    }
};

window.quickApplyToAllSizes = async function(val, action = 'delta') {
    if (!currentModalProductId) return;
    const product = allInventoryProducts.find(p => p.id === currentModalProductId);
    if (!product) return;

    let sizeMap = {};
    try {
        sizeMap = typeof product.size_stock === 'string' ? JSON.parse(product.size_stock) : (product.size_stock || {});
    } catch(e) {}

    const sizesArr = (product.sizes || 'Standard').split(',').map(s => s.trim()).filter(Boolean);
    sizesArr.forEach(sz => {
        if (action === 'set') {
            sizeMap[sz] = Math.max(0, parseInt(val) || 0);
        } else {
            sizeMap[sz] = Math.max(0, (parseInt(sizeMap[sz]) || 0) + (parseInt(val) || 0));
        }
    });

    try {
        const res = await fetch(`${API_BASE}/api/products/${currentModalProductId}/size-stock`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ size_stock: sizeMap })
        });
        if (res.ok) {
            const data = await res.json();
            product.stock = data.totalStock;
            product.size_stock = JSON.stringify(data.size_stock);
            renderSizeModalRows(product, sizesArr, data.size_stock);
            showAdminToast(`Applied ${action === 'set' ? `set to ${val}` : `+${val}`} across all sizes! Total: ${data.totalStock} units`);
        }
    } catch(e) {
        console.error(e);
        showAdminToast('Failed to update all sizes', 'error');
    }
};

// Inline Drawer Logic: Expand row directly in Table View
window.toggleInlineSizeDrawer = function(id) {
    const drawerRow = document.getElementById(`size-drawer-${id}`);
    if (!drawerRow) return;
    const isHidden = drawerRow.style.display === 'none';
    drawerRow.style.display = isHidden ? 'table-row' : 'none';
};

window.adjustInlineSize = async function(productId, size, delta) {
    try {
        const res = await fetch(`${API_BASE}/api/products/${productId}/size-stock`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ size, delta })
        });
        if (res.ok) {
            const data = await res.json();
            const product = allInventoryProducts.find(p => p.id === productId);
            if (product) {
                product.stock = data.totalStock;
                product.size_stock = JSON.stringify(data.size_stock);
            }
            // Update input and inline total
            const inputEl = document.getElementById(`inline-input-${productId}-${size}`);
            if (inputEl) inputEl.value = data.size_stock[size];
            const inlineTotal = document.getElementById(`inline-total-${productId}`);
            if (inlineTotal) inlineTotal.innerText = `${data.totalStock} units`;
            const mainStockInput = document.getElementById(`stock-input-${productId}`);
            if (mainStockInput) mainStockInput.value = data.totalStock;
            const assetValEl = document.getElementById(`inv-val-${productId}`);
            if (assetValEl) assetValEl.innerText = `₹${(data.totalStock * (product.price || 0)).toFixed(2)}`;

            renderLiveInventoryRows();
            loadInventorySummary();
            showAdminToast(`Size ${size} updated to <b>${data.size_stock[size]} pcs</b> (${product.name})`);
        }
    } catch(e) {
        console.error(e);
    }
};

window.setInlineSizeDirect = async function(productId, size, val) {
    const qty = Math.max(0, parseInt(val) || 0);
    try {
        const res = await fetch(`${API_BASE}/api/products/${productId}/size-stock`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ size, stock: qty })
        });
        if (res.ok) {
            const data = await res.json();
            const product = allInventoryProducts.find(p => p.id === productId);
            if (product) {
                product.stock = data.totalStock;
                product.size_stock = JSON.stringify(data.size_stock);
            }
            renderLiveInventoryRows();
            loadInventorySummary();
            showAdminToast(`Size ${size} set to <b>${qty} pcs</b> (${product.name})`);
        }
    } catch(e) {
        console.error(e);
    }
};

window.quickApplyInlineAllSizes = async function(productId, val) {
    const product = allInventoryProducts.find(p => p.id === productId);
    if (!product) return;

    let sizeMap = {};
    try {
        sizeMap = typeof product.size_stock === 'string' ? JSON.parse(product.size_stock) : (product.size_stock || {});
    } catch(e) {}

    const sizesArr = (product.sizes || 'Standard').split(',').map(s => s.trim()).filter(Boolean);
    sizesArr.forEach(sz => {
        sizeMap[sz] = Math.max(0, (parseInt(sizeMap[sz]) || 0) + (parseInt(val) || 0));
    });

    try {
        const res = await fetch(`${API_BASE}/api/products/${productId}/size-stock`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ size_stock: sizeMap })
        });
        if (res.ok) {
            const data = await res.json();
            product.stock = data.totalStock;
            product.size_stock = JSON.stringify(data.size_stock);
            renderLiveInventoryRows();
            loadInventorySummary();
            showAdminToast(`Restocked +${val} across all sizes for ${product.name}! Total: ${data.totalStock} units`);
        }
    } catch(e) {
        console.error(e);
    }
};


function updateDashboardCharts() {
    const filterDays = document.getElementById('dashboard-time-filter').value;
    const now = new Date();
    
    let filteredOrders = allDashboardOrders;
    if (filterDays !== 'all') {
        const days = parseInt(filterDays);
        const cutoff = new Date();
        cutoff.setDate(now.getDate() - days);
        filteredOrders = allDashboardOrders.filter(o => new Date(o.created_at) >= cutoff);
    }

    const totalRev = filteredOrders.reduce((sum, o) => sum + o.total_price, 0);
    const totalOrders = filteredOrders.length;
    
    const statRev = document.getElementById('stat-rev');
    if (statRev) statRev.innerText = `₹${totalRev.toFixed(2)}`;
    const statOrders = document.getElementById('stat-orders');
    if (statOrders) statOrders.innerText = totalOrders;
    const statCust = document.getElementById('stat-cust');
    if (statCust) statCust.innerText = allDashboardCustomers;

    const tbody = document.getElementById('recent-orders-body');
    const recent = filteredOrders.slice(0, 5);
    if (recent.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #888; padding: 20px;">No recent orders.</td></tr>';
    } else {
        tbody.innerHTML = '';
        recent.forEach(o => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>#${o.id}</td>
                <td>${o.customer_name}</td>
                <td style="font-weight: 600;">₹${o.total_price.toFixed(2)}</td>
                <td><span class="status-pill-static status-${o.status}">${o.status}</span></td>
                <td style="color: #888; font-size: 12px;">${new Date(o.created_at).toLocaleDateString()}</td>
            `;
            tbody.appendChild(tr);
        });
    }

    // Process Data for Charts
    const revenueByDate = {};
    const sortedOrders = [...filteredOrders].sort((a,b) => new Date(a.created_at) - new Date(b.created_at));
    
    sortedOrders.forEach(o => {
        const d = new Date(o.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        revenueByDate[d] = (revenueByDate[d] || 0) + o.total_price;
    });
    
    const statusCounts = { 'Pending': 0, 'Processing': 0, 'Shipped': 0, 'Delivered': 0, 'Cancelled': 0 };
    filteredOrders.forEach(o => {
        if(statusCounts[o.status] !== undefined) statusCounts[o.status]++;
    });

    renderCharts(revenueByDate, statusCounts);
}

function renderCharts(revenueByDate, statusCounts) {
    if (revenueChartInstance) revenueChartInstance.destroy();
    if (statusChartInstance) statusChartInstance.destroy();

    const revCtx = document.getElementById('revenueChart').getContext('2d');
    revenueChartInstance = new Chart(revCtx, {
        type: 'line',
        data: {
            labels: Object.keys(revenueByDate),
            datasets: [{
                label: 'Revenue',
                data: Object.values(revenueByDate),
                borderColor: '#3874ff',
                backgroundColor: 'rgba(56, 116, 255, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, grid: { color: '#e3e6ed' } },
                x: { grid: { display: false } }
            }
        }
    });

    const statusCtx = document.getElementById('statusChart').getContext('2d');
    statusChartInstance = new Chart(statusCtx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(statusCounts),
            datasets: [{
                data: Object.values(statusCounts),
                backgroundColor: ['#c9a227', '#2563eb', '#9333ea', '#059669', '#dc2626'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 8, font: { family: 'Nunito Sans' } } }
            },
            cutout: '75%'
        }
    });
}

// ---- Categories Management ----
window.allCategories = [];

function updateCategoryStats() {
    const totalEl = document.getElementById('cat-stat-total');
    const mainEl = document.getElementById('cat-stat-main');
    const subEl = document.getElementById('cat-stat-sub');
    const prodEl = document.getElementById('cat-stat-products');

    const total = window.allCategories.length;
    const main = window.allCategories.filter(c => !c.parent_category).length;
    const sub = total - main;
    
    let linkedProductsCount = 0;
    if (Array.isArray(allProductsData)) {
        linkedProductsCount = allProductsData.filter(p => p.category || p.subcategory).length;
    }

    if (totalEl) totalEl.textContent = total;
    if (mainEl) mainEl.textContent = main;
    if (subEl) subEl.textContent = sub;
    if (prodEl) prodEl.textContent = linkedProductsCount;
}

window.renderCategoriesTable = function(catsToRender) {
    const tbody = document.getElementById('category-table-body');
    if (!tbody) return;
    tbody.innerHTML = '';

    updateCategoryStats();

    if (!catsToRender || catsToRender.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 40px; color: #888;">No matching categories found.</td></tr>';
        return;
    }

    catsToRender.forEach(c => {
        const tr = document.createElement('tr');
        const isMain = !c.parent_category;
        
        // Count products mapped to this category
        let prodCount = 0;
        if (Array.isArray(allProductsData)) {
            prodCount = allProductsData.filter(p => p.category === c.name || p.subcategory === c.name).length;
        }

        const typeBadge = isMain 
            ? `<span style="background: rgba(180, 83, 9, 0.12); color: #b45309; padding: 3px 8px; border-radius: 4px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; display: inline-block;">Main Collection</span>`
            : `<span style="background: #f1f5f9; color: #475569; padding: 3px 8px; border-radius: 4px; font-size: 10px; font-weight: 600; display: inline-block;">Subcategory</span>`;
            
        const hierarchyText = c.parent_category 
            ? `<div style="font-size: 11px; color: #64748b; margin-top: 2px;">Parent: <strong>${c.parent_category}</strong></div>` 
            : `<div style="font-size: 11px; color: #94a3b8; margin-top: 2px;">Top-Level Group</div>`;

        let cleanLink = c.link || 'shop.html';
        if (!cleanLink.startsWith('http') && !cleanLink.startsWith('/')) {
            // relative link
        }

        tr.innerHTML = `
            <td>
                <img src="${c.image || 'assets/product_kurta_ivory.jpg'}" onerror="this.src='assets/product_kurta_ivory.jpg'" style="width: 76px; height: 50px; object-fit: cover; border-radius: 8px; border: 1px solid rgba(0,0,0,0.08); box-shadow: 0 2px 6px rgba(0,0,0,0.04); display: block;">
            </td>
            <td>
                <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                    <strong style="color: #1e293b; font-size: 14px;">${c.name}</strong>
                    ${typeBadge}
                </div>
                ${hierarchyText}
            </td>
            <td>
                <a href="${cleanLink}" target="_blank" style="display: inline-flex; align-items: center; gap: 4px; color: #b45309; font-size: 12px; font-weight: 500; text-decoration: none; background: #fdfaf6; padding: 4px 10px; border-radius: 6px; border: 1px solid rgba(180,83,9,0.15);">
                    <span>${cleanLink}</span>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                </a>
            </td>
            <td>
                <span style="display: inline-flex; align-items: center; gap: 4px; background: ${prodCount > 0 ? '#dcfce7' : '#f1f5f9'}; color: ${prodCount > 0 ? '#15803d' : '#64748b'}; font-weight: 700; font-size: 11px; padding: 3px 8px; border-radius: 12px;">
                    ${prodCount} item${prodCount === 1 ? '' : 's'}
                </span>
            </td>
            <td style="color: #64748b; font-size: 12px;">${c.created_at ? new Date(c.created_at).toLocaleDateString() : 'Active'}</td>
            <td style="text-align: right;">
                <div style="display: inline-flex; gap: 8px; justify-content: flex-end;">
                    <button type="button" class="btn-secondary" onclick="openEditCategoryModal(${c.id})" style="padding: 6px 12px; font-size: 12px; font-weight: 600; display: inline-flex; align-items: center; gap: 4px; cursor: pointer;">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        <span>Edit</span>
                    </button>
                    <button type="button" class="btn-danger" onclick="deleteCategory(${c.id})" style="padding: 6px 12px; font-size: 12px; font-weight: 600; cursor: pointer;">
                        Delete
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
};

window.filterCategoriesByGroup = function(group, btn) {
    document.querySelectorAll('.cat-filter-btn').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');

    let filtered = window.allCategories;
    if (group === 'main') {
        filtered = window.allCategories.filter(c => !c.parent_category);
    } else if (group === 'men') {
        filtered = window.allCategories.filter(c => c.name.includes("Men") || (c.parent_category && c.parent_category.includes("Men")));
    } else if (group === 'women') {
        filtered = window.allCategories.filter(c => c.name.includes("Women") || (c.parent_category && c.parent_category.includes("Women")));
    } else if (group === 'heritage') {
        filtered = window.allCategories.filter(c => c.name.includes("Artisan") || c.name.includes("Heritage") || c.name.includes("Traditional") || c.name.includes("Saree") || (c.parent_category && c.parent_category.includes("Pure Cotton")));
    }
    window.renderCategoriesTable(filtered);
};

window.filterCategoriesSearch = function() {
    const searchInput = document.getElementById('category-search');
    if (!searchInput) return;
    const q = searchInput.value.toLowerCase().trim();
    const filtered = window.allCategories.filter(c => 
        c.name.toLowerCase().includes(q) || 
        (c.parent_category && c.parent_category.toLowerCase().includes(q)) ||
        (c.link && c.link.toLowerCase().includes(q))
    );
    window.renderCategoriesTable(filtered);
};

// Open Edit Category Modal
window.openEditCategoryModal = function(id) {
    const cat = window.allCategories.find(c => c.id == id);
    if (!cat) return;

    document.getElementById('edit-c-id').value = cat.id;
    document.getElementById('edit-c-name').value = cat.name;
    document.getElementById('edit-c-link').value = cat.link;
    
    // Populate parent dropdown
    const editParentSelect = document.getElementById('edit-c-parent');
    if (editParentSelect) {
        editParentSelect.innerHTML = '<option value="">None (Top-Level Main Collection)</option>';
        window.allCategories.forEach(c => {
            // Cannot make a category its own parent
            if (!c.parent_category && c.id != cat.id) {
                const opt = document.createElement('option');
                opt.value = c.name;
                opt.textContent = c.name;
                if (cat.parent_category === c.name) opt.selected = true;
                editParentSelect.appendChild(opt);
            }
        });
    }

    const preview = document.getElementById('edit-c-image-preview');
    if (preview) {
        preview.src = cat.image || 'assets/product_kurta_ivory.jpg';
    }

    const fileInput = document.getElementById('edit-c-image');
    if (fileInput) fileInput.value = '';

    const modal = document.getElementById('edit-category-modal');
    if (modal) modal.style.display = 'flex';
};

window.closeEditCategoryModal = function() {
    const modal = document.getElementById('edit-category-modal');
    if (modal) modal.style.display = 'none';
};

// Handle Category Update
window.handleEditCategorySubmit = async function(e) {
    e.preventDefault();
    const id = document.getElementById('edit-c-id').value;
    const name = document.getElementById('edit-c-name').value.trim();
    const link = document.getElementById('edit-c-link').value.trim();
    const parent = document.getElementById('edit-c-parent').value.trim();
    const submitBtn = document.getElementById('edit-c-submit-btn');

    if (!name || !link) {
        alert('Category name and link are required.');
        return;
    }

    const formData = new FormData();
    formData.append('name', name);
    formData.append('link', link);
    formData.append('parent_category', parent);

    const fileInput = document.getElementById('edit-c-image');
    if (fileInput && fileInput.files && fileInput.files.length > 0) {
        formData.append('images', fileInput.files[0]);
    }

    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Saving...';
    }

    try {
        const res = await fetch(`${API_BASE}/api/categories/${id}`, {
            method: 'PUT',
            body: formData
        });

        const data = await res.json();
        if (res.ok) {
            closeEditCategoryModal();
            await loadCategories();
            alert('Category updated successfully!');
        } else {
            alert('Failed to update category: ' + (data.error || 'Unknown error'));
        }
    } catch(err) {
        console.error(err);
        alert('Server communication error.');
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Save Category Changes';
        }
    }
};

async function loadCategories() {
    const tbody = document.getElementById('category-table-body');
    const select = document.getElementById('p-category');
    const cParentSelect = document.getElementById('c-parent');
    try {
        const response = await fetch(`${API_BASE}/api/categories`);
        const categories = await response.json();
        window.allCategories = categories;
        
        // Update Table
        if (categories.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 40px; color: #888;">No categories created yet.</td></tr>';
            if(select) select.innerHTML = '<option value="" disabled selected>No categories available</option>';
            return;
        }

        window.renderCategoriesTable(categories);

        if(select) select.innerHTML = '<option value="" disabled selected>Select a category...</option>';
        if(cParentSelect) cParentSelect.innerHTML = '<option value="" selected>None (Main Category)</option>';
        
        categories.forEach(c => {
            // Add main categories to dropdowns
            if (!c.parent_category) {
                if(select) {
                    const opt = document.createElement('option');
                    opt.value = c.name;
                    opt.innerText = c.name;
                    select.appendChild(opt);
                }
                if(cParentSelect) {
                    const optP = document.createElement('option');
                    optP.value = c.name;
                    optP.innerText = c.name;
                    cParentSelect.appendChild(optP);
                }
            }
        });
    } catch (err) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: red;">Failed to load categories.</td></tr>';
    }
}

// Function to filter subcategories when parent category is selected in Add Product
window.filterSubcategories = function() {
    const parentVal = document.getElementById('p-category').value;
    const subSelect = document.getElementById('p-subcategory');
    if (!subSelect) return;
    
    subSelect.innerHTML = '<option value="" selected>None</option>';
    const subcategories = window.allCategories.filter(c => c.parent_category === parentVal);
    
    subcategories.forEach(sub => {
        const opt = document.createElement('option');
        opt.value = sub.name;
        opt.innerText = sub.name;
        subSelect.appendChild(opt);
    });
};

// Add Category
const addCategoryForm = document.getElementById('add-category-form');
if (addCategoryForm) {
    addCategoryForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData();
        formData.append('name', document.getElementById('c-name').value);
        formData.append('link', document.getElementById('c-link').value);
        formData.append('parent_category', document.getElementById('c-parent').value);
        const cFiles = document.getElementById('c-image').files;
        for(let i=0; i<cFiles.length; i++) {
            formData.append('images', cFiles[i]);
        }

        try {
            const response = await fetch(`${API_BASE}/api/categories`, {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                document.getElementById('add-category-modal').style.display = 'none';
                e.target.reset();
                loadCategories();
            } else {
                const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                alert('Failed to add category: ' + errorData.error);
            }
        } catch (err) {
            console.error(err);
            alert('Server error.');
        }
    });
}

// Delete Category
async function deleteCategory(id) {
    if (!confirm('Are you sure you want to delete this category?')) return;
    try {
        const response = await fetch(`${API_BASE}/api/categories/${id}`, { method: 'DELETE' });
        if (response.ok) {
            loadCategories();
        } else {
            alert('Failed to delete category.');
        }
    } catch (err) {
        console.error(err);
    }
}

// ---- Reviews Management ----
async function loadReviews() {
    const tbody = document.getElementById('review-table-body');
    try {
        const response = await fetch(`${API_BASE}/api/reviews`);
        const reviews = await response.json();
        
        if (reviews.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 40px; color: #888;">No reviews submitted yet.</td></tr>';
            return;
        }

        tbody.innerHTML = '';
        reviews.forEach(r => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>#${r.id}</td>
                <td style="font-weight: 500;">${r.customer_name}</td>
                <td>${r.product_id}</td>
                <td style="color: #d4af37;">${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</td>
                <td style="max-width: 200px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${r.comment}</td>
                <td style="color: #888; font-size: 12px;">${new Date(r.created_at).toLocaleDateString()}</td>
                <td><button onclick="deleteReview(${r.id})" style="background:none; border:none; color:red; cursor:pointer;">Delete</button></td>
            `;
            tbody.appendChild(tr);
        });
    } catch (err) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: red;">Failed to load reviews.</td></tr>';
    }
}

async function deleteReview(id) {
    if (!confirm('Are you sure you want to delete this review?')) return;
    try {
        const response = await fetch(`${API_BASE}/api/reviews/${id}`, { method: 'DELETE' });
        if (response.ok) {
            loadReviews();
        } else {
            alert('Failed to delete review.');
        }
    } catch (err) {
        console.error(err);
    }
}

// ---- Marketing Management ----
async function loadDiscounts() {
    loadFestiveBannerSettings();
    const tbody = document.getElementById('discount-table-body');
    try {
        const response = await fetch(`${API_BASE}/api/discounts`);
        const discounts = await response.json();
        
        if (discounts.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 40px; color: #888;">No active promo codes.</td></tr>';
            return;
        }

        tbody.innerHTML = '';
        discounts.forEach(d => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="font-weight: 700; letter-spacing: 1px; color: var(--ink);">${d.code}</td>
                <td style="font-weight: 500; color: #27ae60;">${d.discount_percent}% OFF</td>
                <td style="color: #888; font-size: 12px;">${new Date(d.created_at).toLocaleDateString()}</td>
                <td><button onclick="deleteDiscount(${d.id})" style="background:none; border:none; color:red; cursor:pointer;">Deactivate</button></td>
            `;
            tbody.appendChild(tr);
        });
    } catch (err) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: red;">Failed to load discounts.</td></tr>';
    }
}

// Add Discount
const addDiscountForm = document.getElementById('add-discount-form');
if (addDiscountForm) {
    addDiscountForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const payload = {
            code: document.getElementById('d-code').value,
            discount_percent: parseInt(document.getElementById('d-percent').value)
        };

        try {
            const response = await fetch(`${API_BASE}/api/discounts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                document.getElementById('add-discount-modal').style.display = 'none';
                e.target.reset();
                loadDiscounts();
            } else {
                alert('Failed to add discount code. Code might already exist.');
            }
        } catch (err) {
            console.error(err);
        }
    });
}

async function deleteDiscount(id) {
    if (!confirm('Are you sure you want to deactivate this promo code?')) return;
    try {
        const response = await fetch(`${API_BASE}/api/discounts/${id}`, { method: 'DELETE' });
        if (response.ok) {
            loadDiscounts();
        } else {
            alert('Failed to deactivate discount.');
        }
    } catch (err) {
        console.error(err);
    }
}

// ---- Festive & Diwali Sitewide Offer Banner ----
async function loadFestiveBannerSettings() {
    try {
        const res = await fetch(`${API_BASE}/api/settings`);
        const settings = await res.json();
        const toggle = document.getElementById('festive-banner-toggle');
        const textInput = document.getElementById('festive-banner-text');
        const codeInput = document.getElementById('festive-banner-code');
        if (toggle) toggle.checked = settings.festive_banner_active === 'true';
        if (textInput) textInput.value = settings.festive_banner_text || '🪔 Diwali Dhamaka Sale: Flat 20% OFF Sitewide! Use Code: DIWALI20 at checkout · Free Express Shipping 🪔';
        if (codeInput) codeInput.value = settings.festive_banner_code || 'DIWALI20';
        updateFestivePreview();
    } catch(err) {
        console.error('Failed to load festive banner settings:', err);
    }
}

function updateFestivePreview() {
    const textEl = document.getElementById('festive-banner-text');
    const codeEl = document.getElementById('festive-banner-code');
    const text = textEl ? textEl.value : '';
    const code = codeEl ? codeEl.value.toUpperCase() : '';
    const previewText = document.getElementById('festive-preview-text');
    const previewCode = document.getElementById('festive-preview-code');
    if (previewText) previewText.textContent = text || '🪔 Festive Offer Banner Active';
    if (previewCode) previewCode.textContent = code || 'DIWALI20';
}

function applyFestivePreset(type) {
    const textInput = document.getElementById('festive-banner-text');
    const codeInput = document.getElementById('festive-banner-code');
    const toggle = document.getElementById('festive-banner-toggle');
    if (!textInput || !codeInput) return;
    
    if (type === 'diwali') {
        textInput.value = '🪔 Diwali Dhamaka Sale: Flat 20% OFF Sitewide! Use Code: DIWALI20 at checkout · Limited Festive Days Only 🪔';
        codeInput.value = 'DIWALI20';
    } else if (type === 'festive') {
        textInput.value = '🎉 Grand Festive Celebration: Flat 25% OFF on all Pure Cotton Collections! Use Code: FESTIVE25 🎉';
        codeInput.value = 'FESTIVE25';
    } else if (type === 'clearance') {
        textInput.value = '🛍️ End of Season Clearance Sale: Up to 40% OFF + Extra 10% with code CLEARANCE10 🛍️';
        codeInput.value = 'CLEARANCE10';
    }
    if (toggle) toggle.checked = true;
    updateFestivePreview();
}

async function saveFestiveBannerSettings(e) {
    if (e && e.preventDefault) e.preventDefault();
    const toggle = document.getElementById('festive-banner-toggle');
    const active = toggle && toggle.checked ? 'true' : 'false';
    const text = document.getElementById('festive-banner-text').value.trim();
    const code = document.getElementById('festive-banner-code').value.trim().toUpperCase();
    const btn = document.getElementById('save-festive-btn');
    const msg = document.getElementById('festive-save-msg');

    if (btn) btn.disabled = true;
    try {
        const res = await fetch(`${API_BASE}/api/settings`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                festive_banner_active: active,
                festive_banner_text: text,
                festive_banner_code: code
            })
        });

        if (res.ok) {
            if (code) {
                try {
                    await fetch(`${API_BASE}/api/discounts`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ code: code, discount_percent: 20 })
                    });
                } catch(err){}
                loadDiscounts();
            }
            if (msg) {
                msg.style.display = 'inline';
                setTimeout(() => { msg.style.display = 'none'; }, 3000);
            }
            if (typeof showAdminToast === 'function') {
                showAdminToast('Festive banner updated successfully! Live across storefront.', 'success');
            }
        } else {
            alert('Failed to save festive banner settings.');
        }
    } catch(err) {
        alert('Server connection error.');
    } finally {
        if (btn) btn.disabled = false;
    }
}

async function toggleFestiveBanner(checked) {
    try {
        await fetch(`${API_BASE}/api/settings`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ festive_banner_active: checked ? 'true' : 'false' })
        });
        if (typeof showAdminToast === 'function') {
            showAdminToast(checked ? 'Festive Banner Enabled on Website!' : 'Festive Banner Disabled.', 'success');
        }
    } catch(e){}
}

window.loadFestiveBannerSettings = loadFestiveBannerSettings;
window.updateFestivePreview = updateFestivePreview;
window.applyFestivePreset = applyFestivePreset;
window.saveFestiveBannerSettings = saveFestiveBannerSettings;
window.toggleFestiveBanner = toggleFestiveBanner;

// ---- Returns Management ----
async function loadReturns() {
    const tbody = document.getElementById('return-table-body');
    try {
        const response = await fetch(`${API_BASE}/api/returns`);
        const returns = await response.json();
        
        if (returns.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 40px; color: #888;">No return requests found.</td></tr>';
            return;
        }

        tbody.innerHTML = '';
        returns.forEach(r => {
            let statusColor = r.status === 'Pending' ? '#f39c12' : r.status === 'Approved' ? '#27ae60' : '#e74c3c';
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>#RET-${r.id}</td>
                <td><a href="#" style="color:var(--ink); font-weight:500;">#${r.order_id}</a></td>
                <td style="max-width:200px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${r.reason}">${r.reason}</td>
                <td style="color: #888; font-size: 12px;">${new Date(r.created_at).toLocaleDateString()}</td>
                <td style="font-weight: 600; color: ${statusColor};">${r.status}</td>
                <td>
                    ${r.status === 'Pending' ? `
                        <button onclick="updateReturnStatus(${r.id}, 'Approved')" style="background:#27ae60; color:white; border:none; padding:4px 8px; border-radius:3px; cursor:pointer; margin-right:4px;">Approve</button>
                        <button onclick="updateReturnStatus(${r.id}, 'Rejected')" style="background:#e74c3c; color:white; border:none; padding:4px 8px; border-radius:3px; cursor:pointer;">Reject</button>
                    ` : '<span style="color:#888; font-size:12px;">Processed</span>'}
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (err) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: red;">Failed to load return requests.</td></tr>';
    }
}

async function updateReturnStatus(id, status) {
    if (!confirm(`Are you sure you want to mark this return as ${status}?`)) return;
    try {
        const response = await fetch(`${API_BASE}/api/returns/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
        });
        if (response.ok) {
            loadReturns();
        } else {
            alert('Failed to update return status.');
        }
    } catch (err) {
        console.error(err);
    }
}

// ---- Content Management (CMS) ----
async function loadContent() {
    try {
        const response = await fetch(`${API_BASE}/api/content`);
        const content = await response.json();
        
        if (content.hero_title) document.getElementById('cms-hero-title').value = content.hero_title;
        if (content.hero_subtitle) document.getElementById('cms-hero-subtitle').value = content.hero_subtitle;
        if (content.hero_button) document.getElementById('cms-hero-button').value = content.hero_button;

        // Populate Curated Edits fields
        if (content.curated_women_img) {
            const el = document.getElementById('preview-curated-women');
            if (el) el.src = content.curated_women_img;
        }
        if (content.curated_women_title) {
            const el = document.getElementById('input-curated-women-title');
            if (el) el.value = content.curated_women_title;
        }
        if (content.curated_women_desc) {
            const el = document.getElementById('input-curated-women-desc');
            if (el) el.value = content.curated_women_desc;
        }

        if (content.curated_men_img) {
            const el = document.getElementById('preview-curated-men');
            if (el) el.src = content.curated_men_img;
        }
        if (content.curated_men_title) {
            const el = document.getElementById('input-curated-men-title');
            if (el) el.value = content.curated_men_title;
        }
        if (content.curated_men_desc) {
            const el = document.getElementById('input-curated-men-desc');
            if (el) el.value = content.curated_men_desc;
        }

        if (content.curated_kids_img) {
            const el = document.getElementById('preview-curated-kids');
            if (el) el.src = content.curated_kids_img;
        }
        if (content.curated_kids_title) {
            const el = document.getElementById('input-curated-kids-title');
            if (el) el.value = content.curated_kids_title;
        }
        if (content.curated_kids_desc) {
            const el = document.getElementById('input-curated-kids-desc');
            if (el) el.value = content.curated_kids_desc;
        }

    } catch (err) {
        console.error('Failed to load content:', err);
    }
}

const cmsForm = document.getElementById('cms-form');
if (cmsForm) {
    cmsForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const payload = {
            hero_title: document.getElementById('cms-hero-title').value,
            hero_subtitle: document.getElementById('cms-hero-subtitle').value,
            hero_button: document.getElementById('cms-hero-button').value
        };

        try {
            const response = await fetch(`${API_BASE}/api/content`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            
            if (response.ok) {
                const msg = document.getElementById('cms-msg');
                msg.style.display = 'inline';
                setTimeout(() => msg.style.display = 'none', 3000);
            } else {
                alert('Failed to save content updates.');
            }
        } catch (err) {
            console.error(err);
        }
    });
}


// Curated Edits Picture & Text Management
['women', 'men', 'kids'].forEach(type => {
    const input = document.getElementById('input-curated-' + type);
    const preview = document.getElementById('preview-curated-' + type);
    if (input && preview) {
        input.addEventListener('change', () => {
            if (input.files && input.files[0]) {
                preview.src = URL.createObjectURL(input.files[0]);
            }
        });
    }
});

const curatedForm = document.getElementById('curated-edits-form');
if (curatedForm) {
    curatedForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = curatedForm.querySelector('button[type="submit"]');
        const origText = submitBtn ? submitBtn.innerText : '';
        if (submitBtn) {
            submitBtn.innerText = 'Saving Changes...';
            submitBtn.disabled = true;
        }

        const formData = new FormData(curatedForm);
        try {
            const res = await fetch(`${API_BASE}/api/content/curated-edits`, {
                method: 'POST',
                body: formData
            });
            const data = await res.json();
            if (res.ok) {
                const msg = document.getElementById('curated-msg');
                if (msg) {
                    msg.style.display = 'inline';
                    setTimeout(() => { msg.style.display = 'none'; }, 4000);
                }
                if (data.content) {
                    if (data.content.curated_women_img) document.getElementById('preview-curated-women').src = data.content.curated_women_img;
                    if (data.content.curated_men_img) document.getElementById('preview-curated-men').src = data.content.curated_men_img;
                    if (data.content.curated_kids_img) document.getElementById('preview-curated-kids').src = data.content.curated_kids_img;
                }
            } else {
                alert(data.error || 'Failed to save changes.');
            }
        } catch (err) {
            console.error('Curated edits submit error:', err);
            alert('Could not connect to server to save changes.');
        } finally {
            if (submitBtn) {
                submitBtn.innerText = origText;
                submitBtn.disabled = false;
            }
        }
    });
}

// ---- Global Settings ----
async function loadSettings() {
    try {
        const response = await fetch(`${API_BASE}/api/settings`);
        const settings = await response.json();
        
        if (settings.store_name) document.getElementById('set-store-name').value = settings.store_name;
        if (settings.contact_email) document.getElementById('set-contact-email').value = settings.contact_email;
        if (settings.currency) document.getElementById('set-currency').value = settings.currency;
    } catch (err) {
        console.error('Failed to load settings:', err);
    }
}

const settingsForm = document.getElementById('settings-form');
if (settingsForm) {
    settingsForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const payload = {
            store_name: document.getElementById('set-store-name').value,
            contact_email: document.getElementById('set-contact-email').value,
            currency: document.getElementById('set-currency').value
        };

        try {
            const response = await fetch(`${API_BASE}/api/settings`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            
            if (response.ok) {
                const msg = document.getElementById('set-msg');
                msg.style.display = 'inline';
                setTimeout(() => msg.style.display = 'none', 3000);
            } else {
                alert('Failed to save settings.');
            }
        } catch (err) {
            console.error(err);
        }
    });
}

// ---- Hero Slides Management ----

async function loadHeroSlides() {
    const tbody = document.getElementById('hero-slide-table-body');
    if (!tbody) return;
    
    tbody.innerHTML = '<tr><td colspan="3" style="text-align: center; padding: 40px; color: #888;">Loading slides...</td></tr>';
    
    try {
        const response = await fetch(`${API_BASE}/api/hero-slides`);
        const slides = await response.json();
        
        tbody.innerHTML = '';
        if (slides.length === 0) {
            tbody.innerHTML = '<tr><td colspan="3" style="text-align: center; padding: 40px; color: #888;">No hero slides found. Add one above.</td></tr>';
            return;
        }
        
        slides.forEach(s => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><img src="${s.image}" alt="Slide" style="height: 60px; object-fit: cover; border-radius: 4px;"></td>
                <td>${new Date(s.created_at).toLocaleDateString()}</td>
                <td>
                    <button class="btn-primary" style="background:#e74c3c" onclick="deleteHeroSlide(${s.id})">Delete</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (err) {
        console.error(err);
        tbody.innerHTML = '<tr><td colspan="3" style="text-align: center; color: red;">Failed to load slides</td></tr>';
    }
}

window.deleteHeroSlide = async function(id) {
    if(!confirm("Are you sure you want to delete this slide?")) return;
    try {
        const response = await fetch(`${API_BASE}/api/hero-slides/${id}`, { method: 'DELETE' });
        if(response.ok) {
            loadHeroSlides();
        } else {
            alert('Failed to delete slide');
        }
    } catch(err) {
        console.error(err);
    }
}

const addHeroSlideForm = document.getElementById('add-hero-slide-form');
if (addHeroSlideForm) {
    addHeroSlideForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const fileInput = document.getElementById('hs-image');
        if (!fileInput.files[0]) return alert('Please select an image');
        
        const formData = new FormData();
        const hsFiles = fileInput.files;
        for(let i=0; i<hsFiles.length; i++) {
            formData.append('images', hsFiles[i]);
        }
        
        try {
            const response = await fetch(`${API_BASE}/api/hero-slides`, {
                method: 'POST',
                body: formData
            });
            if(response.ok) {
                document.getElementById('add-hero-slide-modal').style.display = 'none';
                addHeroSlideForm.reset();
                loadHeroSlides();
            } else {
                alert('Failed to upload slide');
            }
        } catch(err) {
            console.error(err);
        }
    });
}


// Sidebar Navigation Toggle
window.toggleNavGroup = function(btn) {
    const group = btn.closest('.nav-group');
    group.classList.toggle('collapsed');
}

window.showSection = function(section, element) {
    document.querySelectorAll('.content-section').forEach(sec => sec.style.display = 'none');
    document.getElementById('section-' + section).style.display = 'block';
    
    document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
    if (element) {
        element.classList.add('active');
    } else {
        const navLink = document.querySelector(`.nav-link[onclick*="showSection('${section}'"]`);
        if (navLink) navLink.classList.add('active');
    }

    if(section === 'dashboard') { loadDashboard(); }
    if(section === 'inventory') { loadInventory(); loadInventorySummary(); }
    if(section === 'orders') loadOrders();
    if(section === 'products') loadProducts();
    if(section === 'customers') loadCustomers();
    if(section === 'categories') loadCategories();
    if(section === 'reviews') loadReviews();
    if(section === 'marketing') loadDiscounts();
    if(section === 'returns') loadReturns();
    if(section === 'content') loadContent();
    if(section === 'curated-edits') loadContent();
    if(section === 'hero-slides') loadHeroSlides();
    if(section === 'settings') loadSettings();
}

// Initial load with URL Hash / Param support
const urlParams = new URLSearchParams(window.location.search);
const hashSection = window.location.hash.replace('#', '').trim();
const targetSection = urlParams.get('section') || urlParams.get('tab') || hashSection || 'dashboard';

loadCategories(); // Initialize category dropdowns

if (targetSection && targetSection !== 'dashboard' && document.getElementById('section-' + targetSection)) {
    showSection(targetSection);
} else {
    loadDashboard();
}


// ---- Store Owner Quick Guide Modal Logic ----
function openStoreGuideModal() {
    const modal = document.getElementById('store-guide-modal');
    if (modal) modal.style.display = 'flex';
}

function closeStoreGuideModal() {
    const modal = document.getElementById('store-guide-modal');
    if (modal) modal.style.display = 'none';
}

function switchGuideTab(tabName, btn) {
    document.querySelectorAll('.guide-tab-btn').forEach(b => {
        b.style.background = 'white';
        b.style.color = '#475569';
        b.classList.remove('active');
    });
    if (btn) {
        btn.style.background = '#9C523A';
        btn.style.color = 'white';
        btn.classList.add('active');
    }
    document.querySelectorAll('.guide-content-panel').forEach(p => p.style.display = 'none');
    const panel = document.getElementById('guide-tab-' + tabName);
    if (panel) panel.style.display = 'block';
}

window.openStoreGuideModal = openStoreGuideModal;
window.closeStoreGuideModal = closeStoreGuideModal;
window.switchGuideTab = switchGuideTab;


// ========================================================
// SIZING & COLOR STUDIO ADAPTIVE CONTROLLER (NON-TECH FRIENDLY)
// ========================================================

const SIZE_PRESETS = {
    free: ['Free Size'],
    standard: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'],
    numeric: ['38', '40', '42', '44', '46', '48'],
    kids: ['1-2Y', '2-3Y', '3-4Y', '5-6Y', '7-8Y', '9-10Y', '11-12Y'],
    custom: []
};

function renderSizeChips(mode, presetKey, selectedList = []) {
    const container = document.getElementById(mode + '-size-chips-box');
    if (!container) return;
    container.innerHTML = '';

    const list = SIZE_PRESETS[presetKey] || [];
    if (presetKey === 'free') {
        container.innerHTML = '<span style="font-size: 12px; background: #e0f2fe; color: #0369a1; padding: 4px 12px; border-radius: 14px; font-weight: 600;">🥻 Saree / Dupatta / Shawl One Size (No customer dropdown required)</span>';
        return;
    }

    if (presetKey === 'custom') {
        container.innerHTML = '<span style="font-size: 12px; color: #64748b;">Type your custom sizes in the box below separated by commas.</span>';
        return;
    }

    list.forEach(size => {
        const isChecked = selectedList.length === 0 || selectedList.includes(size);
        const label = document.createElement('label');
        label.className = 'size-chip-label' + (isChecked ? ' checked' : '');
        label.innerHTML = `<input type="checkbox" value="${size}" ${isChecked ? 'checked' : ''} onchange="toggleSizeChip('${mode}', this)"> ${size}`;
        container.appendChild(label);
    });
}

function toggleSizeChip(mode, checkbox) {
    const parent = checkbox.closest('.size-chip-label');
    if (parent) {
        if (checkbox.checked) parent.classList.add('checked');
        else parent.classList.remove('checked');
    }
    updateSizesInputFromChips(mode);
}

function updateSizesInputFromChips(mode) {
    const container = document.getElementById(mode + '-size-chips-box');
    const input = document.getElementById(mode === 'add' ? 'p-sizes' : 'edit-p-sizes');
    if (!container || !input) return;

    const checkedBoxes = container.querySelectorAll('input[type="checkbox"]:checked');
    const sizes = Array.from(checkedBoxes).map(cb => cb.value);
    input.value = sizes.join(', ');
}

function setSizePreset(mode, presetKey, btn) {
    const parent = btn ? btn.parentElement : null;
    if (parent) {
        parent.querySelectorAll('.btn-size-preset').forEach(b => {
            b.classList.remove('active');
            b.style.background = 'white';
            b.style.color = '#334155';
            b.style.borderColor = '#cbd5e1';
        });
        if (btn) {
            btn.classList.add('active');
            btn.style.background = '#9C523A';
            btn.style.color = 'white';
            btn.style.borderColor = '#9C523A';
        }
    }

    const input = document.getElementById(mode === 'add' ? 'p-sizes' : 'edit-p-sizes');
    const hint = document.getElementById(mode + '-size-hint');

    if (presetKey === 'free') {
        if (input) input.value = 'Free Size';
        if (hint) hint.textContent = '✓ One Size (Instant purchase, no size selection error)';
        renderSizeChips(mode, 'free');
    } else if (presetKey === 'custom') {
        if (hint) hint.textContent = '✍️ Custom sizes active';
        renderSizeChips(mode, 'custom');
    } else {
        const list = SIZE_PRESETS[presetKey] || [];
        if (input) input.value = list.join(', ');
        if (hint) hint.textContent = '✓ Active sizes for this garment';
        renderSizeChips(mode, presetKey, list);
    }
}

function syncSizeChipsFromInput(mode) {
    const input = document.getElementById(mode === 'add' ? 'p-sizes' : 'edit-p-sizes');
    if (!input) return;
    const val = input.value.trim();
    const container = document.getElementById(mode + '-size-chips-box');
    if (!container) return;

    const currentSizes = val.split(',').map(s => s.trim()).filter(Boolean);
    const checkboxes = container.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(cb => {
        const isChecked = currentSizes.includes(cb.value);
        cb.checked = isChecked;
        const label = cb.closest('.size-chip-label');
        if (label) {
            if (isChecked) label.classList.add('checked');
            else label.classList.remove('checked');
        }
    });
}

function toggleColorMode(mode) {
    const radios = document.getElementsByName(mode + '-color-mode');
    let selectedMode = 'single';
    radios.forEach(r => { if (r.checked) selectedMode = r.value; });

    const input = document.getElementById(mode === 'add' ? 'p-color' : 'edit-p-color');
    const preview = document.getElementById(mode + '-color-preview-bar');

    if (selectedMode === 'single') {
        if (input) input.placeholder = 'e.g. Natural Indigo Navy';
        if (preview) {
            preview.innerHTML = `✨ Customers will see: <strong>Color: ${input.value || 'Natural Indigo'}</strong> (Auto-selected, zero customer friction)`;
            preview.style.color = '#15803d';
        }
    } else {
        if (input) input.placeholder = 'e.g. Navy, Madder Red, Mustard, Olive';
        if (preview) {
            preview.innerHTML = '✨ Customers will see interactive color buttons to select their preferred shade.';
            preview.style.color = '#0369a1';
        }
    }
}

function updateColorPreview(mode) {
    toggleColorMode(mode);
}

window.setSizePreset = setSizePreset;
window.renderSizeChips = renderSizeChips;
window.toggleSizeChip = toggleSizeChip;
window.syncSizeChipsFromInput = syncSizeChipsFromInput;
window.toggleColorMode = toggleColorMode;
window.updateColorPreview = updateColorPreview;
window.viewOrderDetails = viewOrderDetails;
window.updateOrderStatus = updateOrderStatus;
window.quickUpdateStatus = quickUpdateStatus;
window.openOrderTrackingPublic = openOrderTrackingPublic;
window.printOrderInvoice = printOrderInvoice;
window.toggleOrderChime = toggleOrderChime;
window.playOrderChime = playOrderChime;
