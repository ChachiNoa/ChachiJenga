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

  // Migration: add tag column if it doesn't exist
  const tableInfo = db.pragma('table_info(users)')
  const hasTagColumn = tableInfo.some(col => col.name === 'tag')
  if (!hasTagColumn) {
    // SQLite doesn't support ADD COLUMN with UNIQUE — add plain, index later
    db.exec('ALTER TABLE users ADD COLUMN tag TEXT')
  }

  // Migration: add guild_id column if it doesn't exist
  const hasGuildIdColumn = tableInfo.some(col => col.name === 'guild_id')
  if (!hasGuildIdColumn) {
    db.exec('ALTER TABLE users ADD COLUMN guild_id INTEGER')
  }

  // Migration: add guild_role column if it doesn't exist
  const hasGuildRoleColumn = tableInfo.some(col => col.name === 'guild_role')
  if (!hasGuildRoleColumn) {
    db.exec("ALTER TABLE users ADD COLUMN guild_role TEXT DEFAULT 'member'")
  }

  // Migration: populate tag for existing users
  const usersWithoutTag = db.prepare('SELECT id FROM users WHERE tag IS NULL').all()
  if (usersWithoutTag.length > 0) {
    const updateTag = db.prepare('UPDATE users SET tag = ? WHERE id = ?')
    const maxTagStmt = db.prepare("SELECT MAX(CAST(SUBSTR(tag, 2) AS INTEGER)) as maxTag FROM users WHERE tag IS NOT NULL")
    
    const populateTags = db.transaction((users) => {
      let currentMaxTag = maxTagStmt.get().maxTag || 0
      for (const user of users) {
        currentMaxTag++
        const newTag = `#${currentMaxTag.toString().padStart(5, '0')}`
        updateTag.run(newTag, user.id)
      }
    })
    populateTags(usersWithoutTag)
  }

  // Ensure unique index on tag (safe to run repeatedly — IF NOT EXISTS)
  db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_users_tag ON users(tag)')


  return db
}

module.exports = { setupDatabase }
