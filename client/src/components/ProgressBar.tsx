import type { Player } from '@godzilla-type/shared';

interface ProgressBarProps {
  player: Player;
  isCurrentUser?: boolean;
}

function ProgressBar({ player, isCurrentUser }: ProgressBarProps) {
  return (
    <div className={`w-full py-2 flex items-center gap-4 transition-opacity ${player.isFinished ? 'opacity-50' : 'opacity-100'}`}>
      <div className="flex-1">
        <div className="flex justify-between items-end mb-1 px-1">
          <span className={`text-[10px] uppercase tracking-widest ${isCurrentUser ? 'text-main' : 'text-main-sub'}`}>
            {player.name} {isCurrentUser && '(you)'}
          </span>
          <span className="text-[10px] font-mono text-main-sub">
            {player.wpm} wpm • {player.accuracy}%
          </span>
        </div>
        <div className="h-[2px] w-full bg-main-sub/10 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${isCurrentUser ? 'bg-main' : 'bg-main-sub/40'}`}
            style={{ width: `${player.progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export default ProgressBar;
