const fs = require('fs');
const path = require('path');

const stylePath = path.join(__dirname, 'style.css');
let css = fs.readFileSync(stylePath, 'utf8');

// The stacked logo (graphic + text) needs a much larger height to be readable on mobile
css = css.replace(/@media \(max-width: 900px\) \{\s*\.logo img \{\s*height: 75px !important;\s*\}\s*\}/g, 
`@media (max-width: 900px) {
  .logo img {
    height: 100px !important;
  }
}`);

css = css.replace(/@media \(max-width: 480px\) \{\s*\.logo img \{\s*height: 65px !important;\s*\}\s*\}/g, 
`@media (max-width: 480px) {
  .logo img {
    height: 90px !important;
  }
}`);

// Also clean up any stray 75px that might conflict
css = css.replace(/\.logo img \{ height: 75px !important; margin: 0 !important; top: 0 !important; \}/g, '.logo img { height: 100px !important; margin: 0 !important; top: 0 !important; }');

fs.writeFileSync(stylePath, css, 'utf8');
console.log("Mobile logo size increased.");
