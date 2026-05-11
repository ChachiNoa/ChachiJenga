CREATE TABLE IF NOT EXISTS guilds (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  owner_id INTEGER NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  google_id TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  tag TEXT UNIQUE,
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
  guild_id INTEGER REFERENCES guilds(id),
  guild_role TEXT CHECK(guild_role IN ('member', 'admin')) DEFAULT 'member',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_login DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS friendships (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  requester_id INTEGER NOT NULL REFERENCES users(id),
  addressee_id INTEGER NOT NULL REFERENCES users(id),
  status TEXT CHECK(status IN ('pending', 'accepted', 'rejected')) DEFAULT 'pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(requester_id, addressee_id)
);

CREATE TABLE IF NOT EXISTS guild_invitations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  guild_id INTEGER NOT NULL REFERENCES guilds(id),
  inviter_id INTEGER NOT NULL REFERENCES users(id),
  invitee_id INTEGER NOT NULL REFERENCES users(id),
  status TEXT CHECK(status IN ('pending', 'accepted', 'rejected')) DEFAULT 'pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(guild_id, invitee_id)
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
