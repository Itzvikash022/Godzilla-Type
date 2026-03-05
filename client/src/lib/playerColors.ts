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

function djb2Hash(str: string): number {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
        hash = (hash << 5) + hash + str.charCodeAt(i);
        hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
}

export function hashColor(name: string): string {
    const index = djb2Hash(name) % PLAYER_COLOR_PALETTE.length;
    return PLAYER_COLOR_PALETTE[index];
}
