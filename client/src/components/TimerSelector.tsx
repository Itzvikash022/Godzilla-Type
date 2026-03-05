import { TIMER_MODES } from '@godzilla-type/shared';
import type { TimerMode } from '@godzilla-type/shared';

interface TimerSelectorProps {
  selected: number;
  onSelect: (mode: number) => void;
  disabled?: boolean;
}

function TimerSelector({ selected, onSelect, disabled }: TimerSelectorProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-text-muted text-sm mr-1">⏱️</span>
      {TIMER_MODES.map((mode) => (
        <button
          key={mode}
          onClick={() => onSelect(mode)}
          disabled={disabled}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
            selected === mode
              ? 'bg-accent-primary text-bg-primary'
              : 'bg-bg-primary text-text-secondary hover:text-text-primary hover:bg-bg-hover'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {mode}s
        </button>
      ))}
    </div>
  );
}

export default TimerSelector;
