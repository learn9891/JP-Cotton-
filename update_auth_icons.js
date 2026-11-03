const fs = require('fs');
const path = require('path');

const dir = __dirname;
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

const targetHTML = '<a href="login.html"><svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></a>';
const replacementHTML = `<a href="login.html" id="auth-user-icon"><svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></a>
          <script>
            (function() {
              if (localStorage.getItem('petal_user')) {
                document.currentScript.previousElementSibling.setAttribute('href', 'profile.html');
              }
            })();
          </script>`;

let updatedCount = 0;

for (const file of files) {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  if (content.includes(targetHTML)) {
    content = content.replace(targetHTML, replacementHTML);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${file}`);
    updatedCount++;
  } else if (content.includes('id="auth-user-icon"')) {
    console.log(`Already updated ${file}`);
  } else {
    console.log(`Target not found in ${file}`);
  }
}

console.log(`Total files updated: ${updatedCount}`);
