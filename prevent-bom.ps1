# BOM CLEANER - Remove BOM from ALL HTML files
Write-Host "Removing BOM from ALL HTML files..." -ForegroundColor Yellow

Get-ChildItem -Path "c:/Users/ADMIN/OneDrive/Desktop/My portfolio" -Recurse -Filter "*.html" | ForEach-Object {
    $filePath = $_.FullName
    $fileName = $_.Name
    
    Write-Host "Checking $fileName..." -ForegroundColor Cyan
    
    $content = Get-Content $filePath -Raw -Encoding UTF8
    if ($content.StartsWith([char]0xFEFF)) {
        $cleanContent = $content.Substring(1)
        [System.IO.File]::WriteAllText($filePath, $cleanContent, [System.Text.UTF8Encoding]::new($false))
        Write-Host "✅ BOM removed from $fileName" -ForegroundColor Green
    } else {
        Write-Host "✅ No BOM in $fileName" -ForegroundColor DarkGreen
    }
}

Write-Host "ALL HTML FILES CLEANED!" -ForegroundColor Magenta