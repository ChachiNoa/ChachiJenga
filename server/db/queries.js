/**
 * Prepared SQL queries for ChachiJenga database.
 * All functions receive a `db` instance (better-sqlite3).
 */

// ─── Users ────────────────────────────────────────────

function createUser(db, { googleId, displayName, tag, email, avatarUrl }) {
  const stmt = db.prepare(`
    INSERT INTO users (google_id, display_name, tag, email, avatar_url)
    VALUES (?, ?, ?, ?, ?)
  `)
  return stmt.run(googleId, displayName, tag, email, avatarUrl || null)
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

// ─── Friendships ──────────────────────────────────────

function sendFriendRequest(db, requesterId, addresseeId) {
  const stmt = db.prepare(`
    INSERT INTO friendships (requester_id, addressee_id)
    VALUES (?, ?)
  `)
  return stmt.run(requesterId, addresseeId)
}

function getPendingFriendRequests(db, userId) {
  const stmt = db.prepare(`
    SELECT f.id as friendshipId, u.id as userId, u.display_name as displayName, u.tag, u.avatar_url as avatarUrl, f.created_at as createdAt
    FROM friendships f
    JOIN users u ON f.requester_id = u.id
    WHERE f.addressee_id = ? AND f.status = 'pending'
    ORDER BY f.created_at DESC
  `)
  return stmt.all(userId)
}

function updateFriendRequestStatus(db, friendshipId, addresseeId, status) {
  const stmt = db.prepare(`
    UPDATE friendships
    SET status = ?
    WHERE id = ? AND addressee_id = ? AND status = 'pending'
  `)
  return stmt.run(status, friendshipId, addresseeId)
}

function getFriends(db, userId) {
  const stmt = db.prepare(`
    SELECT 
      f.id as friendshipId,
      u.id as userId, u.display_name as displayName, u.tag, u.avatar_url as avatarUrl, u.elo
    FROM friendships f
    JOIN users u ON (f.requester_id = u.id OR f.addressee_id = u.id)
    WHERE (f.requester_id = ? OR f.addressee_id = ?) 
      AND u.id != ? 
      AND f.status = 'accepted'
  `)
  return stmt.all(userId, userId, userId)
}

function deleteFriendship(db, friendshipId, userId) {
  const stmt = db.prepare(`
    DELETE FROM friendships
    WHERE id = ? AND (requester_id = ? OR addressee_id = ?)
  `)
  return stmt.run(friendshipId, userId, userId)
}

// ─── Guilds ───────────────────────────────────────────

function createGuild(db, { name, ownerId, description, isPublic }) {
  const stmt = db.prepare(`
    INSERT INTO guilds (name, owner_id, description, is_public)
    VALUES (?, ?, ?, ?)
  `)
  return stmt.run(name, ownerId, description, isPublic === undefined ? 1 : (isPublic ? 1 : 0))
}

function getGuildById(db, guildId) {
  const stmt = db.prepare(`
    SELECT id, name, owner_id as ownerId, description, is_public as isPublic, created_at as createdAt
    FROM guilds
    WHERE id = ?
  `)
  return stmt.get(guildId)
}

function getGuildMembers(db, guildId) {
  const stmt = db.prepare(`
    SELECT id, display_name as displayName, tag, avatar_url as avatarUrl, elo, total_points as totalPoints, guild_role as guildRole
    FROM users
    WHERE guild_id = ?
    ORDER BY total_points DESC
  `)
  return stmt.all(guildId)
}

function getGuildsRanking(db, limit = 50) {
  const stmt = db.prepare(`
    SELECT g.id, g.name, g.is_public as isPublic, SUM(u.total_points) as totalPoints, COUNT(u.id) as memberCount
    FROM guilds g
    JOIN users u ON g.id = u.guild_id
    GROUP BY g.id
    ORDER BY totalPoints DESC
    LIMIT ?
  `)
  return stmt.all(limit)
}

function updateGuild(db, guildId, { name, description, isPublic }) {
  const updates = []
  const params = []
  if (name !== undefined) { updates.push('name = ?'); params.push(name) }
  if (description !== undefined) { updates.push('description = ?'); params.push(description) }
  if (isPublic !== undefined) { updates.push('is_public = ?'); params.push(isPublic ? 1 : 0) }
  
  if (updates.length === 0) return { changes: 0 }
  
  params.push(guildId)
  const stmt = db.prepare(`UPDATE guilds SET ${updates.join(', ')} WHERE id = ?`)
  return stmt.run(...params)
}

function deleteGuild(db, guildId) {
  db.prepare('UPDATE users SET guild_id = NULL, guild_role = \'member\' WHERE guild_id = ?').run(guildId)
  const stmt = db.prepare('DELETE FROM guilds WHERE id = ?')
  return stmt.run(guildId)
}

function joinGuild(db, userId, guildId) {
  const stmt = db.prepare("UPDATE users SET guild_id = ?, guild_role = 'member' WHERE id = ?")
  return stmt.run(guildId, userId)
}

function leaveGuild(db, userId) {
  const stmt = db.prepare("UPDATE users SET guild_id = NULL, guild_role = 'member' WHERE id = ?")
  return stmt.run(userId)
}

function kickFromGuild(db, userId) {
  const stmt = db.prepare("UPDATE users SET guild_id = NULL, guild_role = 'member' WHERE id = ?")
  return stmt.run(userId)
}

function setGuildRole(db, userId, role) {
  const stmt = db.prepare('UPDATE users SET guild_role = ? WHERE id = ?')
  return stmt.run(role, userId)
}

function transferGuildOwnership(db, guildId, newOwnerId) {
  const stmt = db.prepare('UPDATE guilds SET owner_id = ? WHERE id = ?')
  return stmt.run(newOwnerId, guildId)
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
  // Friendships
  sendFriendRequest,
  getPendingFriendRequests,
  updateFriendRequestStatus,
  getFriends,
  deleteFriendship,
  // Guilds
  createGuild,
  getGuildById,
  getGuildMembers,
  getGuildsRanking,
  updateGuild,
  deleteGuild,
  joinGuild,
  leaveGuild,
  kickFromGuild,
  setGuildRole,
  transferGuildOwnership,
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
