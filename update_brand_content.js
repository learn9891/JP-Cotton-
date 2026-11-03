const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.sqlite');

db.serialize(() => {
    db.run("UPDATE content SET value = 'Modern Fashion. 100% Pure Cotton.' WHERE key = 'hero_title'");
    db.run("UPDATE content SET value = 'Elevate your wardrobe with our luxurious, breathable cotton collections designed for the modern lifestyle.' WHERE key = 'hero_subtitle'");
    db.run("UPDATE content SET value = 'Discover Pure Cotton' WHERE key = 'hero_button'");
    console.log("Updated brand content in DB.");
});

db.close();
