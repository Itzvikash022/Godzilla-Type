/**
 * Service to generate typing practice content by delegating to our secure Node backend.
 * The backend manages the fallback models (2.5 -> 1.5) and obscures the API key.
 */

export interface GeminiRequestOptions {
    theme: string;
    difficulty: 'Easy' | 'Medium' | 'Hard' | 'Meme';
    wordCount: number;
    punctuation: boolean;
}

export async function generateTypingContent(options: GeminiRequestOptions, onTimeout?: () => void): Promise<string> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
        controller.abort();
        if (onTimeout) onTimeout();
    }, 20000); // Wait 20s overall for the server since it tries fallbacks

    try {
        const response = await fetch('/api/generate-typing-text', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(options),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `Server Error: ${response.status}`);
        }

        const data = await response.json();
        if (!data.text) {
            throw new Error('Received malformed response from generation server.');
        }

        return data.text;
    } catch (err: any) {
        if (err.name === 'AbortError') {
            throw new Error('Timeout: The AI generation took too long.');
        }
        throw err;
    } finally {
        clearTimeout(timeoutId);
    }
}
