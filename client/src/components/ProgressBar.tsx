import type { Player } from '@godzilla-type/shared';
import { hashColor } from '../lib/playerColors';

interface ProgressBarProps {
  player: Player;
  isCurrentUser?: boolean;
}

function ProgressBar({ player, isCurrentUser }: ProgressBarProps) {
  const color = hashColor(player.name);

  return (
    <div className={`w-full py-2 flex items-center gap-4 transition-opacity ${player.isFinished ? 'opacity-50' : 'opacity-100'}`}>
      <div className="flex-1">
        <div className="flex justify-between items-end mb-1 px-1">
          <span
            className="text-[10px] uppercase tracking-widest font-medium"
            style={{ color: isCurrentUser ? color : `${color}aa` }}
          >
            {player.name} {isCurrentUser && '(you)'}
          </span>
          <span className="text-[10px] font-mono text-main-sub">
            {player.wpm} wpm • {player.accuracy}%
          </span>
        </div>
        <div className="h-[2px] w-full bg-main-sub/10 rounded-full overflow-hidden">
          <div
            className="h-full transition-all duration-300 rounded-full"
            style={{ width: `${player.progress}%`, backgroundColor: color }}
          />
        </div>
      </div>
    </div>
  );
}

export default ProgressBar;
