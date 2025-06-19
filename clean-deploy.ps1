# Clean Deployment Script for Vercel
# This script helps resolve deployment issues by cleaning up cached configurations

Write-Host "🧹 Starting clean deployment process..." -ForegroundColor Cyan

# Step 1: Remove cached Vercel configurations
Write-Host "Step 1: Removing cached Vercel configurations..." -ForegroundColor Yellow
if (Test-Path .vercel) {
    Remove-Item -Path .vercel -Recurse -Force
    Write-Host "✅ Removed .vercel directory" -ForegroundColor Green
} else {
    Write-Host "✅ No .vercel directory found" -ForegroundColor Green
}

# Step 2: Verify vercel.json is correct
Write-Host "Step 2: Verifying vercel.json..." -ForegroundColor Yellow
$vercelJson = Get-Content -Raw vercel.json | ConvertFrom-Json

# Check if functions section exists (it shouldn't)
if ($vercelJson.PSObject.Properties.Name -contains "functions") {
    Write-Host "❌ Found 'functions' section in vercel.json - this might cause issues" -ForegroundColor Red
    $removeFunctions = Read-Host "Do you want to remove the 'functions' section? (y/n)"
    
    if ($removeFunctions -eq "y") {
        $vercelJson.PSObject.Properties.Remove('functions')
        $vercelJson | ConvertTo-Json -Depth 10 | Set-Content vercel.json
        Write-Host "✅ Removed 'functions' section from vercel.json" -ForegroundColor Green
    }
} else {
    Write-Host "✅ vercel.json looks good (no 'functions' section)" -ForegroundColor Green
}

# Step 3: Check .vercelignore
Write-Host "Step 3: Checking .vercelignore..." -ForegroundColor Yellow
if (Test-Path .vercelignore) {
    $vercelIgnore = Get-Content .vercelignore
    $apiIgnored = $false
    
    foreach ($line in $vercelIgnore) {
        if ($line -match "^api/" -and -not $line.StartsWith("#")) {
            $apiIgnored = $true
            break
        }
    }
    
    if ($apiIgnored) {
        Write-Host "❌ .vercelignore is ignoring API files - this will cause deployment issues" -ForegroundColor Red
        $fixIgnore = Read-Host "Do you want to update .vercelignore to not ignore API files? (y/n)"
        
        if ($fixIgnore -eq "y") {
            $newContent = @"
# Only ignore non-essential files
node_modules/
.git/
*.log
.env
# DO NOT ignore API files needed for deployment
"@
            Set-Content -Path .vercelignore -Value $newContent
            Write-Host "✅ Updated .vercelignore" -ForegroundColor Green
        }
    } else {
        Write-Host "✅ .vercelignore looks good (not ignoring API files)" -ForegroundColor Green
    }
} else {
    Write-Host "✅ No .vercelignore file found" -ForegroundColor Green
}

# Step 4: Verify API files exist
Write-Host "Step 4: Verifying API files..." -ForegroundColor Yellow
$apiFiles = @(
    "api/auth/google.js",
    "api/auth/login.js",
    "api/auth/register.js",
    "api/contact/submit.js",
    "api/users/update-game-stats.js"
)

$missingFiles = @()
foreach ($file in $apiFiles) {
    if (-not (Test-Path $file)) {
        $missingFiles += $file
    }
}

if ($missingFiles.Count -gt 0) {
    Write-Host "⚠️ Some API files are missing:" -ForegroundColor Yellow
    foreach ($file in $missingFiles) {
        Write-Host "   - $file" -ForegroundColor Yellow
    }
    Write-Host "   This is not necessarily an issue if these endpoints aren't needed" -ForegroundColor Yellow
} else {
    Write-Host "✅ All core API files exist" -ForegroundColor Green
}

# Step 5: Deploy to Vercel
Write-Host "Step 5: Deploying to Vercel..." -ForegroundColor Yellow
$deploy = Read-Host "Ready to deploy? (y/n)"

if ($deploy -eq "y") {
    Write-Host "🚀 Deploying to Vercel..." -ForegroundColor Cyan
    vercel --prod
} else {
    Write-Host "Deployment cancelled" -ForegroundColor Red
}

Write-Host "✅ Clean deployment process completed" -ForegroundColor Green