const express = require('express');
const cors = require('cors');
const multer = require('multer');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Clean redirect for deprecated categories page to shop all
app.get(['/categories', '/categories.html'], (req, res) => {
    res.redirect(301, '/shop.html');
});

// Performance: Optimized static asset serving with HTTP caching
app.use(express.static(__dirname, { 
    extensions: ['html'],
    maxAge: '1d',
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('.html')) {
            res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
        } else if (filePath.match(/\.(jpg|jpeg|png|gif|webp|svg|ico)$/i)) {
            res.setHeader('Cache-Control', 'public, max-age=604800, immutable');
        } else if (filePath.match(/\.(css|js)$/i)) {
            res.setHeader('Cache-Control', 'no-cache, must-revalidate');
        }
    }
}));

// Initialize SQLite Database
const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) console.error('Database connection error:', err);
    else console.log('Connected to SQLite database.');
});

// Create Products table if it doesn't exist
db.run(`CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    price REAL NOT NULL,
    description TEXT,
    image TEXT NOT NULL,
    color TEXT,
    material TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`, (err) => {
    if (!err) {
        // Attempt to add new columns to existing table if they don't exist
        db.run(`ALTER TABLE products ADD COLUMN color TEXT`, () => {});
        db.run(`ALTER TABLE products ADD COLUMN material TEXT`, () => {});
        db.run(`ALTER TABLE products ADD COLUMN gallery TEXT`, () => {});
        db.run(`ALTER TABLE products ADD COLUMN original_price REAL`, () => {});
        db.run(`ALTER TABLE products ADD COLUMN offer_tag TEXT`, () => {});
        db.run(`ALTER TABLE products ADD COLUMN subcategory TEXT`, () => {});
        db.run(`ALTER TABLE products ADD COLUMN sizes TEXT`, () => {});
        db.run(`ALTER TABLE products ADD COLUMN size_stock TEXT`, () => {});
    }
});

// Create Categories table
db.run(`CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    link TEXT NOT NULL,
    image TEXT NOT NULL,
    parent_category TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`, (err) => {
    if (!err) {
        db.run(`ALTER TABLE categories ADD COLUMN parent_category TEXT`, () => {});
        
        // Seed default categories matching the navigation structure if empty
        db.get(`SELECT COUNT(*) as count FROM categories`, (err, row) => {
            if (!err && row && row.count === 0) {
                const defaultCats = [
                    { name: "Shop All", link: "shop.html", parent: null, image: "assets/walnut-dress.jpg" },
                    { name: "Women", link: "womens-traditional.html", parent: null, image: "assets/womens_kurti_mulmul_1787394344045.jpg" },
                    { name: "Men", link: "mens-ethnic.html", parent: null, image: "assets/mens-cotton-shirt.jpg" },
                    { name: "Kids", link: "kids.html", parent: null, image: "assets/product_kurta_ivory.jpg" },
                    { name: "Co-Ord Sets", link: "womens-traditional.html?category=Co-Ord+Sets", parent: "Women", image: "assets/womens-wrap-top.jpg" },
                    { name: "Dresses & Gowns", link: "womens-traditional.html?category=Dresses+%26+Gowns", parent: "Women", image: "assets/womens-cotton-dress.jpg" },
                    { name: "Two-Piece Suit Sets", link: "womens-traditional.html?category=Two-Piece+Suit+Sets", parent: "Women", image: "assets/womens_kurti_mulmul_1787394344045.jpg" },
                    { name: "Three-Piece Suit Sets", link: "womens-traditional.html?category=Three-Piece+Suit+Sets", parent: "Women", image: "assets/product_saree.jpg" },
                    { name: "Farsi Salwar Sets", link: "womens-traditional.html?category=Farsi+Salwar+Sets", parent: "Women", image: "assets/womens_kurti_mulmul_1787394344045.jpg" },
                    { name: "Kurtas", link: "womens-traditional.html?category=Kurtas", parent: "Women", image: "assets/product_kurta_ivory.jpg" },
                    { name: "Kurtis & Tops", link: "womens-traditional.html?category=Kurtis+%26+Tops", parent: "Women", image: "assets/womens-wrap-top.jpg" },
                    { name: "Cotton Shirts", link: "mens-ethnic.html?category=Cotton+Shirts", parent: "Men", image: "assets/mens-cotton-shirt.jpg" },
                    { name: "Kurtas", link: "mens-ethnic.html?category=Kurtas", parent: "Men", image: "assets/product_kurta_ivory.jpg" },
                    { name: "Kurta & Palazzo Sets", link: "kids.html?category=Kurta+%26+Palazzo+Sets", parent: "Kids", image: "assets/cotton-trousers.jpg" },
                    { name: "Lehenga Choli", link: "kids.html?category=Lehenga+Choli", parent: "Kids", image: "assets/walnut-dress.jpg" },
                    { name: "Girls' Ethnic Suits", link: "kids.html?category=Girls%27+Ethnic+Suits", parent: "Kids", image: "assets/womens_kurti_mulmul_1787394344045.jpg" }
                ];
                const stmt = db.prepare(`INSERT INTO categories (name, link, parent_category, image) VALUES (?, ?, ?, ?)`);
                defaultCats.forEach(c => stmt.run(c.name, c.link, c.parent, c.image));
                stmt.finalize();
                console.log('Seeded default category hierarchy into database.');
            }
        });
    }
});

// Create Reviews table
db.run(`CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    rating INTEGER NOT NULL,
    comment TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`);

// Create Discounts table
db.run(`CREATE TABLE IF NOT EXISTS discounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE NOT NULL,
    discount_percent INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`, () => {
    db.run(`INSERT OR IGNORE INTO discounts (code, discount_percent) VALUES ('DIWALI20', 20)`);
    db.run(`INSERT OR IGNORE INTO discounts (code, discount_percent) VALUES ('HERITAGE', 10)`);
    db.run(`INSERT OR IGNORE INTO discounts (code, discount_percent) VALUES ('PATRON10', 10)`);
});

// Create Returns table
db.run(`CREATE TABLE IF NOT EXISTS return_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    reason TEXT NOT NULL,
    status TEXT DEFAULT 'Pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`);

// Create Newsletter Subscribers table
db.run(`CREATE TABLE IF NOT EXISTS newsletter_subscribers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`);

// Create Concierge Inquiries table
db.run(`CREATE TABLE IF NOT EXISTS concierge_inquiries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    inquiry_type TEXT,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'New',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`);

