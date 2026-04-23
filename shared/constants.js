// Socket.io event type constants shared between client and server

const EVENTS = {
  // Matchmaking
  FIND_MATCH: 'find_match',
  CANCEL_FIND: 'cancel_find',
  MATCH_FOUND: 'match_found',

  // Game flow
  SELECT_PIECE: 'select_piece',
  START_CHALLENGE: 'start_challenge',
  DRAWING_RESULT: 'drawing_result',
  PHASE_UPDATE: 'phase_update',
  PIECE_EXTRACTED: 'piece_extracted',
  TOWER_COLLAPSED: 'tower_collapsed',
  TOWER_UPDATE: 'tower_update',
  GAME_OVER: 'game_over',

  // Drawing streaming
  STROKE_DATA: 'stroke_data',
  STROKE_CLEAR: 'stroke_clear',

  // Connection
  PLAYER_DISCONNECTED: 'player_disconnected',
  PLAYER_RECONNECTED: 'player_reconnected',
}

// Game constants
const GAME = {
  TOWER_LAYERS: 18,
  PIECES_PER_LAYER: 3,
  TOTAL_PIECES: 54,
  PROTECTED_TOP_LAYERS: 0,

  TIMER_SECONDS: 45,
  ERROR_PENALTY_SECONDS: 4,

  DIFFICULTY: {
    EASY: 1,
    MEDIUM: 2,
    HARD: 3,
  },

  DRAWINGS_PER_PHASE: {
    1: 3,       // Easy: 3 per phase
    2: [4, 5],  // Medium: 4-5 per phase
    3: [5, 6],  // Hard: 5-6 per phase
  },

  POINTS_PER_PIECE: {
    1: 10,  // Easy
    2: 25,  // Medium
    3: 50,  // Hard
  },

  VICTORY_BONUS: 100,
  DEFEAT_PENALTY: -50,
  FORFEIT_PENALTY: -75,

  DRAW_MULTIPLIER: 0.6,
  DRAW_DIFFICULTY_BONUS: {
    1: 0,   // Easy
    2: 3,   // Medium
    3: 8,   // Hard
  },

  ELO_MIN: 100,
  ELO_K: {
    NEW: 32,       // < 30 games
    REGULAR: 24,   // 30-100 games
    VETERAN: 16,   // > 100 games
  },
  FORFEIT_ELO_MULTIPLIER: 1.2,
}

module.exports = { EVENTS, GAME }

