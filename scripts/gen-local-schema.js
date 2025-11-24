const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const src = path.join(root, 'prisma', 'schema.prisma');
const dest = path.join(root, 'prisma', 'schema.local.prisma');

if (!fs.existsSync(src)) {
  console.error('Source schema.prisma not found at', src);
  process.exit(1);
}

let content = fs.readFileSync(src, 'utf8');

// Replace the datasource provider block to use sqlite instead of postgresql
content = content.replace(/datasource\s+db\s+\{[\s\S]*?\}/m, (match) => {
  // Replace provider line
  let replaced = match.replace(/provider\s*=\s*"[^"]+"/, 'provider = "sqlite"');
  // Keep url as env("DATABASE_URL") so .env controls the file path
  return replaced;
});

fs.writeFileSync(dest, content, 'utf8');
console.log('Generated', dest);
