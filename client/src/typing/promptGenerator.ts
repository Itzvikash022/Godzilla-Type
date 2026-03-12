// ==========================================
// GODZILLA-TYPE — Advanced Prompt Generator
// ==========================================

import wordsDataFull from '@data/words.json';
import quotesDataFull from '@data/quotes.json';

export type PromptMode = 'words' | 'paragraph' | 'quote' | 'custom';

interface MonkeyQuote {
    text: string;
    source: string;
    id: number;
}

interface Quote {
    text: string;
    author: string;
}

// Ensure types match the actual JSON structure from Monkeytype reference
const WORDS: string[] = (wordsDataFull as any).words || (wordsDataFull as any).language || [];
const QUOTES_RAW: MonkeyQuote[] = (quotesDataFull as any).quotes || [];

// Helper for shuffling array
function shuffle<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
}

// Monkeytype logic for punctuation injection
function punctuateWord(word: string, previousWord: string, index: number, total: number): string {
    const rand = Math.random();
    let result = word;

    // 10% chance to capitalize
    if (Math.random() < 0.1) {
        result = result.charAt(0).toUpperCase() + result.slice(1);
    }

    // Punctuation rules
    if (rand < 0.05) {
        result += '.';
    } else if (rand < 0.1) {
        result += ',';
    } else if (rand < 0.12) {
        result += '?';
    } else if (rand < 0.14) {
        result += '!';
    } else if (rand < 0.16) {
        result = `"${result}"`;
    } else if (rand < 0.18) {
        result += ';';
    } else if (rand < 0.2) {
        result += ':';
    }

    return result;
}

/**
 * Generate a random word sequence following Monkeytype's logic.
 */
export function generateWords(count: number, options: { punc?: boolean; numbers?: boolean } = {}): { words: string[]; prompt: string } {
    let selected = [];
    const pool = WORDS;

    for (let i = 0; i < count; i++) {
        let word = pool[Math.floor(Math.random() * pool.length)];

        // Inject numbers
        if (options.numbers && Math.random() < 0.1) {
            word = Math.floor(Math.random() * 100).toString();
        }

        if (options.punc) {
            word = punctuateWord(word, selected[i - 1] || '', i, count);
        }

        selected.push(word);
    }

    return { words: selected, prompt: selected.join(' ') };
}

/**
 * Generate sentences by joining words into natural-looking structures.
 */
export function generateSentences(count: number, clean = true): { words: string[]; prompt: string } {
    const words = [];
    for (let i = 0; i < count; i++) {
        // A sentence is 5-12 words
        const sentenceLength = 5 + Math.floor(Math.random() * 8);
        const { words: sWords } = generateWords(sentenceLength, { punc: false });

        if (!clean) {
            // Capitalize first word and add period only if not cleaning
            sWords[0] = sWords[0].charAt(0).toUpperCase() + sWords[0].slice(1);
            sWords[sWords.length - 1] += '.';
        }

        words.push(...sWords);
    }
    return { words: words, prompt: words.join(' ') };
}

/**
 * Get a random quote from the large dataset.
 */
export function generateQuote(): { words: string[]; prompt: string; author?: string } {
    const q = QUOTES_RAW[Math.floor(Math.random() * QUOTES_RAW.length)];
    const words = q.text.split(' ');
    return { words, prompt: q.text, author: q.source };
}

/**
 * Main prompt generator function.
 */
export function generatePrompt(
    mode: PromptMode,
    amount: number,
    options: { punc?: boolean; numbers?: boolean } = {}
): { words: string[]; prompt: string; author?: string } {
    switch (mode) {
        case 'words':
            return generateWords(amount, options);
        case 'paragraph':
            return generateSentences(amount, false);
        case 'quote':
            return generateQuote();
        default:
            return generateWords(amount, options);
    }
}

/**
 * Extend an existing prompt.
 */
export function extendPrompt(
    existingPrompt: string,
    mode: PromptMode,
    addAmount: number,
    options: { punc?: boolean; numbers?: boolean } = {}
): { words: string[]; prompt: string } {
    const { words: newWords, prompt: newP } = generatePrompt(mode, addAmount, options);
    const combinedPrompt = existingPrompt + ' ' + newP;
    return { words: combinedPrompt.split(' '), prompt: combinedPrompt };
}
