const fs = require('fs');
const path = require('path');

// 1. Update HTML in login.html
const loginPath = path.join(__dirname, 'login.html');
let html = fs.readFileSync(loginPath, 'utf8');

const oldImgBlock = `<div class="auth-img">
      <img src="assets/cat_western.jpg" alt="Login Image">
    </div>`;
    
const newImgBlock = `<div class="auth-img premium-auth-img">
      <img src="assets/cat_western.jpg" alt="JP Cotton Heritage" class="premium-img-scale">
      <div class="auth-img-overlay">
        <h2>Uncover the Elegance<br>of Pure Cotton.</h2>
        <p>Log in to curate your personal wardrobe of timeless heritage pieces.</p>
      </div>
    </div>`;

html = html.replace(oldImgBlock, newImgBlock);
fs.writeFileSync(loginPath, html, 'utf8');

// 2. Append Premium CSS to style.css
const stylePath = path.join(__dirname, 'style.css');
const css = `
/* --- Premium Login Redesign --- */
.auth-split {
  display: flex;
  min-height: calc(100vh - 100px);
  background: #FAF8F5;
}

.auth-img.premium-auth-img {
  flex: 1.2; /* Asymmetric layout: Image is slightly wider */
  position: relative;
  overflow: hidden;
}

.auth-img.premium-auth-img::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(58, 53, 50, 0.8) 0%, rgba(58, 53, 50, 0.2) 50%, transparent 100%);
  pointer-events: none;
}

.premium-img-scale {
  position: absolute;
  top: 0; left: 0; width: 100%; height: 100%;
  object-fit: cover;
  animation: slowZoom 20s infinite alternate linear;
}

@keyframes slowZoom {
  0% { transform: scale(1); }
  100% { transform: scale(1.1); }
}

.auth-img-overlay {
  position: absolute;
  bottom: 60px;
  left: 60px;
  right: 60px;
  z-index: 2;
  color: white;
}
.auth-img-overlay h2 {
  font-family: var(--font-display);
  font-size: 42px;
  font-weight: 300;
  line-height: 1.2;
  margin-bottom: 16px;
  text-shadow: 0 4px 20px rgba(0,0,0,0.3);
}
.auth-img-overlay p {
  font-family: var(--font-body);
  font-size: 15px;
  letter-spacing: 0.05em;
  opacity: 0.9;
  max-width: 400px;
}

.auth-form {
  flex: 1;
  background: #FAF8F5 !important; /* Match warm ivory */
  padding: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.auth-box {
  width: 100%;
  max-width: 420px;
  animation: fadeUp 1s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@keyframes fadeUp {
  0% { opacity: 0; transform: translateY(30px); }
  100% { opacity: 1; transform: translateY(0); }
}

.auth-box h1 {
  font-family: var(--font-display);
  font-size: 42px !important;
  color: #3A3532 !important;
  margin-bottom: 16px !important;
  font-weight: 400;
}

.auth-box p {
  font-size: 15px !important;
  color: #70655B !important;
  margin-bottom: 40px !important;
  line-height: 1.6;
}

/* Premium Minimalist Inputs */
.f-group label {
  font-size: 11px !important;
  letter-spacing: 0.1em !important;
  color: #70655B !important;
}

.f-group input {
  background: transparent !important;
  border: none !important;
  border-bottom: 1px solid rgba(58, 53, 50, 0.2) !important;
  border-radius: 0 !important;
  padding: 12px 0 !important;
  font-size: 16px !important;
  color: #3A3532 !important;
  transition: border-color 0.3s ease !important;
}

.f-group input:focus {
  border-bottom: 1px solid #3A3532 !important;
  box-shadow: none !important;
}

.f-group input::placeholder {
  color: rgba(112, 101, 91, 0.4);
}

.auth-links {
  margin-top: 10px;
  margin-bottom: 40px !important;
}
.auth-links a {
  color: #70655B !important;
  transition: color 0.3s;
}
.auth-links a:hover {
  color: #3A3532 !important;
}

/* Mobile Adjustments */
@media (max-width: 900px) {
  .auth-img.premium-auth-img {
    min-height: 400px;
  }
  .auth-img-overlay {
    bottom: 30px; left: 30px; right: 30px;
  }
  .auth-img-overlay h2 {
    font-size: 32px;
  }
  .auth-form {
    padding: 40px 20px;
  }
}
`;

fs.appendFileSync(stylePath, css, 'utf8');
console.log("Premium Login redesign applied.");
