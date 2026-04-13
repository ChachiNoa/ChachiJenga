const path = require('path')
const fs = require('fs')
const { setupDatabase } = require('../db/setup')
const queries = require('../db/queries')

let db

beforeEach(() => {
  // Use in-memory database for each test
  db = setupDatabase(':memory:')
})

afterEach(() => {
  db.close()
})

describe('Database Setup', () => {
  it('should create all required tables', () => {
    const tables = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
      .all()
      .map((t) => t.name)

    expect(tables).toContain('users')
    expect(tables).toContain('matches')
    expect(tables).toContain('match_turns')
  })

  it('should have foreign keys enabled', () => {
    const fk = db.pragma('foreign_keys', { simple: true })
    expect(fk).toBe(1)
  })
})

describe('User Queries', () => {
  const testUser = {
    googleId: 'google-123',
    displayName: 'Test Player',
    email: 'test@example.com',
    avatarUrl: 'https://example.com/avatar.jpg',
  }

  it('should create a new user', () => {
    const result = queries.createUser(db, testUser)
    expect(result.changes).toBe(1)
    expect(result.lastInsertRowid).toBe(1)
  })

  it('should find user by Google ID', () => {
    queries.createUser(db, testUser)
    const user = queries.findUserByGoogleId(db, 'google-123')
    expect(user).toBeDefined()
    expect(user.display_name).toBe('Test Player')
    expect(user.email).toBe('test@example.com')
    expect(user.elo).toBe(1000)
  })

  it('should find user by ID', () => {
    const { lastInsertRowid } = queries.createUser(db, testUser)
    const user = queries.findUserById(db, lastInsertRowid)
    expect(user).toBeDefined()
    expect(user.google_id).toBe('google-123')
  })

  it('should return undefined for non-existent user', () => {
    const user = queries.findUserByGoogleId(db, 'non-existent')
    expect(user).toBeUndefined()
  })

  it('should reject duplicate Google IDs', () => {
    queries.createUser(db, testUser)
    expect(() => queries.createUser(db, testUser)).toThrow()
  })

  it('should have default stats for new user', () => {
    queries.createUser(db, testUser)
    const user = queries.findUserByGoogleId(db, 'google-123')
    expect(user.elo).toBe(1000)
    expect(user.total_points).toBe(0)
    expect(user.games_played).toBe(0)
    expect(user.games_won).toBe(0)
    expect(user.pieces_extracted).toBe(0)
  })

  it('should increment user stats', () => {
    const { lastInsertRowid: id } = queries.createUser(db, testUser)
    queries.incrementUserStats(db, id, {
      gamesPlayed: 1,
      gamesWon: 1,
      piecesExtracted: 5,
      shapesDrawn: 12,
      eloChange: 24,
      pointsChange: 185,
    })
    const user = queries.findUserById(db, id)
    expect(user.games_played).toBe(1)
    expect(user.games_won).toBe(1)
    expect(user.pieces_extracted).toBe(5)
    expect(user.shapes_drawn).toBe(12)
    expect(user.elo).toBe(1024)
    expect(user.total_points).toBe(185)
  })

  it('should enforce ELO minimum of 100', () => {
    const { lastInsertRowid: id } = queries.createUser(db, testUser)
    queries.incrementUserStats(db, id, { eloChange: -1500 })
    const user = queries.findUserById(db, id)
    expect(user.elo).toBe(100)
  })
})

describe('Ranking Queries', () => {
  it('should return players sorted by ELO descending', () => {
    queries.createUser(db, { googleId: 'g1', displayName: 'Low', email: 'low@test.com' })
    queries.createUser(db, { googleId: 'g2', displayName: 'High', email: 'high@test.com' })
    queries.incrementUserStats(db, 2, { eloChange: 200 })

    const ranking = queries.getTopPlayers(db, 10)
    expect(ranking).toHaveLength(2)
    expect(ranking[0].display_name).toBe('High')
    expect(ranking[1].display_name).toBe('Low')
  })

  it('should respect limit', () => {
    for (let i = 0; i < 5; i++) {
      queries.createUser(db, { googleId: `g${i}`, displayName: `P${i}`, email: `p${i}@t.com` })
    }
    const ranking = queries.getTopPlayers(db, 3)
    expect(ranking).toHaveLength(3)
  })

  it('should calculate player rank', () => {
    queries.createUser(db, { googleId: 'g1', displayName: 'P1', email: 'p1@t.com' })
    queries.createUser(db, { googleId: 'g2', displayName: 'P2', email: 'p2@t.com' })
    queries.createUser(db, { googleId: 'g3', displayName: 'P3', email: 'p3@t.com' })
    queries.incrementUserStats(db, 2, { eloChange: 200 })
    queries.incrementUserStats(db, 3, { eloChange: 100 })

    const rank = queries.getPlayerRank(db, 3)
    expect(rank.rank).toBe(2)
  })
})

describe('Match Queries', () => {
  let player1Id, player2Id

  beforeEach(() => {
    player1Id = queries.createUser(db, { googleId: 'g1', displayName: 'P1', email: 'p1@t.com' }).lastInsertRowid
    player2Id = queries.createUser(db, { googleId: 'g2', displayName: 'P2', email: 'p2@t.com' }).lastInsertRowid
  })

  it('should create a match', () => {
    const result = queries.createMatch(db, { player1Id, player2Id })
    expect(result.changes).toBe(1)
  })

  it('should finish a match', () => {
    const { lastInsertRowid: matchId } = queries.createMatch(db, { player1Id, player2Id })
    queries.finishMatch(db, matchId, {
      winnerId: player1Id,
      result: 'win',
      player1Points: 185,
      player2Points: 60,
      player1EloChange: 24,
      player2EloChange: -24,
      totalPiecesExtracted: 12,
      durationSeconds: 300,
    })
    const match = queries.getMatchById(db, matchId)
    expect(match.winner_id).toBe(player1Id)
    expect(match.result).toBe('win')
    expect(match.player1_points).toBe(185)
  })

  it('should get player matches', () => {
    queries.createMatch(db, { player1Id, player2Id })
    queries.createMatch(db, { player1Id: player2Id, player2Id: player1Id })

    const matches = queries.getPlayerMatches(db, player1Id)
    expect(matches).toHaveLength(2)
  })
})

describe('Match Turn Queries', () => {
  let matchId, playerId

  beforeEach(() => {
    playerId = queries.createUser(db, { googleId: 'g1', displayName: 'P1', email: 'p1@t.com' }).lastInsertRowid
    const p2 = queries.createUser(db, { googleId: 'g2', displayName: 'P2', email: 'p2@t.com' }).lastInsertRowid
    matchId = queries.createMatch(db, { player1Id: playerId, player2Id: p2 }).lastInsertRowid
  })

  it('should create a match turn', () => {
    const result = queries.createMatchTurn(db, {
      matchId, playerId, turnNumber: 1, pieceLayer: 5, piecePosition: 1, difficulty: 2,
    })
    expect(result.changes).toBe(1)
  })

  it('should finish a match turn', () => {
    const { lastInsertRowid: turnId } = queries.createMatchTurn(db, {
      matchId, playerId, turnNumber: 1, pieceLayer: 5, piecePosition: 1, difficulty: 2,
    })
    queries.finishMatchTurn(db, turnId, {
      drawingsCompleted: 12, drawingsFailed: 2, timeRemainingMs: 18000, completed: true, pointsEarned: 25,
    })
    const turns = queries.getTurnsByMatch(db, matchId)
    expect(turns).toHaveLength(1)
    expect(turns[0].completed).toBe(1)
    expect(turns[0].points_earned).toBe(25)
  })
})
