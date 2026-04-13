CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  google_id TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  elo INTEGER DEFAULT 1000,
  total_points INTEGER DEFAULT 0,
  games_played INTEGER DEFAULT 0,
  games_won INTEGER DEFAULT 0,
  games_lost INTEGER DEFAULT 0,
  games_drawn INTEGER DEFAULT 0,
  pieces_extracted INTEGER DEFAULT 0,
  shapes_drawn INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_login DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS matches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player1_id INTEGER NOT NULL REFERENCES users(id),
  player2_id INTEGER NOT NULL REFERENCES users(id),
  winner_id INTEGER REFERENCES users(id),
  result TEXT CHECK(result IN ('win', 'draw', 'forfeit')),
  player1_points INTEGER DEFAULT 0,
  player2_points INTEGER DEFAULT 0,
  player1_elo_change INTEGER DEFAULT 0,
  player2_elo_change INTEGER DEFAULT 0,
  total_pieces_extracted INTEGER DEFAULT 0,
  duration_seconds INTEGER DEFAULT 0,
  game_log TEXT,
  played_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS match_turns (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  match_id INTEGER NOT NULL REFERENCES matches(id),
  player_id INTEGER NOT NULL REFERENCES users(id),
  turn_number INTEGER NOT NULL,
  piece_layer INTEGER NOT NULL,
  piece_position INTEGER NOT NULL,
  difficulty INTEGER CHECK(difficulty BETWEEN 1 AND 3),
  drawings_completed INTEGER DEFAULT 0,
  drawings_failed INTEGER DEFAULT 0,
  time_remaining_ms INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT 0,
  points_earned INTEGER DEFAULT 0
);
