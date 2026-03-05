// ==========================================
// GODZILLA-TYPE — Typing Engine Hook (v2)
// ==========================================
// Key behaviors:
//  1. Timer-based: the test ends when time runs out, NOT when text runs out.
//  2. Text auto-extends when typist nears the end of the buffer.
//  3. Correct chars stay GREEN, incorrect stay RED (no dimming to gray).
// ==========================================

import { useState, useCallback, useRef, useEffect } from 'react';
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
} from '@godzilla-type/shared';

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
}

interface UseTypingEngineOptions {
  duration: number;
  mode?: PromptMode;
  // For multiplayer: supply external words/prompt instead of generating
  providedWords?: string[];
  providedPrompt?: string;
  onProgress?: (state: TypingState) => void;
  onFinish?: (state: TypingState) => void;
}

// How many chars before the end we trigger an extension
const EXTEND_THRESHOLD = 200;
// How many words to add when extending
const EXTEND_AMOUNT = 60;

export function useTypingEngine(options: UseTypingEngineOptions) {
  const {
    duration,
    mode = 'words',
    providedWords,
    providedPrompt,
    onProgress,
    onFinish,
  } = options;

  // ---- State ----
  const [prompt, setPrompt] = useState('');
  const [words, setWords] = useState<string[]>([]);
  const [charStates, setCharStates] = useState<CharState[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [correctChars, setCorrectChars] = useState(0);
  const [incorrectChars, setIncorrectChars] = useState(0);
  const [totalCharsTyped, setTotalCharsTyped] = useState(0);
  const [wpm, setWpm] = useState(0);
  const [netWpm, setNetWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [progress, setProgress] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [timeLeft, setTimeLeft] = useState(duration);
  const [isActive, setIsActive] = useState(false);

  // Refs for values needed in closures without causing re-renders
  const startTimeRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const finishedRef = useRef(false);
  const promptRef = useRef('');
  const charStatesRef = useRef<CharState[]>([]);
  const currentIndexRef = useRef(0);
  const modeRef = useRef<PromptMode>(mode);

  // Maintain sync copies for the setInterval closure to read without adding dependencies
  const totalCharsTypedRef = useRef(0);
  const correctCharsRef = useRef(0);
  const incorrectCharsRef = useRef(0);

  // Keep modeRef in sync
  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  // ---- Init / Reset ----
  const resetTest = useCallback(
    (newWords?: string[], newPrompt?: string) => {
      if (timerRef.current) clearInterval(timerRef.current);

      let w: string[];
      let p: string;
      if (newWords && newPrompt) {
        w = newWords;
        p = newPrompt;
      } else if (providedWords && providedPrompt) {
        w = providedWords;
        p = providedPrompt;
      } else {
        const r = generatePrompt(mode, 100);
        w = r.words;
        p = r.prompt;
      }

      promptRef.current = p;
      const states: CharState[] = p.split('').map((_, i) => (i === 0 ? 'current' : 'upcoming'));
      charStatesRef.current = states;
      currentIndexRef.current = 0;

      setPrompt(p);
      setWords(w);
      setCharStates(states);
      setCurrentIndex(0);
      setCorrectChars(0);
      setIncorrectChars(0);
      setTotalCharsTyped(0);
      setWpm(0);
      setNetWpm(0);
      setAccuracy(100);
      setProgress(0);
      setIsFinished(false);
      setTimeLeft(duration);
      setIsActive(false);

      startTimeRef.current = 0;
      finishedRef.current = false;
      totalCharsTypedRef.current = 0;
      correctCharsRef.current = 0;
      incorrectCharsRef.current = 0;
    },
    [duration, mode, providedWords, providedPrompt]
  );

  // Initialize on mount
  useEffect(() => {
    resetTest();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only once on mount

  // Re-init when provided words change (multiplayer race start)
  useEffect(() => {
    if (providedPrompt) {
      resetTest(providedWords, providedPrompt);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [providedPrompt]);

  // ---- Timer ----
  useEffect(() => {
    if (isActive && !finishedRef.current) {
      timerRef.current = setInterval(() => {
        // Active decay of WPM every second based on true elapsed time
        const elapsed = Date.now() - startTimeRef.current;
        const t = totalCharsTypedRef.current;
        const c = correctCharsRef.current;
        const errs = incorrectCharsRef.current;

        if (t > 0) {
          setWpm(calculateWPM(t, elapsed));
          setNetWpm(calculateNetWPM(t, errs, elapsed));
          setAccuracy(calculateAccuracy(c, t));
        }

        setTimeLeft((prev) => {
          if (prev <= 1) {
            finishedRef.current = true;
            setIsFinished(true);
            setIsActive(false);
            if (timerRef.current) clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive]);

  // ---- Extend text buffer ----
  const extendBuffer = useCallback(() => {
    const currentPrompt = promptRef.current;
    const extended = extendPrompt(currentPrompt, modeRef.current, EXTEND_AMOUNT);
    const newStates = extended.prompt.split('').map((_, i) => {
      if (i < charStatesRef.current.length) {
        return charStatesRef.current[i]; // preserve existing states
      }
      return 'upcoming' as CharState;
    });
    promptRef.current = extended.prompt;
    charStatesRef.current = newStates;
    setPrompt(extended.prompt);
    setWords(extended.words);
    setCharStates(newStates);
  }, []);

  // ---- Keypress handler ----
  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (finishedRef.current) return;
      const key = e.key;
      if (key.length !== 1 && key !== 'Backspace') return;

      // Start timer on first keypress
      if (!isActive) {
        setIsActive(true);
        startTimeRef.current = Date.now();
      }

      if (key === 'Backspace') {
        const ci = currentIndexRef.current;
        if (ci > 0) {
          const newIndex = ci - 1;
          currentIndexRef.current = newIndex;
          const next = [...charStatesRef.current];
          next[newIndex] = 'current';
          if (newIndex + 1 < next.length) next[newIndex + 1] = 'upcoming';
          charStatesRef.current = next;
          setCurrentIndex(newIndex);
          setCharStates([...next]);
        }
        return;
      }

      const ci = currentIndexRef.current;
      const currentPrompt = promptRef.current;
      const expected = currentPrompt[ci];
      const isCorrect = key === expected;

      // Update char state: correct = 'correct' (green), incorrect = 'incorrect' (red)
      const next = [...charStatesRef.current];
      next[ci] = isCorrect ? 'correct' : 'incorrect';
      // Set next char as current cursor
      if (ci + 1 < next.length) {
        next[ci + 1] = 'current';
      }
      charStatesRef.current = next;

      const newIndex = ci + 1;
      currentIndexRef.current = newIndex;

      // Update ref counts
      const newTotal = totalCharsTypedRef.current + 1;
      const newCorrect = correctCharsRef.current + (isCorrect ? 1 : 0);
      const newErr = incorrectCharsRef.current + (isCorrect ? 0 : 1);

      totalCharsTypedRef.current = newTotal;
      correctCharsRef.current = newCorrect;
      incorrectCharsRef.current = newErr;

      setTotalCharsTyped(newTotal);
      setCorrectChars(newCorrect);
      setIncorrectChars(newErr);

      // Update WPM instantly for snappy feedback
      const elapsed = Date.now() - startTimeRef.current;
      setWpm(calculateWPM(newTotal, elapsed));
      setNetWpm(calculateNetWPM(newTotal, newErr, elapsed));
      setAccuracy(calculateAccuracy(newCorrect, newTotal));
      setProgress(calculateProgress(newIndex, currentPrompt.length));

      setCurrentIndex(newIndex);
      setCharStates([...next]);

      // Auto-extend when nearing the end of buffer (timer hasn't expired)
      const charsRemaining = currentPrompt.length - newIndex;
      if ((charsRemaining < EXTEND_THRESHOLD || charsRemaining <= 10) && !finishedRef.current) {
        extendBuffer();
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isActive, correctChars, incorrectChars, extendBuffer]
  );

  // ---- Callbacks for progress/finish ----
  useEffect(() => {
    if (isActive && currentIndex > 0) {
      const state = buildState();
      onProgress?.(state);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, wpm]);

  useEffect(() => {
    if (isFinished) {
      const state = buildState();
      onFinish?.(state);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFinished]);

  function buildState(): TypingState {
    return {
      words, prompt, charStates, currentIndex, correctChars, incorrectChars,
      totalCharsTyped, wpm, netWpm, accuracy, progress, isFinished, timeLeft, isActive,
    };
  }

  return {
    words,
    prompt,
    charStates,
    currentIndex,
    correctChars,
    incorrectChars,
    totalCharsTyped,
    wpm,
    netWpm,
    accuracy,
    progress,
    isFinished,
    timeLeft,
    isActive,
    handleKeyPress,
    resetTest,
  };
}