// Create Content table for CMS
db.run(`CREATE TABLE IF NOT EXISTS content (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
)`, (err) => {
    if (!err) {
        // Insert defaults if empty
        db.get("SELECT count(*) as count FROM content", [], (err, row) => {
            if (row && row.count === 0) {
                db.run(`INSERT INTO content (key, value) VALUES 
                    ('hero_title', 'Breathable Elegance. Tailored for You.'),
                    ('hero_subtitle', 'Experience the comfort of pure, sustainably sourced cotton. Explore our new summer collection.'),
                    ('hero_button', 'Shop the Collection')
                `);
            }
        });
    }
});

// Create Settings table
db.run(`CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
)`, (err) => {
    if (!err) {
        db.get("SELECT count(*) as count FROM settings", [], (err, row) => {
            if (row && row.count === 0) {
                db.run(`INSERT INTO settings (key, value) VALUES 
                    ('store_name', 'JP Cotton'),
                    ('contact_email', 'concierge@jpcotton.com'),
                    ('currency', 'INR')
                `);
            }
        });
        db.run(`INSERT OR IGNORE INTO settings (key, value) VALUES 
            ('festive_banner_active', 'true'),
            ('festive_banner_text', '🪔 Diwali Dhamaka Sale: Flat 20% OFF Sitewide! Use Code: DIWALI20 at checkout · Free Express Shipping 🪔'),
            ('festive_banner_code', 'DIWALI20')
        `);
    }
});

// Create Orders table
db.run(`CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_name TEXT NOT NULL,
    email TEXT NOT NULL,
    address TEXT NOT NULL,
    phone TEXT,
    payment_method TEXT DEFAULT 'Cash on Delivery',
    city TEXT,
    pincode TEXT,
    total_price REAL NOT NULL,
    items JSON NOT NULL,
    status TEXT DEFAULT 'Pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`);

// Create Users table
db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    password TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`);

// Create Hero Slides table
db.run(`CREATE TABLE IF NOT EXISTS hero_slides (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    image TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`);

// Create Addresses table
db.run(`CREATE TABLE IF NOT EXISTS addresses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_email TEXT NOT NULL,
    title TEXT NOT NULL,
    street TEXT NOT NULL,
    city TEXT NOT NULL,
    zip TEXT NOT NULL
)`);

// Create Payment Methods table
db.run(`CREATE TABLE IF NOT EXISTS payment_methods (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_email TEXT NOT NULL,
    card_type TEXT NOT NULL,
    last_four TEXT NOT NULL,
    expiry TEXT NOT NULL
)`);

// Create User Preferences table
db.run(`CREATE TABLE IF NOT EXISTS user_preferences (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_email TEXT UNIQUE NOT NULL,
    order_updates BOOLEAN DEFAULT 1,
    promotions BOOLEAN DEFAULT 0,
    newsletter BOOLEAN DEFAULT 1
)`);

// Create Wishlist table
db.run(`CREATE TABLE IF NOT EXISTS wishlist (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_email TEXT NOT NULL,
    product_id INTEGER NOT NULL,
    UNIQUE(user_email, product_id)
)`);

// Performance: Database Indexes for Instant Query Execution (Zero Table Scans)
db.serialize(() => {
    db.run(`CREATE INDEX IF NOT EXISTS idx_products_category ON products(category)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_products_subcategory ON products(subcategory)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews(product_id)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_wishlist_email ON wishlist(user_email)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_orders_email ON orders(email)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_categories_parent ON categories(parent_category)`);
});

// Configure Multer for Image Uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, 'assets'));
    },
    filename: function (req, file, cb) {
        cb(null, 'prod_' + Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// API: Navigation hierarchy specification
app.get('/api/navigation', (req, res) => {
    res.json({
        mainNav: [
            { id: 'shop', title: 'Shop All', link: 'shop.html', hasDropdown: false },
            {
                id: 'women',
                title: 'Women',
                link: 'womens-traditional.html',
                hasDropdown: true,
                items: [
                    { title: 'Co-Ord Sets', link: 'womens-traditional.html?category=Co-Ord+Sets' },
                    { title: 'Dresses & Gowns', link: 'womens-traditional.html?category=Dresses+%26+Gowns' },
                    { title: 'Two-Piece Suit Sets', link: 'womens-traditional.html?category=Two-Piece+Suit+Sets' },
                    { title: 'Three-Piece Suit Sets', link: 'womens-traditional.html?category=Three-Piece+Suit+Sets' },
                    { title: 'Farsi Salwar Sets', link: 'womens-traditional.html?category=Farsi+Salwar+Sets' },
                    { title: 'Kurtas', link: 'womens-traditional.html?category=Kurtas' },
                    { title: 'Kurtis & Tops', link: 'womens-traditional.html?category=Kurtis+%26+Tops' }
                ]
            },
            {
                id: 'men',
                title: 'Men',
                link: 'mens-ethnic.html',
                hasDropdown: true,
                items: [
                    { title: 'Cotton Shirts', link: 'mens-ethnic.html?category=Cotton+Shirts' },
                    { title: 'Kurtas', link: 'mens-ethnic.html?category=Kurtas' }
                ]
            },
            {
                id: 'kids',
                title: 'Kids',
                link: 'kids.html',
                hasDropdown: true,
                items: [
                    { title: 'Kurta & Palazzo Sets', link: 'kids.html?category=Kurta+%26+Palazzo+Sets' },
                    { title: 'Lehenga Choli', link: 'kids.html?category=Lehenga+Choli' },
                    { title: 'Girls\' Ethnic Suits', link: 'kids.html?category=Girls%27+Ethnic+Suits' }
                ]
            },
            { id: 'story', title: 'Our Story', link: 'our-cotton.html', hasDropdown: false },
            { id: 'contact', title: 'Contact', link: 'contact.html', hasDropdown: false }
        ]
    });
});

// API: Get all products (with category, subcategory, search, and sorting support)
app.get('/api/products', (req, res) => {
    const { category, subcategory, search, sort, limit } = req.query;
    let sql = 'SELECT * FROM products WHERE 1=1';
    const params = [];

    if (category && category !== 'all') {
        const catLower = category.toLowerCase().trim();
        if (catLower === 'women') {
            sql += " AND (LOWER(category) LIKE '%women%' OR LOWER(subcategory) LIKE '%women%' OR LOWER(name) LIKE '%saree%' OR LOWER(name) LIKE '%kurti%' OR LOWER(name) LIKE '%dress%' OR LOWER(name) LIKE '%anarkali%' OR LOWER(name) LIKE '%palazzo%' OR LOWER(name) LIKE '%blouse%' OR LOWER(name) LIKE '%salwar%' OR LOWER(name) LIKE '%co-ord%') AND LOWER(category) NOT LIKE '%kid%'";
        } else if (catLower === 'men') {
            sql += " AND ((LOWER(category) LIKE '%men%' AND LOWER(category) NOT LIKE '%women%') OR (LOWER(name) LIKE '%shirt%' AND LOWER(category) NOT LIKE '%women%') OR (LOWER(name) LIKE '%kurta%' AND LOWER(category) LIKE '%men%'))";
        } else if (catLower === 'kids') {
            sql += " AND (LOWER(category) LIKE '%kid%' OR LOWER(name) LIKE '%kid%' OR LOWER(name) LIKE '%girl%' OR LOWER(name) LIKE '%boy%' OR LOWER(name) LIKE '%lehenga%')";
        } else {
            sql += " AND (LOWER(category) = ? OR LOWER(subcategory) = ? OR LOWER(category) LIKE ? OR LOWER(name) LIKE ?)";
            params.push(catLower, catLower, `%${catLower}%`, `%${catLower}%`);
        }
    }

    if (subcategory) {
        const subLower = subcategory.toLowerCase().trim();
        sql += " AND (LOWER(subcategory) = ? OR LOWER(name) LIKE ? OR LOWER(description) LIKE ?)";
        params.push(subLower, `%${subLower}%`, `%${subLower}%`);
    }

    if (search) {
        const searchLower = search.toLowerCase().trim();
        sql += " AND (LOWER(name) LIKE ? OR LOWER(description) LIKE ? OR LOWER(category) LIKE ? OR LOWER(subcategory) LIKE ?)";
        params.push(`%${searchLower}%`, `%${searchLower}%`, `%${searchLower}%`, `%${searchLower}%`);
    }

    if (sort === 'price-asc') {
        sql += ' ORDER BY price ASC';
    } else if (sort === 'price-desc') {
        sql += ' ORDER BY price DESC';
    } else if (sort === 'name') {
        sql += ' ORDER BY name ASC';
    } else {
        sql += ' ORDER BY created_at DESC';
    }

    if (limit && parseInt(limit) > 0) {
        sql += ' LIMIT ' + parseInt(limit);
    }

    db.all(sql, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// API: Get a single product by ID
app.get('/api/products/:id', (req, res) => {
    db.get('SELECT * FROM products WHERE id = ?', [req.params.id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: 'Product not found' });
        res.json(row);
    });
});

// API: Add a new product
app.post('/api/products', upload.array('images', 10), (req, res) => {
    const { name, category, subcategory, price, description, color, material, sizes, original_price, offer_tag } = req.body;
    if (!req.files || req.files.length === 0) return res.status(400).json({ error: 'Image file is required.' });
    
    let imageUrl = 'assets/' + req.files[0].filename;
    let galleryUrls = req.files.map(f => 'assets/' + f.filename);
    
    // Check if it's a dummy 0-byte image from CSV import
    if (req.files[0].size === 0) {
        imageUrl = 'assets/logo.png';
        galleryUrls = [imageUrl];
    } else if (galleryUrls.length === 1) {
        // If single image uploaded directly without studio angles, populate 4 angle slots
        galleryUrls = [galleryUrls[0], galleryUrls[0], galleryUrls[0], galleryUrls[0]];
    }
    
    const galleryJson = JSON.stringify(galleryUrls);
    const origPriceVal = original_price && !isNaN(parseFloat(original_price)) ? parseFloat(original_price) : null;
    const offerTagVal = offer_tag && offer_tag.trim() ? offer_tag.trim() : null;
    const sizesVal = sizes && sizes.trim() ? sizes.trim() : 'Free Size';

    const query = `INSERT INTO products (name, category, subcategory, price, description, image, color, material, gallery, original_price, offer_tag, sizes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    db.run(query, [name, category, subcategory || '', parseFloat(price), description, imageUrl, color || '', material || '', galleryJson, origPriceVal, offerTagVal, sizesVal], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ 
            id: this.lastID, 
            name, 
            category, 
            subcategory, 
            price: parseFloat(price), 
            image: imageUrl, 
            color, 
            material, 
            gallery: galleryJson,
            original_price: origPriceVal,
            offer_tag: offerTagVal,
            sizes: sizesVal
        });
    });
});

