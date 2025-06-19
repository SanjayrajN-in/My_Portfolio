// Build script for Vercel deployment
import fs from 'fs';
import path from 'path';

// Function to copy a file
function copyFile(source, destination) {
  try {
    fs.copyFileSync(source, destination);
    console.log(`Copied ${source} to ${destination}`);
  } catch (err) {
    console.error(`Error copying ${source}:`, err);
  }
}

// Function to copy a directory recursively
function copyDir(source, destination) {
  // Create destination directory if it doesn't exist
  if (!fs.existsSync(destination)) {
    fs.mkdirSync(destination, { recursive: true });
  }

  // Get all files and directories in the source directory
  const entries = fs.readdirSync(source, { withFileTypes: true });

  // Copy each entry
  for (const entry of entries) {
    const sourcePath = path.join(source, entry.name);
    const destPath = path.join(destination, entry.name);

    if (entry.isDirectory()) {
      // Skip node_modules and .git directories
      if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'public') {
        continue;
      }
      copyDir(sourcePath, destPath);
    } else {
      copyFile(sourcePath, destPath);
    }
  }
}

// Create public directory if it doesn't exist
if (!fs.existsSync('public')) {
  fs.mkdirSync('public', { recursive: true });
  console.log('Created public directory');
}

// Copy HTML files from root directory
const htmlFiles = fs.readdirSync('.').filter(file => file.endsWith('.html'));
for (const file of htmlFiles) {
  copyFile(file, `public/${file}`);
}

// Copy directories
const directoriesToCopy = ['css', 'js', 'images', 'audio', 'pages', 'auth'];
for (const dir of directoriesToCopy) {
  if (fs.existsSync(dir)) {
    copyDir(dir, `public/${dir}`);
  }
}

// Create a build info file
const buildInfo = {
  timestamp: new Date().toISOString(),
  buildVersion: '1.0.0',
  message: 'Build completed successfully'
};

fs.writeFileSync('public/build-info.json', JSON.stringify(buildInfo, null, 2));
console.log('Build completed successfully');