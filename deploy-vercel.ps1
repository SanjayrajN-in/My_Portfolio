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
    
    # Validate vercel.json configuration
    $vercelConfig = Get-Content -Raw vercel.json | ConvertFrom-Json
    $configErrors = $false
    
    # Check for configuration conflicts
    if (($vercelConfig.PSObject.Properties.Name -contains "routes") -and 
        (($vercelConfig.PSObject.Properties.Name -contains "rewrites") -or 
         ($vercelConfig.PSObject.Properties.Name -contains "redirects") -or 
         ($vercelConfig.PSObject.Properties.Name -contains "headers") -or 
         ($vercelConfig.PSObject.Properties.Name -contains "cleanUrls") -or 
         ($vercelConfig.PSObject.Properties.Name -contains "trailingSlash"))) {
        
        Write-Host "❌ Configuration error in vercel.json:" -ForegroundColor Red
        Write-Host "   If 'rewrites', 'redirects', 'headers', 'cleanUrls' or 'trailingSlash' are used," -ForegroundColor Red
        Write-Host "   then 'routes' cannot be present." -ForegroundColor Red
        $configErrors = $true
        
        $fixConfig = Read-Host "Do you want to automatically fix this issue? (y/n)"
        if ($fixConfig -eq "y") {
            # Convert routes to rewrites
            if (($vercelConfig.PSObject.Properties.Name -contains "routes") -and 
                ($vercelConfig.PSObject.Properties.Name -notcontains "rewrites")) {
                
                $rewrites = @()
                foreach ($route in $vercelConfig.routes) {
                    $rewrite = @{
                        source = $route.src
                        destination = $route.dest
                    }
                    $rewrites += $rewrite
                }
                
                # Remove routes and add rewrites
                $vercelConfig.PSObject.Properties.Remove('routes')
                Add-Member -InputObject $vercelConfig -MemberType NoteProperty -Name "rewrites" -Value $rewrites
                
                # Save updated config
                $vercelConfig | ConvertTo-Json -Depth 10 | Set-Content vercel.json
                Write-Host "✅ vercel.json configuration fixed" -ForegroundColor Green
                $configErrors = $false
                
                # Reload the config after changes
                $vercelConfig = Get-Content -Raw vercel.json | ConvertFrom-Json
            }
        } else {
            Write-Host "Deployment cancelled. Please fix vercel.json manually." -ForegroundColor Red
            exit
        }
    }
    
    # Check for function runtime version issues
    if ($vercelConfig.PSObject.Properties.Name -contains "functions") {
        $runtimeIssues = $false
        $functionsToFix = @{}
        $missingFiles = @()
        
        foreach ($functionPath in $vercelConfig.functions.PSObject.Properties.Name) {
            $runtime = $vercelConfig.functions.$functionPath.runtime
            
            # Check if runtime doesn't have a version
            if ($runtime -and -not $runtime.Contains('@')) {
                $runtimeIssues = $true
                $functionsToFix[$functionPath] = $runtime
            }
            
            # Check if the file exists
            $fullPath = "c:/Users/ADMIN/OneDrive/Desktop/My portfolio/$functionPath"
            if (-not (Test-Path $fullPath)) {
                $missingFiles += $functionPath
            }
        }
        
        # Handle missing files
        if ($missingFiles.Count -gt 0) {
            Write-Host "❌ Missing serverless function files in vercel.json:" -ForegroundColor Red
            foreach ($file in $missingFiles) {
                Write-Host "   - $file" -ForegroundColor Red
            }
            Write-Host "   The pattern defined in 'functions' doesn't match any Serverless Functions inside the 'api' directory." -ForegroundColor Red
            $configErrors = $true
            
            $fixMissingFiles = Read-Host "Do you want to remove these missing files from the configuration? (y/n)"
            if ($fixMissingFiles -eq "y") {
                $simplifyConfig = Read-Host "Do you want to simplify the configuration by removing the entire 'functions' section? (recommended) (y/n)"
                
                if ($simplifyConfig -eq "y") {
                    # Remove the entire functions section
                    $vercelConfig.PSObject.Properties.Remove('functions')
                    Write-Host "✅ Removed 'functions' section from vercel.json" -ForegroundColor Green
                } else {
                    # Remove only the missing files
                    foreach ($file in $missingFiles) {
                        $vercelConfig.functions.PSObject.Properties.Remove($file)
                    }
                    Write-Host "✅ Removed missing files from 'functions' section" -ForegroundColor Green
                }
                
                # Save updated config
                $vercelConfig | ConvertTo-Json -Depth 10 | Set-Content vercel.json
                $configErrors = $false
                
                # Reload the config after changes
                $vercelConfig = Get-Content -Raw vercel.json | ConvertFrom-Json
            } else {
                Write-Host "Deployment cancelled. Please fix vercel.json manually." -ForegroundColor Red
                exit
            }
        }
        
        # Handle runtime version issues (only if functions section still exists)
        if ($vercelConfig.PSObject.Properties.Name -contains "functions" -and $runtimeIssues) {
            Write-Host "❌ Function runtime version error in vercel.json:" -ForegroundColor Red
            Write-Host "   Function Runtimes must have a valid version, for example '@vercel/node@1.15.4'" -ForegroundColor Red
            $configErrors = $true
            
            $fixRuntimes = Read-Host "Do you want to automatically fix this issue? (y/n)"
            if ($fixRuntimes -eq "y") {
                foreach ($functionPath in $functionsToFix.Keys) {
                    $runtime = $functionsToFix[$functionPath]
                    
                    # Add version to runtime
                    if ($runtime -eq "@vercel/node") {
                        $vercelConfig.functions.$functionPath.runtime = "@vercel/node@1.15.4"
                    } elseif ($runtime -eq "@vercel/python") {
                        $vercelConfig.functions.$functionPath.runtime = "@vercel/python@3.1.0"
                    } elseif ($runtime -eq "@vercel/go") {
                        $vercelConfig.functions.$functionPath.runtime = "@vercel/go@1.2.3"
                    } elseif ($runtime -eq "@vercel/ruby") {
                        $vercelConfig.functions.$functionPath.runtime = "@vercel/ruby@1.2.6"
                    } else {
                        # Default to adding version 1.0.0 for unknown runtimes
                        $vercelConfig.functions.$functionPath.runtime = "$runtime@1.0.0"
                    }
                }
                
                # Save updated config
                $vercelConfig | ConvertTo-Json -Depth 10 | Set-Content vercel.json
                Write-Host "✅ Function runtime versions fixed" -ForegroundColor Green
                $configErrors = $false
            } else {
                Write-Host "Deployment cancelled. Please fix vercel.json manually." -ForegroundColor Red
                exit
            }
        }
    }
    
    if (-not $configErrors) {
        Write-Host "✅ vercel.json configuration validated" -ForegroundColor Green
    }
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