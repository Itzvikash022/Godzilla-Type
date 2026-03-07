import { mutation } from './_generated/server';
import { v } from 'convex/values';

/**
 * Create or retrieve a user based on their Clerk authentication.
 * Returns the userId. Throws if not authenticated.
 */
export const createUser = mutation({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error('Unauthenticated call to createUser');
        }

        const tokenIdentifier = identity.tokenIdentifier;
        const name = identity.name || identity.nickname || identity.givenName || 'Anonymous Player';

        const existing = await ctx.db
            .query('users')
            .withIndex('by_token', (q) => q.eq('tokenIdentifier', tokenIdentifier))
            .first();

        if (existing) {
            // Update name if it changed
            if (existing.username !== name) {
                await ctx.db.patch(existing._id, { username: name });

                // Also update stats name
                const stats = await ctx.db
                    .query('playerStats')
                    .filter((q) => q.eq(q.field('userId'), existing._id))
                    .first();
                if (stats) {
                    await ctx.db.patch(stats._id, { username: name });
                }
            }
            return existing._id;
        }

        const userId = await ctx.db.insert('users', {
            username: name,
            tokenIdentifier,
            createdAt: Date.now(),
        });

        // Create initial playerStats entry
        await ctx.db.insert('playerStats', {
            userId,
            username: name,
            avgWpm: 0,
            maxWpm: 0,
            avgAccuracy: 0,
            racesPlayed: 0,
        });

        return userId;
    },
});

/**
 * Submit a race result. Idempotent via localId — will not insert duplicates.
 * Securely tied to the Clerk authenticated user.
 */
export const submitRaceResult = mutation({
    args: {
        wpm: v.number(),
        netWpm: v.number(),
        accuracy: v.number(),
        mode: v.string(),
        duration: v.number(),
        createdAt: v.number(),
        localId: v.string(),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error('Unauthenticated call to submitRaceResult');
        }

        const user = await ctx.db
            .query('users')
            .withIndex('by_token', (q) => q.eq('tokenIdentifier', identity.tokenIdentifier))
            .first();

        if (!user) {
            throw new Error('User record not found in Convex');
        }

        // Dedup guard — skip if already uploaded
        const existing = await ctx.db
            .query('raceResults')
            .withIndex('by_local_id', (q) => q.eq('localId', args.localId))
            .first();

        if (existing) {
            return existing._id;
        }

        const resultId = await ctx.db.insert('raceResults', {
            userId: user._id,
            username: user.username,
            wpm: args.wpm,
            netWpm: args.netWpm,
            accuracy: args.accuracy,
            mode: args.mode,
            duration: args.duration,
            createdAt: args.createdAt,
            localId: args.localId,
        });

        // Update playerStats
        let stats = await ctx.db
            .query('playerStats')
            .filter((q) => q.eq(q.field('userId'), user._id))
            .first();

        // If playerStats doesn't exist (account created before stats table was introduced), backfill it.
        if (!stats) {
            const newStatsId = await ctx.db.insert('playerStats', {
                userId: user._id,
                username: user.username,
                avgWpm: 0,
                maxWpm: 0,
                avgAccuracy: 0,
                racesPlayed: 0,
            });
            stats = await ctx.db.get(newStatsId);
        }

        if (stats && args.mode !== 'custom') {
            const newRacesPlayed = stats.racesPlayed + 1;
            const newAvgWpm = Math.round(
                (stats.avgWpm * stats.racesPlayed + args.netWpm) / newRacesPlayed
            );
            const newMaxWpm = Math.max(stats.maxWpm, args.netWpm);
            const newAvgAccuracy = Math.round(
                ((stats.avgAccuracy * stats.racesPlayed + args.accuracy) / newRacesPlayed) * 100
            ) / 100;

            const updatePayload: any = {
                avgWpm: newAvgWpm,
                maxWpm: newMaxWpm,
                avgAccuracy: newAvgAccuracy,
                racesPlayed: newRacesPlayed,
            };

            // Calculate duration-specific stats
            if ([15, 30, 60, 120].includes(args.duration)) {
                const dKey = `stats${args.duration}` as 'stats15' | 'stats30' | 'stats60' | 'stats120';
                const dStats = stats[dKey] || { maxWpm: 0, avgWpm: 0, avgAccuracy: 0, racesPlayed: 0 };

                const dNewRacesPlayed = dStats.racesPlayed + 1;
                const dNewAvgWpm = Math.round((dStats.avgWpm * dStats.racesPlayed + args.netWpm) / dNewRacesPlayed);
                const dNewMaxWpm = Math.max(dStats.maxWpm, args.netWpm);
                const dNewAvgAccuracy = Math.round(((dStats.avgAccuracy * dStats.racesPlayed + args.accuracy) / dNewRacesPlayed) * 100) / 100;

                updatePayload[dKey] = {
                    maxWpm: dNewMaxWpm,
                    avgWpm: dNewAvgWpm,
                    avgAccuracy: dNewAvgAccuracy,
                    racesPlayed: dNewRacesPlayed,
                };
            }

            await ctx.db.patch(stats._id, updatePayload);
        }

        return resultId;
    },
});