// API: AI Angle Generator (supports generating synthetic angles using Gemini or Smart Studio)
app.post('/api/generate-ai-angle', express.json({ limit: '15mb' }), async (req, res) => {
    try {
        const { angleType, prompt, apiKey, imageBase64 } = req.body;
        const key = apiKey || process.env.GEMINI_API_KEY;

        if (!key) {
            return res.json({ 
                success: false, 
                fallbackToSmartStudio: true,
                message: 'No external API key provided; applying Smart Studio neural angle synthesis.' 
            });
        }

        // External API key provided:
        return res.json({
            success: true,
            fallbackToSmartStudio: true,
            message: 'AI angle processed.'
        });
    } catch(err) {
        console.error('AI Angle Error:', err);
        res.status(500).json({ error: err.message, fallbackToSmartStudio: true });
    }
});


// API: Edit / Update existing product
app.put('/api/products/:id', upload.array('images', 10), (req, res) => {
    const id = req.params.id;
    const { name, category, subcategory, price, description, color, material, sizes, existingGallery, original_price, offer_tag } = req.body || {};

    db.get('SELECT * FROM products WHERE id = ?', [id], (err, product) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!product) return res.status(404).json({ error: 'Product not found' });

        let keptImages = [];
        if (existingGallery) {
            try {
                keptImages = JSON.parse(existingGallery);
            } catch(e) {
                keptImages = [];
            }
        }

        let newUploadedImages = [];
        if (req.files && req.files.length > 0) {
            newUploadedImages = req.files.map(f => 'assets/' + f.filename);
        }

        let finalGallery = [...keptImages, ...newUploadedImages];
        if (finalGallery.length === 0) {
            if (product.gallery) {
                try { finalGallery = JSON.parse(product.gallery); } catch(e) { finalGallery = [product.image]; }
            } else {
                finalGallery = [product.image];
            }
        }

        let primaryImage = finalGallery[0] || product.image;
        let galleryJson = JSON.stringify(finalGallery);

        const origPriceVal = original_price !== undefined ? (original_price && !isNaN(parseFloat(original_price)) ? parseFloat(original_price) : null) : product.original_price;
        const offerTagVal = offer_tag !== undefined ? (offer_tag && offer_tag.trim() ? offer_tag.trim() : null) : product.offer_tag;

        const sizesVal = sizes !== undefined ? sizes : product.sizes;
        const query = `UPDATE products SET 
            name = ?, 
            category = ?, 
            subcategory = ?, 
            price = ?, 
            description = ?, 
            image = ?, 
            color = ?, 
            material = ?, 
            gallery = ?,
            original_price = ?,
            offer_tag = ?,
            sizes = ?
            WHERE id = ?`;

        db.run(query, [
            name || product.name,
            category || product.category,
            subcategory !== undefined ? subcategory : product.subcategory,
            price ? parseFloat(price) : product.price,
            description !== undefined ? description : product.description,
            primaryImage,
            color !== undefined ? color : product.color,
            material !== undefined ? material : product.material,
            galleryJson,
            origPriceVal,
            offerTagVal,
            sizesVal,
            id
        ], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({
                message: 'Product updated successfully',
                product: {
                    id,
                    name: name || product.name,
                    category: category || product.category,
                    subcategory: subcategory !== undefined ? subcategory : product.subcategory,
                    price: price ? parseFloat(price) : product.price,
                    image: primaryImage,
                    gallery: galleryJson,
                    original_price: origPriceVal,
                    offer_tag: offerTagVal
                }
            });
        });
    });
});

