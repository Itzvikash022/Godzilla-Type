// ==========================================
// GODZILLA-TYPE — Prompt Generator
// ==========================================
// Large dataset-backed prompt generation for multiple typing modes.

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — import attributes require TS 5.3+ with resolveJsonModule
import wordsData from '../../data/words.json' with { type: 'json' };
// @ts-ignore
import sentencesData from '../../data/sentences.json' with { type: 'json' };
// @ts-ignore
import quotesData from '../../data/quotes.json' with { type: 'json' };


export type PromptMode = 'words' | 'sentences' | 'paragraph' | 'quote' | 'custom';

interface Quote {
  text: string;
  author: string;
}

const wData: any = (wordsData as any).default || wordsData;
const sData: any = (sentencesData as any).default || sentencesData;
const qData: any = (quotesData as any).default || quotesData;

const WORDS: string[] = wData.words || wData.language || [];
const SENTENCES: string[] = sData.sentences || (Array.isArray(sData) ? sData : []);
const QUOTES: Quote[] = qData.quotes || (Array.isArray(qData) ? qData : []);

// --- Helpers ---

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickMany<T>(arr: T[], count: number): T[] {
  const result: T[] = [];
  for (let i = 0; i < count; i++) {
    result.push(pick(arr));
  }
  return result;
}

// --- Generators ---

/**
 * Generate a random word sequence.
 * Returns { words, prompt } for compatibility with typing engine.
 */
export function generateWords(count: number): { words: string[]; prompt: string } {
  const words = pickMany(WORDS, count);
  return { words, prompt: words.join(' ') };
}

/**
 * Generate N random sentences joined into a single prompt.
 */
export function generateSentences(count: number): { words: string[]; prompt: string } {
  const selected = pickMany(SENTENCES, count);
  const prompt = selected.join(' ');
  const words = prompt.split(' ');
  return { words, prompt };
}

/**
 * Generate a paragraph (alias for generateSentences, good default for races).
 */
export function generateParagraph(sentenceCount: number): { words: string[]; prompt: string } {
  return generateSentences(sentenceCount);
}

/**
 * Return a random quote formatted for typing.
 */
export function generateQuote(): { words: string[]; prompt: string; author?: string } {
  const q = pick(QUOTES);
  const prompt = `${q.text}`;
  const words = prompt.split(' ');
  return { words, prompt, author: q.author };
}

/**
 * Generate a prompt by mode.
 * @param mode   - 'words' | 'sentences' | 'paragraph' | 'quote'
 * @param amount - word count (words) or sentence count (sentences/paragraph). Ignored for quote.
 */
export function generatePrompt(
  mode: PromptMode,
  amount: number
): { words: string[]; prompt: string; author?: string } {
  switch (mode) {
    case 'words':
      return generateWords(amount);
    case 'sentences':
      return generateSentences(amount);
    case 'paragraph':
      return generateParagraph(amount);
    case 'quote':
      return generateQuote();
    case 'custom':
      // Custom mode: caller must supply providedPrompt; fall back to words
      return generateWords(amount);
    default:
      return generateWords(amount);
  }
}

/**
 * Extend an existing prompt by appending more words.
 * Used when the typist is still typing but reaches the end of the buffer.
 */
export function extendPrompt(
  existingPrompt: string,
  mode: PromptMode,
  addAmount: number
): { words: string[]; prompt: string } {
  let extension: string;
  if (mode === 'words') {
    extension = pickMany(WORDS, addAmount).join(' ');
  } else {
    extension = pickMany(SENTENCES, Math.max(1, Math.ceil(addAmount / 8))).join(' ');
  }
  const newPrompt = existingPrompt + ' ' + extension;
  return { words: newPrompt.split(' '), prompt: newPrompt };
}

export const datasetStats = {
  wordCount: WORDS.length,
  sentenceCount: SENTENCES.length,
  quoteCount: QUOTES.length,
};
