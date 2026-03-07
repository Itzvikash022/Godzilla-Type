import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Crown } from 'lucide-react';
import { useSocket } from '../hooks/useSocket';
import { useTypingEngine } from '../hooks/useTypingEngine';
import type { TypingState } from '../hooks/useTypingEngine';
import TypingArea from '../components/TypingArea';
import ProgressBar from '../components/ProgressBar';
import Countdown from '../components/Countdown';
import Leaderboard from '../components/Leaderboard';
import TimerSelector from '../components/TimerSelector';
import { saveResult } from '../lib/db';
import { hashColor } from '../lib/playerColors';
import { triggerCloudSync } from '../components/SyncManager';
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
  PromptMode,
} from '@godzilla-type/shared';

function Room() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { emit, on, isConnected, socket } = useSocket();

  // Phase 10: Username modal for direct link joins
  const savedName = localStorage.getItem('godzilla-player-name') || '';
  const [nameInput, setNameInput] = useState(savedName);
  const [nameConfirmed, setNameConfirmed] = useState(!!savedName);
  const [nameError, setNameError] = useState('');

  const [room, setRoom] = useState<RoomType | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [raceData, setRaceData] = useState<RaceStartData | null>(null);
  const [raceResults, setRaceResults] = useState<RaceResultsData | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);

  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const playerName = nameInput.trim() || 'Player1';
  const currentPlayerId = socket?.id || '';
  const isHost = room?.hostId === currentPlayerId;
  const isLobby = room?.state === RaceState.LOBBY;
  const isCountingDown = room?.state === RaceState.COUNTDOWN;
  const isRacing = room?.state === RaceState.RACING;
  const isFinished = room?.state === RaceState.FINISHED;

  const handleConfirmName = () => {
    const trimmed = nameInput.trim();
    if (trimmed.length < 2) {
      setNameError('Name must be at least 2 characters');
      return;
    }
    localStorage.setItem('godzilla-player-name', trimmed);
    setNameConfirmed(true);
    setNameError('');
  };

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
      mode: 'words', // multiplayer uses server-chosen text mode
      synced: false,
    }).catch(console.error);
    triggerCloudSync();
  }, [code, emit, playerName, raceData]);

  const engine = useTypingEngine({
    duration: raceData?.duration || 30,
    providedWords: raceData?.words,
    providedPrompt: raceData?.prompt,
    onProgress: () => { },
    onFinish: handleFinish,
  });

  useEffect(() => {
    if (!isConnected || !nameConfirmed) return;
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
  }, [isConnected, nameConfirmed, on, code, playerName, emit]);

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
  const handleUpdateTextMode = (mode: PromptMode) => {
    emit(SocketEvents.UPDATE_SETTINGS, {
      roomCode: code,
      settings: { textMode: mode },
    });
  };
  const handleUpdateRandomStartTime = (enabled: boolean) => {
    emit(SocketEvents.UPDATE_SETTINGS, {
      roomCode: code,
      settings: { randomStartTime: enabled },
    });
  };
  const handleStartRandom = () => {
    const durations = [15, 30, 60, 120];
    const modes: PromptMode[] = ['words', 'sentences', 'quote'];
    const randomDuration = durations[Math.floor(Math.random() * durations.length)];
    const randomMode = modes[Math.floor(Math.random() * modes.length)];

    emit(SocketEvents.UPDATE_SETTINGS, {
      roomCode: code,
      settings: { timerDuration: randomDuration, textMode: randomMode },
    });
    emit(SocketEvents.START_RACE, { roomCode: code });
  };

  // Phase 10: Show username modal if name not yet confirmed
  if (!nameConfirmed) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="bg-bg-secondary/40 border border-main-sub/10 rounded-2xl p-10 w-full max-w-sm text-center animate-fade-in">
          <h2 className="text-lg font-bold text-text-primary mb-2">Enter Your Name</h2>
          <p className="text-[10px] uppercase tracking-widest text-main-sub mb-6">
            to join room <span className="text-main font-mono">{code}</span>
          </p>
          <input
            type="text"
            value={nameInput}
            onChange={(e) => { setNameInput(e.target.value); setNameError(''); }}
            onKeyDown={(e) => e.key === 'Enter' && handleConfirmName()}
            className="w-full bg-bg-primary border-b-2 border-main-sub/20 p-2 text-text-primary outline-none focus:border-main transition-colors font-mono mb-2 text-center"
            placeholder="Your nickname..."
            maxLength={15}
            autoFocus
          />
          {nameError && (
            <p className="text-error text-[10px] uppercase tracking-widest mb-4">{nameError}</p>
          )}
          <button
            onClick={handleConfirmName}
            className="mt-4 w-full py-3 bg-main/5 text-main border border-main/20 rounded hover:bg-main/10 transition-all text-xs uppercase tracking-widest"
          >
            Join Room
          </button>
        </div>
      </div>
    );
  }

  if (!room) return <div className="flex-1 flex items-center justify-center text-main-sub animate-pulse">connecting...</div>;

  return (
    <div className="flex-1 flex flex-col max-w-7xl mx-auto w-full px-6 py-12">
      {/* Room Header */}
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
          {/* Settings Column */}
          <div className="space-y-8">
            <h2 className="text-sm uppercase tracking-[0.3em] text-main-sub border-b border-main-sub/10 pb-2">Settings</h2>

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-secondary">Race Duration</span>
                <TimerSelector selected={room.settings.timerDuration} onSelect={handleUpdateDuration} disabled={!isHost} />
              </div>

              {/* Phase 15: Text mode selector */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-secondary">Text Mode</span>
                <div className="flex items-center gap-2">
                  {(['words', 'sentences', 'quote'] as PromptMode[]).map((m) => (
                    <button
                      key={m}
                      onClick={() => isHost && handleUpdateTextMode(m)}
                      disabled={!isHost}
                      className={`text-[10px] uppercase px-2 py-1 rounded transition-all ${(room.settings.textMode === m) || (!room.settings.textMode && m === 'words')
                        ? 'text-main'
                        : 'text-main-sub hover:text-text-primary'
                        } disabled:opacity-30`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {/* Phase 27: Random Start Time Toggle */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-secondary">Random Start Time</span>
                <button
                  onClick={() => isHost && handleUpdateRandomStartTime(!room.settings.randomStartTime)}
                  disabled={!isHost}
                  className={`relative inline-flex h-4 w-8 items-center rounded-full transition-colors ${room.settings.randomStartTime ? 'bg-main' : 'bg-bg-primary border border-main-sub/20'
                    } disabled:opacity-30`}
                >
                  <span
                    className={`inline-block h-2 w-2 transform rounded-full bg-white transition-transform ${room.settings.randomStartTime ? 'translate-x-5' : 'translate-x-1'
                      }`}
                  />
                </button>
              </div>

              {isHost && (
                <div className="flex flex-col gap-3 pt-4">
                  <button
                    onClick={handleStartRace}
                    className="w-full py-4 bg-bg-secondary text-main border border-main/20 rounded hover:bg-main/5 transition-all uppercase tracking-[0.2em] text-sm font-bold"
                  >
                    Start Race
                  </button>
                  <button
                    onClick={handleStartRandom}
                    className="w-full py-3 bg-main/5 text-main-sub border border-main-sub/20 rounded hover:bg-main/10 hover:text-main transition-all uppercase tracking-[0.2em] text-xs font-bold"
                  >
                    Start Random
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Players Column */}
          <div className="space-y-8">
            <h2 className="text-sm uppercase tracking-[0.3em] text-main-sub border-b border-main-sub/10 pb-2">Players ({players.length})</h2>
            <div className="grid gap-2">
              {players.map((p) => (
                <div key={p.id} className="flex items-center justify-between py-2 border-b border-main-sub/5">
                  <span className="text-sm font-medium" style={{ color: hashColor(p.name) }}>
                    {p.name} {p.isHost && <Crown size={10} className="inline mb-0.5" />}
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