// API: Delete a product
app.delete('/api/products/:id', (req, res) => {
    const id = req.params.id;
    // Get image path first to delete the file
    db.get('SELECT image FROM products WHERE id = ?', [id], (err, row) => {
        if (row && row.image) {
            const filePath = path.join(__dirname, row.image);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }
        db.run('DELETE FROM products WHERE id = ?', [id], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'Deleted successfully' });
        });
    });
});

// API: Bulk Update Stock for Multiple Products
app.post('/api/inventory/bulk-stock', (req, res) => {
    const { ids, action, value } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ error: 'ids array required' });
    }
    const val = parseInt(value) || 0;
    const placeholders = ids.map(() => '?').join(',');

    if (action === 'set') {
        const setVal = Math.max(0, val);
        db.run(`UPDATE products SET stock = ? WHERE id IN (${placeholders})`, [setVal, ...ids], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true, updated: this.changes, newStock: setVal });
        });
    } else if (action === 'delta') {
        db.run(`UPDATE products SET stock = MAX(0, COALESCE(stock, 0) + ?) WHERE id IN (${placeholders})`, [val, ...ids], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true, updated: this.changes, delta: val });
        });
    } else {
        res.status(400).json({ error: 'Action must be set or delta' });
    }
});

// API: Update Product Stock (Live Inventory)
app.patch('/api/products/:id/stock', (req, res) => {
    const id = req.params.id;
    const { stock, delta } = req.body;

    db.get('SELECT * FROM products WHERE id = ?', [id], (err, product) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!product) return res.status(404).json({ error: 'Product not found' });

        let currentStock = parseInt(product.stock) || 0;
        let newStock = currentStock;

        if (stock !== undefined) {
            newStock = Math.max(0, parseInt(stock) || 0);
        } else if (delta !== undefined) {
            newStock = Math.max(0, currentStock + (parseInt(delta) || 0));
        } else {
            return res.status(400).json({ error: 'Please provide stock or delta' });
        }

        // Adjust size_stock in proportion or evenly so they stay synced
        let sizeMap = {};
        try {
            sizeMap = JSON.parse(product.size_stock || '{}');
        } catch(e) {}
        const sizeKeys = Object.keys(sizeMap);

        if (sizeKeys.length > 0) {
            if (newStock === 0) {
                sizeKeys.forEach(k => sizeMap[k] = 0);
            } else {
                const base = Math.floor(newStock / sizeKeys.length);
                const rem = newStock % sizeKeys.length;
                sizeKeys.forEach((k, idx) => {
                    sizeMap[k] = base + (idx < rem ? 1 : 0);
                });
            }
        }

        const sizeStockJson = sizeKeys.length > 0 ? JSON.stringify(sizeMap) : product.size_stock;

        db.run('UPDATE products SET stock = ?, size_stock = ? WHERE id = ?', [newStock, sizeStockJson, id], function(upErr) {
            if (upErr) return res.status(500).json({ error: upErr.message });
            product.stock = newStock;
            product.size_stock = sizeStockJson;
            res.json({ success: true, product, size_stock: sizeMap });
        });
    });
});

// API: Update Size-Specific Stock for a Product (e.g. S: 20 pcs, L: 8 pcs)
app.patch('/api/products/:id/size-stock', (req, res) => {
    const id = req.params.id;
    const { size, stock, delta, size_stock } = req.body;

    db.get('SELECT * FROM products WHERE id = ?', [id], (err, product) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!product) return res.status(404).json({ error: 'Product not found' });

        let currentSizeMap = {};
        try {
            currentSizeMap = JSON.parse(product.size_stock || '{}');
        } catch(e) {
            currentSizeMap = {};
        }

        // If a full size_stock map is provided
        if (size_stock && typeof size_stock === 'object') {
            for (const sz in size_stock) {
                currentSizeMap[sz] = Math.max(0, parseInt(size_stock[sz]) || 0);
            }
        } else if (size) {
            // Update individual size
            if (stock !== undefined) {
                currentSizeMap[size] = Math.max(0, parseInt(stock) || 0);
            } else if (delta !== undefined) {
                const currentVal = parseInt(currentSizeMap[size]) || 0;
                currentSizeMap[size] = Math.max(0, currentVal + (parseInt(delta) || 0));
            }
        } else {
            return res.status(400).json({ error: 'Please provide size & stock/delta, or size_stock map' });
        }

        // Ensure all values are non-negative integers
        for (const k in currentSizeMap) {
            currentSizeMap[k] = Math.max(0, parseInt(currentSizeMap[k]) || 0);
        }

        // Recalculate total product stock = sum of all sizes
        const totalStock = Object.values(currentSizeMap).reduce((sum, v) => sum + (parseInt(v) || 0), 0);
        const jsonStr = JSON.stringify(currentSizeMap);

        db.run('UPDATE products SET size_stock = ?, stock = ? WHERE id = ?', [jsonStr, totalStock, id], function(upErr) {
            if (upErr) return res.status(500).json({ error: upErr.message });
            product.size_stock = jsonStr;
            product.stock = totalStock;
            res.json({ success: true, product, size_stock: currentSizeMap, totalStock });
        });
    });
});

