const fs = require('fs');
const path = require('path');

const stylePath = path.join(__dirname, 'style.css');
const cssToAdd = `
/* --- Mobile Responsive Fixes (Header & Hero) --- */
@media (max-width: 900px) {
  header { 
    padding: 10px 15px !important; 
  }
  nav { 
    flex-wrap: wrap; 
    gap: 15px; 
    padding: 10px 0 !important; 
  }
  .logo { 
    order: 1; 
  }
  .icons { 
    order: 2; 
    gap: 16px !important; 
  }
  .search-bar { 
    order: 3; 
    display: flex !important; 
    width: 100%; 
    margin: 0 !important; 
    max-width: 100% !important; 
  }
  .navlinks { 
    gap: 20px !important; 
    padding: 10px 0 15px !important; 
    font-size: 11px !important; 
    letter-spacing: 0.1em !important; 
    overflow-x: auto; 
    -webkit-overflow-scrolling: touch; 
    white-space: nowrap; 
    justify-content: flex-start !important; 
    margin-bottom: 0 !important;
    border-bottom: none !important;
  }
  
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
    font-size: 36px !important; 
  }
}
@media (max-width: 480px) {
  .logo img { 
    height: 45px !important; 
    top: 0 !important;
  }
}
`;

fs.appendFileSync(stylePath, cssToAdd, 'utf8');
console.log("Appended mobile responsive fixes to style.css");
