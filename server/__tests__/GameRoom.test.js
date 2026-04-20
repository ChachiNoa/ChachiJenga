const { GameRoom } = require('../game/GameRoom');

describe('GameRoom', () => {
  let room;
  let mockIo;
  let p1, p2;

  beforeEach(() => {
    p1 = { socketId: 's1', user: { id: 'u1' } };
    p2 = { socketId: 's2', user: { id: 'u2' } };
    
    mockIo = {
      to: jest.fn().mockReturnThis(),
      emit: jest.fn()
    };
    
    room = new GameRoom('room1', p1, p2, mockIo);
  });

  it('should initialize and randomly select a current player', () => {
    expect(['s1', 's2']).toContain(room.getCurrentPlayer().socketId);
    expect(room.status).toBe('WAITING');
  });

  it('should start game and emit event', () => {
    room.startGame();
    expect(room.status).toBe('IN_PROGRESS');
    expect(mockIo.to).toHaveBeenCalledWith('room1');
    expect(mockIo.emit).toHaveBeenCalledWith('game_started', expect.any(Object));
  });

  it('should switch turns', () => {
    const initialTurn = room.getCurrentPlayer().socketId;
    room.switchTurn();
    const newTurn = room.getCurrentPlayer().socketId;
    
    expect(newTurn).not.toBe(initialTurn);
    expect(mockIo.emit).toHaveBeenCalledWith('turn_changed', expect.any(Object));
  });

  it('should handle forfeit', () => {
    room.startGame();
    room.handleForfeit('s1');
    expect(room.status).toBe('ENDED');
    // endGame now emits individually to each player socket
    expect(mockIo.to).toHaveBeenCalledWith('s1');
    expect(mockIo.to).toHaveBeenCalledWith('s2');
    expect(mockIo.emit).toHaveBeenCalledWith('game_over', expect.objectContaining({
      reason: 'FORFEIT',
      summary: expect.any(Object)
    }));
  });

  it('should prevent acting out of turn', () => {
    room.startGame();
    const wrongTurn = room.getCurrentPlayer().socketId === 's1' ? 's2' : 's1';
    const result = room.handleSelectPiece(wrongTurn, 0, 0);
    expect(result.success).toBe(false);
    expect(result.reason).toBe('Not your turn');
  });

  it('should handle piece extracted and switch turn', () => {
    room.startGame();
    const currentPlayer = room.getCurrentPlayer().socketId;
    
    // Select first layer piece
    const selectRes = room.handleSelectPiece(currentPlayer, 0, 0);
    expect(selectRes.success).toBe(true);
    
    const extractRes = room.handlePieceExtracted(currentPlayer, 0, 0);
    expect(extractRes.success).toBe(true);
    
    const newTurn = room.getCurrentPlayer().socketId;
    expect(newTurn).not.toBe(currentPlayer);
  });
});
