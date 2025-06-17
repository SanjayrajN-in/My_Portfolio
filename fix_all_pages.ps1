# PowerShell script to fix all HTML pages with consistent navbar structure
# This script ensures consistent navbar across all pages

$pages = Get-ChildItem -Path "pages" -Filter "*.html"

foreach ($page in $pages) {
    $content = Get-Content -Path $page.FullName -Raw
    
    # Fix indentation in header section
    $content = $content -replace '<!-- Header -->\s+<header>', '<!-- Header -->
    <header>'
    
    # Fix indentation in nav-container
    $content = $content -replace '<header>\s+<div class="nav-container">', '<header>
        <div class="nav-container">'
    
    # Ensure page transition div exists
    if (-not ($content -match '<div class="page-transition">')) {
        $content = $content -replace '<body class="dark-theme subpage">', '<body class="dark-theme subpage">
    <!-- Page Transition -->
    <div class="page-transition">
        <div class="loader"></div>
    </div>
    '
    }
    
    # Fix any missing backticks in Font Awesome styles
    $content = $content -replace 'style\.textContent = \s+\.fas', 'style.textContent = `
                    .fas'
    
    # Fix any missing closing backtick
    $content = $content -replace '\.fab\.fa-instagram:before \{ content: "\\f16d"; \}\s+;', '.fab.fa-instagram:before { content: "\\f16d"; }
                `;'
    
    # Save the updated content
    Set-Content -Path $page.FullName -Value $content -NoNewline
    Write-Host "Fixed $($page.Name) successfully."
}

# Fix index.html as well
$indexPath = "index.html"
if (Test-Path $indexPath) {
    $content = Get-Content -Path $indexPath -Raw
    
    # Fix indentation in header section
    $content = $content -replace '<!-- Header -->\s+<header>', '<!-- Header -->
    <header>'
    
    # Fix indentation in nav-container
    $content = $content -replace '<header>\s+<div class="nav-container">', '<header>
        <div class="nav-container">'
    
    # Save the updated content
    Set-Content -Path $indexPath -Value $content -NoNewline
    Write-Host "Fixed index.html successfully."
}

Write-Host "All pages have been fixed with consistent navbar structure."