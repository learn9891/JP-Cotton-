const fs = require('fs');
const path = require('path');

const stylePath = path.join(__dirname, 'style.css');

const cssToAdd = `
/* --- Fix Login Page Image Alignment --- */
.auth-img {
  overflow: hidden;
}
.auth-img img {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
}
`;

fs.appendFileSync(stylePath, cssToAdd, 'utf8');
console.log("Login page alignment fix applied");
