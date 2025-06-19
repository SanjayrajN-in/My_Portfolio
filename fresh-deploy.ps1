# Fresh Deployment Script
# This script creates a new project in a subdirectory for clean deployment

Write-Host "🌱 Starting fresh deployment process..." -ForegroundColor Cyan

# Create a fresh directory
$freshDir = "fresh-deploy"
Write-Host "Creating fresh deployment directory: $freshDir" -ForegroundColor Yellow

# Check if directory exists and remove it
if (Test-Path $freshDir) {
    Remove-Item -Path $freshDir -Recurse -Force
}

# Create new directory
New-Item -ItemType Directory -Path $freshDir | Out-Null

# Create minimal package.json
$packageJson = @"
{
  "name": "portfolio-api",
  "version": "1.0.0",
  "description": "Portfolio API",
  "main": "index.js",
  "scripts": {
    "start": "vercel dev",
    "deploy": "vercel --prod"
  },
  "dependencies": {
    "mongodb": "^4.13.0",
    "jsonwebtoken": "^9.0.0"
  }
}
"@
Set-Content -Path "$freshDir/package.json" -Value $packageJson
Write-Host "✅ Created package.json" -ForegroundColor Green

# Create minimal vercel.json
$vercelJson = @"
{
  "version": 2
}
"@
Set-Content -Path "$freshDir/vercel.json" -Value $vercelJson
Write-Host "✅ Created minimal vercel.json" -ForegroundColor Green

# Create API directory
New-Item -ItemType Directory -Path "$freshDir/api" | Out-Null

# Create a simple API endpoint
$helloApi = @"
// Simple API endpoint
module.exports = (req, res) => {
  res.status(200).json({
    message: 'Hello from Vercel Serverless Function!',
    timestamp: new Date().toISOString(),
    success: true
  });
};
"@
Set-Content -Path "$freshDir/api/hello.js" -Value $helloApi
Write-Host "✅ Created api/hello.js" -ForegroundColor Green

# Create .vercelignore
$vercelIgnore = @"
node_modules
.git
"@
Set-Content -Path "$freshDir/.vercelignore" -Value $vercelIgnore
Write-Host "✅ Created .vercelignore" -ForegroundColor Green

# Deploy from fresh directory
Write-Host "🚀 Ready to deploy from fresh directory" -ForegroundColor Cyan
$deploy = Read-Host "Do you want to deploy now? (y/n)"

if ($deploy -eq "y") {
    Write-Host "Changing to fresh directory and deploying..." -ForegroundColor Yellow
    Push-Location $freshDir
    vercel --prod
    Pop-Location
    
    Write-Host "✅ Fresh deployment completed" -ForegroundColor Green
    Write-Host "If this deployment was successful, you can gradually add more files to the $freshDir directory" -ForegroundColor Yellow
} else {
    Write-Host "Deployment cancelled" -ForegroundColor Red
    Write-Host "You can manually deploy later by running:" -ForegroundColor Yellow
    Write-Host "  cd $freshDir" -ForegroundColor Yellow
    Write-Host "  vercel --prod" -ForegroundColor Yellow
}