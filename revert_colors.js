const fs = require('fs');
const path = require('path');

const stylePath = path.join(__dirname, 'style.css');
let css = fs.readFileSync(stylePath, 'utf8');

// Replace the muted grey-browns and ivory with the original rich terracotta/brown variables
// #FAF8F5 -> var(--bg) or white (it was used as a background)
css = css.replace(/#FAF8F5/gi, 'white'); // Let's use clean white for cards/forms as it was before
css = css.replace(/background: white !important;/gi, 'background: white;'); // clean up

// #3A3532 -> var(--indigo-d) (the rich dark brown)
css = css.replace(/#3A3532/gi, 'var(--indigo-d)');

// #70655B -> var(--ink-soft)
css = css.replace(/#70655B/gi, 'var(--ink-soft)');

// rgba(58, 53, 50, ...) -> the original dark color is --ink or --indigo-d. 58, 53, 50 is #3A3532.
// We can just leave the rgba for shadows as they are just dark transparent colors.

// For the login page gradient overlay:
css = css.replace(/rgba\(58, 53, 50,/gi, 'rgba(44, 38, 35,'); // 2C2623 is --ink

fs.writeFileSync(stylePath, css, 'utf8');
console.log("Colors reverted to original theme variables.");
