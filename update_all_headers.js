const fs = require('fs');
const path = require('path');

const dir = __dirname;
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

const indexContent = fs.readFileSync(path.join(dir, 'index.html'), 'utf8');
const headerMatch = indexContent.match(/<header\b[^>]*>[\s\S]*?<\/header>/i);

if (!headerMatch) {
    console.error('Could not find header in index.html');
    process.exit(1);
}

const headerContent = headerMatch[0];

let updatedCount = 0;

files.forEach(file => {
    if (file === 'index.html') return; // Skip index.html itself
    
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    const regex = /<header\b[^>]*>[\s\S]*?<\/header>/i;
    if (regex.test(content)) {
        content = content.replace(regex, headerContent);
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Updated header in ' + file);
        updatedCount++;
    } else {
        console.log('No header found in ' + file);
    }
});

console.log(`Successfully updated ${updatedCount} files.`);
