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

  // Scroll logic: Center the current line
  useEffect(() => {
    if (cursorRef.current && containerRef.current) {
      const container = containerRef.current;
      const cursor = cursorRef.current;
      
      const cursorTop = cursor.offsetTop;
      const containerHeight = container.clientHeight;
      const scrollY = cursorTop - containerHeight / 2 + 32;

      container.scrollTo({ top: scrollY, behavior: 'smooth' });
    }
  }, [currentIndex]);

  // Group characters into words
  const words = prompt.split(' ');
  let charIdx = 0;

  return (
    <div className="relative w-full max-w-[1200px] mx-auto py-8 select-none">
      {/* Hidden input */}
      <input
        ref={inputRef}
        type="text"
        className="absolute opacity-0 pointer-events-none"
        onKeyDown={onKeyDown}
        disabled={disabled}
        autoFocus
        autoComplete="off"
      />

      {/* Words display */}
      <div 
        ref={containerRef}
        className="typing-container text-3xl leading-relaxed h-[240px] overflow-hidden transition-all duration-300 pointer-events-none px-4"
      >
        <div className="flex flex-wrap">
          {words.map((word, wordIdx) => {
            const wordChars = word.split('');
            
            return (
              <div key={wordIdx} className="word mb-4">
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
                  <span className={`char ${charStates[charIdx] || 'upcoming'}`} ref={charIdx === currentIndex ? cursorRef : null}>
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
