// Workaround script to initialize SQLite database
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '../prisma/dev.db');

console.log('Database initialization script');
console.log('==============================\n');

// Check if database exists
if (fs.existsSync(dbPath)) {
  const stats = fs.statSync(dbPath);
  console.log('✓ Database file exists:', dbPath);
  console.log('  Size:', stats.size, 'bytes');
} else {
  console.log('✗ Database file not found');
  fs.writeFileSync(dbPath, '');
  console.log('✓ Created empty database file');
}

console.log('\nNext steps:');
console.log('1. Run: npx prisma db push --skip-generate');
console.log('2. Run: npx prisma generate');
console.log('\nIf you encounter 403 Forbidden errors, you may need to:');
console.log('- Check your network/proxy settings');
console.log('- Use PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1');
console.log('- Or manually initialize the database');
