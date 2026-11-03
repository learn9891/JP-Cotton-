const fs = require('fs');
const path = require('path');

const stylePath = path.join(__dirname, 'style.css');

const cssToAdd = `
@media (max-width: 900px) {
  .journey-header h2 { font-size: 40px; }
  .journey-header p { font-size: 14px; }
}
@media (max-width: 480px) {
  .journey-header h2 { font-size: 32px; }
}
`;

fs.appendFileSync(stylePath, cssToAdd, 'utf8');
console.log("Journey mobile CSS applied.");
