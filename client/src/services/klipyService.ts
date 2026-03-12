// Klipy API Integration Service
// Docs: https://docs.klipy.com/getting-started

const KLIPY_BASE_URL = 'https://api.klipy.com/api/v1';
const KLIPY_APP_KEY = import.meta.env.VITE_KLIPY_APP_KEY || 'ENTER_YOUR_KLIPY_APP_KEY_HERE';
const CUSTOMER_ID = 'godzilla-type-client';

export type KlipyMediaType = 'gifs' | 'stickers' | 'static-memes' | 'clips';

interface KlipyMediaFormat {
    url: string;
    width?: number;
    height?: number;
}

type KlipyMediaOrString = KlipyMediaFormat | string;

export interface KlipyItem {
    id: string;
    title: string;
    file: {
        gif?: KlipyMediaOrString;
        png?: KlipyMediaOrString;
        webp?: KlipyMediaOrString;
        mp4?: KlipyMediaOrString;
        hd?: {
            gif?: KlipyMediaOrString;
            png?: KlipyMediaOrString;
            webp?: KlipyMediaOrString;
            mp4?: KlipyMediaOrString;
        };
        sd?: {
            gif?: KlipyMediaOrString;
            png?: KlipyMediaOrString;
            webp?: KlipyMediaOrString;
            mp4?: KlipyMediaOrString;
        };
    };
}

let trendingCache: Record<KlipyMediaType, KlipyItem[]> = {
    'gifs': [],
    'stickers': [],
    'static-memes': [],
    'clips': []
};

let trendingCacheTime: Record<KlipyMediaType, number> = {
    'gifs': 0,
    'stickers': 0,
    'static-memes': 0,
    'clips': 0
};

const CACHE_TTL = 1000 * 60 * 5; // 5 minutes

export function getCachedKlipyTrending(type: KlipyMediaType): KlipyItem[] | null {
    const now = Date.now();
    if (trendingCache[type].length > 0 && (now - trendingCacheTime[type] < CACHE_TTL)) {
        return trendingCache[type];
    }
    return null;
}

export async function searchKlipy(query: string, type: KlipyMediaType = 'gifs', limit = 12): Promise<KlipyItem[]> {
    try {
        const isTrending = !query.trim();

        if (isTrending) {
            const cached = getCachedKlipyTrending(type);
            if (cached) return cached;
        }

        const endpoint = isTrending 
            ? `${KLIPY_BASE_URL}/${KLIPY_APP_KEY}/${type}/trending?customer_id=${CUSTOMER_ID}&per_page=${limit}`
            : `${KLIPY_BASE_URL}/${KLIPY_APP_KEY}/${type}/search?q=${encodeURIComponent(query)}&customer_id=${CUSTOMER_ID}&per_page=${limit}`;
            
        const response = await fetch(endpoint);

        if (!response.ok) {
            throw new Error(`Klipy API failed: ${response.statusText}`);
        }

        const data = await response.json();
        const results = data.data?.data || [];

        if (isTrending) {
            trendingCache[type] = results;
            trendingCacheTime[type] = Date.now();
        }

        return results;
    } catch (error) {
        console.error(`Error fetching Klipy (${type}):`, error);
        return [];
    }
}

function extractUrl(media?: KlipyMediaOrString): string | undefined {
    if (!media) return undefined;
    if (typeof media === 'string') return media;
    return media.url;
}

/**
 * Helper to get the best preview URL from a Klipy item
 */
export function getKlipyPreviewUrl(item: KlipyItem): string {
    const f = item.file;
    // Prefer webp/gif/png for preview (no mp4)
    return extractUrl(f.hd?.webp) || extractUrl(f.webp) || extractUrl(f.hd?.gif) || extractUrl(f.gif) || extractUrl(f.hd?.png) || extractUrl(f.png) || extractUrl(f.sd?.webp) || extractUrl(f.sd?.gif) || '';
}

/**
 * Helper to get the high-quality image URL for sending
 */
export function getKlipyMainUrl(item: KlipyItem): string {
    const f = item.file;
    // Explicitly exclude mp4 as Chatbox uses <img> tags. Fallback to best available animated/static image.
    return extractUrl(f.hd?.webp) || extractUrl(f.hd?.gif) || extractUrl(f.hd?.png) || extractUrl(f.webp) || extractUrl(f.gif) || extractUrl(f.png) || extractUrl(f.sd?.webp) || extractUrl(f.sd?.gif) || '';
}
