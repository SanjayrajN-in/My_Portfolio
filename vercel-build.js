// Simplified build script for Vercel deployment
import fs from 'fs';
import path from 'path';

// Create public directory
if (!fs.existsSync('public')) {
  fs.mkdirSync('public', { recursive: true });
  console.log('Created public directory');
}

// Copy index.html to public
try {
  fs.copyFileSync('index.html', 'public/index.html');
  console.log('Copied index.html to public directory');
} catch (err) {
  console.error('Error copying index.html:', err);
}

// Create a simple placeholder file
fs.writeFileSync('public/vercel.html', `
<!DOCTYPE html>
<html>
<head>
  <title>Vercel Deployment</title>
  <meta http-equiv="refresh" content="0;url=/" />
</head>
<body>
  <p>Redirecting to homepage...</p>
</body>
</html>
`);

console.log('Build completed successfully');