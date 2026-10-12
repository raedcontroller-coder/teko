const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');
const distDir = path.join(__dirname, 'dist');

if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

fs.readdirSync(srcDir).forEach(file => {
  const srcPath = path.join(srcDir, file);
  const distPath = path.join(distDir, file);
  const stat = fs.statSync(srcPath);

  if (stat.isDirectory()) {
    fs.cpSync(srcPath, distPath, { recursive: true });
    console.log(`Copied directory ${file} to dist/`);
  } else if (file.endsWith('.py')) {
    fs.copyFileSync(srcPath, distPath);
    console.log(`Copied ${file} to dist/`);
  }
});
