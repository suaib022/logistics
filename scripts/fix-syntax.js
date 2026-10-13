const fs = require('fs');
const { execSync } = require('child_process');

const files = execSync('find app components lib scripts tests -type f -name "*.ts" -o -name "*.tsx" -o -name "*.js"').toString().split('\n').filter(Boolean);

files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  let changed = false;
  
  if (content.includes('\`')) {
    content = content.split('\`').join('`');
    changed = true;
  }
  if (content.includes('\${')) {
    content = content.split('\${').join('${');
    changed = true;
  }
  
  if (changed) {
    fs.writeFileSync(f, content);
    console.log('Fixed', f);
  }
});