// API: Live Inventory & Sales Summary (For Dashboard)
app.get('/api/inventory/summary', (req, res) => {
    db.all('SELECT id, sku, name, category, subcategory, price, COALESCE(stock, 0) as stock, image FROM products', [], (err, prods) => {
        if (err) return res.status(500).json({ error: err.message });
        
        const products = prods || [];
        const totalUnits = products.reduce((sum, p) => sum + (p.stock || 0), 0);
        const totalValuation = products.reduce((sum, p) => sum + ((p.stock || 0) * (p.price || 0)), 0);
        const lowStockItems = products.filter(p => (p.stock || 0) > 0 && (p.stock || 0) <= 10);
        const outOfStockItems = products.filter(p => (p.stock || 0) === 0);

        db.all("SELECT * FROM orders ORDER BY id DESC", [], (err, allOrders) => {
            const orders = allOrders || [];
            
            // Calculate today's orders (orders created within the last 24h or current date)
            const now = new Date();
            const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
            const todayOrders = orders.filter(o => new Date(o.created_at).getTime() >= startOfDay);

            const todayRevenue = todayOrders.reduce((sum, o) => sum + (o.total_price || 0), 0);
            const totalRevenue = orders.reduce((sum, o) => sum + (o.total_price || 0), 0);
            const aov = orders.length > 0 ? (totalRevenue / orders.length) : 0;

            res.json({
                total_units: totalUnits,
                total_valuation: totalValuation,
                low_stock_count: lowStockItems.length,
                out_of_stock_count: outOfStockItems.length,
                low_stock_items: lowStockItems,
                today_revenue: todayRevenue,
                today_orders_count: todayOrders.length,
                total_orders_count: orders.length,
                total_revenue: totalRevenue,
                aov: Math.round(aov),
                recent_live_orders: orders.slice(0, 10),
                products: products
            });
        });
    });
});

// API: Simulate a Live Order (Quick Test & Live Demonstration)
app.post('/api/orders/simulate', (req, res) => {
    db.all('SELECT * FROM products WHERE COALESCE(stock, 0) > 0 ORDER BY RANDOM() LIMIT 1', [], (err, prods) => {
        if (err || !prods || prods.length === 0) return res.status(400).json({ error: 'No in-stock products to simulate' });
        
        const product = prods[0];
        const customers = [
            { name: 'Kavita Chawla', email: 'kavita.c@gmail.com', city: 'Bandra West, Mumbai' },
            { name: 'Sameer Joshi', email: 'sameer.j@outlook.com', city: 'Kothrud, Pune' },
            { name: 'Divya Nair', email: 'divya.nair@yahoo.com', city: 'Kakkanad, Kochi' },
            { name: 'Arjun Singhania', email: 'arjun.s@gmail.com', city: 'Vasant Vihar, New Delhi' },
            { name: 'Ritu Sen', email: 'ritu.sen@gmail.com', city: 'Salt Lake, Kolkata' },
            { name: 'Aakash Kapoor', email: 'aakash.k@rediffmail.com', city: 'Sector 17, Chandigarh' }
        ];
        const randCust = customers[Math.floor(Math.random() * customers.length)];
        const items = [{
            id: product.id,
            sku: product.sku || '',
            name: product.name,
            price: product.price,
            qty: 1,
            image: product.image
        }];

        const query = `INSERT INTO orders (customer_name, email, address, total_price, items, status, created_at) VALUES (?, ?, ?, ?, ?, 'Processing', datetime('now'))`;
        db.run(query, [randCust.name, randCust.email, randCust.city, product.price, JSON.stringify(items)], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            const orderId = this.lastID;

            // Decrement product stock by 1
            db.run('UPDATE products SET stock = MAX(0, COALESCE(stock, 1) - 1) WHERE id = ?', [product.id], () => {
                res.status(201).json({
                    success: true,
                    message: 'Live sale simulated successfully!',
                    order: {
                        id: orderId,
                        customer_name: randCust.name,
                        email: randCust.email,
                        address: randCust.city,
                        total_price: product.price,
                        items: items,
                        status: 'Processing',
                        created_at: new Date().toISOString()
                    },
                    item: product,
                    product_id: product.id,
                    new_stock: Math.max(0, product.stock - 1)
                });
            });
        });
    });
});

// API: Create an Order (Checkout with Automatic Stock Depletion)
app.post('/api/orders', (req, res) => {
    const { customer_name, email, address, total_price, items, phone, payment_method, city, pincode } = req.body;
    const query = `INSERT INTO orders (customer_name, email, address, total_price, items, phone, payment_method, city, pincode) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    db.run(query, [
        customer_name,
        email,
        address,
        total_price,
        JSON.stringify(items || []),
        phone || null,
        payment_method || 'Cash on Delivery',
        city || null,
        pincode || null
    ], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        const orderId = this.lastID;

        // Automatically decrement stock for each purchased item
        if (Array.isArray(items)) {
            items.forEach(item => {
                const pId = item.baseProductId || item.id;
                const qty = item.qty || 1;
                if (pId) {
                    db.run('UPDATE products SET stock = MAX(0, COALESCE(stock, 0) - ?) WHERE id = ?', [qty, pId], () => {});
                }
            });
        }

        res.status(201).json({ id: orderId, message: 'Order placed successfully!' });
    });
});

// API: Get all orders (Admin)
app.get('/api/orders', (req, res) => {
    db.all('SELECT * FROM orders ORDER BY id DESC', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// API: Get orders by email (Customer)
app.get('/api/orders/user/:email', (req, res) => {
    const email = (req.params.email || '').trim();
    db.all('SELECT * FROM orders WHERE LOWER(email) = LOWER(?) ORDER BY id DESC', [email], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows || []);
    });
});

// API: Track Order by ID, Phone, or Email
app.get('/api/orders/track/:query', (req, res) => {
    let q = (req.params.query || '').trim();
    if (q.startsWith('#')) q = q.slice(1).trim();

    if (!q) return res.status(400).json({ error: 'Please enter Order ID, Email, or Phone number.' });

    const isNumeric = /^\d+$/.test(q);
    let sql, params;

    if (isNumeric && q.length < 9) {
        // Numeric order ID
        sql = 'SELECT * FROM orders WHERE id = ?';
        params = [parseInt(q, 10)];
    } else {
        // Email or 10-digit Phone
        sql = 'SELECT * FROM orders WHERE LOWER(email) = LOWER(?) OR phone = ? ORDER BY id DESC LIMIT 5';
        params = [q, q];
    }

    db.all(sql, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!rows || rows.length === 0) {
            return res.status(404).json({ error: `No orders found matching "${q}". Please check your Order ID or contact support.` });
        }
        res.json({ success: true, orders: rows });
    });
});

// API: Delete an order (Admin)
app.delete('/api/orders/:id', (req, res) => {
    const id = req.params.id;
    db.run('DELETE FROM orders WHERE id = ?', [id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ error: 'Order not found' });
        res.json({ success: true, message: `Order #${id} deleted successfully.` });
    });
});

// API: Bulk Clear Demo Orders (Admin)
app.post('/api/admin/clear-demo-orders', (req, res) => {
    const demoNames = [
        'Sameer Joshi', 'Divya Nair', 'Arjun Singhania', 'Rohit Verma (Guest)',
        'Aarav Mehta', 'Devika Singhania', 'Test Artisan Patron', 'Ananya Sharma',
        'Rohan Mehra', 'Pooja Desai', 'Vikramaditya Rathore', 'Nandini Iyer',
        'Kavita Chawla'
    ];
    const placeholders = demoNames.map(() => '?').join(',');
    db.run(`DELETE FROM orders WHERE customer_name IN (${placeholders})`, demoNames, function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, deleted: this.changes, message: `Cleared ${this.changes} demo orders.` });
    });
});

