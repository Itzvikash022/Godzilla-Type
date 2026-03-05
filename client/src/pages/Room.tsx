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
  const { emit, on, off, socket, isConnected } = useSocket();

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

  // Typing engine (only active during race)
  const handleProgress = useCallback((state: TypingState) => {
    // Progress is sent via interval, not per-keystroke
  }, []);

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

    // Save locally
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
    onProgress: handleProgress,
    onFinish: handleFinish,
  });

  // Socket listeners
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
    }));

    cleanups.push(on(SocketEvents.RACE_PROGRESS, (data: { players: Player[] }) => {
      setPlayers(data.players);
    }));

    cleanups.push(on(SocketEvents.RACE_FINISHED, (data: RaceResultsData) => {
      setRaceResults(data);
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    }));

    cleanups.push(on(SocketEvents.ERROR, (data: { message: string }) => {
      console.error('Socket error:', data.message);
    }));

    // On mount, emit JOIN_ROOM to ensure we're in the room and get the current state
    if (code && playerName) {
      emit(SocketEvents.JOIN_ROOM, { roomCode: code, playerName });
    }

    return () => cleanups.forEach((c) => c());
  }, [isConnected, on, code, playerName, emit]);

  // Send progress updates at interval during racing
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

  // Reset typing engine when race starts
  useEffect(() => {
    if (raceData) {
      engine.resetTest(raceData.words, raceData.prompt);
    }
  }, [raceData]);

  const handleStartRace = () => {
    emit(SocketEvents.START_RACE, { roomCode: code });
  };

  const handleRestartRace = () => {
    emit(SocketEvents.RESTART_RACE, { roomCode: code });
    setRaceResults(null);
    setRaceData(null);
    setCountdown(null);
  };

  const handleLeaveRoom = () => {
    emit(SocketEvents.LEAVE_ROOM, { roomCode: code });
    navigate('/multiplayer');
  };

  const handleAssignTeam = (playerId: string, team: TeamColor) => {
    emit(SocketEvents.ASSIGN_TEAM, { roomCode: code, playerId, team });
  };

  const handleToggleTeamMode = () => {
    emit(SocketEvents.UPDATE_SETTINGS, {
      roomCode: code,
      settings: { teamMode: !room?.settings.teamMode },
    });
  };

  const handleUpdateDuration = (duration: number) => {
    emit(SocketEvents.UPDATE_SETTINGS, {
      roomCode: code,
      settings: { timerDuration: duration },
    });
  };

  if (!room) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-16 text-center">
        <div className="text-4xl mb-4 animate-pulse">🦎</div>
        <p className="text-text-secondary">Connecting to room...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      {/* Room Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">
            Room <span className="font-mono text-accent-primary">{code}</span>
          </h1>
          <p className="text-text-secondary text-sm">
            {players.length} player{players.length !== 1 ? 's' : ''} •{' '}
            {room.settings.teamMode ? '🏁 Team Mode' : '🏁 Free-for-all'} •{' '}
            {room.settings.timerDuration}s
          </p>
        </div>
        <button
          onClick={handleLeaveRoom}
          className="px-4 py-2 rounded-lg text-sm text-text-secondary hover:text-error hover:bg-error/10 transition-all"
        >
          Leave Room
        </button>
      </div>

      {/* Countdown Overlay */}
      {isCountingDown && countdown !== null && <Countdown count={countdown} />}

      {/* LOBBY STATE */}
      {isLobby && (
        <div className="animate-fade-in space-y-6">
          {/* Room Code Share */}
          <div className="glass-card p-6 rounded-2xl text-center">
            <p className="text-text-secondary text-sm mb-2">Share this code with your coworkers</p>
            <p className="text-5xl font-mono font-black gradient-text tracking-[0.3em]">{code}</p>
          </div>

          {/* Host Controls */}
          {isHost && (
            <div className="glass-card p-6 rounded-2xl space-y-4">
              <h3 className="text-lg font-semibold text-text-primary">👑 Host Controls</h3>

              <div className="flex items-center justify-between">
                <span className="text-text-secondary text-sm">Timer Duration</span>
                <TimerSelector
                  selected={room.settings.timerDuration}
                  onSelect={handleUpdateDuration}
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-text-secondary text-sm">Team Mode</span>
                <button
                  onClick={handleToggleTeamMode}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    room.settings.teamMode
                      ? 'bg-accent-primary/20 text-accent-primary'
                      : 'bg-bg-primary text-text-secondary hover:bg-bg-hover'
                  }`}
                >
                  {room.settings.teamMode ? '✓ Enabled' : 'Disabled'}
                </button>
              </div>

              <button
                onClick={handleStartRace}
                disabled={players.length < 1}
                className="w-full py-3 rounded-xl bg-accent-primary text-bg-primary font-bold text-lg hover:bg-accent-secondary transition-all disabled:opacity-50 btn-glow"
              >
                🏁 Start Race
              </button>
            </div>
          )}

          {/* Players List */}
          <div className="glass-card p-6 rounded-2xl">
            <h3 className="text-lg font-semibold text-text-primary mb-4">Players</h3>
            <div className="space-y-3">
              {players.map((player) => (
                <div
                  key={player.id}
                  className="flex items-center justify-between bg-bg-primary/50 p-3 rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    {player.team !== TeamColor.NONE && (
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: TEAM_COLORS[player.team].bg }}
                      />
                    )}
                    <span className="text-text-primary font-medium">
                      {player.name}
                      {player.isHost && <span className="ml-2 text-xs text-accent-secondary">👑 Host</span>}
                      {player.id === currentPlayerId && <span className="ml-2 text-xs text-accent-primary">(You)</span>}
                    </span>
                  </div>

                  {/* Team Assignment (visible when team mode is on) */}
                  {room.settings.teamMode && (isHost || player.id === currentPlayerId) && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleAssignTeam(player.id, TeamColor.RED)}
                        className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                          player.team === TeamColor.RED
                            ? 'bg-team-red text-white'
                            : 'bg-bg-hover text-text-secondary hover:bg-team-red/20'
                        }`}
                      >
                        Red
                      </button>
                      <button
                        onClick={() => handleAssignTeam(player.id, TeamColor.BLUE)}
                        className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                          player.team === TeamColor.BLUE
                            ? 'bg-team-blue text-white'
                            : 'bg-bg-hover text-text-secondary hover:bg-team-blue/20'
                        }`}
                      >
                        Blue
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {!isHost && (
            <p className="text-center text-text-muted text-sm animate-pulse">
              Waiting for host to start the race...
            </p>
          )}
        </div>
      )}

      {/* RACING STATE */}
      {isRacing && (
        <div className="space-y-6 animate-fade-in">
          {/* Timer */}
          <div className="text-center">
            <span className={`font-mono text-4xl font-bold ${engine.timeLeft <= 5 ? 'text-error animate-pulse' : 'text-accent-primary'}`}>
              {engine.timeLeft}s
            </span>
          </div>

          {/* Progress bars for all players */}
          <div className="space-y-2">
            {players.map((player) => (
              <ProgressBar
                key={player.id}
                player={player}
                isCurrentUser={player.id === currentPlayerId}
              />
            ))}
          </div>

          {/* Typing Area */}
          <div className="glass-card p-6 rounded-2xl">
            <TypingArea
              prompt={engine.prompt}
              charStates={engine.charStates}
              currentIndex={engine.currentIndex}
              onKeyDown={engine.handleKeyPress}
              disabled={engine.isFinished}
            />
          </div>

          {/* Live metrics */}
          <div className="grid grid-cols-3 gap-4">
            <div className="glass-card p-3 rounded-xl text-center">
              <p className="text-text-muted text-xs">WPM</p>
              <p className="text-2xl font-bold gradient-text font-mono">{engine.wpm}</p>
            </div>
            <div className="glass-card p-3 rounded-xl text-center">
              <p className="text-text-muted text-xs">Net WPM</p>
              <p className="text-2xl font-bold text-accent-primary font-mono">{engine.netWpm}</p>
            </div>
            <div className="glass-card p-3 rounded-xl text-center">
              <p className="text-text-muted text-xs">Accuracy</p>
              <p className={`text-2xl font-bold font-mono ${engine.accuracy >= 95 ? 'text-success' : 'text-accent-primary'}`}>
                {engine.accuracy}%
              </p>
            </div>
          </div>
        </div>
      )}

      {/* FINISHED STATE */}
      {isFinished && raceResults && (
        <div className="space-y-6">
          <div className="text-center mb-4">
            <div className="text-5xl mb-2">🏁</div>
            <h2 className="text-2xl font-bold text-text-primary">Race Complete!</h2>
          </div>

          <Leaderboard
            players={raceResults.players}
            teamScores={raceResults.teamScores}
          />

          {isHost && (
            <div className="flex justify-center mt-6">
              <button
                onClick={handleRestartRace}
                className="px-8 py-3 rounded-xl bg-accent-primary text-bg-primary font-bold hover:bg-accent-secondary transition-all btn-glow"
              >
                🔄 Race Again
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Room;
