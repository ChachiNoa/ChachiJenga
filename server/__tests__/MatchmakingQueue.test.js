const { MatchmakingQueue } = require('../matchmaking/MatchmakingQueue');

describe('MatchmakingQueue', () => {
  let queue;
  let mockOnMatch;

  beforeEach(() => {
    mockOnMatch = jest.fn();
    queue = new MatchmakingQueue(mockOnMatch);
  });

  it('should add a player to the queue', () => {
    queue.addPlayer('socket1', { id: 'user1', name: 'Player 1' });
    expect(queue.getQueueSize()).toBe(1);
    expect(mockOnMatch).not.toHaveBeenCalled();
  });

  it('should remove a player from the queue', () => {
    queue.addPlayer('socket1', { id: 'user1', name: 'Player 1' });
    queue.removePlayer('socket1');
    expect(queue.getQueueSize()).toBe(0);
  });

  it('should match two players and remove them from the queue', () => {
    queue.addPlayer('socket1', { id: 'user1', name: 'Player 1' });
    queue.addPlayer('socket2', { id: 'user2', name: 'Player 2' });
    
    expect(mockOnMatch).toHaveBeenCalledWith(
      { socketId: 'socket1', user: { id: 'user1', name: 'Player 1' } },
      { socketId: 'socket2', user: { id: 'user2', name: 'Player 2' } }
    );
    expect(queue.getQueueSize()).toBe(0);
  });

  it('should not match a player with themselves', () => {
    queue.addPlayer('socket1', { id: 'user1', name: 'Player 1' });
    // Same user ID but maybe a different socket, shouldn't normally happen but good to check
    queue.addPlayer('socket2', { id: 'user1', name: 'Player 1' });
    
    // In this basic version, we might just match them, but let's say the queue
    // shouldn't match two entries with the same user ID. 
    // Actually, maybe it just updates the socket? Let's specify that if the user pushes again, 
    // it updates or ignores, but doesn't match against self.
    expect(mockOnMatch).not.toHaveBeenCalled();
    expect(queue.getQueueSize()).toBe(1); // Or 2 depending on implementation, but shouldn't match
  });
});
