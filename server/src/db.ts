// ==========================================
// GODZILLA-TYPE — SQLite Database (sql.js)
// ==========================================

import initSqlJs, { Database as SqlJsDatabase } from 'sql.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { RaceResult } from '@godzilla-type/shared';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, '..', 'godzilla-type.db');

let db: SqlJsDatabase;

export async function initDatabase() {
  const SQL = await initSqlJs();

  // Load existing database or create new one
  try {
    if (fs.existsSync(DB_PATH)) {
      const buffer = fs.readFileSync(DB_PATH);
      db = new SQL.Database(buffer);
    } else {
      db = new SQL.Database();
    }
  } catch {
    db = new SQL.Database();
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS race_results (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      player_name TEXT NOT NULL,
      wpm INTEGER NOT NULL,
      net_wpm INTEGER NOT NULL,
      accuracy REAL NOT NULL,
      finish_order INTEGER NOT NULL,
      room_code TEXT NOT NULL,
      timer_duration INTEGER NOT NULL,
      timestamp INTEGER NOT NULL
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS player_stats (
      player_name TEXT PRIMARY KEY,
      best_wpm INTEGER DEFAULT 0,
      avg_wpm REAL DEFAULT 0,
      best_accuracy REAL DEFAULT 100,
      avg_accuracy REAL DEFAULT 100,
      total_races INTEGER DEFAULT 0,
      last_race INTEGER DEFAULT 0
    );
  `);

  saveDB();
  console.log('📦 Database initialized');
}

function saveDB() {
  try {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
  } catch (err) {
    console.error('Failed to save database:', err);
  }
}

export function saveRaceResult(result: RaceResult) {
  try {
    db.run(
      `INSERT INTO race_results (player_name, wpm, net_wpm, accuracy, finish_order, room_code, timer_duration, timestamp, mode)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        result.playerName,
        result.wpm,
        result.netWpm,
        result.accuracy,
        result.finishOrder,
        result.roomCode,
        result.timerDuration,
        result.timestamp,
        result.mode || 'words'
      ]
    );

    // Only update global player_stats if the mode isn't custom
    if (result.mode !== 'custom') {
      const existing = db.exec(
        `SELECT * FROM player_stats WHERE player_name = ?`,
        [result.playerName]
      );

      if (existing.length > 0 && existing[0].values.length > 0) {
        const row = existing[0].values[0];
        const oldBestWpm = row[1] as number;
        const oldAvgWpm = row[2] as number;
        const oldBestAcc = row[3] as number;
        const oldAvgAcc = row[4] as number;
        const oldTotal = row[5] as number;

        const newTotal = oldTotal + 1;
        const newAvgWpm = (oldAvgWpm * oldTotal + result.netWpm) / newTotal;
        const newAvgAcc = (oldAvgAcc * oldTotal + result.accuracy) / newTotal;
        const newBestWpm = Math.max(oldBestWpm, result.netWpm);
        const newBestAcc = Math.max(oldBestAcc, result.accuracy);

        db.run(
          `UPDATE player_stats SET best_wpm = ?, avg_wpm = ?, best_accuracy = ?, avg_accuracy = ?, total_races = ?, last_race = ? WHERE player_name = ?`,
          [newBestWpm, newAvgWpm, newBestAcc, newAvgAcc, newTotal, result.timestamp, result.playerName]
        );
      } else {
        db.run(
          `INSERT INTO player_stats (player_name, best_wpm, avg_wpm, best_accuracy, avg_accuracy, total_races, last_race) VALUES (?, ?, ?, ?, ?, 1, ?)`,
          [result.playerName, result.netWpm, result.netWpm, result.accuracy, result.accuracy, result.timestamp]
        );
      }
    }

    saveDB();
  } catch (err) {
    console.error('Failed to save race result:', err);
  }
}

export function getPlayerStats(playerName: string) {
  try {
    const statsResult = db.exec(
      `SELECT * FROM player_stats WHERE player_name = ?`,
      [playerName]
    );
    const historyResult = db.exec(
      `SELECT * FROM race_results WHERE player_name = ? ORDER BY timestamp DESC LIMIT 50`,
      [playerName]
    );

    const stats = statsResult.length > 0 && statsResult[0].values.length > 0
      ? {
        playerName: statsResult[0].values[0][0],
        bestWpm: statsResult[0].values[0][1],
        avgWpm: statsResult[0].values[0][2],
        bestAccuracy: statsResult[0].values[0][3],
        avgAccuracy: statsResult[0].values[0][4],
        totalRaces: statsResult[0].values[0][5],
        lastRace: statsResult[0].values[0][6],
      }
      : null;

    const history = historyResult.length > 0
      ? historyResult[0].values.map((row: any[]) => ({
        id: row[0],
        playerName: row[1],
        wpm: row[2],
        netWpm: row[3],
        accuracy: row[4],
        finishOrder: row[5],
        roomCode: row[6],
        timerDuration: row[7],
        timestamp: row[8],
        mode: row[9] || 'words',
      }))
      : [];

    return { stats, history };
  } catch {
    return { stats: null, history: [] };
  }
}

export function getLeaderboard(limit = 20, duration?: number) {
  try {
    if (duration) {
      // Dynamic aggregation for specific duration, ignoring 'custom' modes
      const result = db.exec(
        `SELECT player_name, 
                MAX(net_wpm) as best_wpm, 
                AVG(net_wpm) as avg_wpm, 
                MAX(accuracy) as best_accuracy, 
                AVG(accuracy) as avg_accuracy, 
                COUNT(*) as total_races 
         FROM race_results 
         WHERE timer_duration = ? AND (mode != 'custom' OR mode IS NULL)
         GROUP BY player_name 
         ORDER BY best_wpm DESC LIMIT ?`,
        [duration, limit]
      );
      if (result.length === 0) return [];
      return result[0].values.map((row: any[]) => ({
        playerName: row[0],
        bestWpm: Math.round(row[1]),
        avgWpm: Math.round(row[2]),
        bestAccuracy: Math.round(row[3] * 100) / 100,
        avgAccuracy: Math.round(row[4] * 100) / 100,
        totalRaces: row[5],
      }));
    } else {
      // Global leaderboard using pre-aggregated player_stats
      const result = db.exec(
        `SELECT * FROM player_stats ORDER BY best_wpm DESC LIMIT ?`,
        [limit]
      );
      if (result.length === 0) return [];
      return result[0].values.map((row: any[]) => ({
        playerName: row[0],
        bestWpm: row[1],
        avgWpm: Math.round(row[2]),
        bestAccuracy: Math.round(row[3] * 100) / 100,
        avgAccuracy: Math.round(row[4] * 100) / 100,
        totalRaces: row[5],
        lastRace: row[6],
      }));
    }
  } catch (err) {
    console.error('Leaderboard error:', err);
    return [];
  }
}
