import type { Request, Response } from 'express';

const MODELS_TO_TRY = [
    'gemini-2.5-flash',
    'gemini-3.1-flash-lite-preview',
    'gemini-3.1-pro-preview'
];

export async function generateTypingTextHandler(req: Request, res: Response) {
    try {
        const { theme, difficulty, wordCount, punctuation } = req.body;

        // We expect the API key to be available in the server's environment. Trimming strictly.
        const apiKey = process.env.GEMINI_API_KEY?.trim();
        if (!apiKey) {
            return res.status(500).json({ error: 'Gemini API Key is not configured on the server.' });
        }

        const systemInstruction = `You are generating text for a typing practice application.

Generate a passage suitable for typing practice.

Requirements:
Theme: ${theme || 'General topic'}
Difficulty level: ${difficulty || 'Medium'}
Approximate length: ${wordCount || 200} words
Punctuation allowed: ${punctuation === true}

Rules:
The text must be plain English prose.
Do not include bullet points, lists, titles, or markdown.
Do not include explanations.
Do not include code formatting.
Do not include emojis.

The text should be continuous paragraphs suitable for typing practice. Wait... actually, flatten the output to be one continuous single block of text (single paragraph) to make typing flow better.
If punctuation is disabled, avoid commas, quotation marks, and complex punctuation.

Difficulty guidance:
Easy: short sentences, simple vocabulary
Medium: moderate sentence length, normal vocabulary
Hard: longer sentences, advanced vocabulary

Return ONLY the generated text with no extra commentary.`;

        const requestBody = {
            contents: [
                {
                    parts: [{ text: `Generate a passage about: ${theme || 'General topic'}` }]
                }
            ],
            systemInstruction: {
                parts: [{ text: systemInstruction }]
            },
            generationConfig: {
                temperature: 0.7,
            }
        };

        let lastError: Error | null = null;
        let finalOutput = '';

        for (const model of MODELS_TO_TRY) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => {
                    controller.abort();
                }, 15000);

                const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

                const response = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(requestBody),
                    signal: controller.signal
                });

                clearTimeout(timeoutId);

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));

                    // Stop fallbacks if the key itself is just broken
                    if (response.status === 400 && errorData?.error?.message?.includes('API key not valid')) {
                        throw new Error(`Google rejected the API key. Please check your key in server/.env`);
                    }

                    throw new Error(`API Error (${model}): ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`);
                }

                const data = await response.json();
                const generatedText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

                if (generatedText) {
                    finalOutput = sanitizeAIOutput(generatedText);
                    break; // Stop falling back since we succeeded
                } else {
                    throw new Error(`Empty response from model ${model}`);
                }

            } catch (error) {
                // If it's a hard auth failure, don't fallback
                if (error instanceof Error && error.message.includes('API key')) {
                    throw error;
                }

                console.warn(`[GEMINI] Failed with model ${model}, trying next...`, error);
                lastError = error instanceof Error ? error : new Error(String(error));
            }
        }

        if (!finalOutput) {
            throw lastError || new Error("All Gemini fallback models failed.");
        }

        return res.json({ text: finalOutput });

    } catch (error) {
        console.error('[GEMINI FATAL]', error);
        return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown generation error' });
    }
}

function sanitizeAIOutput(text: string): string {
    return text
        .replace(/\n+/g, ' ')
        .replace(/(\*\*|\*|__|_)/g, '')
        .replace(/#+\s/g, '')
        .replace(/\s{2,}/g, ' ')
        .trim();
}
