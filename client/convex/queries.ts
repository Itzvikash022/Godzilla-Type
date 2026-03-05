import { query } from './_generated/server';
import { v } from 'convex/values';

/**
 * Get global leaderboard from playerStats, sorted by the given field.
 */
export const getLeaderboard = query({
    args: {
        sortBy: v.optional(v.union(v.literal('maxWpm'), v.literal('avgWpm'), v.literal('avgAccuracy'))),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, { sortBy = 'maxWpm', limit = 50 }) => {
        const stats = await ctx.db.query('playerStats').collect();

        return stats
            .filter((s) => s.racesPlayed > 0)
            .sort((a, b) => (b[sortBy] ?? 0) - (a[sortBy] ?? 0))
            .slice(0, limit);
    },
});

/**
 * Get individual player stats and recent race history securely for the authenticated user.
 */
export const getUserStats = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return null;

        const user = await ctx.db
            .query('users')
            .withIndex('by_token', (q) => q.eq('tokenIdentifier', identity.tokenIdentifier))
            .first();

        if (!user) return null;

        const stats = await ctx.db
            .query('playerStats')
            .filter((q) => q.eq(q.field('userId'), user._id))
            .first();

        if (!stats) return null;

        const recentResults = await ctx.db
            .query('raceResults')
            .withIndex('by_user', (q) => q.eq('userId', user._id))
            .order('desc')
            .take(20);

        return { stats, recentResults };
    },
});
