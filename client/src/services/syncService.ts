// ==========================================
// GODZILLA-TYPE — Cloud Sync Service
// ==========================================
//
// Architecture: Local-First
//   1. Race results ALWAYS saved to IndexedDB first
//   2. Sync to Convex happens async, fire-and-forget
//   3. All syncing is silently skipped if:
//      a. User is not "registered" (guest mode)
//      b. VITE_CONVEX_URL is not configured
//      c. Device is offline
//   4. Network reconnect triggers automatic retry
//   5. localId dedup prevents double-uploads

import { getConvexClient } from './convexClient';
import { getUnsynced, markResultSynced } from '../lib/db';

const CLOUD_USER_KEY = 'godzilla-cloud-registered';
const CLOUD_USER_ID_KEY = 'godzilla-cloud-user-id';

// ── Helpers ───────────────────────────────────────────────────────────────────

export function isRegistered(): boolean {
    return localStorage.getItem(CLOUD_USER_KEY) === 'true';
}

export function getCloudUserId(): string | null {
    return localStorage.getItem(CLOUD_USER_ID_KEY);
}

// ── Registration ──────────────────────────────────────────────────────────────

/**
 * Register a username in Convex (idempotent).
 * Persists the returned userId for future sync calls.
 * Returns true on success, false on failure.
 */
export async function registerUser(username: string): Promise<boolean> {
    const client = getConvexClient();
    if (!client) return false;

    try {
        // Use string-based mutation path — Convex browser client supports this
        // The generated api types will refine this after first convex dev push
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const userId = await (client as any).mutation('mutations:createUser', { username }) as string;
        localStorage.setItem(CLOUD_USER_KEY, 'true');
        localStorage.setItem(CLOUD_USER_ID_KEY, userId);
        // Immediately sync any pending results
        await syncPending();
        return true;
    } catch (err) {
        console.warn('[SyncService] Registration failed:', err);
        return false;
    }
}

// ── Sync Core ─────────────────────────────────────────────────────────────────

let _syncing = false;

/**
 * Sync all unsynced race results to Convex.
 * Safe to call multiple times — guards against concurrent runs.
 */
export async function syncPending(): Promise<void> {
    if (!isRegistered()) return;
    if (!navigator.onLine) return;
    if (_syncing) return;

    const client = getConvexClient();
    if (!client) return;

    const userId = getCloudUserId();
    if (!userId) return;

    const pending = await getUnsynced();
    if (pending.length === 0) return;

    _syncing = true;

    try {
        for (const result of pending) {
            if (!result.id) continue;

            try {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                await (client as any).mutation('mutations:submitRaceResult', {
                    userId,
                    username: result.playerName,
                    wpm: result.wpm,
                    netWpm: result.netWpm,
                    accuracy: result.accuracy,
                    mode: result.mode ?? 'words',
                    duration: result.timerDuration,
                    createdAt: result.timestamp,
                    localId: result.id,
                });

                await markResultSynced(result.id);
            } catch (err) {
                console.warn('[SyncService] Failed to sync result:', result.id, err);
                // Continue to next — will retry on next sync call
            }
        }
    } finally {
        _syncing = false;
    }
}

// ── Schedule (debounced) ──────────────────────────────────────────────────────

let _debounceTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Trigger a sync after a short delay.
 * Safe to call after every race — only one sync will run.
 */
export function scheduleSync(): void {
    if (_debounceTimer) clearTimeout(_debounceTimer);
    _debounceTimer = setTimeout(() => {
        syncPending().catch(console.error);
    }, 1500);
}

// ── Network Reconnect ─────────────────────────────────────────────────────────

let _reconnectListenerAttached = false;

/**
 * Attach the online/offline network listener once.
 * Call this once during app initialization.
 */
export function attachNetworkListener(): void {
    if (_reconnectListenerAttached) return;
    _reconnectListenerAttached = true;

    window.addEventListener('online', () => {
        console.log('[SyncService] Network reconnected — syncing pending results...');
        syncPending().catch(console.error);
    });
}
