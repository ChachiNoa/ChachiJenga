const express = require('express');

function createProfileRouter(db) {
  const router = express.Router();

  router.get('/:id', (req, res) => {
    try {
      const { id } = req.params;
      const user = db.prepare(`
        SELECT 
          id, display_name as displayName, avatar_url as avatarUrl, elo, 
          games_played as gamesPlayed, games_won as gamesWon, 
          games_lost as gamesLost, games_drawn as gamesDrawn,
          pieces_extracted as piecesExtracted, shapes_drawn as shapesDrawn
        FROM users
        WHERE id = ? OR google_id = ?
      `).get(id, id);

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const recentMatches = db.prepare(`
        SELECT played_at as playedAt, player1_id, player2_id, winner_id, result,
           CASE 
             WHEN player1_id = ? THEN player1_elo_change
             ELSE player2_elo_change
           END as eloChange,
           CASE 
             WHEN player1_id = ? THEN player1_points
             ELSE player2_points
           END as matchPoints
        FROM matches 
        WHERE player1_id = ? OR player2_id = ?
        ORDER BY played_at DESC
        LIMIT 10
      `).all(user.id, user.id, user.id, user.id);

      res.json({ user, recentMatches });
    } catch (e) {
      console.error('[Profile API]', e);
      res.status(500).json({ error: 'Failed to fetch profile' });
    }
  });

  return router;
}

module.exports = { createProfileRouter };
