const fs = require('fs');
const path = require('path');

const stylePath = path.join(__dirname, 'style.css');
let css = fs.readFileSync(stylePath, 'utf8');

// Replace any excessive !important sizes that might break desktop
css = css.replace(/\.logo img \{\s*height: 110px !important;\s*\}/g, '.logo img { height: 75px !important; margin: 0; }');
css = css.replace(/\.logo img \{\s*height: 120px !important;\s*width: auto !important;\s*object-fit: contain !important;\s*\}/g, '');
css = css.replace(/\.logo img \{ height: 120px !important; \}/g, '');
css = css.replace(/\.logo img \{\s*height: 100px !important;\s*\}/g, '.logo img { height: 90px !important; }');
css = css.replace(/\.logo img \{\s*height: 100px !important; margin: 0 !important; top: 0 !important; \}/g, '.logo img { height: 90px !important; margin: 0 !important; top: 0 !important; }');

// We want to make sure the desktop nav handles a larger logo gracefully
// We will append a final rule for the logo sizing to ensure perfection
const finalLogoFix = `
/* --- Bulletproof Logo Sizing (Desktop & Mobile) --- */
.logo { display: flex; align-items: center; justify-content: center; }
.logo img {
  height: 85px !important; /* Perfect height for stacked logo on desktop */
  width: auto !important;
  object-fit: contain !important;
  max-width: 100%;
}

@media (max-width: 900px) {
  .logo img {
    height: 75px !important; /* Slightly smaller for mobile to not break the grid */
  }
}
`;

fs.writeFileSync(stylePath, css + finalLogoFix, 'utf8');
console.log("Desktop logo fix applied.");
