import { Sparkles } from 'lucide-react';

interface AIContentButtonProps {
    onClick: () => void;
    disabled?: boolean;
}

export default function AIContentButton({ onClick, disabled }: AIContentButtonProps) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`
        flex items-center gap-2 px-4 py-2 text-xs uppercase tracking-widest rounded-lg font-mono font-bold
        transition-all duration-300 transform
        ${disabled
                    ? 'bg-bg-secondary text-main-sub/30 cursor-not-allowed border border-main-sub/5'
                    : 'bg-main/10 text-main border border-main/30 hover:bg-main hover:text-bg-primary hover:scale-[1.02] shadow-[0_0_15px_rgba(226,183,20,0.15)] hover:shadow-[0_0_20px_rgba(226,183,20,0.4)]'
                }
      `}
        >
            <Sparkles size={14} className={disabled ? 'opacity-30' : 'animate-pulse'} />
            Generate with AI
        </button>
    );
}
