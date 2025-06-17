$pages = Get-ChildItem -Path "pages" -Filter "*.html"

$fontPreload = @"
    <!-- Preload critical fonts -->
    <link rel="preload" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/webfonts/fa-solid-900.woff2" as="font" type="font/woff2" crossorigin>
    <link rel="preload" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/webfonts/fa-brands-400.woff2" as="font" type="font/woff2" crossorigin>
    <link rel="preload" href="https://fonts.gstatic.com/s/rajdhani/v15/LDI2apCSOBg7S-QT7pbYF8Osc-I.woff2" as="font" type="font/woff2" crossorigin>
    <link rel="preload" href="https://fonts.gstatic.com/s/orbitron/v29/yMJMMIlzdpvBhQQL_SC3X9yhF25-T1nyGy6xpmIyXw.woff2" as="font" type="font/woff2" crossorigin>
    
"@

foreach ($page in $pages) {
    if ($page.Name -ne "about.html") {  # Skip about.html as we've already updated it
        $content = Get-Content -Path $page.FullName -Raw
        
        # Add font preloading before critical CSS
        if ($content -match '<link rel="stylesheet" href="../css/critical.css">') {
            $content = $content -replace '<link rel="stylesheet" href="../css/critical.css">', "$fontPreload<link rel=""stylesheet"" href=""../css/critical.css"">"
            
            # Write the updated content back to the file
            Set-Content -Path $page.FullName -Value $content
            
            Write-Host "Added font preloading to $($page.Name)"
        }
    }
}

Write-Host "All pages updated successfully!"