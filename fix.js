const fs = require('fs');
const files = fs.readdirSync('.').filter(f => f.endsWith('.html'));
files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  
  // Fix stars
  content = content.replace(/<div class="t-stars">.*?<\/div>/g, '<div class="t-stars">&#9733; &#9733; &#9733; &#9733; &#9733;<\/div>');
  
  // Fix Author em-dash 
  content = content.replace(/<div class="t-author">.*?([A-Z]+ [A-Z]\., VERIFIED BUYER)<\/div>/g, '<div class="t-author">&mdash; <\/div>');
  
  // Fix quote em-dash 
  content = content.replace(/kurta.*?true to size/g, 'kurta &mdash; true to size');

  // Fix Price Rupee
  content = content.replace(/class="price">.*?(\d+,\d+)<\/div>/g, 'class="price">&#8377;<\/div>');
  content = content.replace(/class="si-price">.*?(\d+,\d+)<\/div>/g, 'class="si-price">&#8377;<\/div>');
  content = content.replace(/class="pdp-price">.*?(\d+,\d+)<\/div>/g, 'class="pdp-price">&#8377;<\/div>');
  content = content.replace(/Add to Cart.*?(\d+,\d+)<\/a>/g, 'Add to Cart &mdash; &#8377;<\/a>');

  fs.writeFileSync(f, content, 'utf8');
});
console.log('Fixed encoding issues');
