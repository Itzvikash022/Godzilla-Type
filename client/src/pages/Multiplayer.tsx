import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../hooks/useSocket';
import { SocketEvents } from '@godzilla-type/shared';

function Multiplayer() {
  const navigate = useNavigate();
  const { emit, on, isConnected } = useSocket();
  const [playerName, setPlayerName] = useState(localStorage.getItem('godzilla-player-name') || '');
  const [roomCode, setRoomCode] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const cleanups: (() => void)[] = [];

    cleanups.push(on(SocketEvents.ROOM_CREATED, (data: { room: { code: string } }) => {
      navigate(`/room/${data.room.code}`);
    }));

    cleanups.push(on(SocketEvents.ROOM_UPDATED, (data: { room: { code: string } }) => {
      navigate(`/room/${data.room.code}`);
    }));

    cleanups.push(on(SocketEvents.ERROR, (data: { message: string }) => {
      setError(data.message);
    }));

    return () => cleanups.forEach((c) => c());
  }, [on, navigate]);

  const handleCreateRoom = () => {
    if (!playerName.trim()) {
      setError('Enter a nickname first');
      return;
    }
    localStorage.setItem('godzilla-player-name', playerName);
    emit(SocketEvents.CREATE_ROOM, { playerName });
  };

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim()) {
      setError('Enter a nickname first');
      return;
    }
    if (roomCode.length !== 6) {
      setError('Room code must be 6 characters');
      return;
    }
    localStorage.setItem('godzilla-player-name', playerName);
    emit(SocketEvents.JOIN_ROOM, { roomCode: roomCode.toUpperCase(), playerName });
  };

  return (
    <div className="flex-1 flex items-center justify-center max-w-4xl mx-auto w-full px-6">
      <div className="w-full space-y-12 animate-fade-in">
        <div className="text-center space-y-2">
           <h2 className="text-3xl font-bold tracking-tighter text-text-primary">Multiplayer Race</h2>
           <p className="text-[10px] uppercase tracking-[0.3em] text-main-sub">Ready to roll?</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 bg-bg-secondary/40 p-12 rounded-2xl border border-main-sub/10">
          {/* Settings */}
          <div className="space-y-6">
             <div className="space-y-2">
               <label className="text-[10px] uppercase tracking-widest text-main-sub">Your Nickname</label>
               <input 
                 type="text" 
                 value={playerName}
                 onChange={(e) => setPlayerName(e.target.value)}
                 className="w-full bg-bg-primary border-b-2 border-main-sub/20 p-2 text-text-primary outline-none focus:border-main transition-colors font-mono"
                 placeholder="Enter name..."
                 maxLength={15}
               />
             </div>
             
             <button 
                onClick={handleCreateRoom}
                className="w-full py-3 bg-main/5 text-main border border-main/20 rounded hover:bg-main/10 transition-all font-mono text-xs uppercase tracking-widest"
             >
               create new room
             </button>
          </div>

          {/* Join */}
          <form onSubmit={handleJoinRoom} className="space-y-6 md:border-l md:border-main-sub/10 md:pl-12">
            <div className="space-y-2">
               <label className="text-[10px] uppercase tracking-widest text-main-sub">Join Room</label>
               <input 
                 type="text" 
                 value={roomCode}
                 onChange={(e) => setRoomCode(e.target.value)}
                 className="w-full bg-bg-primary border-b-2 border-main-sub/20 p-2 text-text-primary outline-none focus:border-main transition-colors font-mono tracking-widest uppercase"
                 placeholder="6-char code"
                 maxLength={6}
               />
             </div>
             
             <button 
                type="submit"
                className="w-full py-3 bg-bg-primary text-text-primary border border-text-primary/10 rounded hover:border-text-primary/30 transition-all font-mono text-xs uppercase tracking-widest"
             >
               join existing
             </button>
          </form>
        </div>

        {error && (
          <div className="text-center text-error font-mono text-xs uppercase tracking-widest animate-pulse">
            {error}
          </div>
        )}

        {!isConnected && (
           <div className="text-center text-main-sub text-[10px] uppercase tracking-widest">
             Connecting to socket server...
           </div>
        )}
      </div>
    </div>
  );
}

export default Multiplayer;
