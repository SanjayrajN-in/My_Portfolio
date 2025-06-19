# Reset Vercel Configuration Script
# This script temporarily replaces vercel.json with a minimal version for deployment

Write-Host "🔄 Resetting Vercel configuration..." -ForegroundColor Cyan

# Backup current vercel.json
if (Test-Path vercel.json) {
    Rename-Item -Path vercel.json -NewName vercel.bak.json -Force
    Write-Host "✅ Backed up current vercel.json to vercel.bak.json" -ForegroundColor Green
}

# Create minimal vercel.json
$minimalConfig = @"
{
  "version": 2,
  "functions": {
    "api/hello.js": {
      "runtime": "@vercel/node@1.15.4"
    }
  }
}
"@
Set-Content -Path vercel.json -Value $minimalConfig
Write-Host "✅ Created minimal vercel.json" -ForegroundColor Green

# Deploy with minimal configuration
Write-Host "🚀 Deploying with minimal configuration..." -ForegroundColor Yellow
$deploy = Read-Host "Ready to deploy with minimal configuration? (y/n)"

if ($deploy -eq "y") {
    vercel --prod
    
    # Restore original configuration
    $restore = Read-Host "Deployment complete. Restore original configuration? (y/n)"
    if ($restore -eq "y") {
        Remove-Item -Path vercel.json -Force
        Rename-Item -Path vercel.bak.json -NewName vercel.json
        Write-Host "✅ Restored original vercel.json" -ForegroundColor Green
    } else {
        Write-Host "Original configuration not restored. Backup is in vercel.bak.json" -ForegroundColor Yellow
    }
} else {
    # Restore original configuration without deploying
    Remove-Item -Path vercel.json -Force
    Rename-Item -Path vercel.bak.json -NewName vercel.json
    Write-Host "✅ Restored original vercel.json without deploying" -ForegroundColor Green
}

Write-Host "✅ Reset process completed" -ForegroundColor Green