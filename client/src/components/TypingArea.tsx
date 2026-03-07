// ============================================
// GODZILLA-TYPE — TypingArea (Ghost-Free v3)
// ============================================
// Key insight: Use a DIV with tabIndex={0} + onKeyDown
// as the keyboard sink instead of an <input>.
// A div never shows a browser cursor, completely
// eliminating the "double cursor" ghost bug.
// ============================================

import React, { useRef, useEffect, useMemo, memo } from 'react';

interface LetterProps {
  id: string;
  char: string;
  state: 'correct' | 'incorrect' | 'current' | 'upcoming';
}

const Letter = memo(({ id, char, state }: LetterProps) => (
  <span id={id} className={`char ${state}`}>
    {char === ' ' ? '\u00A0' : char}
  </span>
));
Letter.displayName = 'Letter';

interface WordProps {
  word: string;
  startIndex: number;
  states: string;
  extra?: string;
  wordIndex: number;
  isLast: boolean;
}

const Word = memo(({ word, startIndex, states, extra = '', wordIndex, isLast }: WordProps) => {
  const chars = word.split('');
  const stateArray = states.split(',');
  const spaceIndex = startIndex + word.length;
  // charStates for the word + the space following it
  const spaceState = (stateArray[word.length] as any) || 'upcoming';

  return (
    <div className="word" id={`word-${wordIndex}`}>
      {chars.map((char, i) => (
        <Letter
          key={i}
          id={`char-${startIndex + i}`}
          char={char}
          state={(stateArray[i] as any) || 'upcoming'}
        />
      ))}
      {extra.split('').map((char, i) => (
        <span key={`extra-${i}`} className="char incorrect extra">
          {char}
        </span>
      ))}
      {!isLast && (
        <Letter
          id={`char-${spaceIndex}`}
          char=" "
          state={spaceState}
        />
      )}
    </div>
  );
});
Word.displayName = 'Word';

interface TypingAreaProps {
  prompt: string;
  charStates: ('correct' | 'incorrect' | 'current' | 'upcoming')[];
  currentIndex: number;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  extraChars?: Record<number, string>;
  isTyping?: boolean;
}

function TypingArea({ prompt, charStates, currentIndex, onKeyDown, disabled, extraChars = {}, isTyping = false }: TypingAreaProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const wordsContainerRef = useRef<HTMLDivElement>(null);
  const caretRef = useRef<HTMLDivElement>(null);

  // ------------------------------------------------------------------
  // 1. Build word table (recomputed only when prompt changes)
  // ------------------------------------------------------------------
  const wordData = useMemo(() => {
    const words = prompt.split(' ');
    let idx = 0;
    return words.map((w, i) => {
      const entry = { word: w, startIndex: idx };
      idx += w.length + 1; // +1 for space between words
      return entry;
    });
  }, [prompt]);

  // ------------------------------------------------------------------
  // 2. Binary-search active word index — O(log N)
  // ------------------------------------------------------------------
  const activeWordIndex = useMemo(() => {
    let lo = 0, hi = wordData.length - 1;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      const { startIndex, word } = wordData[mid];
      // A word's "active" range includes its characters AND the trailing space
      if (currentIndex >= startIndex && currentIndex < startIndex + word.length + 1) return mid;
      if (currentIndex < startIndex) hi = mid - 1; else lo = mid + 1;
    }
    return wordData.length - 1;
  }, [wordData, currentIndex]);

  // ------------------------------------------------------------------
  // 3. Windowing — render all for texts ≤ 2000 words
  // ------------------------------------------------------------------
  const windowRange = useMemo(() => {
    if (wordData.length <= 2000) return { start: 0, end: wordData.length };
    const page = Math.floor(activeWordIndex / 100);
    const start = Math.max(0, (page - 1) * 100);
    return { start, end: start + 400 };
  }, [wordData.length, activeWordIndex]);

  const windowedWords = useMemo(() => {
    return wordData.slice(windowRange.start, windowRange.end);
  }, [wordData, windowRange]);

  // ------------------------------------------------------------------
  // 4. Focus management — focus the wrapper div, not an input
  //    A div CANNOT show a browser text cursor.
  // ------------------------------------------------------------------
  useEffect(() => {
    wrapperRef.current?.focus();
    const refocus = (e: MouseEvent) => {
      // Don't steal focus from modal/dropdowns
      const target = e.target as HTMLElement;
      if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA' && target.tagName !== 'BUTTON' && target.tagName !== 'SELECT') {
        wrapperRef.current?.focus();
      }
    };
    window.addEventListener('click', refocus);
    return () => window.removeEventListener('click', refocus);
  }, []);

  // ------------------------------------------------------------------
  // 5. Initial caret position — fires only on prompt reset (engine handles
  //    all subsequent moves directly via DOM in handleKeyPress).
  // ------------------------------------------------------------------
  useEffect(() => {
    const el = document.getElementById(`char-0`);
    const wrapper = wordsContainerRef.current;
    const caret = caretRef.current;
    if (!el || !wrapper || !caret) return;
    const pr = wrapper.getBoundingClientRect();
    const er = el.getBoundingClientRect();
    caret.style.left = `${er.left - pr.left}px`;
    caret.style.top = `${er.top - pr.top}px`;
    caret.style.height = `${er.height || 30}px`;
  }, [prompt]);

  return (
    <div
      ref={wrapperRef}
      tabIndex={disabled ? -1 : 0}
      onKeyDown={onKeyDown as any}
      className="relative w-full max-w-[1500px] mx-auto py-8 select-none outline-none"
      // outline:none so there's no focus ring visible on the wrapper
      style={{ cursor: 'default' }}
    >
      {/* Scrollable word container */}
      <div
        ref={containerRef}
        className="typing-container h-[144px] overflow-hidden px-4"
        style={{ pointerEvents: 'none' }}
      >
        <div ref={wordsContainerRef} className="flex flex-wrap relative">
          {/* Custom caret — no browser artifact */}
          <div
            ref={caretRef}
            className={`caret${disabled ? '' : (isTyping ? '' : ' blinking')}`}
            style={{
              position: 'absolute',
              width: '2px',
              top: 0,
              left: 0,
              height: '30px',
            }}
          />

          {windowedWords.map((data, idx) => {
            const globalWordIndex = windowRange.start + idx;
            const extra = extraChars[globalWordIndex] || '';
            const isLast = globalWordIndex === wordData.length - 1;
            const states = charStates
              .slice(data.startIndex, data.startIndex + data.word.length + 1) // +1 for space
              .join(',');
            return (
              <Word
                key={data.startIndex}
                word={data.word}
                startIndex={data.startIndex}
                states={states}
                extra={extra}
                wordIndex={globalWordIndex}
                isLast={isLast}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default memo(TypingArea);
