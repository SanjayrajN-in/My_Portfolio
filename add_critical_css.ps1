$pages = Get-ChildItem -Path "pages" -Filter "*.html"

foreach ($page in $pages) {
    $content = Get-Content -Path $page.FullName -Raw
    
    # Add critical CSS
    $content = $content -replace '<link rel="stylesheet" href="../css/styles.css\?v=3.0">', '<link rel="stylesheet" href="../css/critical.css">' + "`n" + '    <link rel="stylesheet" href="../css/styles.css?v=3.0">'
    
    # Write the updated content back to the file
    Set-Content -Path $page.FullName -Value $content
    
    Write-Host "Added critical CSS to $($page.Name)"
}

Write-Host "All pages updated successfully!"