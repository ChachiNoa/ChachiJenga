const { setupDatabase } = require('../db/setup')
const { generateToken, verifyToken } = require('../auth/authService')
const { createAuthMiddleware } = require('../auth/authMiddleware')
const { createUser, findUserByGoogleId } = require('../db/queries')

let db

beforeEach(() => {
  db = setupDatabase(':memory:')
})

afterEach(() => {
  db.close()
})

describe('AuthService - Token Generation', () => {
  it('should generate a valid JWT token', () => {
    const user = { id: 1, google_id: 'g123' }
    const token = generateToken(user)

    expect(token).toBeDefined()
    expect(typeof token).toBe('string')
    expect(token.split('.')).toHaveLength(3) // JWT has 3 parts
  })

  it('should include userId and googleId in token payload', () => {
    const user = { id: 42, google_id: 'g456' }
    const token = generateToken(user)
    const decoded = verifyToken(token)

    expect(decoded.userId).toBe(42)
    expect(decoded.googleId).toBe('g456')
  })

  it('should reject an invalid token', () => {
    expect(() => verifyToken('invalid.token.here')).toThrow()
  })

  it('should reject a tampered token', () => {
    const user = { id: 1, google_id: 'g123' }
    const token = generateToken(user)
    const tampered = token.slice(0, -5) + 'XXXXX'

    expect(() => verifyToken(tampered)).toThrow()
  })
})

describe('AuthService - User Creation via DB', () => {
  it('should create a new user on first login', () => {
    const result = createUser(db, {
      googleId: 'google-new-user',
      displayName: 'New Player',
      email: 'new@example.com',
      avatarUrl: 'https://example.com/pic.jpg',
    })

    expect(result.changes).toBe(1)

    const user = findUserByGoogleId(db, 'google-new-user')
    expect(user.display_name).toBe('New Player')
    expect(user.elo).toBe(1000)
  })

  it('should find existing user on repeat login', () => {
    createUser(db, {
      googleId: 'google-existing',
      displayName: 'Existing Player',
      email: 'existing@example.com',
    })

    const user = findUserByGoogleId(db, 'google-existing')
    expect(user).toBeDefined()
    expect(user.display_name).toBe('Existing Player')
  })

  it('should reject duplicate google IDs', () => {
    const userData = {
      googleId: 'google-dup',
      displayName: 'Dup Player',
      email: 'dup@example.com',
    }
    createUser(db, userData)
    expect(() => createUser(db, { ...userData, email: 'dup2@example.com' })).toThrow()
  })
})

describe('AuthMiddleware', () => {
  let middleware

  beforeEach(() => {
    middleware = createAuthMiddleware(db)
  })

  function mockReqRes(headers = {}) {
    const req = { headers }
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    }
    const next = jest.fn()
    return { req, res, next }
  }

  it('should reject requests without Authorization header', () => {
    const { req, res, next } = mockReqRes()
    middleware(req, res, next)

    expect(res.status).toHaveBeenCalledWith(401)
    expect(next).not.toHaveBeenCalled()
  })

  it('should reject requests with invalid token format', () => {
    const { req, res, next } = mockReqRes({ authorization: 'InvalidFormat' })
    middleware(req, res, next)

    expect(res.status).toHaveBeenCalledWith(401)
    expect(next).not.toHaveBeenCalled()
  })

  it('should reject requests with invalid JWT', () => {
    const { req, res, next } = mockReqRes({ authorization: 'Bearer invalid.token' })
    middleware(req, res, next)

    expect(res.status).toHaveBeenCalledWith(401)
    expect(next).not.toHaveBeenCalled()
  })

  it('should accept requests with valid token and attach user', () => {
    const { lastInsertRowid: userId } = createUser(db, {
      googleId: 'g-auth-test',
      displayName: 'Auth Test',
      email: 'auth@test.com',
    })

    const token = generateToken({ id: userId, google_id: 'g-auth-test' })
    const { req, res, next } = mockReqRes({ authorization: `Bearer ${token}` })
    middleware(req, res, next)

    expect(next).toHaveBeenCalled()
    expect(req.user).toBeDefined()
    expect(req.user.id).toBe(userId)
    expect(req.user.display_name).toBe('Auth Test')
  })

  it('should reject valid token for non-existent user', () => {
    const token = generateToken({ id: 9999, google_id: 'g-nonexistent' })
    const { req, res, next } = mockReqRes({ authorization: `Bearer ${token}` })
    middleware(req, res, next)

    expect(res.status).toHaveBeenCalledWith(401)
    expect(next).not.toHaveBeenCalled()
  })
})
