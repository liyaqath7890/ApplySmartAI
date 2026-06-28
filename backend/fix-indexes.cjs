const fs = require('fs');
const path = require('path');

const modelsDir = path.join(__dirname, 'routes', 'models');
const files = fs.readdirSync(modelsDir).filter(f => f.endsWith('.js'));

function toSnakeCase(str) {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

let totalUpdated = 0;

for (const file of files) {
  const filePath = path.join(modelsDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;
  
  // Replace anything that looks like fields: ['camelCase'] or fields: ['camelCase', 'anotherCamel']
  content = content.replace(/(fields:\s*\[)([^\]]+)(\])/g, (match, prefix, fieldsList, suffix) => {
    const items = fieldsList.split(',').map(s => s.trim());
    const newItems = items.map(item => {
      const strMatch = item.match(/^(['"])(.*?)(\1)$/);
      if (strMatch) {
        const quote = strMatch[1];
        const val = strMatch[2];
        if (/[a-z][A-Z]/.test(val)) {
          return `${quote}${toSnakeCase(val)}${quote}`;
        }
      }
      return item;
    });
    return `${prefix}${newItems.join(', ')}${suffix}`;
  });
  
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${file}`);
    totalUpdated++;
  }
}

console.log(`Done. Updated ${totalUpdated} files.`);
