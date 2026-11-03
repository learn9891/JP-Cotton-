const fs = require('fs');
const path = require('path');

const dir = __dirname;
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

const oldVantaScriptRegex = /<!-- Vanta\.js Header Background -->[\s\S]*?VANTA\.WAVES[\s\S]*?<\/script>/i;

const newVantaScript = `<!-- Vanta.js Header Background -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r134/three.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/vanta@latest/dist/vanta.clouds.min.js"></script>
  <script>
    document.addEventListener('DOMContentLoaded', () => {
      if (typeof VANTA !== 'undefined' && document.querySelector('#main-header')) {
        VANTA.CLOUDS({
          el: "#main-header",
          mouseControls: true,
          touchControls: true,
          gyroControls: false,
          minHeight: 80.00,
          minWidth: 200.00,
          backgroundColor: 0xeef1f6,
          skyColor: 0xeef1f6,
          cloudColor: 0xffffff,
          cloudShadowColor: 0xcccccc,
          sunColor: 0xeef1f6,
          sunGlareColor: 0xeef1f6,
          sunlightColor: 0xeef1f6,
          speed: 1.00
        });
      }
    });
  </script>`;

let updatedCount = 0;

files.forEach(file => {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    if (oldVantaScriptRegex.test(content)) {
        content = content.replace(oldVantaScriptRegex, newVantaScript);
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Replaced Vanta in ' + file);
        updatedCount++;
    } else {
        console.log('No Vanta script found in ' + file);
    }
});

console.log(`Successfully updated ${updatedCount} files.`);
