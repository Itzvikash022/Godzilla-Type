/**
 * Deterministic player color assignment based on username and connection ID.
 * Generates an HSL color strictly from the hash to allow 360 unique variants.
 */

function generateHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        // Java-style string hash
        hash = Math.imul(31, hash) + str.charCodeAt(i) | 0;
    }

    // MurmurHash3 finalizer (avalanche)
    hash ^= hash >>> 16;
    hash = Math.imul(hash, 0x85ebca6b);
    hash ^= hash >>> 13;
    hash = Math.imul(hash, 0xc2b2ae35);
    hash ^= hash >>> 16;

    return Math.abs(hash);
}

export function hashColor(name: string, uniqueId?: string): string {
    const inputString = name + (uniqueId || '');
    const hue = generateHash(inputString) % 360;

    // Saturation 75%, Lightness 65% ensures nice bright pastel/neon colors that contrast well on dark mode
    return `hsl(${hue}, 75%, 65%)`;
}
