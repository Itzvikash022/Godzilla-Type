// ==========================================
// GODZILLA-TYPE — Zero-Latency Typing Engine (v4)
// ==========================================
// Key insight: React state is ONLY updated for:
//   - isActive (to start timer)
//   - isFinished (to end test)
//   - prompt extension (new words added)
//   - stats (every 500ms tick)
//
// Character coloring, caret positioning, and extra-char rendering
// happen via DIRECT DOM mutation — zero React re-renders per keystroke.
// This is how Monkeytype achieves its responsiveness.
// ==========================================

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import {
  calculateWPM,
  calculateNetWPM,
  calculateAccuracy,
  calculateProgress,
} from '@godzilla-type/shared';
import {
  generatePrompt,
  extendPrompt,
  type PromptMode,
} from '../typing/promptGenerator';

export type CharState = 'correct' | 'incorrect' | 'current' | 'upcoming';
export { type PromptMode };

export interface TypingState {
  words: string[];
  prompt: string;
  charStates: CharState[];
  currentIndex: number;
  correctChars: number;
  incorrectChars: number;
  totalCharsTyped: number;
  wpm: number;
  netWpm: number;
  accuracy: number;
  progress: number;
  isFinished: boolean;
  timeLeft: number;
  isActive: boolean;
  extraChars: Record<number, string>;
  isTyping: boolean;
}

interface UseTypingEngineOptions {
  duration: number;
  mode?: PromptMode;
  providedWords?: string[];
  providedPrompt?: string;
  onProgress?: (state: TypingState) => void;
  onFinish?: (state: TypingState) => void;
}

const EXTEND_THRESHOLD = 200;
const EXTEND_AMOUNT = 60;

// ---- Direct DOM helpers ---- //
// These bypass React entirely for zero-latency character coloring.
function setCharClass(index: number, state: CharState) {
  const el = document.getElementById(`char-${index}`);
  if (el) el.className = `char ${state}`;
}

function appendExtraChar(wordEl: Element, char: string) {
  const span = document.createElement('span');
  span.className = 'char incorrect extra';
  span.textContent = char;
  // Insert BEFORE the trailing space (last child of word div)
  const lastChild = wordEl.lastElementChild;
  if (lastChild) wordEl.insertBefore(span, lastChild);
  else wordEl.appendChild(span);
}

function removeLastExtraChar(wordEl: Element) {
  // Extra chars are spans with class 'extra'. Find the last one and remove it.
  const extras = wordEl.querySelectorAll('.char.extra');
  if (extras.length > 0) extras[extras.length - 1].remove();
}

