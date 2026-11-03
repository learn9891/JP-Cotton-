const fs = require('fs');
const path = require('path');

const stylePath = path.join(__dirname, 'style.css');

const cssToAdd = `
/* --- Fix Login Mobile Layout --- */
@media (max-width: 900px) {
  .auth-split {
    flex-direction: column !important;
    height: auto !important;
    min-height: auto !important;
  }
  .auth-img.premium-auth-img {
    width: 100% !important;
    height: 450px !important; /* Fixed height so image never breaks */
    flex: none !important;
  }
  .auth-form {
    width: 100% !important;
    flex: none !important;
    padding: 50px 20px !important;
    height: auto !important;
  }
}

@media (max-width: 480px) {
  .auth-img.premium-auth-img {
    height: 350px !important;
  }
}
`;

fs.appendFileSync(stylePath, cssToAdd, 'utf8');
console.log("Login mobile layout fix applied.");
