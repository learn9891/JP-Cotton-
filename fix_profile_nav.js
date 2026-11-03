const fs = require('fs');
const path = require('path');

const stylePath = path.join(__dirname, 'style.css');

const cssToAdd = `
/* --- Fix Profile Nav Mobile Layout --- */
@media (max-width: 900px) {
  /* This prevents the global 'nav' grid rule from breaking the profile sidebar nav */
  .profile-nav {
    display: block !important;
    padding: 10px 0 !important;
  }
  .profile-nav h4 {
    display: block !important;
    margin-top: 24px !important;
  }
  .profile-nav ul {
    display: block !important;
    padding-left: 0 !important;
  }
  .profile-nav ul li {
    display: block !important;
  }
}
`;

fs.appendFileSync(stylePath, cssToAdd, 'utf8');
console.log("Profile mobile nav fix applied.");
