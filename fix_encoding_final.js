const fs = require('fs');
const files = fs.readdirSync('.').filter(f => f.endsWith('.html'));

files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  
  // Fix em-dash in titles
  content = content.replace(/ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â/g, '&mdash;');
  
  // Fix Rupee symbol
  content = content.replace(/ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¹/g, '&#8377;');
  
  // Fix Copyright symbol
  content = content.replace(/Ãƒâ€šï¿½/g, '&copy;');
  
  fs.writeFileSync(f, content, 'utf8');
});

console.log('Fixed final encoding issues.');
