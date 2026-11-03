const fs = require('fs');
const path = require('path');

const stylePath = path.join(__dirname, 'style.css');
let css = fs.readFileSync(stylePath, 'utf8');

// We will append a more robust grid-based mobile nav fix
// First, strip out the old fix if it exists to prevent conflicts
const marker = '/* --- Mobile Responsive Fixes (Header & Hero) --- */';
if (css.includes(marker)) {
    css = css.substring(0, css.indexOf(marker));
}

const newMobileCss = `
/* --- Mobile Responsive Fixes (Header & Hero) --- */
@media (max-width: 900px) {
  header { 
    padding: 10px 15px !important; 
  }
  nav { 
    display: grid !important;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
    padding: 5px 0 !important;
    gap: 10px;
  }
  .logo { 
    grid-column: 2;
    display: flex;
    justify-content: center;
  }
  .logo img { 
    height: 40px !important; 
    top: 0 !important;
    margin: 0 !important;
  }
  .icons { 
    grid-column: 3;
    display: flex !important;
    justify-content: flex-end !important;
    gap: 15px !important; 
  }
  .icons svg {
    width: 20px !important;
    height: 20px !important;
  }
  .search-bar { 
    grid-column: 1 / -1; /* Span full width on the next row */
    display: flex !important; 
    width: 100% !important; 
    margin: 10px 0 0 0 !important; 
    max-width: 100% !important; 
    padding: 10px 15px !important;
    box-sizing: border-box;
  }
  
  /* Fix navlinks wrapping and spacing */
  .navlinks { 
    display: flex !important;
    flex-wrap: wrap !important;
    justify-content: center !important;
    gap: 12px 20px !important; 
    padding: 15px 0 10px !important; 
    font-size: 11px !important; 
    letter-spacing: 0.05em !important; 
    white-space: normal !important;
    overflow: hidden !important; 
    margin-bottom: 0 !important;
  }
  .nav-item {
    padding-bottom: 0 !important;
    margin-bottom: 0 !important;
  }
  
  /* Disable hover dropdowns on mobile to stop screen stretching/overlapping */
  .dropdown { 
    display: none !important; 
  }

  /* Fix split hero overlap */
  .hero-split { 
    height: auto !important; 
    min-height: auto !important; 
  }
  .hero-split-text { 
    padding: 40px 20px !important; 
  }
  .hero-split-slider { 
    height: 50vh !important; 
    min-height: 350px !important; 
  }
  .hero-split-content h1 { 
    font-size: 32px !important; 
  }
}

@media (max-width: 480px) {
  .logo img { 
    height: 35px !important; 
  }
  .icons {
    gap: 10px !important;
  }
}
`;

fs.writeFileSync(stylePath, css + newMobileCss, 'utf8');
console.log("Bulletproof mobile nav CSS applied");
