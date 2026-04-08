const Database = require('better-sqlite3');
const path = require('path');

// In production (Railway), use /data volume for persistence. Locally use server dir.
const DB_PATH = process.env.NODE_ENV === 'production'
  ? '/data/bd-tool.sqlite'
  : path.join(__dirname, '..', 'bd-tool.sqlite');

let db;

function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }
  return db;
}

module.exports = { getDb };
