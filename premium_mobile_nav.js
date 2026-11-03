const fs = require('fs');
const path = require('path');

const dir = __dirname;
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

const premiumHeaderHTML = `<header id="main-header">
    <div class="wrap">
      <nav>
        <div class="menu-toggle" onclick="document.getElementById('mobile-menu').classList.add('active')">
          <svg viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" fill="none"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
        </div>
        <div class="logo"><a href="index.html"><img src="assets/logo.png" alt="JP Cotton"></a></div>
        <div class="search-bar">
          <svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input type="text" placeholder="Search for heritage pieces, pure cotton, sarees..." class="global-search">
        </div>
        <div class="icons">
          <a href="favorites.html"><svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z"/></svg></a>
          <a href="cart.html">
            <svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6"/></svg>
            <span class="cart-badge" id="cart-badge">0</span>
          </a>
          <a href="login.html" id="auth-user-icon"><svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></a>
          <script>
            (function() {
              if (localStorage.getItem('petal_user')) {
                document.getElementById('auth-user-icon').setAttribute('href', 'profile.html');
              }
            })();
          </script>
        </div>
      </nav>
      <div class="navlinks desktop-only">
        <div class="nav-item">
          <a href="womens-traditional.html">Women's Pure Cotton</a>
          <div class="dropdown">
            <a href="womens-traditional.html">Cotton Kurtis</a>
            <a href="womens-traditional.html">Traditional Suit Sets</a>
          </div>
        </div>
        <div class="nav-item">
          <a href="womens-western.html">Women's Breezy Cottons</a>
          <div class="dropdown">
            <a href="womens-western.html">Cotton Dresses</a>
            <a href="womens-western.html">Casual Wear</a>
          </div>
        </div>
        <div class="nav-item">
          <a href="mens-ethnic.html">Men's Cotton Essentials</a>
          <div class="dropdown">
            <a href="mens-ethnic.html">Casual Shirts</a>
            <a href="mens-ethnic.html">Kurtas</a>
          </div>
        </div>
        <div class="nav-item">
          <a href="our-cotton.html">Our Story</a>
        </div>
        <div class="nav-item"><a href="contact.html">Contact Us</a></div>
      </div>
    </div>
    
    <!-- Premium Mobile Slide-Out Menu -->
    <div class="mobile-menu-overlay" id="mobile-menu-overlay" onclick="document.getElementById('mobile-menu').classList.remove('active'); this.classList.remove('active');"></div>
    <div class="mobile-menu" id="mobile-menu">
      <div class="mobile-menu-close" onclick="document.getElementById('mobile-menu').classList.remove('active'); document.getElementById('mobile-menu-overlay').classList.remove('active');">
        <svg viewBox="0 0 24 24" width="32" height="32" stroke="currentColor" stroke-width="1.5" fill="none"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </div>
      <div class="mobile-navlinks">
        <a href="womens-traditional.html">Women's Pure Cotton</a>
        <a href="womens-western.html">Women's Breezy Cottons</a>
        <a href="mens-ethnic.html">Men's Cotton Essentials</a>
        <a href="our-cotton.html">Our Story</a>
        <a href="contact.html">Contact Us</a>
      </div>
    </div>
  </header>`;

files.forEach(file => {
    if(file === 'admin.html') return; // skip admin
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace everything between <header id="main-header"> and </header>
    const regex = /<header id="main-header">[\s\S]*?<\/header>/;
    if (regex.test(content)) {
        const updatedContent = content.replace(regex, premiumHeaderHTML);
        fs.writeFileSync(filePath, updatedContent, 'utf8');
        console.log('Injected premium mobile nav into ' + file);
    }
});

// Update style.css
const stylePath = path.join(dir, 'style.css');
let css = fs.readFileSync(stylePath, 'utf8');

const marker = '/* --- Mobile Responsive Fixes (Header & Hero) --- */';
if (css.includes(marker)) {
    css = css.substring(0, css.indexOf(marker));
}

const premiumMobileCSS = `
/* --- Mobile Responsive Fixes (Header & Hero) --- */
.menu-toggle { display: none; cursor: pointer; color: #70655B; }
.menu-toggle svg { width: 28px; height: 28px; }

/* Mobile Menu Styles */
.mobile-menu-overlay {
  position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
  background: rgba(0,0,0,0.5); z-index: 999;
  opacity: 0; visibility: hidden; transition: opacity 0.3s;
}
.mobile-menu-overlay.active { opacity: 1; visibility: visible; }

.mobile-menu {
  position: fixed; top: 0; left: -100%; width: 85%; max-width: 380px; height: 100vh;
  background: #FAF8F5; z-index: 1000; box-shadow: 20px 0 50px rgba(0,0,0,0.2);
  transition: left 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  display: flex; flex-direction: column; padding: 60px 40px;
}
.mobile-menu.active { left: 0; }
.mobile-menu-close { position: absolute; top: 20px; right: 20px; cursor: pointer; color: #3A3532; transition: transform 0.3s; }
.mobile-menu-close:hover { transform: rotate(90deg); }
.mobile-navlinks { margin-top: 20px; }
.mobile-navlinks a { 
  display: block; font-family: var(--font-body); font-size: 16px; font-weight: 500; 
  letter-spacing: 0.1em; text-transform: uppercase; color: #3A3532; text-decoration: none; 
  padding: 18px 0; border-bottom: 1px solid rgba(0,0,0,0.05); transition: opacity 0.3s, transform 0.3s;
}
.mobile-navlinks a:hover { opacity: 0.6; padding-left: 5px; }

@media (min-width: 901px) {
  .desktop-only { display: flex !important; }
}

@media (max-width: 900px) {
  header { padding: 15px 20px !important; }
  .desktop-only { display: none !important; }
  
  nav { 
    display: grid !important;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
    padding: 0 !important;
  }
  
  .menu-toggle { display: block; grid-column: 1; }
  .logo { grid-column: 2; display: flex; justify-content: center; }
  .logo img { height: 40px !important; margin: 0 !important; top: 0 !important; }
  .icons { grid-column: 3; justify-content: flex-end; gap: 16px !important; }
  .search-bar { grid-column: 1 / -1; width: 100%; max-width: 100%; margin: 15px 0 0 0 !important; }
  
  .hero-split { height: auto !important; min-height: auto !important; }
  .hero-split-text { padding: 40px 20px !important; }
  .hero-split-slider { height: 50vh !important; min-height: 350px !important; }
  .hero-split-content h1 { font-size: 32px !important; }
}
`;

fs.writeFileSync(stylePath, css + premiumMobileCSS, 'utf8');
console.log("Premium mobile CSS applied");
