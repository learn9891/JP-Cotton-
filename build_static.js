const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const srcDir = __dirname;
const distDir = path.join(__dirname, 'dist');
const apiDir = path.join(distDir, 'api');

// Create directories
if (!fs.existsSync(distDir)) fs.mkdirSync(distDir);
if (!fs.existsSync(apiDir)) fs.mkdirSync(apiDir);
if (!fs.existsSync(path.join(apiDir, 'products'))) fs.mkdirSync(path.join(apiDir, 'products'));
if (!fs.existsSync(path.join(apiDir, 'reviews'))) fs.mkdirSync(path.join(apiDir, 'reviews'));

// Copy static assets
function copyDir(src, dest) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest);
    const entries = fs.readdirSync(src, { withFileTypes: true });
    for (let entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        if (entry.isDirectory()) {
            copyDir(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

// Copy HTML, CSS, JS files and assets folder
const files = fs.readdirSync(srcDir);
for (const file of files) {
    if (file === 'dist' || file === 'node_modules' || file.endsWith('.sqlite') || file.endsWith('.db')) continue;
    const srcPath = path.join(srcDir, file);
    const destPath = path.join(distDir, file);
    if (fs.statSync(srcPath).isDirectory()) {
        if (file === 'assets') {
            copyDir(srcPath, destPath);
        }
    } else if (file.endsWith('.html') || file.endsWith('.css') || file.endsWith('.js') || file.endsWith('.png') || file.endsWith('.jpg')) {
        fs.copyFileSync(srcPath, destPath);
    }
}

// Generate API JSON files from database
const db = new sqlite3.Database(path.join(srcDir, 'database.sqlite'));

db.serialize(() => {
    // 1. Products
    db.all('SELECT * FROM products ORDER BY created_at DESC', (err, rows) => {
        fs.writeFileSync(path.join(apiDir, 'products.json'), JSON.stringify(rows || []));
        
        // Single products
        if (rows) {
            rows.forEach(row => {
                fs.writeFileSync(path.join(apiDir, 'products', `${row.id}.json`), JSON.stringify(row));
            });
        }
    });

    // 2. Hero Slides
    db.all('SELECT * FROM hero_slides ORDER BY created_at ASC', (err, rows) => {
        fs.writeFileSync(path.join(apiDir, 'hero-slides.json'), JSON.stringify(rows || []));
    });

    // 3. Categories
    db.all('SELECT * FROM categories ORDER BY created_at DESC', (err, rows) => {
        fs.writeFileSync(path.join(apiDir, 'categories.json'), JSON.stringify(rows || []));
    });

    // 4. Content
    db.all('SELECT * FROM content', (err, rows) => {
        const contentMap = {};
        if (rows) rows.forEach(r => contentMap[r.key] = r.value);
        fs.writeFileSync(path.join(apiDir, 'content.json'), JSON.stringify(contentMap));
    });

    // 5. Settings
    db.all('SELECT * FROM settings', (err, rows) => {
        const settingsMap = {};
        if (rows) rows.forEach(r => settingsMap[r.key] = r.value);
        fs.writeFileSync(path.join(apiDir, 'settings.json'), JSON.stringify(settingsMap));
    });

    // 6. Reviews
    db.all('SELECT * FROM reviews ORDER BY created_at DESC', (err, rows) => {
        const reviewsByProduct = {};
        if (rows) {
            rows.forEach(r => {
                if (!reviewsByProduct[r.product_id]) reviewsByProduct[r.product_id] = [];
                reviewsByProduct[r.product_id].push(r);
            });
            Object.keys(reviewsByProduct).forEach(pid => {
                fs.writeFileSync(path.join(apiDir, 'reviews', `${pid}.json`), JSON.stringify(reviewsByProduct[pid]));
            });
        }
    });
});

db.close(() => {
    console.log('Database exported to JSON.');
    
    // Patch app.js to use JSON files
    const appJsPath = path.join(distDir, 'app.js');
    let appJs = fs.readFileSync(appJsPath, 'utf8');
    
    appJs = appJs.replace(/fetch\('http:\/\/localhost:3000\/api\/products'\)/g, "fetch('api/products.json')");
    appJs = appJs.replace(/fetch\('http:\/\/localhost:3000\/api\/hero-slides'\)/g, "fetch('api/hero-slides.json')");
    appJs = appJs.replace(/fetch\('http:\/\/localhost:3000\/api\/categories'\)/g, "fetch('api/categories.json')");
    appJs = appJs.replace(/fetch\('http:\/\/localhost:3000\/api\/content'\)/g, "fetch('api/content.json')");
    appJs = appJs.replace(/fetch\('http:\/\/localhost:3000\/api\/settings'\)/g, "fetch('api/settings.json')");
    
    // Dynamic fetches
    appJs = appJs.replace(/fetch\(`http:\/\/localhost:3000\/api\/products\/\$\{productId\}`\)/g, "fetch(`api/products/${productId}.json`)");
    
    // Reviews
    appJs = appJs.replace(/fetch\(`http:\/\/localhost:3000\/api\/reviews\/\$\{PRODUCT_ID\}`\)/g, "fetch(`api/reviews/${PRODUCT_ID}.json`).catch(()=>({ json: () => [] }))");
    
    // For POST/PUT/DELETE, just mock success or empty
    // Wishlist GET
    appJs = appJs.replace(/fetch\(`http:\/\/localhost:3000\/api\/wishlist\/\$\{currentUser\.email\}`\)/g, "Promise.resolve({ json: () => window.jpWishlist ? window.jpWishlist.items : [] })");
    
    // Wishlist POST
    appJs = appJs.replace(/fetch\('http:\/\/localhost:3000\/api\/wishlist', \{[^}]+\}\)/g, "Promise.resolve({ json: () => ({message: 'ok'}) })");

    // Review POST
    appJs = appJs.replace(/fetch\('http:\/\/localhost:3000\/api\/reviews', \{[^}]+\}\)/g, "Promise.resolve({ json: () => ({id: 999, message: 'Review submitted!'}) })");

    fs.writeFileSync(appJsPath, appJs);
    console.log('app.js patched for static hosting.');
    console.log('Build complete. Upload the "dist" folder to Netlify Drop.');
});
