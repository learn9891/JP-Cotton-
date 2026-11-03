const fs = require('fs');
const path = require('path');

const dir = __dirname;
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

const newNavlinks = `<div class="navlinks">
        <div class="nav-item">
          <a href="womens-traditional.html">Women's Traditional</a>
          <div class="dropdown">
            <a href="womens-traditional.html">Kurtis</a>
            <a href="womens-traditional.html">Suit Sets</a>
            <div class="nested-group">
              <a href="javascript:void(0)" onclick="this.parentElement.classList.toggle('open');">Cholis</a>
              <div class="nested-content">
                <a href="womens-traditional.html">Salwar &amp; Kameez</a>
                <a href="womens-traditional.html">Kurtas</a>
                <a href="womens-traditional.html">Kurta Sets</a>
                <a href="womens-traditional.html">2 Piece Kurta Sets</a>
              </div>
            </div>
          </div>
        </div>
        <div class="nav-item">
          <a href="womens-western.html">Women's Western</a>
          <div class="dropdown">
            <div class="nested-group">
              <a href="javascript:void(0)" onclick="this.parentElement.classList.toggle('open');">Dresses</a>
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
          <a href="mens-ethnic.html">Men's Wear</a>
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
          <a href="our-cotton.html">Cotton Cloth</a>
          <div class="dropdown">
            <a href="#">Coming Soon</a>
          </div>
        </div>
        <div class="nav-item"><a href="our-cotton.html">Our Story</a></div>
        <div class="nav-item"><a href="contact.html">Contact Us</a></div>
      </div>`;

files.forEach(file => {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Use regex to find <div class="navlinks">...</div> up to the closing header
    const regex = /<div class="navlinks">[\s\S]*?<\/div>\s*<\/div>\s*<\/header>/;
    const match = content.match(regex);
    
    if (match) {
        const replacement = newNavlinks + '\n    </div>\n  </header>';
        const updatedContent = content.replace(regex, replacement);
        fs.writeFileSync(filePath, updatedContent, 'utf8');
        console.log('Updated ' + file);
    } else {
        console.log('No match in ' + file);
    }
});
