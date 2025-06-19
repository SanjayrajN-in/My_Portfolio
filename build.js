// Enhanced build script for Vercel deployment
import fs from 'fs';
import path from 'path';

// Function to copy a directory recursively
function copyDirectory(source, destination) {
  // Create destination directory if it doesn't exist
  if (!fs.existsSync(destination)) {
    fs.mkdirSync(destination, { recursive: true });
  }

  // Get all files and directories in the source directory
  const entries = fs.readdirSync(source, { withFileTypes: true });

  for (const entry of entries) {
    const sourcePath = path.join(source, entry.name);
    const destinationPath = path.join(destination, entry.name);

    // Skip node_modules, .git, and other unnecessary directories
    if (entry.name === 'node_modules' || entry.name === '.git' || 
        entry.name === 'public' || entry.name.startsWith('.')) {
      continue;
    }

    if (entry.isDirectory()) {
      // Recursively copy subdirectories
      copyDirectory(sourcePath, destinationPath);
    } else {
      // Copy files
      fs.copyFileSync(sourcePath, destinationPath);
      console.log(`Copied: ${sourcePath} -> ${destinationPath}`);
    }
  }
}

// Create public directory if it doesn't exist
if (!fs.existsSync('public')) {
  fs.mkdirSync('public', { recursive: true });
  console.log('Created public directory');
}

// Copy essential directories
const directoriesToCopy = ['css', 'js', 'images', 'audio', 'pages', 'auth'];
for (const dir of directoriesToCopy) {
  if (fs.existsSync(dir)) {
    copyDirectory(dir, path.join('public', dir));
    console.log(`Copied directory: ${dir}`);
  }
}

// Copy API directory separately (don't put in public)
if (fs.existsSync('api')) {
  console.log('API directory exists, will be handled by Vercel Functions');
  
  // Create backup directory if it doesn't exist
  const backupDir = path.join(process.cwd(), 'api-backup');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
    console.log(`Created backup directory: ${backupDir}`);
  }
  
  // Ensure subdirectories exist
  ['auth', 'contact', 'users'].forEach(subdir => {
    const subdirPath = path.join(backupDir, subdir);
    if (!fs.existsSync(subdirPath)) {
      fs.mkdirSync(subdirPath, { recursive: true });
      console.log(`Created backup subdirectory: ${subdirPath}`);
    }
  });
  
  // Skip file removal since they've already been removed
  console.log('Skipping API file cleanup - files already consolidated');
  
  console.log('API file cleanup completed');
}

// Copy root HTML and other files
try {
  fs.copyFileSync('index.html', 'public/index.html');
  console.log('Copied index.html to public directory');
  
  // Copy other important files from root
  const rootFilesToCopy = [
    'favicon.ico',
    'robots.txt',
    'sitemap.xml'
  ];
  
  for (const file of rootFilesToCopy) {
    if (fs.existsSync(file)) {
      fs.copyFileSync(file, path.join('public', file));
      console.log(`Copied ${file} to public directory`);
    }
  }
} catch (err) {
  console.error('Error copying files:', err);
}

// Create a vercel.json in the public directory to ensure proper routing
const vercelConfig = {
  "version": 2,
  "routes": [
    { "handle": "filesystem" },
    { "src": "/(.*)", "dest": "/index.html" }
  ]
};

fs.writeFileSync('public/vercel.json', JSON.stringify(vercelConfig, null, 2));
console.log('Created vercel.json in public directory');

console.log('Build completed successfully');