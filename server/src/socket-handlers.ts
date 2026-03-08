// ==========================================
// GODZILLA-TYPE — Socket Event Handlers
// ==========================================

import { Server, Socket } from 'socket.io';
import {
  SocketEvents,
  CreateRoomPayload,
  JoinRoomPayload,
  PlayerProgressPayload,
  AssignTeamPayload,
  UpdateSettingsPayload,
  ChatMessagePayload,
  MemeMessagePayload,
  COUNTDOWN_SECONDS,
} from '@godzilla-type/shared';
import {
  createRoom,
  joinRoom,
  leaveRoom,
  getRoomByCode,
  assignTeam,
  updateSettings,
  prepareRace,
  startRace,
  updatePlayerProgress,
  checkRaceComplete,
  finishRace,
  restartRace,
  getTeamScores,
  findRoomByPlayerId,
} from './rooms.js';
import { saveRaceResult } from './db.js';

// ---- Meme Room State ---- (in-memory, per-room, cleared on restart)
const memeHistory = new Map<string, MemeMessagePayload[]>(); // roomCode -> last 20 memes
const memeCooldowns = new Map<string, number>(); // playerId -> lastSentTimestamp
const MEME_COOLDOWN_MS = 3000;
const MEME_HISTORY_LIMIT = 20;

