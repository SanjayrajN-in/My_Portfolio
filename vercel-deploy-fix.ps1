# Vercel Deployment Fix Script
# This script creates a temporary deployment directory with only essential files

Write-Host "🛠️ Starting Vercel deployment fix..." -ForegroundColor Cyan

# Create a temporary directory for deployment
$tempDir = "vercel-deploy-temp"
Write-Host "Creating temporary deployment directory: $tempDir" -ForegroundColor Yellow

# Check if temp directory exists and remove it
if (Test-Path $tempDir) {
    Remove-Item -Path $tempDir -Recurse -Force
}

# Create new temp directory
New-Item -ItemType Directory -Path $tempDir | Out-Null

# Create minimal vercel.json in temp directory
$vercelJson = @"
{
  "version": 2,
  "rewrites": [
    { "source": "/api/:path*", "destination": "/api/:path*" },
    { "source": "/auth/google/callback", "destination": "/auth/google/callback.html" }
  ],
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "Access-Control-Allow-Origin", "value": "https://sanjayrajn.vercel.app" },
        { "key": "Access-Control-Allow-Methods", "value": "GET, POST, PUT, DELETE, OPTIONS" },
        { "key": "Access-Control-Allow-Headers", "value": "Content-Type, Authorization, X-Requested-With, Accept, Cache-Control" },
        { "key": "Access-Control-Allow-Credentials", "value": "true" }
      ]
    }
  ]
}
"@
Set-Content -Path "$tempDir/vercel.json" -Value $vercelJson
Write-Host "✅ Created minimal vercel.json" -ForegroundColor Green

# Copy package.json
Copy-Item -Path "package.json" -Destination "$tempDir/package.json"
Write-Host "✅ Copied package.json" -ForegroundColor Green

# Copy API files
Write-Host "Copying API files..." -ForegroundColor Yellow
New-Item -ItemType Directory -Path "$tempDir/api" | Out-Null
New-Item -ItemType Directory -Path "$tempDir/api/auth" | Out-Null
New-Item -ItemType Directory -Path "$tempDir/api/contact" | Out-Null
New-Item -ItemType Directory -Path "$tempDir/api/users" | Out-Null

# Copy essential API files
$apiFiles = @(
    "api/auth/google.js",
    "api/auth/login.js",
    "api/auth/register.js",
    "api/contact/submit.js",
    "api/users/update-game-stats.js"
)

foreach ($file in $apiFiles) {
    if (Test-Path $file) {
        $destDir = Split-Path -Parent "$tempDir/$file"
        if (-not (Test-Path $destDir)) {
            New-Item -ItemType Directory -Path $destDir | Out-Null
        }
        Copy-Item -Path $file -Destination "$tempDir/$file"
        Write-Host "  Copied $file" -ForegroundColor Gray
    } else {
        Write-Host "  Warning: $file not found" -ForegroundColor Yellow
    }
}

# Copy HTML files
Write-Host "Copying HTML files..." -ForegroundColor Yellow
Copy-Item -Path "index.html" -Destination "$tempDir/index.html"
Write-Host "  Copied index.html" -ForegroundColor Gray

# Create auth/google directory and callback.html
New-Item -ItemType Directory -Path "$tempDir/auth/google" | Out-Null
if (Test-Path "auth/google/callback.html") {
    Copy-Item -Path "auth/google/callback.html" -Destination "$tempDir/auth/google/callback.html"
    Write-Host "  Copied auth/google/callback.html" -ForegroundColor Gray
} else {
    # Create a minimal callback.html if it doesn't exist
    $callbackHtml = @"
<!DOCTYPE html>
<html>
<head>
    <title>Google Auth Callback</title>
    <script>
        window.opener.postMessage({ type: 'google-auth-callback', url: window.location.href }, '*');
        window.close();
    </script>
</head>
<body>
    <p>Authentication successful! You can close this window.</p>
</body>
</html>
"@
    Set-Content -Path "$tempDir/auth/google/callback.html" -Value $callbackHtml
    Write-Host "  Created minimal auth/google/callback.html" -ForegroundColor Gray
}

# Create .vercelignore
$vercelIgnore = @"
# Only ignore non-essential files
node_modules/
.git/
*.log
.env
"@
Set-Content -Path "$tempDir/.vercelignore" -Value $vercelIgnore
Write-Host "✅ Created .vercelignore" -ForegroundColor Green

# Deploy from temp directory
Write-Host "🚀 Ready to deploy from temporary directory" -ForegroundColor Cyan
$deploy = Read-Host "Do you want to deploy now? (y/n)"

if ($deploy -eq "y") {
    Write-Host "Changing to temporary directory and deploying..." -ForegroundColor Yellow
    Push-Location $tempDir
    vercel --prod
    Pop-Location
    
    Write-Host "✅ Deployment process completed" -ForegroundColor Green
    Write-Host "Note: The temporary directory $tempDir can be deleted after successful deployment" -ForegroundColor Yellow
} else {
    Write-Host "Deployment cancelled" -ForegroundColor Red
    Write-Host "You can manually deploy later by running:" -ForegroundColor Yellow
    Write-Host "  cd $tempDir" -ForegroundColor Yellow
    Write-Host "  vercel --prod" -ForegroundColor Yellow
}