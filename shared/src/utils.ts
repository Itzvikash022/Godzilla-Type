// ==========================================
// GODZILLA-TYPE — Shared Utilities
// ==========================================

import { COMMON_WORDS, ROOM_CODE_LENGTH } from './constants.js';

/**
 * Calculate gross WPM: (total characters typed / 5) / minutes elapsed
 */
export function calculateWPM(charsTyped: number, timeElapsedMs: number): number {
  if (timeElapsedMs <= 0) return 0;
  const minutes = timeElapsedMs / 60000;
  return Math.round((charsTyped / 5) / minutes);
}

/**
 * Calculate net WPM: ((total characters - errors) / 5) / minutes elapsed
 */
export function calculateNetWPM(charsTyped: number, errors: number, timeElapsedMs: number): number {
  if (timeElapsedMs <= 0) return 0;
  const minutes = timeElapsedMs / 60000;
  const netChars = Math.max(0, charsTyped - errors);
  return Math.round((netChars / 5) / minutes);
}

/**
 * Calculate accuracy percentage
 */
export function calculateAccuracy(correctChars: number, totalChars: number): number {
  if (totalChars <= 0) return 100;
  return Math.round((correctChars / totalChars) * 10000) / 100;
}

/**
 * Generate a 6-character alphanumeric room code
 */
export function generateRoomCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < ROOM_CODE_LENGTH; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Generate an array of random words
 */
export function generateWordSequence(count: number): string[] {
  const words: string[] = [];
  for (let i = 0; i < count; i++) {
    const idx = Math.floor(Math.random() * COMMON_WORDS.length);
    words.push(COMMON_WORDS[idx]);
  }
  return words;
}

/**
 * Generate a prompt text string from random words
 */
export function generatePromptText(wordCount: number): { words: string[]; prompt: string } {
  const words = generateWordSequence(wordCount);
  return { words, prompt: words.join(' ') };
}

/**
 * Calculate progress percentage based on characters typed vs total
 */
export function calculateProgress(charsTyped: number, totalChars: number): number {
  if (totalChars <= 0) return 0;
  return Math.min(100, Math.round((charsTyped / totalChars) * 100));
}
