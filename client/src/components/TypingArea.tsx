import { useRef, useEffect } from 'react';

interface TypingAreaProps {
  prompt: string;
  charStates: ('correct' | 'incorrect' | 'current' | 'upcoming')[];
  currentIndex: number;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  disabled?: boolean;
}

function TypingArea({ prompt, charStates, currentIndex, onKeyDown, disabled }: TypingAreaProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLSpanElement>(null);

  // Auto-focus logic
  useEffect(() => {
    inputRef.current?.focus();
    const handleFocus = () => inputRef.current?.focus();
    window.addEventListener('click', handleFocus);
    return () => window.removeEventListener('click', handleFocus);
  }, []);

  // Scroll logic: Shift lines up as typist moves down
  useEffect(() => {
    if (cursorRef.current && containerRef.current) {
      const container = containerRef.current;
      const cursor = cursorRef.current;
      const lineWeight = 48; // Based on index.css font-size + line-height

      const cursorTop = cursor.offsetTop;

      // We want to show one line above the current one for context
      // If we are on line 2 (48px) or beyond, we shift up by one line
      if (cursorTop >= lineWeight) {
        container.scrollTo({ top: cursorTop - lineWeight, behavior: 'smooth' });
      } else {
        container.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  }, [currentIndex]);

  // Group characters into words
  const words = prompt.split(' ');
  let charIdx = 0;

  return (
    <div className="relative w-full max-w-[1500px] mx-auto py-8 select-none">
      {/* Hidden input — captures all keyboard and mobile touch input */}
      <input
        ref={inputRef}
        type="text"
        inputMode="text"
        className="absolute opacity-0 pointer-events-none"
        onKeyDown={onKeyDown}
        disabled={disabled}
        autoFocus
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        readOnly={false}
      />

      {/* Words display — click or touch anywhere to focus the hidden input */}
      <div
        ref={containerRef}
        className="typing-container h-[144px] overflow-hidden transition-all duration-300 pointer-events-none px-4"
        onTouchStart={() => inputRef.current?.focus()}
      >
        <div className="flex flex-wrap">
          {words.map((word, wordIdx) => {
            const wordChars = word.split('');

            return (
              <div key={wordIdx} className="word">
                {wordChars.map((char, i) => {
                  const state = charStates[charIdx] || 'upcoming';
                  const isCurrent = charIdx === currentIndex;
                  charIdx++;

                  return (
                    <span
                      key={i}
                      className={`char ${state}`}
                      ref={isCurrent ? cursorRef : null}
                    >
                      {char}
                    </span>
                  );
                })}
                {/* Add space character logic */}
                {wordIdx < words.length - 1 && (
                  <span
                    className={`char ${charStates[charIdx] || 'upcoming'}`}
                    ref={charIdx === currentIndex ? cursorRef : null}
                  >
                    {(() => {
                      charIdx++;
                      return '\u00A0';
                    })()}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default TypingArea;
