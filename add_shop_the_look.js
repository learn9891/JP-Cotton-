const fs = require('fs');
const path = require('path');

// 1. Add CSS to style.css
const cssToAdd = `
/* --- Shop The Look Section --- */
.shop-the-look {
  position: relative;
  width: 100%;
  max-width: 800px;
  margin: 0 auto 60px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(0,0,0,0.08);
}
.shop-the-look img {
  width: 100%;
  display: block;
  object-fit: cover;
  max-height: 800px;
}
.hotspot {
  position: absolute;
  width: 24px;
  height: 24px;
  background: white;
  border-radius: 50%;
  cursor: pointer;
  transform: translate(-50%, -50%);
  box-shadow: 0 0 0 0 rgba(255,255,255,0.7);
  animation: pulseWhite 2s infinite;
}
.hotspot::after {
  content: '';
  position: absolute;
  top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  width: 8px; height: 8px;
  background: var(--primary);
  border-radius: 50%;
}
.hotspot-tooltip {
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%) translateY(10px);
  background: white;
  padding: 12px 16px;
  border-radius: 8px;
  width: max-content;
  box-shadow: 0 10px 30px rgba(0,0,0,0.15);
  opacity: 0;
  visibility: hidden;
  transition: all 0.3s ease;
  z-index: 10;
  text-align: center;
  margin-bottom: 15px;
}
.hotspot:hover .hotspot-tooltip {
  opacity: 1;
  visibility: visible;
  transform: translateX(-50%) translateY(0);
}
.hotspot-tooltip::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border-width: 8px;
  border-style: solid;
  border-color: white transparent transparent transparent;
}
.hotspot-tooltip h4 {
  font-family: var(--font-body);
  font-size: 14px;
  color: var(--ink);
  margin-bottom: 4px;
}
.hotspot-tooltip p {
  color: var(--primary);
  font-weight: 600;
  font-size: 13px;
  margin-bottom: 8px;
}
.hotspot-tooltip a {
  display: inline-block;
  padding: 6px 12px;
  background: var(--primary);
  color: white;
  font-size: 12px;
  border-radius: 4px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  text-decoration: none;
}
.hotspot-tooltip a:hover {
  background: var(--primary-hover);
}
@keyframes pulseWhite {
  0% { box-shadow: 0 0 0 0 rgba(255,255,255,0.7); }
  70% { box-shadow: 0 0 0 15px rgba(255,255,255,0); }
  100% { box-shadow: 0 0 0 0 rgba(255,255,255,0); }
}
`;

const stylePath = path.join(__dirname, 'style.css');
if (!fs.readFileSync(stylePath, 'utf8').includes('.shop-the-look')) {
    fs.appendFileSync(stylePath, cssToAdd);
    console.log("Appended CSS to style.css");
}

// 2. Add HTML to index.html
const htmlToAdd = `  <!-- Shop the Look -->
  <section class="section reveal">
    <div class="wrap">
      <div class="section-head" style="text-align:center; flex-direction:column; align-items:center;">
        <h2 style="font-family: var(--font-display); font-size:40px; color:var(--primary); font-style:italic;">Shop The Look</h2>
        <p style="color: var(--ink-soft); margin-top: 12px; font-size: 16px;">Hover over the pulsing dots to shop the items in this outfit.</p>
      </div>
      <div class="shop-the-look">
        <img src="assets/product_kurta_ivory.jpg" alt="Model wearing Ivory Kurta">
        
        <!-- Hotspot 1 (Kurta) -->
        <div class="hotspot" style="top: 40%; left: 45%;">
          <div class="hotspot-tooltip">
            <h4>Ivory Pure Cotton Kurta</h4>
            <p>₹1,899</p>
            <a href="product.html">Shop Now</a>
          </div>
        </div>

        <!-- Hotspot 2 (Bottoms) -->
        <div class="hotspot" style="top: 75%; left: 55%;">
          <div class="hotspot-tooltip">
            <h4>Straight Cotton Trousers</h4>
            <p>₹1,299</p>
            <a href="product.html">Shop Now</a>
          </div>
        </div>
      </div>
    </div>
  </section>

`;

const indexPath = path.join(__dirname, 'index.html');
let indexContent = fs.readFileSync(indexPath, 'utf8');

if (!indexContent.includes('<!-- Shop the Look -->')) {
    indexContent = indexContent.replace('<!-- New Arrivals Grid -->', htmlToAdd + '  <!-- New Arrivals Grid -->');
    fs.writeFileSync(indexPath, indexContent, 'utf8');
    console.log("Injected Shop The Look into index.html");
} else {
    console.log("Shop The Look already exists in index.html");
}