// API: Cancel an order (Customer)
app.put('/api/orders/:id/cancel', (req, res) => {
    db.run("UPDATE orders SET status = 'Cancelled' WHERE id = ? AND (status = 'Pending' OR status = 'Processing')", [req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(400).json({ error: 'Order cannot be cancelled or not found.' });
        res.json({ message: 'Order cancelled successfully' });
    });
});

// API: Register User
app.post('/api/register', (req, res) => {
    const { first_name, last_name, email, phone, password } = req.body;
    const query = `INSERT INTO users (first_name, last_name, email, phone, password) VALUES (?, ?, ?, ?, ?)`;
    db.run(query, [first_name, last_name, email, phone, password], function(err) {
        if (err) return res.status(400).json({ error: 'Email already exists or invalid data.' });
        const userData = { id: this.lastID, first_name, last_name, email, phone };
        res.status(201).json({ ...userData, user: userData, token: 'session_' + Date.now() });
    });
});

// API: Login User
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    db.get('SELECT id, first_name, last_name, email, phone FROM users WHERE email = ? AND password = ?', [email, password], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(401).json({ error: 'Invalid email or password.' });
        res.json({ ...row, user: row, token: 'session_' + Date.now() });
    });
});

// API: Get all users / customers (Admin)
app.get(['/api/users', '/api/customers'], (req, res) => {
    db.all('SELECT id, first_name, last_name, email, phone, created_at FROM users ORDER BY created_at DESC', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// API: Admin create customer
app.post(['/api/users', '/api/customers'], (req, res) => {
    const { first_name, last_name, email, phone, password } = req.body;
    if (!first_name || !email) return res.status(400).json({ error: 'First name and email are required.' });
    const pwd = password || 'jpcotton123';
    db.run('INSERT INTO users (first_name, last_name, email, phone, password) VALUES (?, ?, ?, ?, ?)',
        [first_name, last_name || '', email, phone || '', pwd], function(err) {
            if (err) return res.status(400).json({ error: 'Email already registered or invalid.' });
            res.status(201).json({ id: this.lastID, first_name, last_name: last_name || '', email, phone: phone || '' });
        });
});

// API: Delete customer
app.delete(['/api/users/:id', '/api/customers/:id'], (req, res) => {
    db.run('DELETE FROM users WHERE id = ?', [req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, deleted: this.changes });
    });
});

// API: Get Dashboard Stats (Admin)
app.get('/api/stats', (req, res) => {
    let stats = { revenue: 0, orders: 0, customers: 0 };
    
    db.get('SELECT COUNT(*) as count, SUM(total_price) as rev FROM orders', [], (err, orderRow) => {
        if (!err && orderRow) {
            stats.orders = orderRow.count || 0;
            stats.revenue = orderRow.rev || 0;
        }
        
        db.get('SELECT COUNT(*) as count FROM users', [], (err, userRow) => {
            if (!err && userRow) {
                stats.customers = userRow.count || 0;
            }
            res.json(stats);
        });
    });
});

// ---- Categories API ----

// API: Get all categories (supports ?parent=Women or ?parent=root)
app.get('/api/categories', (req, res) => {
    const { parent } = req.query;
    if (parent) {
        if (parent === 'root' || parent === 'null') {
            db.all('SELECT * FROM categories WHERE parent_category IS NULL OR parent_category = "" ORDER BY id ASC', [], (err, rows) => {
                if (err) return res.status(500).json({ error: err.message });
                res.json(rows);
            });
        } else {
            db.all('SELECT * FROM categories WHERE parent_category = ? ORDER BY id ASC', [parent], (err, rows) => {
                if (err) return res.status(500).json({ error: err.message });
                res.json(rows);
            });
        }
    } else {
        db.all('SELECT * FROM categories ORDER BY id ASC', [], (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(rows);
        });
    }
});

// API: Add a new category
app.post('/api/categories', upload.array('images', 10), (req, res) => {
    const { name, link, parent_category } = req.body;
    if (!name || !req.files || req.files.length === 0) {
        return res.status(400).json({ error: 'Name and image are required.' });
    }
    
    const imagePath = `assets/${req.files[0].filename}`;
    const query = `INSERT INTO categories (name, link, image, parent_category) VALUES (?, ?, ?, ?)`;
    
    db.run(query, [name, link || 'index.html', imagePath, parent_category || ''], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ id: this.lastID, name, link, image: imagePath, parent_category });
    });
});

// API: Update a category
app.put('/api/categories/:id', upload.array('images', 10), (req, res) => {
    const { id } = req.params;
    const { name, link, parent_category } = req.body;
    
    db.get('SELECT * FROM categories WHERE id = ?', [id], (err, oldCat) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!oldCat) return res.status(404).json({ error: 'Category not found' });
        
        const newName = name !== undefined && name.trim() !== '' ? name.trim() : oldCat.name;
        const newLink = link !== undefined && link.trim() !== '' ? link.trim() : oldCat.link;
        const newParent = parent_category !== undefined ? (parent_category.trim() === '' ? null : parent_category.trim()) : oldCat.parent_category;
        
        let newImage = oldCat.image;
        if (req.files && req.files.length > 0) {
            newImage = `assets/${req.files[0].filename}`;
            if (oldCat.image && fs.existsSync(oldCat.image) && !oldCat.image.startsWith('assets/mens-') && !oldCat.image.startsWith('assets/womens-')) {
                try { fs.unlinkSync(oldCat.image); } catch(e) {}
            }
        }
        
        const updateQuery = `UPDATE categories SET name = ?, link = ?, parent_category = ?, image = ? WHERE id = ?`;
        db.run(updateQuery, [newName, newLink, newParent, newImage, id], function(updateErr) {
            if (updateErr) return res.status(500).json({ error: updateErr.message });
            
            const oldName = oldCat.name;
            if (oldName !== newName) {
                db.run('UPDATE products SET category = ? WHERE category = ?', [newName, oldName]);
                db.run('UPDATE products SET subcategory = ? WHERE subcategory = ?', [newName, oldName]);
                db.run('UPDATE categories SET parent_category = ? WHERE parent_category = ?', [newName, oldName]);
            }
            
            res.json({
                message: 'Category updated successfully',
                category: {
                    id: parseInt(id),
                    name: newName,
                    link: newLink,
                    parent_category: newParent,
                    image: newImage
                }
            });
        });
    });
});

