$pages = Get-ChildItem -Path "pages" -Filter "*.html"

foreach ($page in $pages) {
    $content = Get-Content -Path $page.FullName -Raw
    
    # Add page transition element
    if ($content -match '<body class="dark-theme">\s*<!-- Particle Background -->') {
        $content = $content -replace '<body class="dark-theme">\s*<!-- Particle Background -->', '<body class="dark-theme">' + "`n" + '    <!-- Page Transition -->' + "`n" + '    <div class="page-transition">' + "`n" + '        <div class="loader"></div>' + "`n" + '    </div>' + "`n" + '    ' + "`n" + '    <!-- Particle Background -->'
        
        # Write the updated content back to the file
        Set-Content -Path $page.FullName -Value $content
        
        Write-Host "Added page transition to $($page.Name)"
    }
}

Write-Host "All pages updated successfully!"