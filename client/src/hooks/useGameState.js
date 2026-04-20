import { useState, useCallback } from 'react';

export function useGameState(initialState = null) {
  const [gameState, setGameState] = useState(initialState || {
    tower: null,
    turn: null, // socketId of the current player
    myScore: 0,
    opponentScore: 0,
    status: 'WAITING'
  });

  const updateGameState = useCallback((updates) => {
    setGameState(prev => ({ ...prev, ...updates }));
  }, []);

  return { gameState, updateGameState, setGameState };
}
