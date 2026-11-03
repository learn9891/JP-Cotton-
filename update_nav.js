const fs = require('fs');
const path = require('path');

const dir = __dirname;
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html') && f !== 'admin.html');

const oldRegex = /<div class="navlinks">[\s\S]*?<\/div>\s*<\/div>\s*<\/header>/i;

const newNav = `<div class="navlinks">
        <div class="nav-item">
          <a href="womens-traditional.html">Women's Pure Cotton</a>
          <div class="dropdown">
            <a href="womens-traditional.html">Cotton Kurtis</a>
            <a href="womens-traditional.html">Traditional Suit Sets</a>
            <div class="nested-group">
              <a href="javascript:void(0)" onclick="this.parentElement.classList.toggle('open');">Cholis</a>
              <div class="nested-content">
                <a href="womens-traditional.html">Salwar &amp; Kameez</a>
                <a href="womens-traditional.html">Cotton Kurtas</a>
                <a href="womens-traditional.html">Kurta Sets</a>
                <a href="womens-traditional.html">2 Piece Kurta Sets</a>
              </div>
            </div>
          </div>
        </div>
        <div class="nav-item">
          <a href="womens-western.html">Women's Breezy Cottons</a>
          <div class="dropdown">
            <div class="nested-group">
              <a href="javascript:void(0)" onclick="this.parentElement.classList.toggle('open');">Cotton Dresses</a>
              <div class="nested-content">
                <a href="womens-western.html">Casual Wear</a>
                <a href="womens-western.html">Festive Wear</a>
                <a href="womens-western.html">Spring Summer</a>
                <a href="womens-western.html">Office Wear</a>
              </div>
            </div>
            <a href="womens-western.html">Crop Tops</a>
            <a href="womens-western.html">Corset Tops</a>
            <a href="womens-western.html">Co-rd Sets</a>
          </div>
        </div>
        <div class="nav-item">
          <a href="mens-ethnic.html">Men's Cotton Essentials</a>
          <div class="dropdown">
            <a href="mens-ethnic.html">Casual Shirts</a>
            <a href="mens-ethnic.html">Kurtas</a>
            <a href="mens-ethnic.html">Kurta Pyjama Set</a>
            <div class="nested-group">
              <a href="javascript:void(0)" onclick="this.parentElement.classList.toggle('open');">Bottoms</a>
              <div class="nested-content">
                <a href="mens-ethnic.html">Pants</a>
                <a href="mens-ethnic.html">Pyjamas</a>
              </div>
            </div>
          </div>
        </div>
        <div class="nav-item">
          <a href="our-cotton.html">Our Story</a>
        </div>
        <div class="nav-item"><a href="contact.html">Contact Us</a></div>
      </div>
    </div>
  </header>`;

let updated = 0;
files.forEach(file => {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    if (oldRegex.test(content)) {
        content = content.replace(oldRegex, newNav);
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Updated nav in ' + file);
        updated++;
    }
});

console.log('Successfully updated nav in ' + updated + ' files.');