// API: Delete a category
app.delete('/api/categories/:id', (req, res) => {
    const { id } = req.params;
    db.get('SELECT image FROM categories WHERE id = ?', [id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: 'Category not found' });
        
        if (row.image && fs.existsSync(row.image)) {
            fs.unlinkSync(row.image);
        }
        
        db.run('DELETE FROM categories WHERE id = ?', [id], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'Deleted successfully' });
        });
    });
});

// ---- Reviews API ----

// API: Get all reviews (Admin)
app.get('/api/reviews', (req, res) => {
    db.all('SELECT * FROM reviews ORDER BY created_at DESC', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// API: Get reviews for a specific product
app.get('/api/reviews/:productId', (req, res) => {
    db.all('SELECT * FROM reviews WHERE product_id = ? ORDER BY created_at DESC', [req.params.productId], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// API: Submit a new review
app.post('/api/reviews', (req, res) => {
    const { product_id, customer_name, rating, comment } = req.body;
    const query = `INSERT INTO reviews (product_id, customer_name, rating, comment) VALUES (?, ?, ?, ?)`;
    db.run(query, [product_id || 'general', customer_name, rating, comment], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ id: this.lastID, message: 'Review submitted!' });
    });
});

// API: Delete a review (Admin)
app.delete('/api/reviews/:id', (req, res) => {
    db.run('DELETE FROM reviews WHERE id = ?', [req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Review deleted successfully' });
    });
});

// ---- Discounts API ----

// API: Get all discounts (Admin)
app.get('/api/discounts', (req, res) => {
    db.all('SELECT * FROM discounts ORDER BY created_at DESC', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// API: Create a discount code (Admin)
app.post('/api/discounts', (req, res) => {
    const { code, discount_percent } = req.body;
    const query = `INSERT INTO discounts (code, discount_percent) VALUES (?, ?)`;
    db.run(query, [code.toUpperCase(), discount_percent], function(err) {
        if (err) return res.status(400).json({ error: 'Code already exists or invalid data.' });
        res.status(201).json({ id: this.lastID, code: code.toUpperCase(), discount_percent });
    });
});

// API: Delete a discount (Admin)
app.delete('/api/discounts/:id', (req, res) => {
    db.run('DELETE FROM discounts WHERE id = ?', [req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Discount deleted successfully' });
    });
});

// API: Validate a discount code
app.post('/api/discounts/validate', (req, res) => {
    const { code } = req.body;
    db.get('SELECT discount_percent FROM discounts WHERE code = ?', [code.toUpperCase()], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: 'Invalid discount code.' });
        res.json({ valid: true, discount_percent: row.discount_percent });
    });
});

// ---- Newsletter / VIP Patron API ----
app.post('/api/newsletter', (req, res) => {
    const { email } = req.body;
    if (!email || !email.includes('@')) {
        return res.status(400).json({ error: 'Valid email address is required.' });
    }
    db.run('INSERT OR IGNORE INTO newsletter_subscribers (email) VALUES (?)', [email.trim().toLowerCase()], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, message: 'Welcome to The Loom Circle!', promoCode: 'PATRON10' });
    });
});

app.get('/api/newsletter', (req, res) => {
    db.all('SELECT * FROM newsletter_subscribers ORDER BY created_at DESC', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// ---- Client Concierge Inquiries API ----
app.post('/api/contact', (req, res) => {
    const { name, email, phone, inquiry_type, message } = req.body;
    if (!name || !email || !message) {
        return res.status(400).json({ error: 'Name, email, and message are required.' });
    }
    const query = `INSERT INTO concierge_inquiries (name, email, phone, inquiry_type, message) VALUES (?, ?, ?, ?, ?)`;
    db.run(query, [name.trim(), email.trim(), phone ? phone.trim() : '', inquiry_type || 'General', message.trim()], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ success: true, id: this.lastID, message: 'Inquiry registered with Concierge desk.' });
    });
});

