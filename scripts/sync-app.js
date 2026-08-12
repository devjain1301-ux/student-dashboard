const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const wwwDir = path.join(rootDir, 'www');

// Ensure www directory exists
if (!fs.existsSync(wwwDir)) {
  fs.mkdirSync(wwwDir, { recursive: true });
}

function copyFolderRecursiveSync(source, target) {
  if (!fs.existsSync(target)) {
    fs.mkdirSync(target, { recursive: true });
  }

  if (fs.lstatSync(source).isDirectory()) {
    const files = fs.readdirSync(source);
    files.forEach((file) => {
      const curSource = path.join(source, file);
      const curTarget = path.join(target, file);
      if (fs.lstatSync(curSource).isDirectory()) {
        copyFolderRecursiveSync(curSource, curTarget);
      } else {
        fs.copyFileSync(curSource, curTarget);
      }
    });
  }
}

// Copy essential files and folders
const filesToCopy = ['index.html', 'manifest.json', 'sw.js', 'vercel.json'];
const foldersToCopy = ['css', 'js', 'assets'];

filesToCopy.forEach((file) => {
  const src = path.join(rootDir, file);
  const dest = path.join(wwwDir, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log(`Copied ${file} -> www/${file}`);
  }
});

foldersToCopy.forEach((folder) => {
  const src = path.join(rootDir, folder);
  const dest = path.join(wwwDir, folder);
  if (fs.existsSync(src)) {
    copyFolderRecursiveSync(src, dest);
    console.log(`Synced folder ${folder} -> www/${folder}`);
  }
});

console.log('App web bundle prepared successfully in www/ directory!');
