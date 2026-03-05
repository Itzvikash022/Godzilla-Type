import { useEffect, useRef } from 'react';
import { useMutation, useConvexAuth, useConvex } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { getUnsynced, getResults, markResultSynced, saveResult } from '../lib/db';

export function SyncManager() {
    const { isAuthenticated, isLoading } = useConvexAuth();
    const convex = useConvex();
    const createUser = useMutation(api.mutations.createUser);
    const submitRaceResult = useMutation(api.mutations.submitRaceResult);

    const syncingRef = useRef(false);

    useEffect(() => {
        if (isLoading || !isAuthenticated) return;

        const syncData = async (forceAll = false) => {
            if (syncingRef.current || !navigator.onLine) return;
            syncingRef.current = true;

            try {
                // Ensure user exists in Convex database under their Clerk identity ALWAYS
                await createUser();

                // --- PULL PHASE: Hydrate local database with cloud records ---
                const cloudData = await convex.query(api.queries.getUserStats, {});
                if (cloudData && cloudData.recentResults) {
                    for (const r of cloudData.recentResults) {
                        await saveResult({
                            playerName: cloudData.stats.username,
                            wpm: r.wpm,
                            netWpm: r.netWpm,
                            accuracy: r.accuracy,
                            finishOrder: 0,
                            timestamp: r.createdAt,
                            roomCode: '',
                            timerDuration: r.duration,
                            mode: r.mode as any,
                            synced: true,
                            id: r.localId // Guarantees we overwrite/dedup using IndexedDB keyPath
                        });
                    }
                    // Notify observers (like Stats.tsx) that local db has fresh cloud data
                    window.dispatchEvent(new Event('godzilla-sync-completed'));
                }

                // --- PUSH PHASE: Send untracked local records to the cloud ---
                const pending = forceAll ? await getResults() : await getUnsynced();
                if (pending.length > 0) {
                    console.log(`[SyncManager] Found ${pending.length} results to push...`);

                    for (const result of pending) {
                        if (!result.id) continue;

                        try {
                            await submitRaceResult({
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
                            console.warn('[SyncManager] Failed to sync result:', result.id, err);
                        }
                    }
                    console.log(`[SyncManager] Successfully synced ${pending.length} results.`);
                    window.dispatchEvent(new Event('godzilla-sync-completed'));
                }
            } catch (err) {
                console.error('[SyncManager] Global sync error:', err);
            } finally {
                syncingRef.current = false;
            }
        };

        syncData();

        const onOnline = () => syncData();
        window.addEventListener('online', onOnline);

        const onCustomSync = () => syncData();
        window.addEventListener('godzilla-trigger-sync', onCustomSync);

        const onFullSync = () => syncData(true);
        window.addEventListener('godzilla-force-full-sync', onFullSync);

        return () => {
            window.removeEventListener('online', onOnline);
            window.removeEventListener('godzilla-trigger-sync', onCustomSync);
            window.removeEventListener('godzilla-force-full-sync', onFullSync);
        };
    }, [isAuthenticated, isLoading, createUser, submitRaceResult, convex]);

    return null;
}

export function triggerCloudSync() {
    window.dispatchEvent(new Event('godzilla-trigger-sync'));
}

export function triggerFullCloudSync() {
    window.dispatchEvent(new Event('godzilla-force-full-sync'));
}
