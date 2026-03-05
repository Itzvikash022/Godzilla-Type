import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../hooks/useSocket';
import { SocketEvents } from '@godzilla-type/shared';
import type { Room } from '@godzilla-type/shared';

function Multiplayer() {
  const [playerName, setPlayerName] = useState(
    () => localStorage.getItem('godzilla-player-name') || ''
  );
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { emit, on, isConnected } = useSocket();

  const handleCreateRoom = () => {
    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }
    localStorage.setItem('godzilla-player-name', playerName.trim());
    setIsLoading(true);
    setError('');

    const cleanup = on(SocketEvents.ROOM_CREATED, (data: { room: Room }) => {
      cleanup();
      navigate(`/room/${data.room.code}`);
    });

    const cleanupError = on(SocketEvents.ERROR, (data: { message: string }) => {
      cleanupError();
      setError(data.message);
      setIsLoading(false);
    });

    emit(SocketEvents.CREATE_ROOM, { playerName: playerName.trim() });
  };

  const handleJoinRoom = () => {
    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }
    if (!joinCode.trim() || joinCode.trim().length !== 6) {
      setError('Please enter a valid 6-character room code');
      return;
    }
    localStorage.setItem('godzilla-player-name', playerName.trim());
    setIsLoading(true);
    setError('');

    const cleanup = on(SocketEvents.ROOM_UPDATED, (data: { room: Room }) => {
      cleanup();
      navigate(`/room/${data.room.code}`);
    });

    const cleanupError = on(SocketEvents.ERROR, (data: { message: string }) => {
      cleanupError();
      setError(data.message);
      setIsLoading(false);
    });

    emit(SocketEvents.JOIN_ROOM, {
      roomCode: joinCode.trim().toUpperCase(),
      playerName: playerName.trim(),
    });
  };

  return (
    <div className="max-w-lg mx-auto px-6 py-16">
      <div className="text-center mb-10 animate-fade-in">
        <h1 className="text-3xl font-bold text-text-primary mb-2">Multiplayer Race</h1>
        <p className="text-text-secondary">Create or join a room to race with coworkers</p>
      </div>

      {/* Connection Status */}
      <div className={`flex items-center justify-center gap-2 mb-8 text-sm ${isConnected ? 'text-success' : 'text-error'}`}>
        <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-success' : 'bg-error'} animate-pulse`} />
        {isConnected ? 'Connected to server' : 'Connecting...'}
      </div>

      {/* Name Input */}
      <div className="glass-card p-6 rounded-2xl mb-6 animate-slide-up">
        <label className="block text-text-secondary text-sm mb-2">Your Name</label>
        <input
          type="text"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          placeholder="Enter your name..."
          maxLength={20}
          className="w-full bg-bg-primary border border-white/10 rounded-xl px-4 py-3 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-primary/50 focus:ring-1 focus:ring-accent-primary/30 transition-all"
        />
      </div>

      {/* Create Room */}
      <div className="glass-card p-6 rounded-2xl mb-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
        <h2 className="text-lg font-semibold text-text-primary mb-3">🏠 Create a Room</h2>
        <p className="text-text-secondary text-sm mb-4">Start a new race room and invite others with a code.</p>
        <button
          onClick={handleCreateRoom}
          disabled={isLoading || !isConnected}
          className="w-full py-3 rounded-xl bg-accent-primary text-bg-primary font-semibold hover:bg-accent-secondary transition-all disabled:opacity-50 disabled:cursor-not-allowed btn-glow"
        >
          {isLoading ? 'Creating...' : 'Create Room'}
        </button>
      </div>

      {/* Join Room */}
      <div className="glass-card p-6 rounded-2xl animate-slide-up" style={{ animationDelay: '0.2s' }}>
        <h2 className="text-lg font-semibold text-text-primary mb-3">🔗 Join a Room</h2>
        <p className="text-text-secondary text-sm mb-4">Enter a 6-character room code to join.</p>
        <div className="flex gap-3">
          <input
            type="text"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            placeholder="Room code (e.g. AB12CD)"
            maxLength={6}
            className="flex-1 bg-bg-primary border border-white/10 rounded-xl px-4 py-3 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-primary/50 font-mono text-center tracking-widest uppercase transition-all"
          />
          <button
            onClick={handleJoinRoom}
            disabled={isLoading || !isConnected}
            className="px-6 py-3 rounded-xl bg-bg-hover text-text-primary font-semibold hover:bg-accent-primary hover:text-bg-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Join
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mt-4 p-3 rounded-xl bg-error/10 border border-error/20 text-error text-sm text-center animate-fade-in">
          {error}
        </div>
      )}
    </div>
  );
}

export default Multiplayer;
