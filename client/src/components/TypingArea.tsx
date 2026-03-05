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
  const currentCharRef = useRef<HTMLSpanElement>(null);

  // Auto-focus on mount and keep focus
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Scroll to current character
  useEffect(() => {
    if (currentCharRef.current && containerRef.current) {
      const container = containerRef.current;
      const charEl = currentCharRef.current;
      const charTop = charEl.offsetTop;
      const containerHeight = container.clientHeight;
      const scrollTarget = charTop - containerHeight / 3;

      if (scrollTarget > container.scrollTop) {
        container.scrollTo({ top: scrollTarget, behavior: 'smooth' });
      }
    }
  }, [currentIndex]);

  const handleClick = () => {
    inputRef.current?.focus();
  };

  return (
    <div
      className="relative cursor-text"
      onClick={handleClick}
    >
      {/* Hidden input to capture keystrokes */}
      <input
        ref={inputRef}
        type="text"
        className="absolute opacity-0 w-0 h-0"
        onKeyDown={onKeyDown}
        disabled={disabled}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
      />

      {/* Typing display */}
      <div
        ref={containerRef}
        className="font-mono text-3xl leading-relaxed overflow-x-hidden select-none px-4 py-6 whitespace-pre-wrap break-all"
      >
        {prompt.split('').map((char, i) => {
          const state = charStates[i] || 'upcoming';
          const isCurrent = state === 'current';

          return (
            <span
              key={i}
              ref={isCurrent ? currentCharRef : null}
              className={`typing-char ${state} ${char === ' ' ? 'mx-[1px]' : ''}`}
            >
              {char === ' ' ? '\u00A0' : char}
            </span>
          );
        })}
      </div>

      {/* Click hint */}
      {disabled ? null : (
        <div className="text-center text-text-muted text-sm mt-2 animate-pulse">
          Click here and start typing...
        </div>
      )}
    </div>
  );
}

export default TypingArea;
