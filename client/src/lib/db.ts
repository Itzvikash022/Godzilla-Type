// ==========================================
// GODZILLA-TYPE — IndexedDB Stats Storage
// ==========================================

import type { RaceResult, PlayerStats } from '@godzilla-type/shared';

const DB_NAME = 'godzilla-type-stats';
const DB_VERSION = 1;
const STORE_NAME = 'race_results';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, {
          keyPath: 'id',
          autoIncrement: true,
        });
        store.createIndex('timestamp', 'timestamp', { unique: false });
        store.createIndex('playerName', 'playerName', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveResult(result: RaceResult): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.add(result);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getResults(): Promise<RaceResult[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const index = store.index('timestamp');
    const request = index.openCursor(null, 'prev');
    const results: RaceResult[] = [];

    request.onsuccess = () => {
      const cursor = request.result;
      if (cursor && results.length < 100) {
        results.push(cursor.value);
        cursor.continue();
      } else {
        resolve(results);
      }
    };

    request.onerror = () => reject(request.error);
  });
}

export async function getStats(): Promise<PlayerStats> {
  const results = await getResults();

  if (results.length === 0) {
    return {
      playerName: '',
      bestWpm: 0,
      avgWpm: 0,
      bestAccuracy: 0,
      avgAccuracy: 0,
      totalRaces: 0,
      history: [],
    };
  }

  const bestWpm = Math.max(...results.map((r) => r.netWpm));
  const avgWpm = Math.round(results.reduce((s, r) => s + r.netWpm, 0) / results.length);
  const bestAccuracy = Math.max(...results.map((r) => r.accuracy));
  const avgAccuracy = Math.round(results.reduce((s, r) => s + r.accuracy, 0) / results.length * 100) / 100;

  return {
    playerName: results[0]?.playerName || '',
    bestWpm,
    avgWpm,
    bestAccuracy,
    avgAccuracy,
    totalRaces: results.length,
    history: results,
  };
}

export async function clearStats(): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
