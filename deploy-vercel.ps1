# Vercel Deployment Script for PowerShell
# This script helps deploy your application to Vercel with proper environment variables

Write-Host "🚀 Starting Vercel deployment process..." -ForegroundColor Cyan

# Check if Vercel CLI is installed
try {
    $vercelVersion = vercel --version
    Write-Host "✅ Vercel CLI detected: $vercelVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Vercel CLI not found. Installing..." -ForegroundColor Red
    npm install -g vercel
}

# Check for .env file
if (Test-Path .env) {
    Write-Host "✅ .env file found" -ForegroundColor Green
    
    # Read .env file and set environment variables for this session
    Get-Content .env | ForEach-Object {
        if ($_ -match "^\s*([^#][^=]+)=(.*)$") {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim()
            Write-Host "   Setting $key" -ForegroundColor Gray
            [Environment]::SetEnvironmentVariable($key, $value, "Process")
        }
    }
} else {
    Write-Host "⚠️ No .env file found. Make sure to set environment variables in Vercel dashboard." -ForegroundColor Yellow
}

# Verify critical environment variables
$requiredVars = @("MONGODB_URI", "JWT_SECRET", "GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET")
$missingVars = @()

foreach ($var in $requiredVars) {
    $value = [Environment]::GetEnvironmentVariable($var, "Process")
    if ([string]::IsNullOrEmpty($value)) {
        $missingVars += $var
    }
}

if ($missingVars.Count -gt 0) {
    Write-Host "⚠️ Missing environment variables: $($missingVars -join ', ')" -ForegroundColor Yellow
    Write-Host "   These must be set in Vercel dashboard before deployment" -ForegroundColor Yellow
    
    $proceed = Read-Host "Do you want to proceed anyway? (y/n)"
    if ($proceed -ne "y") {
        Write-Host "Deployment cancelled" -ForegroundColor Red
        exit
    }
}

# Run pre-deployment checks
Write-Host "🔍 Running pre-deployment checks..." -ForegroundColor Cyan

# Check package.json
if (Test-Path package.json) {
    Write-Host "✅ package.json found" -ForegroundColor Green
} else {
    Write-Host "❌ package.json not found" -ForegroundColor Red
    exit
}

# Check vercel.json
if (Test-Path vercel.json) {
    Write-Host "✅ vercel.json found" -ForegroundColor Green
} else {
    Write-Host "❌ vercel.json not found" -ForegroundColor Red
    exit
}

# Check API files
$apiFiles = @(
    "api/auth/google.js",
    "api/auth/login.js",
    "api/auth/register.js",
    "api/contact/submit.js",
    "api/config/database.js",
    "api/models/User.js"
)

foreach ($file in $apiFiles) {
    if (Test-Path $file) {
        Write-Host "✅ $file found" -ForegroundColor Green
    } else {
        Write-Host "❌ $file not found" -ForegroundColor Red
    }
}

# Deploy to Vercel
Write-Host "🚀 Deploying to Vercel..." -ForegroundColor Cyan
vercel --prod

# Post-deployment checks
Write-Host "🔍 Running post-deployment checks..." -ForegroundColor Cyan
Write-Host "   Please verify these endpoints after deployment:" -ForegroundColor Yellow
Write-Host "   1. API Status: https://sanjayrajn.vercel.app/api/test/api-status" -ForegroundColor Yellow
Write-Host "   2. Environment Check: https://sanjayrajn.vercel.app/api/debug/env-check" -ForegroundColor Yellow

Write-Host "✅ Deployment process completed" -ForegroundColor Green