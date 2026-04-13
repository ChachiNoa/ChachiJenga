/**
 * Prepared SQL queries for ChachiJenga database.
 * All functions receive a `db` instance (better-sqlite3).
 */

// ─── Users ────────────────────────────────────────────

function createUser(db, { googleId, displayName, email, avatarUrl }) {
  const stmt = db.prepare(`
    INSERT INTO users (google_id, display_name, email, avatar_url)
    VALUES (?, ?, ?, ?)
  `)
  return stmt.run(googleId, displayName, email, avatarUrl || null)
}

function findUserByGoogleId(db, googleId) {
  const stmt = db.prepare('SELECT * FROM users WHERE google_id = ?')
  return stmt.get(googleId)
}

function findUserById(db, id) {
  const stmt = db.prepare('SELECT * FROM users WHERE id = ?')
  return stmt.get(id)
}

function updateUserLogin(db, id) {
  const stmt = db.prepare('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?')
  return stmt.run(id)
}

function updateUserStats(db, id, { elo, totalPoints, gamesPlayed, gamesWon, gamesLost, gamesDrawn, piecesExtracted, shapesDrawn }) {
  const stmt = db.prepare(`
    UPDATE users SET
      elo = COALESCE(?, elo),
      total_points = COALESCE(?, total_points),
      games_played = COALESCE(?, games_played),
      games_won = COALESCE(?, games_won),
      games_lost = COALESCE(?, games_lost),
      games_drawn = COALESCE(?, games_drawn),
      pieces_extracted = COALESCE(?, pieces_extracted),
      shapes_drawn = COALESCE(?, shapes_drawn)
    WHERE id = ?
  `)
  return stmt.run(
    elo ?? null, totalPoints ?? null, gamesPlayed ?? null,
    gamesWon ?? null, gamesLost ?? null, gamesDrawn ?? null,
    piecesExtracted ?? null, shapesDrawn ?? null, id
  )
}

function incrementUserStats(db, id, { gamesPlayed = 0, gamesWon = 0, gamesLost = 0, gamesDrawn = 0, piecesExtracted = 0, shapesDrawn = 0, eloChange = 0, pointsChange = 0 }) {
  const stmt = db.prepare(`
    UPDATE users SET
      elo = MAX(100, elo + ?),
      total_points = total_points + ?,
      games_played = games_played + ?,
      games_won = games_won + ?,
      games_lost = games_lost + ?,
      games_drawn = games_drawn + ?,
      pieces_extracted = pieces_extracted + ?,
      shapes_drawn = shapes_drawn + ?
    WHERE id = ?
  `)
  return stmt.run(eloChange, pointsChange, gamesPlayed, gamesWon, gamesLost, gamesDrawn, piecesExtracted, shapesDrawn, id)
}

// ─── Ranking ──────────────────────────────────────────

function getTopPlayers(db, limit = 100) {
  const stmt = db.prepare(`
    SELECT id, display_name, avatar_url, elo, games_played, games_won, pieces_extracted
    FROM users
    ORDER BY elo DESC
    LIMIT ?
  `)
  return stmt.all(limit)
}

function getPlayerRank(db, userId) {
  const stmt = db.prepare(`
    SELECT COUNT(*) + 1 AS rank
    FROM users
    WHERE elo > (SELECT elo FROM users WHERE id = ?)
  `)
  return stmt.get(userId)
}

// ─── Matches ──────────────────────────────────────────

function createMatch(db, { player1Id, player2Id }) {
  const stmt = db.prepare(`
    INSERT INTO matches (player1_id, player2_id)
    VALUES (?, ?)
  `)
  return stmt.run(player1Id, player2Id)
}

function finishMatch(db, matchId, { winnerId, result, player1Points, player2Points, player1EloChange, player2EloChange, totalPiecesExtracted, durationSeconds, gameLog }) {
  const stmt = db.prepare(`
    UPDATE matches SET
      winner_id = ?,
      result = ?,
      player1_points = ?,
      player2_points = ?,
      player1_elo_change = ?,
      player2_elo_change = ?,
      total_pieces_extracted = ?,
      duration_seconds = ?,
      game_log = ?
    WHERE id = ?
  `)
  return stmt.run(
    winnerId ?? null, result, player1Points, player2Points,
    player1EloChange, player2EloChange, totalPiecesExtracted,
    durationSeconds, gameLog ? JSON.stringify(gameLog) : null, matchId
  )
}

function getMatchById(db, id) {
  const stmt = db.prepare('SELECT * FROM matches WHERE id = ?')
  return stmt.get(id)
}

function getPlayerMatches(db, userId, limit = 20) {
  const stmt = db.prepare(`
    SELECT * FROM matches
    WHERE player1_id = ? OR player2_id = ?
    ORDER BY played_at DESC
    LIMIT ?
  `)
  return stmt.all(userId, userId, limit)
}

// ─── Match Turns ──────────────────────────────────────

function createMatchTurn(db, { matchId, playerId, turnNumber, pieceLayer, piecePosition, difficulty }) {
  const stmt = db.prepare(`
    INSERT INTO match_turns (match_id, player_id, turn_number, piece_layer, piece_position, difficulty)
    VALUES (?, ?, ?, ?, ?, ?)
  `)
  return stmt.run(matchId, playerId, turnNumber, pieceLayer, piecePosition, difficulty)
}

function finishMatchTurn(db, turnId, { drawingsCompleted, drawingsFailed, timeRemainingMs, completed, pointsEarned }) {
  const stmt = db.prepare(`
    UPDATE match_turns SET
      drawings_completed = ?,
      drawings_failed = ?,
      time_remaining_ms = ?,
      completed = ?,
      points_earned = ?
    WHERE id = ?
  `)
  return stmt.run(drawingsCompleted, drawingsFailed, timeRemainingMs, completed ? 1 : 0, pointsEarned, turnId)
}

function getTurnsByMatch(db, matchId) {
  const stmt = db.prepare('SELECT * FROM match_turns WHERE match_id = ? ORDER BY turn_number')
  return stmt.all(matchId)
}

module.exports = {
  // Users
  createUser,
  findUserByGoogleId,
  findUserById,
  updateUserLogin,
  updateUserStats,
  incrementUserStats,
  // Ranking
  getTopPlayers,
  getPlayerRank,
  // Matches
  createMatch,
  finishMatch,
  getMatchById,
  getPlayerMatches,
  // Match turns
  createMatchTurn,
  finishMatchTurn,
  getTurnsByMatch,
}
