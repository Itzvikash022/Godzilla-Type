// ==========================================
// GODZILLA-TYPE — Room Manager
// ==========================================

import {
  Room,
  Player,
  RaceState,
  TeamColor,
  RoomSettings,
  generateRoomCode,
  generatePrompt,
  DEFAULT_TIMER,
  DEFAULT_WORD_COUNT,
  MAX_PLAYERS_PER_ROOM,
} from '@godzilla-type/shared';

const rooms = new Map<string, Room>();

export function createRoom(hostId: string, hostName: string): Room {
  let code = generateRoomCode();
  while (rooms.has(code)) {
    code = generateRoomCode();
  }

  const host: Player = {
    id: hostId,
    name: hostName,
    wpm: 0,
    netWpm: 0,
    accuracy: 100,
    progress: 0,
    charsTyped: 0,
    errors: 0,
    team: TeamColor.NONE,
    isHost: true,
    isReady: false,
    isFinished: false,
    finishOrder: 0,
  };

  const room: Room = {
    code,
    players: [host],
    state: RaceState.LOBBY,
    hostId,
    settings: {
      timerDuration: DEFAULT_TIMER,
      wordCount: DEFAULT_WORD_COUNT,
      teamMode: false,
      textMode: 'words',
      randomStartTime: false,
    },
    prompt: '',
    words: [],
    startTime: null,
    endTime: null,
  };

  rooms.set(code, room);
  return room;
}

export function joinRoom(code: string, playerId: string, playerName: string): Room | null {
  const room = rooms.get(code);
  if (!room) return null;
  if (room.state !== RaceState.LOBBY) return null;
  if (room.players.length >= MAX_PLAYERS_PER_ROOM) return null;
  if (room.players.find((p) => p.id === playerId)) return room;

  const player: Player = {
    id: playerId,
    name: playerName,
    wpm: 0,
    netWpm: 0,
    accuracy: 100,
    progress: 0,
    charsTyped: 0,
    errors: 0,
    team: TeamColor.NONE,
    isHost: false,
    isReady: false,
    isFinished: false,
    finishOrder: 0,
  };

  room.players.push(player);
  return room;
}

export function leaveRoom(code: string, playerId: string): Room | null {
  const room = rooms.get(code);
  if (!room) return null;

  room.players = room.players.filter((p) => p.id !== playerId);

  if (room.players.length === 0) {
    rooms.delete(code);
    return null;
  }

  // Transfer host
  if (room.hostId === playerId) {
    room.hostId = room.players[0].id;
    room.players[0].isHost = true;
  }

  return room;
}

export function getRoomByCode(code: string): Room | undefined {
  return rooms.get(code);
}

export function assignTeam(code: string, playerId: string, team: TeamColor): Room | null {
  const room = rooms.get(code);
  if (!room) return null;

  const player = room.players.find((p) => p.id === playerId);
  if (player) {
    player.team = team;
  }

  return room;
}

export function updateSettings(code: string, settings: Partial<RoomSettings>): Room | null {
  const room = rooms.get(code);
  if (!room) return null;

  room.settings = { ...room.settings, ...settings };
  return room;
}

export function setPlayerReady(code: string, playerId: string, isReady: boolean): Room | null {
  const room = rooms.get(code);
  if (!room) return null;

  const player = room.players.find((p) => p.id === playerId);
  if (player) {
    player.isReady = isReady;
  }

  return room;
}

export function kickPlayer(code: string, playerId: string): Room | null {
  const room = rooms.get(code);
  if (!room) return null;

  room.players = room.players.filter((p) => p.id !== playerId);

  if (room.players.length === 0) {
    rooms.delete(code);
    return null;
  }

  // Transfer host if necessary
  if (room.hostId === playerId) {
    room.hostId = room.players[0].id;
    room.players[0].isHost = true;
  }

  return room;
}

export function prepareRace(code: string): Room | null {
  const room = rooms.get(code);
  if (!room) return null;

  const { words, prompt } = generatePrompt(room.settings.textMode || 'words', room.settings.wordCount);
  room.words = words;
  room.prompt = prompt;
  room.state = RaceState.COUNTDOWN;

  // Reset all players
  for (const player of room.players) {
    player.wpm = 0;
    player.netWpm = 0;
    player.accuracy = 100;
    player.progress = 0;
    player.charsTyped = 0;
    player.errors = 0;
    player.isFinished = false;
    player.finishOrder = 0;
  }

  return room;
}

export function startRace(code: string): Room | null {
  const room = rooms.get(code);
  if (!room) return null;

  room.state = RaceState.RACING;
  room.startTime = Date.now();
  room.endTime = null;

  return room;
}

export function updatePlayerProgress(
  code: string,
  playerId: string,
  data: {
    charsTyped: number;
    errors: number;
    wpm: number;
    netWpm: number;
    accuracy: number;
    progress: number;
    isFinished: boolean;
  }
): Room | null {
  const room = rooms.get(code);
  if (!room) return null;

  const player = room.players.find((p) => p.id === playerId);
  if (!player) return null;

  player.charsTyped = data.charsTyped;
  player.errors = data.errors;
  player.wpm = data.wpm;
  player.netWpm = data.netWpm;
  player.accuracy = data.accuracy;
  player.progress = data.progress;

  if (data.isFinished && !player.isFinished) {
    player.isFinished = true;
    const finishedCount = room.players.filter((p) => p.isFinished).length;
    player.finishOrder = finishedCount;
  }

  return room;
}

export function checkRaceComplete(code: string): boolean {
  const room = rooms.get(code);
  if (!room) return false;
  return room.players.every((p) => p.isFinished);
}

export function finishRace(code: string): Room | null {
  const room = rooms.get(code);
  if (!room) return null;

  room.state = RaceState.FINISHED;
  room.endTime = Date.now();

  for (const player of room.players) {
    if (player.charsTyped === 0) {
      player.accuracy = 0;
    }
    // ensure everyone is marked finished
    if (!player.isFinished) {
      player.isFinished = true;
    }
  }

  return room;
}

export function restartRace(code: string): Room | null {
  const room = rooms.get(code);
  if (!room) return null;

  room.state = RaceState.LOBBY;
  room.prompt = '';
  room.words = [];
  room.startTime = null;
  room.endTime = null;

  for (const player of room.players) {
    player.wpm = 0;
    player.netWpm = 0;
    player.accuracy = 100;
    player.progress = 0;
    player.charsTyped = 0;
    player.errors = 0;
    player.isReady = false;
    player.isFinished = false;
    player.finishOrder = 0;
  }

  return room;
}

export function getTeamScores(code: string) {
  const room = rooms.get(code);
  if (!room) return [];

  const teamMap = new Map<TeamColor, number>();

  for (const player of room.players) {
    if (player.team !== TeamColor.NONE) {
      const current = teamMap.get(player.team) || 0;
      teamMap.set(player.team, current + player.netWpm);
    }
  }

  return Array.from(teamMap.entries()).map(([team, totalNetWpm]) => ({
    team,
    totalNetWpm,
  }));
}

export function findRoomByPlayerId(playerId: string): Room | undefined {
  for (const room of rooms.values()) {
    if (room.players.find((p) => p.id === playerId)) {
      return room;
    }
  }
  return undefined;
}
