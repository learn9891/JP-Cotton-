 $files = Get-ChildItem -Filter *.html
foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw

    # Image Replacements
    $content = $content -replace 'https://images.unsplash.com/photo-1583391733958-d15ce69c87cc\?q=80&w=\d+&auto=format&fit=crop', 'assets/product_kurta_ivory.jpg'
    $content = $content -replace 'https://images.unsplash.com/photo-1610189013289-40bc9736c533\?q=80&w=\d+&auto=format&fit=crop', 'assets/product_saree.jpg'
    $content = $content -replace 'https://images.unsplash.com/photo-1555529771-835f59fc5efe\?q=80&w=\d+&auto=format&fit=crop', 'assets/product_cotton_close.jpg'
    $content = $content -replace 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990\?q=80&w=\d+&auto=format&fit=crop', 'assets/cat_western.jpg'
    $content = $content -replace 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c\?q=80&w=\d+&auto=format&fit=crop', 'assets/cat_western.jpg'
    $content = $content -replace 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f\?q=80&w=\d+&auto=format&fit=crop', 'assets/community_1.jpg'
    $content = $content -replace 'https://images.unsplash.com/photo-1591348278863-a8bf3a0058b2\?q=80&w=\d+&auto=format&fit=crop', 'assets/cat_ethnic.jpg'
    $content = $content -replace 'https://images.unsplash.com/photo-1626248359495-926db0808b89\?q=80&w=\d+&auto=format&fit=crop', 'assets/product_kurta_ivory.jpg'
    $content = $content -replace 'https://images.unsplash.com/photo-1599839619722-39751411ea63\?q=80&w=\d+&auto=format&fit=crop', 'assets/cotton_harvest.jpg'

    # Catch-all for any remaining unsplash links
    $content = $content -replace 'https://images.unsplash.com/photo-[a-zA-Z0-9\-]+\?q=80&w=\d+&auto=format&fit=crop', 'assets/product_saree.jpg'

    # Fix product card links to point to product.html
    $content = $content -replace '<a href="#" class="p-card">', '<a href="product.html" class="p-card">'
    $content = $content -replace 'href="#" class="see-all"', 'href="product.html" class="see-all"'

    # Write back to file safely
    [IO.File]::WriteAllText($file.FullName, $content)
}
