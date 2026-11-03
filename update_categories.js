const fs = require('fs');

function updateImages(file, imageArray) {
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf8');
  let index = 0;
  
  // Regex to match <img src="..." alt="..."> inside the file, but we only want to target product cards.
  // The easiest way is to match all <img src="assets/product_saree.jpg" ...> or similar since they are all using product_saree.jpg, cat_western.jpg, etc.
  // Let's just replace all <img src="assets/..." (except logo) sequentially for product cards.
  
  // Actually, let's just do a manual string replacement for the image tags sequentially.
  // A safer regex: /<img[^>]*src="assets\/(?!logo)[^"]*"[^>]*>/g
  content = content.replace(/<img[^>]*src="assets\/(?!logo)[^"]*"[^>]*>/gi, (match) => {
     // If it's the hero bg or something we might not want to replace it, but these category pages only have product images mostly.
     // Let's look for class="img-hover" or just plain <img>
     
     if (index < imageArray.length) {
         let newImg = imageArray[index];
         index++;
         // reconstruct the tag replacing the src
         return match.replace(/src="[^"]+"/, src="assets/");
     }
     return match;
  });
  
  fs.writeFileSync(file, content, 'utf8');
}

const w_trad = [
  'womens_kurti_mulmul_1787394344045.jpg', 'swatch_mulmul_1787394498344.jpg',
  'product_saree.jpg', 'product_cotton_close.jpg',
  'womens_traditional.jpg', 'swatch-silk.jpg',
  'product_saree.jpg', 'product_cotton_close.jpg'
];
updateImages('womens-traditional.html', w_trad);

const w_west = [
  'womens-cotton-dress.jpg', 'swatch-cotton-twill.jpg',
  'womens-wrap-top.jpg', 'swatch-pima-cotton.jpg',
  'womens_corset_poplin_1787394361807.jpg', 'swatch_poplin_1787394515962.jpg',
  'walnut-dress.jpg', 'swatch_raw_linen_1787311712138.jpg'
];
updateImages('womens-western.html', w_west);

const m_ethnic = [
  'mens_kurta_cambric_1787394390478.jpg', 'swatch-cotton-canvas.jpg',
  'product_kurta_ivory.jpg', 'swatch-pima-cotton.jpg',
  'mens_ethnic.jpg', 'swatch_mulmul_1787394498344.jpg',
  'mens_shirt_poplin_1787394421579.jpg', 'swatch_poplin_1787394515962.jpg'
];
updateImages('mens-ethnic.html', m_ethnic);

console.log('Categories updated!');
