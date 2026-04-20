const express = require('express');

function createRankingRouter(db) {
  const router = express.Router();

  router.get('/', (req, res) => {
    try {
      const topPlayers = db.prepare(`
        SELECT id, display_name as displayName, elo, games_won as gamesWon, pieces_extracted as piecesExtracted
        FROM users
        ORDER BY elo DESC, games_won DESC
        LIMIT 100
      `).all();

      // Ensure rank is added
      const ranking = topPlayers.map((player, index) => ({
        ...player,
        rank: index + 1
      }));

      res.json({ ranking });
    } catch (e) {
      console.error('[Ranking API]', e);
      res.status(500).json({ error: 'Failed to fetch ranking' });
    }
  });

  return router;
}

module.exports = { createRankingRouter };
