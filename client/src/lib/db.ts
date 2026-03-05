// ==========================================
// GODZILLA-TYPE — IndexedDB Stats Storage
// ==========================================
//  DB_VERSION 2: Added 'synced' index + 'id' field for Convex sync

import type { RaceResult, PlayerStats } from '@godzilla-type/shared';

const DB_NAME = 'godzilla-type-stats';
const DB_VERSION = 2;
const STORE_NAME = 'race_results';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = request.result;
      const oldVersion = (event as IDBVersionChangeEvent).oldVersion;

      if (!db.objectStoreNames.contains(STORE_NAME)) {
        // Fresh install — create full schema
        const store = db.createObjectStore(STORE_NAME, {
          keyPath: 'id',
        });
        store.createIndex('timestamp', 'timestamp', { unique: false });
        store.createIndex('playerName', 'playerName', { unique: false });
        store.createIndex('synced', 'synced', { unique: false });
      } else if (oldVersion < 2) {
        // Upgrade from v1 (autoIncrement id) — add synced index
        const store = request.transaction!.objectStore(STORE_NAME);
        if (!store.indexNames.contains('synced')) {
          store.createIndex('synced', 'synced', { unique: false });
        }
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveResult(result: RaceResult): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    // Ensure a UUID id exists for Convex dedup
    const record: RaceResult = {
      ...result,
      id: result.id ?? crypto.randomUUID(),
      synced: result.synced ?? false,
    };

    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put(record);
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

/**
 * Return all results that have not been synced to Convex yet.
 */
export async function getUnsynced(): Promise<RaceResult[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);

    // Collect all results and filter in-memory
    // (IDBKeyRange can't express "!== true" so we read all and filter)
    const request = store.getAll();
    request.onsuccess = () => {
      const all: RaceResult[] = request.result;
      resolve(all.filter((r) => !r.synced));
    };
    request.onerror = () => reject(request.error);
  });
}

/**
 * Mark a result as synced by its UUID id.
 */
export async function markResultSynced(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const getReq = store.get(id);

    getReq.onsuccess = () => {
      const record = getReq.result as RaceResult | undefined;
      if (record) {
        store.put({ ...record, synced: true });
      }
      tx.oncomplete = () => resolve();
    };

    tx.onerror = () => reject(tx.error);
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
