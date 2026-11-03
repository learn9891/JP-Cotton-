const fs = require('fs');
const path = require('path');

const dir = __dirname;
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

const vantaScripts = `
  <!-- Vanta.js Header Background -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r134/three.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/vanta@latest/dist/vanta.waves.min.js"></script>
  <script>
    document.addEventListener('DOMContentLoaded', () => {
      if (typeof VANTA !== 'undefined' && document.querySelector('#main-header')) {
        VANTA.WAVES({
          el: "#main-header",
          mouseControls: true,
          touchControls: true,
          gyroControls: false,
          minHeight: 80.00,
          minWidth: 200.00,
          scale: 1.00,
          scaleMobile: 1.00,
          color: 0xeef1f6,     // Cotton cloth light color
          shininess: 15.00,    // Low shininess for fabric
          waveHeight: 12.00,   // Soft waves
          waveSpeed: 0.60,     // Gentle movement
          zoom: 1.2
        });
      }
    });
  </script>
`;

files.forEach(file => {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Add Cotton Cloth to navigation if Dress Material exists
    content = content.replace(/<a href="#">Dress Material<\/a>/g, '<a href="our-cotton.html">Cotton Cloth</a>');

    // Inject Vanta JS before </body>
    if (!content.includes('vanta.waves.min.js')) {
        content = content.replace(/<\/body>/, `${vantaScripts}\n</body>`);
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Injected Vanta into ' + file);
    }
});
