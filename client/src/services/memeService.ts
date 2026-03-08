import { useState, useEffect } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';

export interface MemeItem {
    memeId: string;
    imageUrl: string;
    soundUrl?: string;
    type: string;
}

const SERVER_BASE = import.meta.env.VITE_SERVER_URL || '';

/**
 * Uploads a meme image (+ optional sound) to the server anonymously.
 * The server validates, uploads to Cloudinary, and returns the CDN URLs.
 */
export async function uploadMeme(
    imageFile: File,
    soundFile: File | null
): Promise<{ memeId: string; imageUrl: string; soundUrl?: string }> {
    const form = new FormData();
    form.append('image', imageFile);
    if (soundFile) form.append('sound', soundFile);

    const response = await fetch(`${SERVER_BASE}/api/upload-meme`, {
        method: 'POST',
        body: form,
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || `Upload failed (${response.status})`);
    }

    return response.json();
}

/**
 * Hook to fetch the meme library from Convex, cache it locally for instant loads,
 * and prefetch the Cloudinary images into the browser's disk cache silently.
 */
export function useMemeLibrary() {
    // 1. Instantly load from cache to give UI an immediate response
    const [memes, setMemes] = useState<MemeItem[]>(() => {
        try {
            const cached = localStorage.getItem('godzilla_memes_cache');
            return cached ? JSON.parse(cached) : [];
        } catch {
            return [];
        }
    });

    // 2. Fetch the live master list from Convex
    const liveMemes = useQuery(api.memeMutations.getAllMemes);

    // 3. Reconcile live data vs cache, and trigger background preloading
    useEffect(() => {
        if (!liveMemes) return;

        // Save new state to state and cache
        setMemes(liveMemes);
        localStorage.setItem('godzilla_memes_cache', JSON.stringify(liveMemes));

        // Background preloading logic
        // We only want to preload images we haven't already cached locally
        // But the browser's disk cache is smart—calling `new Image().src` on an already 
        // cached Cloudinary URL takes 0 network bytes. Still, we stagger it so it doesn't freeze the UI.
        const preloadItems = [...liveMemes];
        let index = 0;

        const preloader = setInterval(() => {
            if (index >= preloadItems.length) {
                clearInterval(preloader);
                return;
            }
            const img = new Image();
            img.src = preloadItems[index].imageUrl;
            index++;
        }, 100); // Preload one image every 100ms in the background

        return () => clearInterval(preloader);
    }, [liveMemes]);

    return { memes, isLoading: !liveMemes && memes.length === 0 };
}
