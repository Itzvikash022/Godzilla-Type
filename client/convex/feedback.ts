import { action, internalMutation } from './_generated/server';
import { internal } from './_generated/api';
import { v } from 'convex/values';

// Convex actions run in a Node.js-like env where process.env is available.
// We declare it here so the client tsconfig (which lacks @types/node) doesn't complain.
declare const process: { env: Record<string, string | undefined> };

/**
 * Internal mutation to insert feedback into the database.
 * Called via ctx.runMutation from the public action.
 */
export const save = internalMutation({
    args: {
        name: v.string(),
        module: v.string(),
        category: v.string(),
        description: v.string(),
    },
    handler: async (ctx, args) => {
        return await ctx.db.insert('feedback', {
            ...args,
            createdAt: Date.now(),
        });
    },
});

/**
 * Public action: saves feedback to the DB and sends a Telegram notification.
 */
export const submit = action({
    args: {
        name: v.string(),
        module: v.string(),
        category: v.string(),
        description: v.string(),
    },
    handler: async (ctx, args) => {
        // 1. Persist to DB via internal mutation
        await ctx.runMutation(internal.feedback.save, args);

        // 2. Notify Telegram (env vars set in Convex Dashboard → Settings → Env Vars)
        const botToken = process.env.TELEGRAM_BOT_TOKEN;
        const chatId = process.env.TELEGRAM_CHAT_ID;

        if (botToken && chatId) {
            const emoji = args.category === 'Bug' ? '🐛'
                : args.category === 'Suggestion' ? '💡'
                : args.category === 'Feature Request' ? '🚀'
                : args.category === 'Timepass' ? '🎮'
                : '📝';

            const text = [
                `${emoji} *New Godzilla-Type Feedback*`,
                ``,
                `👤 *Name:* ${args.name}`,
                `📦 *Module:* ${args.module}`,
                `🏷️ *Category:* ${args.category}`,
                ``,
                `💬 *Description:*`,
                args.description,
            ].join('\n');

            try {
                await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        chat_id: chatId,
                        text,
                        parse_mode: 'Markdown',
                    }),
                });
            } catch (err) {
                console.error('Telegram notification failed:', err);
                // Don't throw—feedback was already saved to DB
            }
        } else {
            console.warn('Telegram credentials not configured. Feedback saved to DB only.');
        }
    },
});
