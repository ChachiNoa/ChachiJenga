const Database = require('better-sqlite3')
const fs = require('fs')
const path = require('path')

function setupDatabase(dbPath) {
  const resolvedPath = dbPath || path.join(__dirname, '..', 'chachijenga.db')
  const db = new Database(resolvedPath)

  // Enable WAL mode for better concurrent performance
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')

  // Read and execute schema
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8')
  db.exec(schema)

  return db
}

module.exports = { setupDatabase }
