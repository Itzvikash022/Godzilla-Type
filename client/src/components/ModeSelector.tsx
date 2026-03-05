import type { PromptMode } from '../hooks/useTypingEngine';

interface ModeSelectorProps {
  selected: PromptMode;
  onSelect: (mode: PromptMode) => void;
  disabled?: boolean;
}

const MODES: { value: PromptMode; label: string; icon: string; desc: string }[] = [
  { value: 'words', label: 'Words', icon: '📝', desc: 'Random word sequences' },
  { value: 'sentences', label: 'Sentences', icon: '💬', desc: 'Natural English sentences' },
  { value: 'paragraph', label: 'Paragraph', icon: '📄', desc: 'Multi-sentence paragraphs' },
  { value: 'quote', label: 'Quote', icon: '💡', desc: 'Famous quotes' },
];

function ModeSelector({ selected, onSelect, disabled }: ModeSelectorProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-text-muted text-sm mr-1">Mode:</span>
      {MODES.map((m) => (
        <button
          key={m.value}
          onClick={() => onSelect(m.value)}
          disabled={disabled}
          title={m.desc}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
            selected === m.value
              ? 'bg-accent-primary text-bg-primary'
              : 'bg-bg-primary text-text-secondary hover:text-text-primary hover:bg-bg-hover'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          <span className="mr-1.5">{m.icon}</span>
          {m.label}
        </button>
      ))}
    </div>
  );
}

export default ModeSelector;
