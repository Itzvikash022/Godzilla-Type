// ==========================================
// GODZILLA-TYPE — Convex Client Singleton
// ==========================================

import { ConvexClient } from 'convex/browser';

const convexUrl = import.meta.env.VITE_CONVEX_URL as string;

let _client: ConvexClient | null = null;

export function getConvexClient(): ConvexClient | null {
    if (!convexUrl) {
        console.warn('[Convex] VITE_CONVEX_URL is not set — cloud sync disabled.');
        return null;
    }
    if (!_client) {
        _client = new ConvexClient(convexUrl);
    }
    return _client;
}

export function isConvexConfigured(): boolean {
    return !!convexUrl;
}