export function registerSocketHandlers(io: Server) {
  io.on('connection', (socket: Socket) => {
    console.log(`🔌 Player connected: ${socket.id}`);

    // ---- CREATE ROOM ----
    socket.on(SocketEvents.CREATE_ROOM, (payload: CreateRoomPayload) => {
      // Leave any existing room first
      handleLeavePreviousRoom(socket);

      const room = createRoom(socket.id, payload.playerName);
      socket.join(room.code);
      socket.emit(SocketEvents.ROOM_CREATED, { room });
      console.log(`🏠 Room ${room.code} created by ${payload.playerName}`);
    });

    // ---- JOIN ROOM ----
    socket.on(SocketEvents.JOIN_ROOM, (payload: JoinRoomPayload) => {
      // Leave any other room first, but don't leave the one we're joining
      handleLeavePreviousRoom(socket, payload.roomCode);

      const room = joinRoom(payload.roomCode, socket.id, payload.playerName);
      if (!room) {
        console.warn(`❌ Join failed for ${payload.playerName} to room ${payload.roomCode}`);
        socket.emit(SocketEvents.ERROR, {
          message: 'Unable to join room. It may not exist, be full, or a race is in progress.',
        });
        return;
      }
      socket.join(room.code);
      io.to(room.code).emit(SocketEvents.ROOM_UPDATED, { room });
      console.log(`👤 ${payload.playerName} joined room ${room.code}`);
    });

    // ---- LEAVE ROOM ----
    socket.on(SocketEvents.LEAVE_ROOM, ({ roomCode }: { roomCode: string }) => {
      const room = leaveRoom(roomCode, socket.id);
      socket.leave(roomCode);
      if (room) {
        io.to(roomCode).emit(SocketEvents.ROOM_UPDATED, { room });
      }
    });

    // ---- UPDATE SETTINGS ----
    socket.on(SocketEvents.UPDATE_SETTINGS, (payload: UpdateSettingsPayload) => {
      const room = getRoomByCode(payload.roomCode);
      if (!room || room.hostId !== socket.id) return;

      const updated = updateSettings(payload.roomCode, payload.settings);
      if (updated) {
        io.to(payload.roomCode).emit(SocketEvents.ROOM_UPDATED, { room: updated });
      }
    });

    // ---- CHAT MESSAGE ----
    socket.on(SocketEvents.CHAT_MESSAGE, (payload: ChatMessagePayload) => {
      const room = getRoomByCode(payload.roomCode);
      if (!room) return;

      // Ensure the sender is actually in the room
      const isPlayerInRoom = room.players.some((p) => p.id === socket.id);
      if (!isPlayerInRoom) return;

      // Broadcast message to everyone in the room
      io.to(payload.roomCode).emit(SocketEvents.CHAT_MESSAGE, payload);
    });

    // ---- ASSIGN TEAM ----
    socket.on(SocketEvents.ASSIGN_TEAM, (payload: AssignTeamPayload) => {
      const room = assignTeam(payload.roomCode, payload.playerId, payload.team);
      if (room) {
        io.to(payload.roomCode).emit(SocketEvents.ROOM_UPDATED, { room });
      }
    });

    // ---- START RACE ----
    socket.on(SocketEvents.START_RACE, ({ roomCode }: { roomCode: string }) => {
      const room = getRoomByCode(roomCode);
      if (!room || room.hostId !== socket.id) return;

      const prepared = prepareRace(roomCode);
      if (!prepared) return;

      io.to(roomCode).emit(SocketEvents.ROOM_UPDATED, { room: prepared });

      // Countdown
      let count = room.settings.randomStartTime
        ? Math.floor(Math.random() * 13) // 0 to 12
        : COUNTDOWN_SECONDS;
      const isRandom = room.settings.randomStartTime;

      const countdown = setInterval(() => {
        const displayCount = (isRandom && count > 0) ? -1 : count;
        io.to(roomCode).emit(SocketEvents.RACE_COUNTDOWN, { count: displayCount });
        count--;

        if (count < 0) {
          clearInterval(countdown);
          const racing = startRace(roomCode);
          if (racing) {
            console.log(`🏁 Starting race in ${roomCode}. Generated prompt length: ${racing.prompt.length}, Words count: ${racing.words.length}`);
            if (racing.prompt.length === 0) {
              console.error(`🚨 ALERT: Racing prompt is empty. Data import logic might have failed.`);
            }
            io.to(roomCode).emit(SocketEvents.RACE_START, {
              prompt: racing.prompt,
              words: racing.words,
              duration: racing.settings.timerDuration,
              startTime: racing.startTime,
            });
            io.to(roomCode).emit(SocketEvents.ROOM_UPDATED, { room: racing });

            // Auto-end race after timer expires + 2s buffer
            setTimeout(() => {
              const currentRoom = getRoomByCode(roomCode);
              if (currentRoom && currentRoom.state === 'RACING') {
                const finished = finishRace(roomCode);
                if (finished) {
                  const teamScores = finished.settings.teamMode
                    ? getTeamScores(roomCode)
                    : undefined;
                  io.to(roomCode).emit(SocketEvents.RACE_FINISHED, {
                    players: finished.players,
                    teamScores,
                  });
                  io.to(roomCode).emit(SocketEvents.ROOM_UPDATED, { room: finished });

                  // Save results
                  for (const player of finished.players) {
                    saveRaceResult({
                      playerName: player.name,
                      wpm: player.wpm,
                      netWpm: player.netWpm,
                      accuracy: player.accuracy,
                      finishOrder: player.finishOrder,
                      timestamp: Date.now(),
                      roomCode: roomCode,
                      timerDuration: finished.settings.timerDuration,
                    });
                  }
                }
              }
            }, (racing.settings.timerDuration + 2) * 1000);
          }
        }
      }, 1000);
    });

    // ---- PLAYER PROGRESS ----
    socket.on(SocketEvents.PLAYER_PROGRESS, (payload: PlayerProgressPayload) => {
      const room = updatePlayerProgress(payload.roomCode, socket.id, {
        charsTyped: payload.charsTyped,
        errors: payload.errors,
        wpm: payload.wpm,
        netWpm: payload.netWpm,
        accuracy: payload.accuracy,
        progress: payload.progress,
        isFinished: payload.isFinished,
      });

      if (room) {
        // Broadcast to everyone in the room
        io.to(payload.roomCode).emit(SocketEvents.RACE_PROGRESS, {
          players: room.players,
        });

        // Check if all finished
        if (payload.isFinished && checkRaceComplete(payload.roomCode)) {
          const finished = finishRace(payload.roomCode);
          if (finished) {
            const teamScores = finished.settings.teamMode
              ? getTeamScores(payload.roomCode)
              : undefined;
            io.to(payload.roomCode).emit(SocketEvents.RACE_FINISHED, {
              players: finished.players,
              teamScores,
            });
            io.to(payload.roomCode).emit(SocketEvents.ROOM_UPDATED, {
              room: finished,
            });

            // Save results
            for (const player of finished.players) {
              saveRaceResult({
                playerName: player.name,
                wpm: player.wpm,
                netWpm: player.netWpm,
                accuracy: player.accuracy,
                finishOrder: player.finishOrder,
                timestamp: Date.now(),
                roomCode: payload.roomCode,
                timerDuration: finished.settings.timerDuration,
              });
            }
          }
        }
      }
    });

    // ---- RESTART RACE ----
    socket.on(SocketEvents.RESTART_RACE, ({ roomCode }: { roomCode: string }) => {
      const room = getRoomByCode(roomCode);
      if (!room || room.hostId !== socket.id) return;

      const restarted = restartRace(roomCode);
      if (restarted) {
        // Clear meme history for the room on restart
        memeHistory.delete(roomCode);
        io.to(roomCode).emit(SocketEvents.ROOM_UPDATED, { room: restarted });
      }
    });

    // ---- MEME_SEND ----
    socket.on(SocketEvents.MEME_SEND, (payload: MemeMessagePayload) => {
      const now = Date.now();
      const lastSent = memeCooldowns.get(socket.id) ?? 0;

      // Enforce 3-second per-user cooldown
      if (now - lastSent < MEME_COOLDOWN_MS) {
        socket.emit(SocketEvents.ERROR, { message: 'Please wait before sending another meme.' });
        return;
      }
      memeCooldowns.set(socket.id, now);

      // Store in history ring buffer
      const history = memeHistory.get(payload.roomCode) ?? [];
      history.push(payload);
      if (history.length > MEME_HISTORY_LIMIT) history.shift();
      memeHistory.set(payload.roomCode, history);

      // Broadcast to all peers (including sender for sync)
      io.to(payload.roomCode).emit(SocketEvents.MEME_MESSAGE, payload);
    });

    function handleLeavePreviousRoom(socket: Socket, excludeRoomCode?: string) {
      const existingRoom = findRoomByPlayerId(socket.id);
      if (existingRoom && existingRoom.code !== excludeRoomCode) {
        const updated = leaveRoom(existingRoom.code, socket.id);
        socket.leave(existingRoom.code);
        if (updated) {
          io.to(existingRoom.code).emit(SocketEvents.ROOM_UPDATED, { room: updated });
        }
      }
    }

    // ---- DISCONNECT ----
    socket.on('disconnect', () => {
      console.log(`🔌 Player disconnected: ${socket.id}`);
      handleLeavePreviousRoom(socket);
    });
  });
}
