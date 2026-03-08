import { useRef, useCallback } from 'react';

const SOUND_COOLDOWN_MS = 2000;

/**
 * useMemeSound
 *
 * Manages all sound playback rules for the Meme Room:
 * - Deduplication via eventId Set (no duplicate plays on reconnect/re-render)
 * - 2-second global cooldown between sounds from different memes
 * - Auto-mute after playback finishes
 * - Manual replay via exposed `replay()` function
 */
export function useMemeSound() {
    const playedEvents = useRef<Set<string>>(new Set());
    const lastSoundTime = useRef<number>(0);
    const activeAudio = useRef<HTMLAudioElement | null>(null);

    const stopCurrentSound = useCallback((muteOnly = false) => {
        if (activeAudio.current) {
            activeAudio.current.muted = true;
            if (!muteOnly) {
                activeAudio.current.pause();
                activeAudio.current.currentTime = 0;
            }
            activeAudio.current = null;
        }
    }, []);

    /**
     * Play the sound for a freshly received meme event.
     * Will NOT play if:
     *  - The eventId has already been played (dedup)
     *  - Another sound played within the last 2 seconds (cooldown)
     *  - The meme is marked as historical (isHistory === true)
     */
    const playOnce = useCallback((eventId: string, soundUrl: string, isHistory = false) => {
        if (isHistory) return;
        if (playedEvents.current.has(eventId)) return;

        const now = Date.now();
        if (now - lastSoundTime.current < SOUND_COOLDOWN_MS) return;

        playedEvents.current.add(eventId);
        lastSoundTime.current = now;

        stopCurrentSound(); // Stop any currently playing meme sound

        const audio = new Audio(soundUrl);
        activeAudio.current = audio;
        audio.muted = false;

        audio.play().catch(() => { /* Autoplay blocked */ });
        audio.onended = () => {
            stopCurrentSound(true);
        };
    }, [stopCurrentSound]);

    /**
     * Manually replay a sound (triggered by the 🔁 button).
     * Bypasses cooldown and dedup — direct user intent.
     * Auto-mutes after playback.
     */
    const replay = useCallback((soundUrl: string) => {
        stopCurrentSound(); // Stop any currently playing meme sound

        const audio = new Audio(soundUrl);
        activeAudio.current = audio;
        audio.muted = false;

        audio.play().catch(() => { });
        audio.onended = () => {
            stopCurrentSound(true);
        };
    }, [stopCurrentSound]);

    return { playOnce, replay };
}
