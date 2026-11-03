const fs = require('fs');
const path = require('path');

const stylePath = path.join(__dirname, 'style.css');
let css = fs.readFileSync(stylePath, 'utf8');

// Replace the header section
const oldHeaderStart = '/* ---- Header (Sticky & Glassmorphism) ---- */';
const oldHeaderEnd = '/* ---- Search Suggestions ---- */';

const newHeader = `/* ---- Header (Minimalist E-Commerce) ---- */
header {
  position: sticky; top: 0; z-index: 100;
  background: #FAF8F5; /* Warm ivory/cream */
  border-bottom: none;
  transition: transform var(--trans-smooth);
  padding: 10px 40px; /* Generous padding */
}
header .wrap { position: relative; z-index: 2; max-width: 1400px; margin: 0 auto; }
header.hide { transform: translateY(-100%); }
nav { display: flex; align-items: center; justify-content: space-between; padding: 15px 0 25px; }
.logo a { display: block; }
.logo img { 
  height: 70px;
  width: auto; 
  object-fit: contain; 
}
.search-bar {
  flex: 1; max-width: 550px; display: flex; align-items: center; gap: 12px;
  border: 1px solid rgba(0,0,0,0.1); padding: 12px 24px; border-radius: 30px;
  background: white;
  margin: 0 40px;
}
.search-bar:focus-within { border-color: rgba(0,0,0,0.3); }
.search-bar svg { width: 18px; height: 18px; stroke: #70655B; flex-shrink: 0; }
.search-bar input { border: none; outline: none; width: 100%; background: transparent; font-family: var(--font-body); font-size: 14px; color: var(--ink); }
.search-bar input::placeholder { color: #A09A93; }

.icons { display: flex; gap: 24px; align-items: center; }
.icons a { color: #70655B; position: relative; text-decoration: none; }
.icons svg { width: 22px; height: 22px; stroke: #70655B; fill: none; stroke-width: 1.5; transition: stroke 0.3s; }
.icons a:hover svg { stroke: var(--ink); }
.cart-badge {
  position: absolute; top: -6px; right: -8px;
  background: #D32F2F; color: white; font-size: 10px; font-weight: bold;
  padding: 2px 5px; border-radius: 10px;
}

`;

if (css.includes(oldHeaderStart) && css.includes(oldHeaderEnd)) {
    const startIndex = css.indexOf(oldHeaderStart);
    const endIndex = css.indexOf(oldHeaderEnd);
    css = css.substring(0, startIndex) + newHeader + css.substring(endIndex);
}

// Replace the navlinks section
const oldNavStart = '/* ---- Navigation Links ---- */';
const oldNavEnd = '/* ---- Hero Section ---- */';

const newNav = `/* ---- Navigation Links ---- */
.navlinks { display: flex; justify-content: center; gap: 60px; padding: 0 0 10px; font-family: var(--font-body); font-size: 13px; font-weight: 500; letter-spacing: 0.15em; text-transform: uppercase; color: #3A3532; margin-bottom: 0; }
.nav-item { position: relative; padding-bottom: 20px; margin-bottom: -20px; cursor: pointer; }
.nav-item > a { color: #3A3532; transition: opacity 0.3s; text-decoration: none; }
.nav-item:hover > a { opacity: 0.6; }

.dropdown {
  position: absolute; top: 100%; left: 50%; transform: translateX(-50%) translateY(10px);
  background: #FAF8F5; padding: 16px 24px;
  min-width: 220px;
  opacity: 0; visibility: hidden; transition: all var(--trans-fast); z-index: 110;
  text-align: center;
}
.nav-item:hover .dropdown { opacity: 1; visibility: visible; transform: translateX(-50%) translateY(0); }
.dropdown a { display: block; padding: 10px 0; font-size: 12px; color: #3A3532; letter-spacing: 0.05em; text-transform: uppercase; text-decoration: none; opacity: 0.8; transition: opacity 0.2s; }
.dropdown a:hover { opacity: 1; color: var(--primary); }

/* Hide dropdown arrows */
.nested-group > a { display: block; }
.nested-group > a::after { display: none !important; }
.nested-content { max-height: 0; overflow: hidden; transition: max-height 0.4s; }
.nested-group:hover .nested-content { max-height: 250px; margin-top: 10px; }

`;

if (css.includes(oldNavStart) && css.includes(oldNavEnd)) {
    const startIndex = css.indexOf(oldNavStart);
    const endIndex = css.indexOf(oldNavEnd);
    css = css.substring(0, startIndex) + newNav + css.substring(endIndex);
}

fs.writeFileSync(stylePath, css, 'utf8');
console.log("Updated style.css with minimal nav styling");
