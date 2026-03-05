import type { PromptMode } from '@godzilla-type/shared';

interface ModeSelectorProps {
  selectedMode: PromptMode;
  onSelectMode: (mode: PromptMode) => void;
  selectedDuration: number;
  onSelectDuration: (duration: number) => void;
  disabled?: boolean;
}

const MODES: { value: PromptMode; label: string }[] = [
  { value: 'words', label: 'words' },
  { value: 'sentences', label: 'sentences' },
  { value: 'paragraph', label: 'paragraph' },
  { value: 'quote', label: 'quote' },
];

const DURATIONS = [15, 30, 60, 120];

function ModeSelector({ 
  selectedMode, 
  onSelectMode, 
  selectedDuration, 
  onSelectDuration, 
  disabled 
}: ModeSelectorProps) {
  return (
    <div className="flex items-center gap-6 bg-bg-secondary/40 rounded-xl px-4 py-2 animate-fade-in border border-main-sub/5">
      {/* Mode Select */}
      <div className="flex items-center gap-2 border-r border-main-sub/10 pr-6">
        {MODES.map((mode) => (
          <button
            key={mode.value}
            onClick={() => onSelectMode(mode.value)}
            disabled={disabled}
            className={`text-xs uppercase tracking-widest px-2 py-1 transition-all ${
              selectedMode === mode.value ? 'text-main' : 'text-main-sub hover:text-text-primary'
            } disabled:opacity-30`}
          >
            {mode.label}
          </button>
        ))}
      </div>

      {/* Duration Select */}
      <div className="flex items-center gap-3">
        {DURATIONS.map((duration) => (
          <button
            key={duration}
            onClick={() => onSelectDuration(duration)}
            disabled={disabled}
            className={`text-xs font-mono px-2 py-1 transition-all ${
              selectedDuration === duration ? 'text-main' : 'text-main-sub hover:text-text-primary'
            } disabled:opacity-30`}
          >
            {duration}
          </button>
        ))}
      </div>
    </div>
  );
}

export default ModeSelector;