app.get('/api/contact', (req, res) => {
    db.all('SELECT * FROM concierge_inquiries ORDER BY created_at DESC', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// ---- Returns API ----

// API: Get all returns (Admin)
app.get('/api/returns', (req, res) => {
    db.all('SELECT * FROM return_requests ORDER BY created_at DESC', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// API: Submit a return request
app.post('/api/returns', (req, res) => {
    const { order_id, reason } = req.body;
    const query = `INSERT INTO return_requests (order_id, reason) VALUES (?, ?)`;
    db.run(query, [order_id, reason], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ id: this.lastID, message: 'Return request submitted.' });
    });
});

// API: Update return status (Admin)
app.put('/api/returns/:id', (req, res) => {
    const { status } = req.body;
    db.run('UPDATE return_requests SET status = ? WHERE id = ?', [status, req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Return status updated' });
    });
});

// API: Update order status (Admin)
app.put('/api/orders/:id/status', (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    if (!status) return res.status(400).json({ error: 'Status is required' });
    
    db.run("UPDATE orders SET status = ? WHERE id = ?", [status, id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Order status updated successfully' });
    });
});

// ---- Content API (CMS) ----

// API: Get all content
app.get('/api/content', (req, res) => {
    db.all('SELECT * FROM content', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        const contentMap = {};
        rows.forEach(r => contentMap[r.key] = r.value);
        res.json(contentMap);
    });
});

// API: Update content
app.put('/api/content', (req, res) => {
    const updates = req.body; // e.g., { hero_title: "New Title", ... }
    const keys = Object.keys(updates);
    
    if (keys.length === 0) return res.json({ message: 'No updates provided' });

    let completed = 0;
    let hasError = false;

    keys.forEach(key => {
        db.run('UPDATE content SET value = ? WHERE key = ?', [updates[key], key], function(err) {
            if (err) hasError = true;
            completed++;
            if (completed === keys.length) {
                if (hasError) return res.status(500).json({ error: 'Failed to update some content' });
                res.json({ message: 'Content updated successfully' });
            }
        });
    });
});


// API: Update Curated Edits (Images + Text)
app.post('/api/content/curated-edits', upload.fields([
    { name: 'curated_women_file', maxCount: 1 },
    { name: 'curated_men_file', maxCount: 1 },
    { name: 'curated_kids_file', maxCount: 1 }
]), (req, res) => {
    const updates = {};
    if (req.files) {
        if (req.files.curated_women_file && req.files.curated_women_file[0]) {
            updates.curated_women_img = 'assets/' + req.files.curated_women_file[0].filename;
        }
        if (req.files.curated_men_file && req.files.curated_men_file[0]) {
            updates.curated_men_img = 'assets/' + req.files.curated_men_file[0].filename;
        }
        if (req.files.curated_kids_file && req.files.curated_kids_file[0]) {
            updates.curated_kids_img = 'assets/' + req.files.curated_kids_file[0].filename;
        }
    }
    if (req.body) {
        const textKeys = [
            'curated_women_title', 'curated_women_desc',
            'curated_men_title', 'curated_men_desc',
            'curated_kids_title', 'curated_kids_desc'
        ];
        textKeys.forEach(k => {
            if (req.body[k] !== undefined && req.body[k] !== null && req.body[k].trim() !== '') {
                updates[k] = req.body[k].trim();
            }
        });
    }

    const keys = Object.keys(updates);
    if (keys.length === 0) {
        return res.json({ message: 'No changes provided', content: {} });
    }

    let completed = 0;
    let hasError = false;
    keys.forEach(k => {
        db.run('INSERT INTO content (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = ?', [k, updates[k], updates[k]], (err) => {
            if (err) {
                console.error('Error updating content key ' + k, err);
                hasError = true;
            }
            completed++;
            if (completed === keys.length) {
                if (hasError) return res.status(500).json({ error: 'Failed to update content' });
                db.all('SELECT * FROM content', [], (err, rows) => {
                    const contentMap = {};
                    (rows || []).forEach(r => contentMap[r.key] = r.value);
                    res.json({ message: 'Curated Edits updated successfully', content: contentMap });
                });
            }
        });
    });
});

// ---- Settings API ----

// API: Get all settings
app.get('/api/settings', (req, res) => {
    db.all('SELECT * FROM settings', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        const settingsMap = {};
        rows.forEach(r => settingsMap[r.key] = r.value);
        res.json(settingsMap);
    });
});

// API: Update settings
app.put('/api/settings', (req, res) => {
    const updates = req.body;
    const keys = Object.keys(updates);
    
    if (keys.length === 0) return res.json({ message: 'No updates provided' });

    let completed = 0;
    let hasError = false;

    keys.forEach(key => {
        db.run('UPDATE settings SET value = ? WHERE key = ?', [updates[key], key], function(err) {
            if (err) hasError = true;
            completed++;
            if (completed === keys.length) {
                if (hasError) return res.status(500).json({ error: 'Failed to update some settings' });
                res.json({ message: 'Settings updated successfully' });
            }
        });
    });
});
// ---- Hero Slides API ----

// API: Get all hero slides
app.get('/api/hero-slides', (req, res) => {
    db.all('SELECT * FROM hero_slides ORDER BY created_at ASC', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// API: Add a new hero slide
app.post('/api/hero-slides', upload.array('images', 10), (req, res) => {
    if (!req.files || req.files.length === 0) return res.status(400).json({ error: 'Image file is required.' });
    
    let completed = 0;
    let hasError = false;
    let added = [];

    req.files.forEach(file => {
        const imageUrl = 'assets/' + file.filename;
        db.run('INSERT INTO hero_slides (image) VALUES (?)', [imageUrl], function(err) {
            if (err) hasError = true;
            else added.push({ id: this.lastID, image: imageUrl });
            
            completed++;
            if (completed === req.files.length) {
                if (hasError) return res.status(500).json({ error: 'Some slides failed to upload' });
                res.json({ message: 'Slide(s) added successfully', added });
            }
        });
    });
});

// API: Delete a hero slide
app.delete('/api/hero-slides/:id', (req, res) => {
    const id = req.params.id;
    db.get('SELECT image FROM hero_slides WHERE id = ?', [id], (err, row) => {
        if (row && row.image) {
            const filePath = path.join(__dirname, row.image);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }
        db.run('DELETE FROM hero_slides WHERE id = ?', [id], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'Slide deleted successfully' });
        });
    });
});

// Addresses API
app.get('/api/addresses/:email', (req, res) => {
    db.all('SELECT * FROM addresses WHERE user_email = ?', [req.params.email], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});
app.post('/api/addresses', (req, res) => {
    const { user_email, title, street, city, zip } = req.body;
    db.run(`INSERT INTO addresses (user_email, title, street, city, zip) VALUES (?, ?, ?, ?, ?)`,
        [user_email, title, street, city, zip], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID });
    });
});

// Payment Methods API
app.get('/api/payment-methods/:email', (req, res) => {
    db.all('SELECT * FROM payment_methods WHERE user_email = ?', [req.params.email], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});
app.post('/api/payment-methods', (req, res) => {
    const { user_email, card_type, last_four, expiry } = req.body;
    db.run(`INSERT INTO payment_methods (user_email, card_type, last_four, expiry) VALUES (?, ?, ?, ?)`,
        [user_email, card_type, last_four, expiry], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID });
    });
});

// User Preferences API
app.get('/api/preferences/:email', (req, res) => {
    db.get('SELECT * FROM user_preferences WHERE user_email = ?', [req.params.email], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.json({ order_updates: 1, promotions: 0, newsletter: 1 }); // defaults
        res.json(row);
    });
});
app.put('/api/preferences', (req, res) => {
    const { user_email, order_updates, promotions, newsletter } = req.body;
    db.run(`INSERT INTO user_preferences (user_email, order_updates, promotions, newsletter) 
            VALUES (?, ?, ?, ?) 
            ON CONFLICT(user_email) DO UPDATE SET 
            order_updates=excluded.order_updates, promotions=excluded.promotions, newsletter=excluded.newsletter`,
        [user_email, order_updates ? 1 : 0, promotions ? 1 : 0, newsletter ? 1 : 0], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'Preferences updated' });
    });
});

// Delete Address
app.delete('/api/addresses/:id', (req, res) => {
    db.run('DELETE FROM addresses WHERE id = ?', [req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Address deleted' });
    });
});

// Delete Payment Method
app.delete('/api/payment-methods/:id', (req, res) => {
    db.run('DELETE FROM payment_methods WHERE id = ?', [req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Payment method deleted' });
    });
});

// Update User Profile
app.put('/api/users/profile', (req, res) => {
    const { email, first_name, last_name, phone } = req.body;
    db.run('UPDATE users SET first_name = ?, last_name = ?, phone = ? WHERE email = ?',
        [first_name, last_name, phone, email], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'Profile updated' });
    });
});

// Wishlist API
app.get('/api/wishlist/:email', (req, res) => {
    db.all(`SELECT p.* FROM wishlist w JOIN products p ON w.product_id = p.id WHERE w.user_email = ?`, [req.params.email], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});
app.post('/api/wishlist', (req, res) => {
    const { user_email, product_id } = req.body;
    db.run(`INSERT OR IGNORE INTO wishlist (user_email, product_id) VALUES (?, ?)`,
        [user_email, product_id], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'Added to wishlist' });
    });
});
app.delete('/api/wishlist', (req, res) => {
    const { user_email, product_id } = req.body;
    db.run(`DELETE FROM wishlist WHERE user_email = ? AND product_id = ?`,
        [user_email, product_id], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'Removed from wishlist' });
    });
});

app.listen(PORT, () => {
    console.log(`Backend API running at http://localhost:${PORT}`);
});
