// Copia o lucide e compila o Tailwind para funcionar 100% offline dentro do APK
const fs = require('fs'), cp = require('child_process');
fs.copyFileSync('node_modules/lucide/dist/umd/lucide.min.js', 'www/lucide.min.js');
cp.execSync('npx tailwindcss -i src/input.css -o www/app.css --minify', { stdio: 'inherit' });
console.log('Build web OK');
