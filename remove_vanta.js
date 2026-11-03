const fs = require('fs');
const path = require('path');

const dir = __dirname;
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

const vantaScriptRegex = /<!-- Vanta\.js Header Background -->[\s\S]*?VANTA\.CLOUDS[\s\S]*?<\/script>/i;

let updatedCount = 0;

files.forEach(file => {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    if (vantaScriptRegex.test(content)) {
        content = content.replace(vantaScriptRegex, '');
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Removed Vanta from ' + file);
        updatedCount++;
    } else {
        console.log('No Vanta script found in ' + file);
    }
});

console.log(`Successfully removed Vanta from ${updatedCount} files.`);
