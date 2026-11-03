const fs = require('fs');
const files = fs.readdirSync('.').filter(f => f.endsWith('.html'));

// Prices to cycle through
const prices = ['3,450', '2,100', '4,200', '1,950', '2,800', '5,400', '3,800'];
let priceIndex = 0;

files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  
  // Fix empty prices
  content = content.replace(/&#8377;<\/div>/g, () => {
    const p = prices[priceIndex % prices.length];
    priceIndex++;
    return '&#8377;' + p + '<\/div>';
  });
  content = content.replace(/&#8377;<\/a>/g, () => {
    return '&#8377;3,450<\/a>'; // For add to cart
  });
  
  // Fix author names specifically in index.html
  if (f === 'index.html') {
    let authorCount = 0;
    content = content.replace(/<div class="t-author">&mdash; <\/div>/g, () => {
      authorCount++;
      if (authorCount === 1) return '<div class="t-author">&mdash; ANJALI S., VERIFIED BUYER<\/div>';
      if (authorCount === 2) return '<div class="t-author">&mdash; RAHUL I., VERIFIED BUYER<\/div>';
      return '<div class="t-author">&mdash; MEHR K., VERIFIED BUYER<\/div>';
    });
  }

  fs.writeFileSync(f, content, 'utf8');
});
console.log('Fixed missing data');
