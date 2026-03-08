import { mutation, query } from './_generated/server';
import { v } from 'convex/values';

/**
 * Persists meme metadata to Convex after a successful Cloudinary upload.
 * Uploads are anonymous, so no user data is required.
 */
export const saveMemeMetadata = mutation({
    args: {
        memeId: v.string(),
        imageUrl: v.string(),
        soundUrl: v.optional(v.string()),
        type: v.string(), // We keep type for backward compatibility, but everything is 'user' now
    },
    handler: async (ctx, args) => {
        await ctx.db.insert('memes', {
            ...args,
            createdAt: Date.now(),
        });
    },
});

/**
 * Returns all memes for the meme picker gallery.
 * Limited to 100 most recent for performance.
 */
export const getAllMemes = query({
    args: {},
    handler: async (ctx) => {
        return await ctx.db
            .query('memes')
            .order('desc')
            .take(100);
    },
});
