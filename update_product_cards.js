const fs = require('fs');
const path = require('path');

// 1. Update app.js
const appPath = path.join(__dirname, 'app.js');
let appContent = fs.readFileSync(appPath, 'utf8');

const oldCardHTML = `            <div class="p-card">
              <div class="p-card-img" style="cursor:pointer;" onclick="window.location.href='product.html?id=\${p.id}'">
                <div class="p-wishlist \${isWishlisted}" onclick="toggleWishlist(event, this, \${p.id}, '\${p.name.replace(/'/g, "\\\\'")}', \${p.price}, '\${p.image}')"><svg viewBox="0 0 24 24"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z"/></svg></div>
                <img src="\${p.image}" alt="\${p.name}" style="width:100%; height:100%; object-fit:cover;" onerror="this.src='assets/product_kurta_ivory.jpg'">
                <img class="img-hover" src="\${p.image}" alt="\${p.name} Detail" style="width:100%; height:100%; object-fit:cover;" onerror="this.src='assets/product_kurta_ivory.jpg'">
              </div>
              <h3 style="cursor:pointer;" onclick="window.location.href='product.html?id=\${p.id}'">\${p.name}</h3>
              <p class="price" style="cursor:pointer;" onclick="window.location.href='product.html?id=\${p.id}'">&#8377;\${p.price.toFixed(2)}</p>
              <div style="display: flex; gap: 8px; margin-top: 10px;">
                <button onclick="addToCart(\${p.id}, '\${p.name}', \${p.price}, '\${p.image}')" class="btn-primary" style="flex: 1; padding:8px; border-radius:0; font-size: 11px;">Add to Cart</button>
                <button onclick="buyNow(\${p.id}, '\${p.name}', \${p.price}, '\${p.image}')" class="btn-primary" style="flex: 1; padding:8px; border-radius:0; font-size: 11px;">Buy Now</button>
              </div>
            </div>`;

const newCardHTML = `            <div class="p-card">
              <div class="p-card-img" style="cursor:pointer;" onclick="window.location.href='product.html?id=\${p.id}'">
                <div class="p-wishlist \${isWishlisted}" onclick="toggleWishlist(event, this, \${p.id}, '\${p.name.replace(/'/g, "\\\\'")}', \${p.price}, '\${p.image}')">
                  <svg viewBox="0 0 24 24"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z"/></svg>
                </div>
                <img src="\${p.image}" alt="\${p.name}" style="width:100%; height:100%; object-fit:cover;" onerror="this.src='assets/product_kurta_ivory.jpg'">
                <img class="img-hover" src="\${p.image}" alt="\${p.name} Detail" style="width:100%; height:100%; object-fit:cover;" onerror="this.src='assets/product_kurta_ivory.jpg'">
                
                <!-- Quick Add Overlay -->
                <div class="quick-add-overlay">
                  <button onclick="event.stopPropagation(); addToCart(\${p.id}, '\${p.name.replace(/'/g, "\\\\'")}', \${p.price}, '\${p.image}');" class="btn-quick-add">Quick Add</button>
                </div>
              </div>
              <div onclick="window.location.href='product.html?id=\${p.id}'" style="cursor:pointer;">
                <h3>\${p.name}</h3>
                <p class="price">&#8377;\${p.price.toFixed(2)}</p>
              </div>
            </div>`;

if (appContent.includes('<div class="p-card">')) {
    appContent = appContent.replace(oldCardHTML, newCardHTML);
    fs.writeFileSync(appPath, appContent, 'utf8');
    console.log("Updated app.js with interactive product cards");
}

// 2. Add CSS to style.css
const stylePath = path.join(__dirname, 'style.css');
const cssToAdd = `
/* --- Interactive Product Cards --- */
.quick-add-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  padding: 15px;
  background: linear-gradient(to top, rgba(0,0,0,0.4), transparent);
  transform: translateY(100%);
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  justify-content: center;
}
.p-card-img:hover .quick-add-overlay {
  transform: translateY(0);
}
.btn-quick-add {
  background: white;
  color: var(--ink);
  border: none;
  width: 100%;
  padding: 12px;
  font-family: var(--font-body);
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  font-weight: 600;
  cursor: pointer;
  border-radius: 4px;
  transition: background 0.2s, color 0.2s;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}
.btn-quick-add:hover {
  background: var(--primary);
  color: white;
}
`;

if (!fs.readFileSync(stylePath, 'utf8').includes('.quick-add-overlay')) {
    fs.appendFileSync(stylePath, cssToAdd);
    console.log("Appended product card CSS to style.css");
}