// ---- Engine ---- //
export function useTypingEngine(options: UseTypingEngineOptions) {
  const {
    duration,
    mode = 'words',
    providedWords,
    providedPrompt,
    onProgress,
    onFinish,
  } = options;

  // Minimal React state — only things that affect non-typing UI
  const [prompt, setPrompt] = useState('');
  const [words, setWords] = useState<string[]>([]);
  const [charStates, setCharStates] = useState<CharState[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(duration);
  const [isFinished, setIsFinished] = useState(false);
  const [isActive, setIsActive] = useState(false);
  // extraChars still needs React state so the Word component can render extra spans on load/reset
  const [extraChars, setExtraChars] = useState<Record<number, string>>({});
  const [isTyping, setIsTyping] = useState(false);

  // Refs — the true source of truth during typing
  const startTimeRef = useRef<number>(0);
  const timerRef = useRef<number | null>(null);
  const currentIndexRef = useRef(0);
  const charStatesRef = useRef<CharState[]>([]);
  const totalCharsTypedRef = useRef(0);
  const correctCharsRef = useRef(0);
  const incorrectCharsRef = useRef(0);
  const promptRef = useRef('');
  const wordsRef = useRef<string[]>([]);
  const modeRef = useRef(mode);
  const durationRef = useRef(duration);
  const typingTimeoutRef = useRef<number | null>(null);
  const extraCharsRef = useRef<Record<number, string>>({});
  // Track word boundaries for fast lookup
  const wordBoundariesRef = useRef<{ start: number; end: number }[]>([]);

  const [stats, setStats] = useState({ wpm: 0, netWpm: 0, accuracy: 100, progress: 0 });

  useEffect(() => { modeRef.current = mode; }, [mode]);
  useEffect(() => { durationRef.current = duration; }, [duration]);

  // Build word boundary lookup: [{start, end}] where end is index of trailing space
  function buildWordBoundaries(p: string) {
    const boundaries: { start: number; end: number }[] = [];
    let i = 0;
    while (i < p.length) {
      const spaceIdx = p.indexOf(' ', i);
      if (spaceIdx === -1) {
        boundaries.push({ start: i, end: p.length - 1 });
        break;
      }
      boundaries.push({ start: i, end: spaceIdx });
      i = spaceIdx + 1;
    }
    wordBoundariesRef.current = boundaries;
    return boundaries;
  }

  // Fast O(1) word index by cursor position
  function getWordIdxForCharIdx(ci: number): number {
    const bounds = wordBoundariesRef.current;
    for (let i = 0; i < bounds.length; i++) {
      if (ci <= bounds[i].end) return i;
    }
    return bounds.length - 1;
  }

  // ---- Reset Logic ---- //
  const resetTest = useCallback((keepWords = false) => {
    if (timerRef.current) cancelAnimationFrame(timerRef.current);

    let w: string[];
    let p: string;

    if (keepWords) {
      w = wordsRef.current.length ? wordsRef.current : [];
      p = promptRef.current || '';
    } else if (providedWords && providedPrompt) {
      w = providedWords;
      p = providedPrompt;
    } else {
      const r = generatePrompt(modeRef.current, 100);
      w = r.words;
      p = r.prompt;
    }

    promptRef.current = p;
    wordsRef.current = w;
    buildWordBoundaries(p);

    const states: CharState[] = p.split('').map((_, i) => (i === 0 ? 'current' : 'upcoming'));
    charStatesRef.current = states;
    currentIndexRef.current = 0;

    setPrompt(p);
    setWords(w);
    setCharStates(states);
    setCurrentIndex(0);
    setTimeLeft(durationRef.current);
    setIsFinished(false);
    setIsActive(false);
    setExtraChars({});
    extraCharsRef.current = {};
    setIsTyping(false);
    setStats({ wpm: 0, netWpm: 0, accuracy: 100, progress: 0 });

    startTimeRef.current = 0;
    totalCharsTypedRef.current = 0;
    correctCharsRef.current = 0;
    incorrectCharsRef.current = 0;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [providedWords, providedPrompt]);

  useEffect(() => { resetTest(false); }, [mode, providedWords, providedPrompt]);
  useEffect(() => { if (wordsRef.current.length) resetTest(true); }, [duration]);

  // ---- Timer ---- //
  useEffect(() => {
    if (!isActive || isFinished) return;

    let lastTick = Date.now();
    const tick = () => {
      const now = Date.now();
      const elapsed = now - startTimeRef.current;
      const t = totalCharsTypedRef.current;
      const errs = incorrectCharsRef.current;
      const c = correctCharsRef.current;

      if (now - lastTick > 500) {
        if (t > 0) {
          setStats({
            wpm: calculateWPM(t, elapsed),
            netWpm: calculateNetWPM(t, errs, elapsed),
            accuracy: calculateAccuracy(c, t),
            progress: calculateProgress(currentIndexRef.current, promptRef.current.length)
          });
        }

        const remaining = Math.max(0, duration - Math.floor(elapsed / 1000));
        setTimeLeft(remaining);

        if (remaining === 0) {
          setIsFinished(true);
          setIsActive(false);
          return;
        }
        lastTick = now;
      }

      timerRef.current = requestAnimationFrame(tick);
    };

    timerRef.current = requestAnimationFrame(tick);
    return () => { if (timerRef.current) cancelAnimationFrame(timerRef.current); };
  }, [isActive, isFinished, duration]);

  // ---- Buffer Extension ---- //
  const extendBuffer = useCallback(() => {
    const currentPrompt = promptRef.current;
    const extended = extendPrompt(currentPrompt, modeRef.current, EXTEND_AMOUNT);
    const newStates = [...charStatesRef.current];

    for (let i = charStatesRef.current.length; i < extended.prompt.length; i++) {
      newStates.push('upcoming');
    }

    promptRef.current = extended.prompt;
    charStatesRef.current = newStates;
    buildWordBoundaries(extended.prompt);
    setPrompt(extended.prompt);
    setWords(extended.words);
    setCharStates(newStates);
  }, []);

  // ---- Input Handling (Zero-React-Render Hot Path) ---- //
  const handleKeyPress = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (isFinished) return;
    const key = e.key;
    if (key.length !== 1 && key !== 'Backspace') return;

    // --- Blinking caret: stop blink on keypress, resume after 500ms idle ---
    const caretEl = document.querySelector('.caret');
    if (caretEl) {
      caretEl.classList.remove('blinking');
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        caretEl.classList.add('blinking');
      }, 500) as unknown as number;
    }

    if (!isActive) {
      setIsActive(true);
      startTimeRef.current = Date.now();
    }

    const ci = currentIndexRef.current;
    const p = promptRef.current;
    const states = charStatesRef.current;
    const wordIdx = getWordIdxForCharIdx(ci);
    const wordEl = document.getElementById(`word-${wordIdx}`);

    if (key === 'Backspace') {
      const currentExtras = extraCharsRef.current[wordIdx] || '';
      if (currentExtras.length > 0) {
        // Remove last extra char from DOM directly
        if (wordEl) removeLastExtraChar(wordEl);
        const nextExtras = { ...extraCharsRef.current, [wordIdx]: currentExtras.slice(0, -1) };
        extraCharsRef.current = nextExtras;
        // Update caret
        const caretDom = document.querySelector<HTMLElement>('.caret');
        if (wordEl && caretDom) {
          const allChars = wordEl.querySelectorAll('.char');
          const lastChar = allChars[allChars.length - 1] as HTMLElement;
          const wp = (wordEl.parentElement as HTMLElement).getBoundingClientRect();
          const er = lastChar.getBoundingClientRect();
          const allCharsPrev = wordEl.querySelectorAll('.char');
          // After removal, recalculate
          const extras = wordEl.querySelectorAll('.char.extra');
          if (extras.length === 0) {
            // Back to the space char
            const spaceEl = document.getElementById(`char-${wordBoundariesRef.current[wordIdx].end}`);
            if (spaceEl) {
              const wr = (spaceEl.parentElement?.parentElement as HTMLElement)?.getBoundingClientRect() ?? wp;
              const sr = spaceEl.getBoundingClientRect();
              caretDom.style.left = `${sr.left - wr.left}px`;
              caretDom.style.top = `${sr.top - wr.top}px`;
              caretDom.style.height = `${sr.height || 30}px`;
            }
          } else {
            const lastExtra = extras[extras.length - 1] as HTMLElement;
            const wr = (wordEl.parentElement as HTMLElement).getBoundingClientRect();
            const er = lastExtra.getBoundingClientRect();
            caretDom.style.left = `${er.right - wr.left}px`;
            caretDom.style.top = `${er.top - wr.top}px`;
            caretDom.style.height = `${er.height || 30}px`;
          }
        }
        return;
      }

      if (ci > 0) {
        const ni = ci - 1;
        // Direct DOM: unmark current, mark prev as current
        setCharClass(ci, 'upcoming');
        setCharClass(ni, 'current');
        if (ni + 1 < states.length) states[ni + 1] = 'upcoming';
        states[ni] = 'current';
        currentIndexRef.current = ni;
        charStatesRef.current = states;
        // Move caret directly
        const el = document.getElementById(`char-${ni}`);
        const caretDom = document.querySelector<HTMLElement>('.caret');
        if (el && caretDom) {
          const wr = (el.parentElement?.parentElement as HTMLElement)?.getBoundingClientRect();
          if (wr) {
            const er = el.getBoundingClientRect();
            caretDom.style.left = `${er.left - wr.left}px`;
            caretDom.style.top = `${er.top - wr.top}px`;
            caretDom.style.height = `${er.height || 30}px`;
          }
        }
      }
      return;
    }

    if (key === ' ') {
      // Move to next word: mark skipped chars as incorrect, advance past space
      const bound = wordBoundariesRef.current[wordIdx];
      if (bound) {
        for (let i = ci; i < bound.end; i++) {
          states[i] = 'incorrect';
          setCharClass(i, 'incorrect');
        }
        states[bound.end] = 'correct';
        setCharClass(bound.end, 'correct');
        const ni = bound.end + 1;
        if (ni < states.length) {
          states[ni] = 'current';
          setCharClass(ni, 'current');
        }
        currentIndexRef.current = ni;
        charStatesRef.current = states;
        // Move caret
        const el = document.getElementById(`char-${ni}`);
        const caretDom = document.querySelector<HTMLElement>('.caret');
        const containerDiv = document.querySelector<HTMLElement>('.flex.flex-wrap.relative');
        if (el && caretDom && containerDiv) {
          const wr = containerDiv.getBoundingClientRect();
          const er = el.getBoundingClientRect();
          caretDom.style.left = `${er.left - wr.left}px`;
          caretDom.style.top = `${er.top - wr.top}px`;
          caretDom.style.height = `${er.height || 30}px`;
          const top = er.top - wr.top;
          const scrollEl = containerDiv.parentElement as HTMLElement;
          if (scrollEl) scrollEl.scrollTop = top >= 48 ? top - 48 : 0;
        }
      }
      return;
    }

    // Regular char — typing at or past end of word?
    if (p[ci] === ' ') {
      // EXTRA char
      const currentExtras = extraCharsRef.current[wordIdx] || '';
      if (currentExtras.length < 10 && wordEl) {
        // Append to DOM directly
        appendExtraChar(wordEl, key);
        const nextExtras = { ...extraCharsRef.current, [wordIdx]: currentExtras + key };
        extraCharsRef.current = nextExtras;
        // Move caret to after the new extra char
        const caretDom = document.querySelector<HTMLElement>('.caret');
        if (caretDom) {
          const extras = wordEl.querySelectorAll('.char.extra');
          const lastExtra = extras[extras.length - 1] as HTMLElement;
          const wr = (wordEl.parentElement as HTMLElement).getBoundingClientRect();
          const er = lastExtra.getBoundingClientRect();
          caretDom.style.left = `${er.right - wr.left}px`;
          caretDom.style.top = `${er.top - wr.top}px`;
          caretDom.style.height = `${er.height || 30}px`;
        }
      }
      return;
    }

    // Normal char
    const isCorrect = key === p[ci];
    const newState: CharState = isCorrect ? 'correct' : 'incorrect';
    states[ci] = newState;
    setCharClass(ci, newState);

    const ni = ci + 1;
    if (ni < states.length) {
      states[ni] = 'current';
      setCharClass(ni, 'current');
    }

    currentIndexRef.current = ni;
    charStatesRef.current = states;

    totalCharsTypedRef.current += 1;
    if (isCorrect) correctCharsRef.current += 1;
    else incorrectCharsRef.current += 1;

    // Move caret directly
    const el = document.getElementById(`char-${ni}`);
    const caretDom = document.querySelector<HTMLElement>('.caret');
    const containerDiv = document.querySelector<HTMLElement>('.flex.flex-wrap.relative');
    if (el && caretDom && containerDiv) {
      const wr = containerDiv.getBoundingClientRect();
      const er = el.getBoundingClientRect();
      caretDom.style.left = `${er.left - wr.left}px`;
      caretDom.style.top = `${er.top - wr.top}px`;
      caretDom.style.height = `${er.height || 30}px`;
      const top = er.top - wr.top;
      const scrollEl = containerDiv.parentElement as HTMLElement;
      if (scrollEl) scrollEl.scrollTop = top >= 48 ? top - 48 : 0;
    }

    if (p.length - ni < EXTEND_THRESHOLD) extendBuffer();
  }, [isActive, isFinished, extendBuffer]);

  // Build final state — NOTE: currentIndex and charStates are now NOT updated on every keystroke
  // They default to the ref values and are only synced for reset/extension events.
  const engineState = useMemo(() => ({
    words, prompt, charStates, currentIndex,
    correctChars: correctCharsRef.current,
    incorrectChars: incorrectCharsRef.current,
    totalCharsTyped: totalCharsTypedRef.current,
    ...stats,
    isFinished, timeLeft, isActive,
    extraChars, isTyping
  }), [words, prompt, charStates, currentIndex, stats, isFinished, timeLeft, isActive, extraChars, isTyping]);

  useEffect(() => {
    if (isActive && currentIndexRef.current > 0) onProgress?.(engineState);
  }, [stats.wpm, isActive, onProgress, engineState]);

  useEffect(() => {
    if (isFinished) onFinish?.(engineState);
  }, [isFinished, onFinish, engineState]);

  return {
    ...engineState,
    handleKeyPress,
    resetTest
  };
}
