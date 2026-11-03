const fs = require('fs');
const path = require('path');

const stylePath = path.join(__dirname, 'style.css');

const premiumCSS = `
/* =========================================================================
   PREMIUM EVERYTHING - OVERHAUL FOR PRODUCT, CART, CHECKOUT, CATEGORIES
   ========================================================================= */

/* --- 1. Product Details Page (PDP) --- */
.pdp-split {
  gap: 80px !important;
  margin-top: 40px;
  align-items: start;
}
.pdp-gallery img {
  border-radius: 8px;
  box-shadow: 0 20px 60px rgba(58, 53, 50, 0.08);
  width: 100%;
}
.pdp-info {
  padding-top: 20px;
}
.pdp-info h1 {
  font-family: var(--font-display);
  font-size: 52px !important;
  color: #3A3532;
  margin-bottom: 20px !important;
  line-height: 1.1;
  letter-spacing: -0.02em;
}
.pdp-info .price {
  font-size: 28px !important;
  color: var(--primary) !important;
  margin-bottom: 40px !important;
  font-weight: 400;
}
.pdp-info p {
  color: #70655B;
  font-size: 16px;
  line-height: 1.8;
  margin-bottom: 40px;
}
.pdp-info .btn-primary {
  width: 100%;
  padding: 20px 24px !important;
  font-size: 16px !important;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  border-radius: 4px;
}

/* --- 2. Customer Reviews --- */
#review-form input, 
#review-form select, 
#review-form textarea {
  background: transparent !important;
  border: none !important;
  border-bottom: 1px solid rgba(58, 53, 50, 0.2) !important;
  border-radius: 0 !important;
  font-size: 16px !important;
  padding: 16px 0 !important;
  font-family: var(--font-body);
}
#review-form input:focus, 
#review-form select:focus, 
#review-form textarea:focus {
  border-bottom: 1px solid #3A3532 !important;
  outline: none;
}
.review-item {
  border-bottom: 1px solid rgba(58, 53, 50, 0.08) !important;
  padding-bottom: 30px !important;
  margin-bottom: 30px !important;
}
.review-item strong {
  font-family: var(--font-display);
  font-size: 20px;
  font-weight: 400;
  color: #3A3532;
}

/* --- 3. Shopping Cart --- */
.cart-container {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 80px;
  align-items: start;
  margin-top: 60px;
  margin-bottom: 120px;
}
.cart-empty {
  text-align: center;
  padding: 100px 20px;
  background: var(--bg);
  border-radius: 12px;
}
.cart-items {
  display: flex;
  flex-direction: column;
  gap: 40px;
}
.cart-item {
  display: flex;
  gap: 40px;
  padding-bottom: 40px;
  border-bottom: 1px solid rgba(58, 53, 50, 0.08);
}
.cart-item img {
  width: 140px !important;
  height: 180px !important;
  object-fit: cover;
  border-radius: 8px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.05);
}
.cart-item-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.cart-item-details h3 {
  font-family: var(--font-display);
  font-size: 24px;
  margin-bottom: 16px;
  color: #3A3532;
  font-weight: 400;
}
.cart-item-details .price {
  font-size: 18px;
  color: var(--primary);
  margin-bottom: 30px;
}
.qty-selector {
  border: 1px solid rgba(58, 53, 50, 0.2);
  border-radius: 4px;
  overflow: hidden;
  display: inline-flex;
}
.qty-selector button {
  background: transparent;
  color: #3A3532;
  border: none;
  padding: 10px 15px;
  cursor: pointer;
}
.qty-selector input {
  width: 40px;
  text-align: center;
  border: none;
  background: transparent;
  font-family: var(--font-body);
}

.cart-summary, .c-box {
  background: #FAF8F5 !important;
  padding: 50px !important;
  border-radius: 12px !important;
  border: none !important;
  box-shadow: 0 20px 50px rgba(58, 53, 50, 0.05) !important;
}
.summary-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 24px;
  color: #70655B;
  font-size: 16px;
}
.summary-total, .total-row {
  display: flex;
  justify-content: space-between;
  margin-top: 30px;
  padding-top: 30px;
  border-top: 1px dashed rgba(58, 53, 50, 0.2);
  font-family: var(--font-display);
  font-size: 28px !important;
  color: #3A3532 !important;
  font-weight: 400 !important;
}

/* --- 4. Checkout --- */
.checkout-layout {
  display: grid;
  grid-template-columns: 1fr 450px;
  gap: 80px;
  margin-top: 60px;
  margin-bottom: 120px;
}
.c-box h2, .profile-card h3 {
  font-family: var(--font-display);
  font-size: 32px;
  margin-bottom: 40px;
  color: #3A3532;
  font-weight: 400;
}

/* Luxury Input Fields Globally */
.c-box input[type="text"],
.c-box input[type="email"],
.c-box select {
  background: transparent !important;
  border: none !important;
  border-bottom: 1px solid rgba(58, 53, 50, 0.2) !important;
  border-radius: 0 !important;
  font-size: 16px !important;
  padding: 16px 0 !important;
  font-family: var(--font-body);
  width: 100%;
}
.c-box input:focus, .c-box select:focus {
  border-bottom: 1px solid #3A3532 !important;
  outline: none;
}
.c-box label {
  font-size: 11px !important;
  letter-spacing: 0.1em;
  color: #70655B;
  text-transform: uppercase;
}

/* --- 5. Category Headers (Women's, Men's) --- */
.hero-content h1 {
  font-family: var(--font-display);
  font-size: 56px !important;
  color: #3A3532;
  margin-bottom: 24px;
  letter-spacing: -0.02em;
}
.hero-content p {
  font-size: 18px !important;
  color: #70655B;
  max-width: 600px;
  margin: 0 auto 40px;
  line-height: 1.6;
}

/* Mobile Overrides */
@media (max-width: 900px) {
  .cart-container { grid-template-columns: 1fr; gap: 40px; }
  .checkout-layout { grid-template-columns: 1fr; gap: 40px; }
  .pdp-split { flex-direction: column !important; gap: 40px !important; }
  .cart-item { gap: 20px; }
  .cart-item img { width: 100px !important; height: 130px !important; }
  .cart-summary, .c-box { padding: 30px 20px !important; }
  .pdp-info h1 { font-size: 36px !important; }
}
`;

fs.appendFileSync(stylePath, premiumCSS, 'utf8');
console.log("Premium everything CSS applied.");
