import { Request, Response, NextFunction } from 'express';

// ── Rate Limiter State ────────────────────────────────────────────────────────

interface IPRateData {
    // Short-term tracking (resets every 1 min)
    requestsThisMinute: number;
    minuteStartTime: number;

    // Long-term tracking (violations fade after 30 mins)
    violations: number;
    lastViolationTime: number;

    // Hard ban tracking (ban lasts 60 mins)
    banUntil: number;
}

const ipMap = new Map<string, IPRateData>();

// Constants
const MINUTE_MS = 60 * 1000;
const VIOLATION_WINDOW_MS = 30 * MINUTE_MS;
const BAN_DURATION_MS = 60 * MINUTE_MS;
const MAX_VIOLATIONS = 3;

/**
 * Sweeps stale IP data to prevent memory leaks over time.
 * Runs on every request but is highly efficient due to Map iteration.
 */
function cleanupStaleData() {
    const now = Date.now();
    for (const [ip, data] of ipMap.entries()) {
        const minExpired = now - data.minuteStartTime > MINUTE_MS;
        const violationsExpired = now - data.lastViolationTime > VIOLATION_WINDOW_MS;
        const banExpired = now > data.banUntil;

        // If everything is clean/expired, delete the tracked IP memory completely.
        if (minExpired && violationsExpired && banExpired && data.violations === 0) {
            ipMap.delete(ip);
        }
    }
}

/**
 * Sleep helper for intentional delays.
 */
const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

// ── Express Middleware ────────────────────────────────────────────────────────

export async function geminiRateLimiter(req: Request, res: Response, next: NextFunction) {
    try {
        const ip = req.ip || req.connection.remoteAddress || 'unknown-ip';
        const now = Date.now();
        const body = req.body || {};

        // 1) BYPASS: "Meme" difficulty explicitly overrides limits based on user instructions.
        if (body.difficulty === 'Meme') {
            return next();
        }

        cleanupStaleData();

        // 2) Initialize IP tracking if new.
        let data = ipMap.get(ip);
        if (!data) {
            data = {
                requestsThisMinute: 0,
                minuteStartTime: now,
                violations: 0,
                lastViolationTime: 0,
                banUntil: 0,
            };
            ipMap.set(ip, data);
        }

        // 3) CHECK BAN STATUS
        if (now < data.banUntil) {
            // User is serving a 60-minute ban.
            // Stealth message instruction: "Server is having too busy at the moment try again later"
            res.status(429).json({ error: 'Server is too busy at the moment. Please try again later.' });
            return;
        }

        // 4) MINUTE WINDOW RESET
        if (now - data.minuteStartTime > MINUTE_MS) {
            data.requestsThisMinute = 0;
            data.minuteStartTime = now;
        }

        // 5) INCREMENT REQUESTS
        data.requestsThisMinute++;

        // 6) TIERED LOGIC based on Word Count
        const wordCount = typeof body.wordCount === 'number' ? body.wordCount : 200;
        const isHeavy = wordCount > 200;

        let maxAllowed = isHeavy ? 3 : 5;   // Request limits per minute
        let delayPenalized = false;
        let delayMs = 0;

        // Check if they exceeded the absolute max limit for the minute
        if (data.requestsThisMinute > maxAllowed) {
            // They pushed it too far. Record a violation.
            data.violations++;
            data.lastViolationTime = now;

            if (data.violations >= MAX_VIOLATIONS) {
                // TRIGGER HARD BAN
                data.banUntil = now + BAN_DURATION_MS;
                console.warn(`IP ${ip} entered 60-min ban due to ${MAX_VIOLATIONS} violations.`);
                // Immediately reject using the stealth message.
                res.status(429).json({ error: 'Server is too busy at the moment. Please try again later.' });
                return;
            }

            // Minor infraction rejection (not banned yet). No stealth needed here, just rate limit info.
            const waitTime = Math.ceil((MINUTE_MS - (now - data.minuteStartTime)) / 1000);
            res.status(429).json({ error: `You're requesting too fast! Please wait ${waitTime}s before generating again.` });
            return;
        }

        // 7) DELAY PENALTIES for approaching boundaries
        if (isHeavy && data.requestsThisMinute === 3) {
            // 3rd >200 request: Delay by 3 seconds
            delayPenalized = true;
            delayMs = 3000;
        } else if (!isHeavy && (data.requestsThisMinute === 4 || data.requestsThisMinute === 5)) {
            // 4th and 5th <=200 request: Delay by 2 seconds
            delayPenalized = true;
            delayMs = 2000;
        }

        // Apply delay asynchronously if penalized
        if (delayPenalized) {
            // console.log(`Applying ${delayMs}ms delay to IP ${ip} (Req ${data.requestsThisMinute}/${maxAllowed}).`);
            await delay(delayMs);
        }

        // Clean tracking logic completed; pass to gemini generation handler.
        next();
    } catch (err) {
        console.error('Gemini Rate Limiter Error:', err);
        // On unexpected errors, just fail open so the app continues functioning.
        next();
    }
}
