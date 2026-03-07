/**
 * Deterministic player color assignment based on username.
 * Uses a simple djb2 hash to pick a consistent color from a palette.
 */

const PLAYER_COLOR_PALETTE = [
    '#60a5fa', // blue
    '#4ade80', // green
    '#fb923c', // orange
    '#a78bfa', // purple
    '#22d3ee', // cyan
    '#f472b6', // pink
    '#facc15', // yellow
    '#f87171', // red
];

function generateHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        // Java-style string hash
        hash = Math.imul(31, hash) + str.charCodeAt(i) | 0;
    }

    // MurmurHash3 finalizer (avalanche) to perfectly distribute similar strings (like Player1 vs Player2)
    hash ^= hash >>> 16;
    hash = Math.imul(hash, 0x85ebca6b);
    hash ^= hash >>> 13;
    hash = Math.imul(hash, 0xc2b2ae35);
    hash ^= hash >>> 16;

    return Math.abs(hash);
}

export function hashColor(name: string, uniqueId?: string): string {
    const inputString = name + (uniqueId || '');
    const index = generateHash(inputString) % PLAYER_COLOR_PALETTE.length;
    return PLAYER_COLOR_PALETTE[index];
}
