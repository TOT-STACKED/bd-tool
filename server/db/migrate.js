const fs = require('fs');
const path = require('path');
const { getDb } = require('./client');

function migrate() {
  const db = getDb();
  const migrationsDir = path.join(__dirname, 'migrations');
  const files = fs.readdirSync(migrationsDir).sort();

  for (const file of files) {
    if (!file.endsWith('.sql')) continue;
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    db.exec(sql);
    console.log(`[migrate] ran ${file}`);
  }
}

module.exports = { migrate };

if (require.main === module) {
  migrate();
  console.log('[migrate] done');
}
