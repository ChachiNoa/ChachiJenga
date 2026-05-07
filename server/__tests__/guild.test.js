const { setupDatabase } = require('../db/setup')
const queries = require('../db/queries')

let db

beforeEach(() => {
  db = setupDatabase(':memory:')
})

afterEach(() => {
  db.close()
})

describe('Guilds Queries', () => {
  let user1, user2, user3

  beforeEach(() => {
    user1 = queries.createUser(db, { googleId: 'g1', displayName: 'Owner', email: 'o@t.com', tag: '#00001' }).lastInsertRowid
    user2 = queries.createUser(db, { googleId: 'g2', displayName: 'Member', email: 'm@t.com', tag: '#00002' }).lastInsertRowid
    user3 = queries.createUser(db, { googleId: 'g3', displayName: 'Outsider', email: 'out@t.com', tag: '#00003' }).lastInsertRowid
  })

  it('should create a guild and return id', () => {
    const result = queries.createGuild(db, { name: 'Chachis', ownerId: user1, description: 'Los chachis', isPublic: 1 })
    expect(result.changes).toBe(1)
    expect(result.lastInsertRowid).toBeDefined()
  })

  it('should get guild by id', () => {
    const guildId = queries.createGuild(db, { name: 'Chachis', ownerId: user1, description: 'test', isPublic: 0 }).lastInsertRowid
    const guild = queries.getGuildById(db, guildId)
    expect(guild.name).toBe('Chachis')
    expect(guild.ownerId).toBe(user1)
    expect(guild.isPublic).toBe(0)
  })

  it('should allow joining and leaving a guild', () => {
    const guildId = queries.createGuild(db, { name: 'Chachis', ownerId: user1, description: 'test', isPublic: 1 }).lastInsertRowid
    
    // Join
    queries.joinGuild(db, user2, guildId)
    let members = queries.getGuildMembers(db, guildId)
    expect(members).toHaveLength(1)
    expect(members[0].id).toBe(user2)

    // Leave
    queries.leaveGuild(db, user2)
    members = queries.getGuildMembers(db, guildId)
    expect(members).toHaveLength(0)
  })

  it('should delete a guild and remove members', () => {
    const guildId = queries.createGuild(db, { name: 'Chachis', ownerId: user1, description: 'test', isPublic: 1 }).lastInsertRowid
    queries.joinGuild(db, user1, guildId)
    queries.joinGuild(db, user2, guildId)

    queries.deleteGuild(db, guildId)
    
    const members = queries.getGuildMembers(db, guildId)
    expect(members).toHaveLength(0)
    
    const guild = queries.getGuildById(db, guildId)
    expect(guild).toBeUndefined()
  })

  it('should get guilds ranking', () => {
    const g1 = queries.createGuild(db, { name: 'G1', ownerId: user1 }).lastInsertRowid
    const g2 = queries.createGuild(db, { name: 'G2', ownerId: user3 }).lastInsertRowid

    queries.joinGuild(db, user1, g1) // Owner in G1
    queries.joinGuild(db, user2, g1) // Member in G1
    queries.joinGuild(db, user3, g2) // Owner in G2

    // Give points
    queries.incrementUserStats(db, user1, { pointsChange: 100 })
    queries.incrementUserStats(db, user2, { pointsChange: 50 })
    queries.incrementUserStats(db, user3, { pointsChange: 200 })

    const ranking = queries.getGuildsRanking(db, 10)
    expect(ranking).toHaveLength(2)
    
    // G2 has 200, G1 has 150
    expect(ranking[0].name).toBe('G2')
    expect(ranking[0].totalPoints).toBe(200)
    expect(ranking[0].memberCount).toBe(1)
    
    expect(ranking[1].name).toBe('G1')
    expect(ranking[1].totalPoints).toBe(150)
    expect(ranking[1].memberCount).toBe(2)
  })
})
