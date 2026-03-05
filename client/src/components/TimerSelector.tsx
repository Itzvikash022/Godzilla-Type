interface TimerSelectorProps {
  selected: number;
  onSelect: (duration: number) => void;
  disabled?: boolean;
}

const DURATIONS = [15, 30, 60, 120];

function TimerSelector({ selected, onSelect, disabled }: TimerSelectorProps) {
  return (
    <div className="flex items-center gap-1 bg-bg-secondary/50 rounded-lg p-1">
      <div className="px-3 py-1 text-[10px] uppercase tracking-widest text-main-sub border-r border-main-sub/20 mr-1">
        time
      </div>
      {DURATIONS.map((duration) => (
        <button
          key={duration}
          onClick={() => onSelect(duration)}
          disabled={disabled}
          className={`px-3 py-1 text-sm font-mono rounded transition-all ${
            selected === duration
              ? 'text-main bg-main/10'
              : 'text-text-secondary hover:text-text-primary'
          } disabled:opacity-30`}
        >
          {duration}
        </button>
      ))}
    </div>
  );
}

export default TimerSelector;
