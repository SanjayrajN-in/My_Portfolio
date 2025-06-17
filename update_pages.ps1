$pages = Get-ChildItem -Path "pages" -Filter "*.html"

foreach ($page in $pages) {
    $content = Get-Content -Path $page.FullName -Raw
    
    # Fix DOCTYPE
    $content = $content -replace "DOCTYPE html>", "<!DOCTYPE html>"
    
    # Remove inline styles and navigation.css
    $content = $content -replace '<link rel="stylesheet" href="../css/navigation.css">[\s\S]*?</style>', ''
    
    # Update styles.css link
    $content = $content -replace '<link rel="stylesheet" href="../css/styles.css">', '<link rel="stylesheet" href="../css/styles.css?v=3.0">'
    
    # Write the updated content back to the file
    Set-Content -Path $page.FullName -Value $content
    
    Write-Host "Updated $($page.Name)"
}

Write-Host "All pages updated successfully!"