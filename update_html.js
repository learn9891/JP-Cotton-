const fs = require('fs');
const pages = [
  { file: 'womens-traditional.html', category: "Women's Traditional" },
  { file: 'womens-western.html', category: "Women's Western" },
  { file: 'mens-ethnic.html', category: "Men's Ethnic" }
];

pages.forEach(p => {
  let html = fs.readFileSync(p.file, 'utf8');
  
  const startStr = '<div class="product-grid">';
  const endStr = '</section>';
  
  const startIdx = html.indexOf(startStr);
  if (startIdx === -1) return;
  
  const endIdx = html.indexOf(endStr, startIdx);
  
  const before = html.substring(0, startIdx);
  const after = html.substring(endIdx);
  
  const newGrid = `<div class="product-grid" id="dynamic-products" data-category="${p.category}">
          <!-- Products will be injected here by app.js -->
          <p style="grid-column: span 12; text-align: center; color: #888; padding: 100px 0;">Loading collection...</p>
        </div>
      </div>
    `;
      
  fs.writeFileSync(p.file, before + newGrid + after, 'utf8');
});
console.log('Category pages updated');
