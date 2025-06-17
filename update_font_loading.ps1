$pages = Get-ChildItem -Path "pages" -Filter "*.html"

$fontLoadingScript = @"
    <!-- Backup Google Fonts loading method -->
    <script>
        // Fallback font loading
        WebFontConfig = {
            google: {
                families: ['Orbitron:400,500,700,900', 'Rajdhani:300,400,500,600,700']
            },
            timeout: 2000 // Set timeout to 2 seconds
        };
        
        (function(d) {
            var wf = d.createElement('script'), s = d.scripts[0];
            wf.src = 'https://ajax.googleapis.com/ajax/libs/webfont/1.6.26/webfont.js';
            wf.async = true;
            s.parentNode.insertBefore(wf, s);
        })(document);
    </script>
"@

$fallbackStyles = @"
    <!-- Fallback font styles -->
    <style>
        /* Ensure text is visible during font loading */
        body {
            font-family: 'Rajdhani', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
        }
        h1, h2, h3, .logo, .glitch, .hero-title {
            font-family: 'Orbitron', 'Rajdhani', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
        }
    </style>
"@

foreach ($page in $pages) {
    $content = Get-Content -Path $page.FullName -Raw
    
    # Remove any preload links for Google Fonts
    $content = $content -replace '<link rel="preload" href="https://fonts.gstatic.com/.*?woff2" as="font" type="font/woff2" crossorigin>', ''
    
    # Add font loading script after Google Fonts link
    if ($content -match '<link href="https://fonts.googleapis.com/css2\?family=Orbitron:wght@400;500;700;900&family=Rajdhani:wght@300;400;500;600;700&display=swap" rel="stylesheet">') {
        $content = $content -replace '<link href="https://fonts.googleapis.com/css2\?family=Orbitron:wght@400;500;700;900&family=Rajdhani:wght@300;400;500;600;700&display=swap" rel="stylesheet">', '<link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;700;900&family=Rajdhani:wght@300;400;500;600;700&display=swap" rel="stylesheet">' + "`n" + $fontLoadingScript
    }
    
    # Add fallback styles before </head>
    if ($content -match '</head>') {
        $content = $content -replace '</head>', $fallbackStyles + "`n" + '</head>'
    }
    
    # Write the updated content back to the file
    Set-Content -Path $page.FullName -Value $content
    
    Write-Host "Updated font loading in $($page.Name)"
}

Write-Host "All pages updated successfully!"