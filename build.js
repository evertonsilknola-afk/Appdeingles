const fs = require('fs'), cp = require('child_process');
fs.mkdirSync('www', { recursive: true });
['index.html', 'app.js', 'data.js'].forEach(f => fs.copyFileSync(f, 'www/' + f));
fs.copyFileSync('node_modules/lucide/dist/umd/lucide.min.js', 'www/lucide.min.js');
fs.mkdirSync('src', { recursive: true });
fs.writeFileSync('src/input.css', `@tailwind base;
@tailwind components;
@tailwind utilities;
html,body{background:#0f172a;-webkit-tap-highlight-color:transparent}
body{padding-top:env(safe-area-inset-top);user-select:none;-webkit-user-select:none}
input,select{user-select:text;-webkit-user-select:text;font-size:16px}
.persp{perspective:1000px}
.flip{position:relative;width:100%;height:100%;transition:transform .5s;transform-style:preserve-3d}
.flip.on{transform:rotateY(180deg)}
.face{position:absolute;inset:0;backface-visibility:hidden;-webkit-backface-visibility:hidden}
.back{transform:rotateY(180deg)}`);
cp.execSync('npx tailwindcss -i src/input.css -o www/app.css --minify', { stdio: 'inherit' });
console.log('Build web OK');
