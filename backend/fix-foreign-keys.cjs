const fs = require('fs');
const path = require('path');

const modelsDir = path.join(__dirname, 'routes', 'models');

// Fix index.js
const indexPath = path.join(modelsDir, 'index.js');
let indexContent = fs.readFileSync(indexPath, 'utf8');

// Replace foreignKey: 'xxx_yyy_id' with foreignKey: 'xxxYyyId'
indexContent = indexContent.replace(/foreignKey:\s*'([a-z_]+)_id'/g, (match, prefix) => {
  // Convert prefix from snake_case to camelCase
  const camelPrefix = prefix.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
  return `foreignKey: '${camelPrefix}Id'`;
});

fs.writeFileSync(indexPath, indexContent);
console.log('Fixed index.js foreign keys');

// Now let's loop through all models and ensure they define their foreign keys correctly.
// For any UUID field that matches something like 'userId' and has `field: 'user_id'`, that's already correct.
// We just need to ensure that the primary keys and foreign keys are consistent.
const files = fs.readdirSync(modelsDir);
let changedFiles = 0;

for (const file of files) {
  if (!file.endsWith('.js') || file === 'index.js') continue;
  
  const filePath = path.join(modelsDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;
  
  // We don't necessarily need to change the models if they are already using camelCase properties.
  // The user asked to "Fix: userId vs user_id".
  // Let's ensure any `userId: { ... field: 'user_id' }` is present. If there's `user_id: { ... }` as a property name, we change it to `userId`.
  
  // Replace property definition like:
  // user_id: {
  // with
  // userId: {
  // and add field: 'user_id' if not present
  const propertyRegex = /\n\s+([a-z]+)_id:\s*\{([^}]*)\}/g;
  content = content.replace(propertyRegex, (match, prefix, body) => {
    const camelProp = prefix + 'Id';
    if (!body.includes('field:')) {
      return `\n  ${camelProp}: {${body.replace(/\n\s*$/, `\n    field: '${prefix}_id',\n  `)}`;
    }
    return `\n  ${camelProp}: {${body}`;
  });

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content);
    console.log(`Fixed model: ${file}`);
    changedFiles++;
  }
}

console.log(`Done fixing models. Changed ${changedFiles} model files.`);
