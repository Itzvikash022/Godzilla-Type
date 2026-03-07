import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
    users: defineTable({
        username: v.string(),
        tokenIdentifier: v.optional(v.string()), // Added for Clerk Auth
        createdAt: v.number(),
    })
        .index('by_username', ['username'])
        .index('by_token', ['tokenIdentifier']),

    raceResults: defineTable({
        userId: v.id('users'),
        username: v.string(),
        wpm: v.number(),
        netWpm: v.number(),
        accuracy: v.number(),
        mode: v.string(),    // e.g. 'words', 'sentences', 'quote', 'custom'
        duration: v.number(), // seconds
        createdAt: v.number(),
        localId: v.string(), // client-generated UUID for dedup
    })
        .index('by_user', ['userId'])
        .index('by_local_id', ['localId']),

    playerStats: defineTable({
        userId: v.id('users'),
        username: v.string(),
        avgWpm: v.number(),
        maxWpm: v.number(),
        avgAccuracy: v.number(),
        racesPlayed: v.number(),

        // Duration-specific categories
        stats15: v.optional(v.object({ maxWpm: v.number(), avgWpm: v.number(), avgAccuracy: v.number(), racesPlayed: v.number() })),
        stats30: v.optional(v.object({ maxWpm: v.number(), avgWpm: v.number(), avgAccuracy: v.number(), racesPlayed: v.number() })),
        stats60: v.optional(v.object({ maxWpm: v.number(), avgWpm: v.number(), avgAccuracy: v.number(), racesPlayed: v.number() })),
        stats120: v.optional(v.object({ maxWpm: v.number(), avgWpm: v.number(), avgAccuracy: v.number(), racesPlayed: v.number() })),
    }).index('by_username', ['username']),
});
