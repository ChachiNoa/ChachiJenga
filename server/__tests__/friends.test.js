const { setupDatabase } = require('../db/setup')
const queries = require('../db/queries')

let db

beforeEach(() => {
  db = setupDatabase(':memory:')
})

afterEach(() => {
  db.close()
})

describe('Friendships Queries', () => {
  let user1, user2, user3

  beforeEach(() => {
    user1 = queries.createUser(db, { googleId: 'g1', displayName: 'P1', email: 'p1@t.com', tag: '#00001' }).lastInsertRowid
    user2 = queries.createUser(db, { googleId: 'g2', displayName: 'P2', email: 'p2@t.com', tag: '#00002' }).lastInsertRowid
    user3 = queries.createUser(db, { googleId: 'g3', displayName: 'P3', email: 'p3@t.com', tag: '#00003' }).lastInsertRowid
  })

  it('should send a friend request', () => {
    const result = queries.sendFriendRequest(db, user1, user2)
    expect(result.changes).toBe(1)
  })

  it('should get pending friend requests', () => {
    queries.sendFriendRequest(db, user1, user2)
    queries.sendFriendRequest(db, user3, user2)
    
    const pending = queries.getPendingFriendRequests(db, user2)
    expect(pending).toHaveLength(2)
    expect(pending[0].userId).toBeDefined()
    expect(pending[0].tag).toBeDefined()
  })

  it('should not return pending requests if they are accepted or rejected', () => {
    queries.sendFriendRequest(db, user1, user2)
    const pending = queries.getPendingFriendRequests(db, user2)
    const reqId = pending[0].friendshipId
    
    queries.updateFriendRequestStatus(db, reqId, user2, 'accepted')
    
    const pendingAfter = queries.getPendingFriendRequests(db, user2)
    expect(pendingAfter).toHaveLength(0)
  })

  it('should return friends list with accepted requests', () => {
    // 1 -> 2 accepted
    queries.sendFriendRequest(db, user1, user2)
    let reqs = queries.getPendingFriendRequests(db, user2)
    queries.updateFriendRequestStatus(db, reqs[0].friendshipId, user2, 'accepted')

    // 3 -> 1 accepted
    queries.sendFriendRequest(db, user3, user1)
    reqs = queries.getPendingFriendRequests(db, user1)
    queries.updateFriendRequestStatus(db, reqs[0].friendshipId, user1, 'accepted')

    // 2 -> 3 pending
    queries.sendFriendRequest(db, user2, user3)

    const friendsOf1 = queries.getFriends(db, user1)
    expect(friendsOf1).toHaveLength(2)
    const friendNames = friendsOf1.map(f => f.displayName).sort()
    expect(friendNames).toEqual(['P2', 'P3'])
  })

  it('should delete a friendship', () => {
    queries.sendFriendRequest(db, user1, user2)
    const reqs = queries.getPendingFriendRequests(db, user2)
    queries.updateFriendRequestStatus(db, reqs[0].friendshipId, user2, 'accepted')

    const result = queries.deleteFriendship(db, reqs[0].friendshipId, user1)
    expect(result.changes).toBe(1)

    const friendsOf1 = queries.getFriends(db, user1)
    expect(friendsOf1).toHaveLength(0)
  })
})
