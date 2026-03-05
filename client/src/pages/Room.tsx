import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSocket } from '../hooks/useSocket';
import { useTypingEngine } from '../hooks/useTypingEngine';
import type { TypingState } from '../hooks/useTypingEngine';
import TypingArea from '../components/TypingArea';
import ProgressBar from '../components/ProgressBar';
import Countdown from '../components/Countdown';
import Leaderboard from '../components/Leaderboard';
import TimerSelector from '../components/TimerSelector';
import { saveResult } from '../lib/db';
import {
  SocketEvents,
  RaceState,
  TeamColor,
  TEAM_COLORS,
  PROGRESS_BROADCAST_INTERVAL,
} from '@godzilla-type/shared';
import type {
  Room as RoomType,
  Player,
  RaceStartData,
  CountdownData,
  RaceResultsData,
} from '@godzilla-type/shared';

function Room() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { emit, on, isConnected, socket } = useSocket();

  const [room, setRoom] = useState<RoomType | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [raceData, setRaceData] = useState<RaceStartData | null>(null);
  const [raceResults, setRaceResults] = useState<RaceResultsData | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);

  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const playerName = localStorage.getItem('godzilla-player-name') || 'Player';
  const currentPlayerId = socket?.id || '';
  const isHost = room?.hostId === currentPlayerId;
  const isLobby = room?.state === RaceState.LOBBY;
  const isCountingDown = room?.state === RaceState.COUNTDOWN;
  const isRacing = room?.state === RaceState.RACING;
  const isFinished = room?.state === RaceState.FINISHED;

  const handleFinish = useCallback((state: TypingState) => {
    emit(SocketEvents.PLAYER_PROGRESS, {
      roomCode: code,
      charsTyped: state.totalCharsTyped,
      errors: state.incorrectChars,
      wpm: state.wpm,
      netWpm: state.netWpm,
      accuracy: state.accuracy,
      progress: 100,
      isFinished: true,
    });

    saveResult({
      playerName,
      wpm: state.wpm,
      netWpm: state.netWpm,
      accuracy: state.accuracy,
      finishOrder: 0,
      timestamp: Date.now(),
      roomCode: code || '',
      timerDuration: raceData?.duration || 30,
    }).catch(console.error);
  }, [code, emit, playerName, raceData]);

  const engine = useTypingEngine({
    duration: raceData?.duration || 30,
    providedWords: raceData?.words,
    providedPrompt: raceData?.prompt,
    onProgress: () => {},
    onFinish: handleFinish,
  });

  useEffect(() => {
    if (!isConnected) return;
    const cleanups: (() => void)[] = [];

    cleanups.push(on(SocketEvents.ROOM_UPDATED, (data: { room: RoomType }) => {
      setRoom(data.room);
      setPlayers(data.room.players);
    }));

    cleanups.push(on(SocketEvents.RACE_COUNTDOWN, (data: CountdownData) => {
      setCountdown(data.count);
    }));

    cleanups.push(on(SocketEvents.RACE_START, (data: RaceStartData) => {
      setRaceData(data);
      setCountdown(null);
      setRaceResults(null);
      engine.resetTest(data.words, data.prompt);
    }));

    cleanups.push(on(SocketEvents.RACE_PROGRESS, (data: { players: Player[] }) => {
      setPlayers(data.players);
    }));

    cleanups.push(on(SocketEvents.RACE_FINISHED, (data: RaceResultsData) => {
      setRaceResults(data);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    }));

    if (code && playerName) {
      emit(SocketEvents.JOIN_ROOM, { roomCode: code, playerName });
    }

    return () => cleanups.forEach((c) => c());
  }, [isConnected, on, code, playerName, emit]);

  useEffect(() => {
    if (isRacing && !engine.isFinished) {
      progressIntervalRef.current = setInterval(() => {
        emit(SocketEvents.PLAYER_PROGRESS, {
          roomCode: code,
          charsTyped: engine.totalCharsTyped,
          errors: engine.incorrectChars,
          wpm: engine.wpm,
          netWpm: engine.netWpm,
          accuracy: engine.accuracy,
          progress: engine.progress,
          isFinished: engine.isFinished,
        });
      }, PROGRESS_BROADCAST_INTERVAL);

      return () => {
        if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      };
    }
  }, [isRacing, engine.isFinished, engine.totalCharsTyped, engine.wpm, engine.netWpm, engine.accuracy, engine.progress, code, emit]);

  const handleStartRace = () => emit(SocketEvents.START_RACE, { roomCode: code });
  const handleRestartRace = () => {
    emit(SocketEvents.RESTART_RACE, { roomCode: code });
    setRaceResults(null);
    setRaceData(null);
  };
  const handleLeaveRoom = () => {
    emit(SocketEvents.LEAVE_ROOM, { roomCode: code });
    navigate('/multiplayer');
  };
  const handleAssignTeam = (playerId: string, team: TeamColor) => {
    emit(SocketEvents.ASSIGN_TEAM, { roomCode: code, playerId, team });
  };
  const handleUpdateDuration = (duration: number) => {
    emit(SocketEvents.UPDATE_SETTINGS, {
      roomCode: code,
      settings: { timerDuration: duration },
    });
  };

  if (!room) return <div className="flex-1 flex items-center justify-center text-main-sub animate-pulse">connecting...</div>;

  return (
    <div className="flex-1 flex flex-col max-w-7xl mx-auto w-full px-6 py-12">
      {/* Lobby Header */}
      <div className="flex items-center justify-between mb-12 opacity-80">
        <div className="flex items-center gap-4">
          <span className="text-xs uppercase tracking-[0.2em] text-main-sub">room code</span>
          <span className="text-xl font-bold font-mono text-main">{code}</span>
        </div>
        <button onClick={handleLeaveRoom} className="text-xs uppercase tracking-widest text-main-sub hover:text-error transition-colors">
          leave room
        </button>
      </div>

      {isCountingDown && countdown !== null && <Countdown count={countdown} />}

      {/* LOBBY STATE */}
      {isLobby && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 animate-fade-in">
          <div className="space-y-8">
            <h2 className="text-sm uppercase tracking-[0.3em] text-main-sub border-b border-main-sub/10 pb-2">Settings</h2>
            
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-secondary">Race Duration</span>
                <TimerSelector selected={room.settings.timerDuration} onSelect={handleUpdateDuration} disabled={!isHost} />
              </div>

              {isHost && (
                <button
                  onClick={handleStartRace}
                  className="w-full py-4 bg-bg-secondary text-main border border-main/20 rounded hover:bg-main/5 transition-all uppercase tracking-[0.2em] text-sm font-bold"
                >
                  Start Race
                </button>
              )}
            </div>
          </div>

          <div className="space-y-8">
            <h2 className="text-sm uppercase tracking-[0.3em] text-main-sub border-b border-main-sub/10 pb-2">Players ({players.length})</h2>
            <div className="grid gap-2">
              {players.map((p) => (
                <div key={p.id} className="flex items-center justify-between py-2 border-b border-main-sub/5">
                  <span className={`text-sm ${p.id === currentPlayerId ? 'text-main' : 'text-text-primary'}`}>
                    {p.name} {p.isHost && '👑'}
                  </span>
                  {room.settings.teamMode && (isHost || p.id === currentPlayerId) && (
                     <div className="flex gap-2">
                        <button onClick={() => handleAssignTeam(p.id, TeamColor.RED)} className={`text-[10px] uppercase px-2 py-0.5 rounded ${p.team === TeamColor.RED ? 'bg-red-500/20 text-red-500' : 'text-main-sub'}`}>Red</button>
                        <button onClick={() => handleAssignTeam(p.id, TeamColor.BLUE)} className={`text-[10px] uppercase px-2 py-0.5 rounded ${p.team === TeamColor.BLUE ? 'bg-blue-500/20 text-blue-500' : 'text-main-sub'}`}>Blue</button>
                     </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* RACING STATE */}
      {isRacing && (
        <div className="flex flex-col lg:flex-row gap-8 items-start animate-fade-in">
          {/* Left: Progress Side */}
          <div className="w-full lg:w-64 space-y-4 pt-12">
             <h3 className="text-[10px] uppercase tracking-widest text-main-sub opacity-50 mb-4">Live Progress</h3>
             {players.map(p => <ProgressBar key={p.id} player={p} isCurrentUser={p.id === currentPlayerId} />)}
          </div>

          {/* Center: Typing Area */}
          <div className="flex-1 flex flex-col items-center">
            <div className="mb-8 font-mono text-3xl text-main">{engine.timeLeft}s</div>
            <TypingArea
              prompt={engine.prompt}
              charStates={engine.charStates}
              currentIndex={engine.currentIndex}
              onKeyDown={engine.handleKeyPress}
              disabled={engine.isFinished}
            />
            {/* Live Stats */}
            <div className="mt-8 flex gap-8 text-sm opacity-60">
               <div>WPM: <span className="text-main">{engine.netWpm}</span></div>
               <div>ACC: <span className="text-main">{engine.accuracy}%</span></div>
            </div>
          </div>
        </div>
      )}

      {/* FINISHED STATE */}
      {isFinished && raceResults && (
        <div className="max-w-3xl mx-auto w-full animate-slide-up">
           <div className="text-center mb-12">
              <h2 className="text-4xl font-bold tracking-tighter text-text-primary">Race Result</h2>
           </div>
           
           <Leaderboard players={raceResults.players} teamScores={raceResults.teamScores} />
           
           {isHost && (
             <button onClick={handleRestartRace} className="mt-12 w-full py-4 text-main-sub hover:text-main text-xs uppercase tracking-[0.3em] transition-colors">
               Restart Race
             </button>
           )}
        </div>
      )}
    </div>
  );
}

export default Room;
