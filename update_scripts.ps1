# PowerShell script to ensure all pages include the navigation.js script

$pages = Get-ChildItem -Path "pages" -Filter "*.html"

foreach ($page in $pages) {
    $content = Get-Content -Path $page.FullName -Raw
    
    # Check if navigation.js is already included
    if (-not ($content -match '<script src="../js/navigation.js"></script>')) {
        # Add navigation.js before script.js
        $content = $content -replace '<script src="../js/script.js"></script>', '<script src="../js/navigation.js"></script>
    <script src="../js/script.js"></script>'
        
        # Save the updated content
        Set-Content -Path $page.FullName -Value $content -NoNewline
        Write-Host "Added navigation.js to $($page.Name)"
    } else {
        Write-Host "$($page.Name) already includes navigation.js"
    }
}

# Check index.html as well
$indexPath = "index.html"
if (Test-Path $indexPath) {
    $content = Get-Content -Path $indexPath -Raw
    
    # Check if navigation.js is already included
    if (-not ($content -match '<script src="js/navigation.js"></script>')) {
        # Add navigation.js before script.js
        $content = $content -replace '<script src="js/script.js"></script>', '<script src="js/navigation.js"></script>
    <script src="js/script.js"></script>'
        
        # Save the updated content
        Set-Content -Path $indexPath -Value $content -NoNewline
        Write-Host "Added navigation.js to index.html"
    } else {
        Write-Host "index.html already includes navigation.js"
    }
}

Write-Host "All pages now include the navigation.js script."