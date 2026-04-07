import { useState } from 'react';
import { Settings } from 'lucide-react';

interface TimerSelectorProps {
  selected: number;
  onSelect: (duration: number) => void;
  disabled?: boolean;
}

const DURATIONS = [15, 30, 60, 120];

function TimerSelector({ selected, onSelect, disabled }: TimerSelectorProps) {
  const [isCustomEditing, setIsCustomEditing] = useState(false);
  const [customValue, setCustomValue] = useState('');

  const isCustomMode = !DURATIONS.includes(selected);

  const handleCustomSubmit = (e: React.FormEvent | React.FocusEvent) => {
    e.preventDefault();
    const val = parseInt(customValue, 10);
    if (!isNaN(val) && val >= 10 && val <= 300) {
      onSelect(val);
      setIsCustomEditing(false);
    } else {
      setCustomValue('');
      setIsCustomEditing(false);
    }
  };

  return (
    <div className="flex items-center gap-1 bg-bg-secondary/50 rounded-lg p-1">
      <div className="px-3 py-1 text-[10px] uppercase tracking-widest text-main-sub border-r border-main-sub/20 mr-1">
        time
      </div>
      {DURATIONS.map((duration) => (
        <button
          key={duration}
          onClick={() => { onSelect(duration); setIsCustomEditing(false); }}
          disabled={disabled}
          className={`px-3 py-1 text-sm font-mono rounded transition-all ${
            selected === duration && !isCustomEditing
              ? 'text-main bg-main/10'
              : 'text-text-secondary hover:text-text-primary'
          } disabled:opacity-30`}
        >
          {duration}
        </button>
      ))}

      {isCustomEditing ? (
        <form onSubmit={handleCustomSubmit} className="flex items-center px-1">
          <input
            autoFocus
            type="number"
            min={10}
            max={300}
            disabled={disabled}
            value={customValue}
            onChange={(e) => setCustomValue(e.target.value)}
            onBlur={handleCustomSubmit}
            className="w-12 bg-transparent text-main text-sm font-mono outline-none border-b border-main border-dotted px-1 text-center"
            placeholder="s"
          />
        </form>
      ) : (
        <button
          onClick={() => { setIsCustomEditing(true); setCustomValue(isCustomMode ? selected.toString() : ''); }}
          disabled={disabled}
          className={`px-3 py-1 text-sm font-mono flex items-center gap-1 rounded transition-all ${
            isCustomMode
              ? 'text-main bg-main/10'
              : 'text-text-secondary hover:text-text-primary'
          } disabled:opacity-30`}
          title="Custom Time (10s to 300s)"
        >
          <Settings size={12} />
          {isCustomMode && <span>{selected}</span>}
        </button>
      )}
    </div>
  );
}

export default TimerSelector;
