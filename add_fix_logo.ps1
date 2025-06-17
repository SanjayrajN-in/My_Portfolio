$pages = Get-ChildItem -Path "pages" -Filter "*.html"

foreach ($page in $pages) {
    $content = Get-Content -Path $page.FullName -Raw
    
    # Add fix-logo.css
    if ($content -match '<link rel="stylesheet" href="../css/styles.css\?v=3.0">') {
        $content = $content -replace '<link rel="stylesheet" href="../css/styles.css\?v=3.0">', '<link rel="stylesheet" href="../css/styles.css?v=3.0">' + "`n" + '    <link rel="stylesheet" href="../css/fix-logo.css">'
        
        # Write the updated content back to the file
        Set-Content -Path $page.FullName -Value $content
        
        Write-Host "Added fix-logo.css to $($page.Name)"
    }
}

Write-Host "All pages updated successfully!"