const fs = require('fs');
const path = require('path');

const dir = __dirname;
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

let updatedCount = 0;

files.forEach(file => {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Check if Vanta is present
    if (content.includes('VANTA.CLOUDS')) {
        // Update the colors
        content = content.replace(/backgroundColor: 0xeef1f6/g, 'backgroundColor: 0xF4EFE6');
        content = content.replace(/skyColor: 0xeef1f6/g, 'skyColor: 0xFDFBF7');
        content = content.replace(/cloudColor: 0xffffff/g, 'cloudColor: 0xffffff');
        content = content.replace(/cloudShadowColor: 0xcccccc/g, 'cloudShadowColor: 0xE8DCCB');
        content = content.replace(/sunColor: 0xeef1f6/g, 'sunColor: 0xFDFBF7');
        content = content.replace(/sunGlareColor: 0xeef1f6/g, 'sunGlareColor: 0xFDFBF7');
        content = content.replace(/sunlightColor: 0xeef1f6/g, 'sunlightColor: 0xFDFBF7');
        
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Updated Vanta colors in ' + file);
        updatedCount++;
    } else {
        console.log('No Vanta script found in ' + file);
    }
});

console.log(`Successfully updated ${updatedCount} files.`);
