const fs = require('fs');
const files = [
  'cart.html', 'checkout.html', 'index.html', 'login.html', 'mens-ethnic.html',
  'order-success.html', 'our-cotton.html', 'product.html', 'wishlist.html',
  'womens-traditional.html', 'womens-western.html'
];

files.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    // Fix title dash
    content = content.replace(/<title>JP Cotton Co. [Ã¢â‚¬â€]+ Premium/g, '<title>JP Cotton Co. — Premium');
    content = content.replace(/<title>JP Cotton Co.Ã¢â‚¬â€ Premium/g, '<title>JP Cotton Co. — Premium');
    content = content.replace(/<title>JP Cotton Co.Premium/g, '<title>JP Cotton Co. — Premium');
    // Fix copyright symbol
    content = content.replace(/Ã‚Â©/g, '©');
    fs.writeFileSync(file, content, 'utf8');
  }
});
console.log('Fixed text encoding across files');
