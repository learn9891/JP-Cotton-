const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.sqlite');

const categories = [
  { name: "Women's Pure Cotton", link: "womens-traditional.html", parent: null },
  { name: "Cotton Kurtis", link: "womens-traditional.html", parent: "Women's Pure Cotton" },
  { name: "Traditional Suit Sets", link: "womens-traditional.html", parent: "Women's Pure Cotton" },
  { name: "Cholis", link: "womens-traditional.html", parent: "Women's Pure Cotton" },
  { name: "Salwar & Kameez", link: "womens-traditional.html", parent: "Women's Pure Cotton" },
  { name: "Cotton Kurtas", link: "womens-traditional.html", parent: "Women's Pure Cotton" },
  { name: "Kurta Sets", link: "womens-traditional.html", parent: "Women's Pure Cotton" },
  { name: "2 Piece Kurta Sets", link: "womens-traditional.html", parent: "Women's Pure Cotton" },

  { name: "Women's Breezy Cottons", link: "womens-western.html", parent: null },
  { name: "Cotton Dresses", link: "womens-western.html", parent: "Women's Breezy Cottons" },
  { name: "Casual Wear", link: "womens-western.html", parent: "Women's Breezy Cottons" },
  { name: "Festive Wear", link: "womens-western.html", parent: "Women's Breezy Cottons" },
  { name: "Gowns", link: "womens-western.html", parent: "Women's Breezy Cottons" },

  { name: "Men's Cotton Essentials", link: "mens-ethnic.html", parent: null },
  { name: "Kurtas", link: "mens-ethnic.html", parent: "Men's Cotton Essentials" },
  { name: "Bottoms", link: "mens-ethnic.html", parent: "Men's Cotton Essentials" },
  { name: "Pyjamas", link: "mens-ethnic.html", parent: "Men's Cotton Essentials" }
];

db.serialize(() => {
  db.run("DELETE FROM categories"); 
  
  const stmt = db.prepare("INSERT INTO categories (name, link, parent_category, image) VALUES (?, ?, ?, ?)");
  
  for (const cat of categories) {
    stmt.run(cat.name, cat.link, cat.parent, "assets/product_kurta_ivory.jpg");
  }
  
  stmt.finalize();
  
  console.log("Database seeded successfully with categories.");
});

db.close();
