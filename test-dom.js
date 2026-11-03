const fs = require('fs');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;

const html = fs.readFileSync('product.html', 'utf-8');
const dom = new JSDOM(html, { url: "http://localhost:8080/product.html?id=2" });
const window = dom.window;
const document = window.document;

const product = {
  id: 2,
  name: 'Cotton',
  category: "Women's Traditional",
  price: 2233,
  description: '',
  image: 'assets/prod_1787663956380.jpg'
};

try {
  const info = document.querySelector('.pdp-info');
  if (info) {
    info.querySelector('h1').innerText = product.name;
    info.querySelector('.pdp-price').innerHTML = `&#8377;${product.price.toFixed(2)}`;
    info.querySelector('.pdp-desc').innerText = product.description || 'Elevated everyday cotton clothing, woven close to the source.';
    
    // Update Add to cart button
    const btnContainer = info.querySelector('.add-to-cart').parentElement;
    const sizeSelector = info.querySelector('.size-selector');
    const accordion = info.querySelector('.accordion');
    
    const btnHtml = `
      <div style="display: flex; gap: 8px;">
        <button class="btn-primary">Add to Cart</button>
        <button class="btn-primary">Buy Now</button>
      </div>
    `;
    
    info.innerHTML = `
      <h1>${product.name}</h1>
      <div class="pdp-price">₹${product.price.toFixed(2)}</div>
      <p class="pdp-desc">${product.description || 'Elevated everyday cotton clothing, woven close to the source.'}</p>
      
      <div class="size-selector">
        <div class="size-header">
          <span>Select Size</span>
          <a href="#" style="text-decoration:underline;">Size Guide</a>
        </div>
        <div class="size-grid" id="dyn-size-grid">
          <button class="size-btn" data-size="XS">XS</button>
        </div>
        <div class="size-error" id="dyn-size-error">Error</div>
      </div>

      <div class="qty-selector">
        <button class="qty-btn" id="dyn-qty-dec">-</button>
        <input type="text" class="qty-input" id="dyn-qty-input" value="1">
        <button class="qty-btn" id="dyn-qty-inc">+</button>
      </div>

      ${btnHtml}
      <div class="add-confirm" id="dyn-add-confirm">Added to your cart.</div>
      ${accordion ? accordion.outerHTML : ''}
    `;

    // Attach Dynamic Event Listeners
    let selectedSize = null;
    let qty = 1;
    
    const sizeGrid = info.querySelector('#dyn-size-grid');
    const sizeError = info.querySelector('#dyn-size-error');
    console.log("Success! info.innerHTML updated.");
  }
} catch (e) {
  console.error("Crash!", e);
}
