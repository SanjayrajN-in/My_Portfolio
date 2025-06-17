# Clean UTF-8 Encoding Script
# Removes BOM and ensures proper UTF-8 encoding for all files

Write-Host "🧹 Cleaning file encodings..." -ForegroundColor Cyan

# Function to clean a file's encoding
function Clean-FileEncoding {
    param([string]$FilePath)
    
    if (Test-Path $FilePath) {
        try {
            $content = Get-Content $FilePath -Raw -Encoding UTF8
            $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
            [System.IO.File]::WriteAllText($FilePath, $content, $utf8NoBom)
            Write-Host "✅ Cleaned: $FilePath" -ForegroundColor Green
        }
        catch {
            Write-Host "❌ Error cleaning: $FilePath - $($_.Exception.Message)" -ForegroundColor Red
        }
    }
}

# Clean main files
$files = @(
    "index.html",
    "css/styles-clean.css",
    "js/main.js"
)

foreach ($file in $files) {
    Clean-FileEncoding $file
}

# Clean all HTML files in pages directory
Get-ChildItem "pages" -Filter "*.html" | ForEach-Object {
    Clean-FileEncoding $_.FullName
}

Write-Host "🎉 File encoding cleanup complete!" -ForegroundColor Green
Write-Host "All files are now clean UTF-8 without BOM." -ForegroundColor Yellow