// ==========================================
// GODZILLA-TYPE — Shared Type Definitions
// ==========================================

// ---- Enums ----

export enum RaceState {
  LOBBY = 'LOBBY',
  COUNTDOWN = 'COUNTDOWN',
  RACING = 'RACING',
  FINISHED = 'FINISHED',
}

export enum TeamColor {
  RED = 'RED',
  BLUE = 'BLUE',
  NONE = 'NONE',
}

// ---- Core Interfaces ----

export interface Player {
  id: string;
  name: string;
  wpm: number;
  netWpm: number;
  accuracy: number;
  progress: number; // 0-100 percentage
  charsTyped: number;
  errors: number;
  team: TeamColor;
  isHost: boolean;
  isFinished: boolean;
  finishOrder: number;
}

export interface RoomSettings {
  timerDuration: number; // seconds
  wordCount: number;
  teamMode: boolean;
  textMode: import('./promptGenerator.js').PromptMode;
  randomStartTime: boolean;
}

export interface Room {
  code: string;
  players: Player[];
  state: RaceState;
  hostId: string;
  settings: RoomSettings;
  prompt: string;
  words: string[];
  startTime: number | null;
  endTime: number | null;
}

export interface RaceResult {
  id?: string;           // client-generated UUID — used for Convex dedup
  playerName: string;
  wpm: number;
  netWpm: number;
  accuracy: number;
  finishOrder: number;
  timestamp: number;
  roomCode: string;
  timerDuration: number;
  synced?: boolean;      // false/undefined = pending, true = uploaded to Convex
  mode?: string;         // text mode used: 'words' | 'sentences' | 'quote' | 'custom'
}

export interface PlayerStats {
  playerName: string;
  bestWpm: number;
  avgWpm: number;
  bestAccuracy: number;
  avgAccuracy: number;
  totalRaces: number;
  history: RaceResult[];
}

// ---- Socket Event Payloads ----

export interface CreateRoomPayload {
  playerName: string;
}

export interface JoinRoomPayload {
  roomCode: string;
  playerName: string;
}

export interface StartRacePayload {
  roomCode: string;
}

export interface PlayerProgressPayload {
  roomCode: string;
  charsTyped: number;
  errors: number;
  wpm: number;
  netWpm: number;
  accuracy: number;
  progress: number;
  isFinished: boolean;
}

export interface AssignTeamPayload {
  roomCode: string;
  playerId: string;
  team: TeamColor;
}

export interface UpdateSettingsPayload {
  roomCode: string;
  settings: Partial<RoomSettings>;
}

export interface RoomUpdateData {
  room: Room;
}

export interface RaceStartData {
  prompt: string;
  words: string[];
  duration: number;
  startTime: number;
}

export interface CountdownData {
  count: number;
}

export interface RaceResultsData {
  players: Player[];
  teamScores?: { team: TeamColor; totalNetWpm: number }[];
}

export interface ErrorData {
  message: string;
}

// ---- Socket Events ----

export const SocketEvents = {
  // Client → Server
  CREATE_ROOM: 'create-room',
  JOIN_ROOM: 'join-room',
  LEAVE_ROOM: 'leave-room',
  START_RACE: 'start-race',
  PLAYER_PROGRESS: 'player-progress',
  ASSIGN_TEAM: 'assign-team',
  RESTART_RACE: 'restart-race',
  UPDATE_SETTINGS: 'update-settings',

  // Server → Client
  ROOM_CREATED: 'room-created',
  ROOM_UPDATED: 'room-updated',
  RACE_COUNTDOWN: 'race-countdown',
  RACE_START: 'race-start',
  RACE_PROGRESS: 'race-progress',
  RACE_FINISHED: 'race-finished',
  PLAYER_JOINED: 'player-joined',
  PLAYER_LEFT: 'player-left',
  ERROR: 'error',
} as const;
