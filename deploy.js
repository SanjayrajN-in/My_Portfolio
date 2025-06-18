#!/usr/bin/env node

// Deployment script for Vercel
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting deployment process...\n');

// Check if all required files exist
const requiredFiles = [
    'api/auth/google.js',
    'api/test.js',
    'vercel.json',
    'package.json'
];

console.log('📋 Checking required files...');
for (const file of requiredFiles) {
    if (fs.existsSync(file)) {
        console.log(`✅ ${file}`);
    } else {
        console.log(`❌ ${file} - MISSING!`);
        process.exit(1);
    }
}

// Check API directory structure
console.log('\n📁 Checking API structure...');
const apiDir = 'api';
if (fs.existsSync(apiDir)) {
    const apiFiles = fs.readdirSync(apiDir, { recursive: true });
    apiFiles.forEach(file => {
        if (file.endsWith('.js')) {
            console.log(`✅ api/${file}`);
        }
    });
} else {
    console.log('❌ API directory not found!');
    process.exit(1);
}

// Check package.json dependencies
console.log('\n📦 Checking dependencies...');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const requiredDeps = ['google-auth-library', 'jsonwebtoken'];

for (const dep of requiredDeps) {
    if (packageJson.dependencies[dep]) {
        console.log(`✅ ${dep}: ${packageJson.dependencies[dep]}`);
    } else {
        console.log(`❌ ${dep} - MISSING!`);
        process.exit(1);
    }
}

// Deploy to Vercel
console.log('\n🚀 Deploying to Vercel...');
try {
    execSync('vercel --prod', { stdio: 'inherit' });
    console.log('\n✅ Deployment completed successfully!');
    
    console.log('\n📋 Post-deployment checklist:');
    console.log('1. Check Vercel dashboard for function deployment');
    console.log('2. Test API endpoints:');
    console.log('   - https://sanjayrajn.vercel.app/api/test');
    console.log('   - https://sanjayrajn.vercel.app/api/auth/google (POST only)');
    console.log('3. Test Google login on your website');
    console.log('4. Check browser console for any errors');
    
} catch (error) {
    console.error('\n❌ Deployment failed:', error.message);
    process.exit(1);
}