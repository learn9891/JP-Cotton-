const fs = require('fs');
let appJs = fs.readFileSync('dist/app.js', 'utf8');

// Replace wishlist POST
appJs = appJs.replace(/fetch\('http:\/\/localhost:3000\/api\/wishlist',\s*\{[\s\S]*?\}\)/g, "Promise.resolve({ ok: true, json: () => ({message: 'ok'}) })");

// Replace reviews POST
appJs = appJs.replace(/fetch\('http:\/\/localhost:3000\/api\/reviews',\s*\{[\s\S]*?\}\)/g, "Promise.resolve({ ok: true, json: () => ({id: 999, message: 'Review submitted!'}) })");

// Replace any remaining http://localhost:3000 references just to be safe
// like login, register, orders, addresses, payment-methods, preferences
appJs = appJs.replace(/fetch\('http:\/\/localhost:3000\/api\/login',\s*\{[\s\S]*?\}\)/g, "Promise.resolve({ ok: true, json: () => ({id: 1, first_name: 'Test', last_name: 'User', email: 'test@example.com'}) })");
appJs = appJs.replace(/fetch\('http:\/\/localhost:3000\/api\/register',\s*\{[\s\S]*?\}\)/g, "Promise.resolve({ ok: true, json: () => ({id: 1, first_name: 'Test', last_name: 'User', email: 'test@example.com'}) })");
appJs = appJs.replace(/fetch\('http:\/\/localhost:3000\/api\/orders',\s*\{[\s\S]*?\}\)/g, "Promise.resolve({ ok: true, json: () => ({id: 123, message: 'Order placed!'}) })");
appJs = appJs.replace(/fetch\('http:\/\/localhost:3000\/api\/addresses',\s*\{[\s\S]*?\}\)/g, "Promise.resolve({ ok: true, json: () => ({id: 1}) })");
appJs = appJs.replace(/fetch\('http:\/\/localhost:3000\/api\/payment-methods',\s*\{[\s\S]*?\}\)/g, "Promise.resolve({ ok: true, json: () => ({id: 1}) })");
appJs = appJs.replace(/fetch\('http:\/\/localhost:3000\/api\/preferences',\s*\{[\s\S]*?\}\)/g, "Promise.resolve({ ok: true, json: () => ({message: 'Preferences updated'}) })");
appJs = appJs.replace(/fetch\('http:\/\/localhost:3000\/api\/wishlist',\s*\{[\s\S]*?\}\)/g, "Promise.resolve({ ok: true, json: () => ({message: 'Wishlist updated'}) })");

// GET endpoints returning arrays for specific user
appJs = appJs.replace(/fetch\(`http:\/\/localhost:3000\/api\/orders\/user\/\$\{currentUser\.email\}\`\)/g, "Promise.resolve({ ok: true, json: () => [] })");
appJs = appJs.replace(/fetch\(`http:\/\/localhost:3000\/api\/addresses\/\$\{currentUser\.email\}\`\)/g, "Promise.resolve({ ok: true, json: () => [] })");
appJs = appJs.replace(/fetch\(`http:\/\/localhost:3000\/api\/payment-methods\/\$\{currentUser\.email\}\`\)/g, "Promise.resolve({ ok: true, json: () => [] })");
appJs = appJs.replace(/fetch\(`http:\/\/localhost:3000\/api\/preferences\/\$\{currentUser\.email\}\`\)/g, "Promise.resolve({ ok: true, json: () => ({order_updates: 1, promotions: 0, newsletter: 1}) })");

appJs = appJs.replace(/fetch\(`http:\/\/localhost:3000\/api\/wishlist\/\$\{currentUser\.email\}\`\)/g, "Promise.resolve({ ok: true, json: () => [] })");


fs.writeFileSync('dist/app.js', appJs);
console.log('Fixed additional endpoints');
