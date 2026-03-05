import type { Player } from '@godzilla-type/shared';
import { TeamColor, TEAM_COLORS } from '@godzilla-type/shared';

interface ProgressBarProps {
  player: Player;
  isCurrentUser?: boolean;
}

function ProgressBar({ player, isCurrentUser }: ProgressBarProps) {
  const teamClass =
    player.team === TeamColor.RED
      ? 'team-red'
      : player.team === TeamColor.BLUE
        ? 'team-blue'
        : '';

  const borderClass = isCurrentUser ? 'ring-2 ring-accent-primary/40' : '';

  return (
    <div
      className={`glass-card p-3 rounded-xl transition-all duration-200 ${borderClass}`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {player.team !== TeamColor.NONE && (
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: TEAM_COLORS[player.team].bg }}
            />
          )}
          <span className={`text-sm font-medium ${isCurrentUser ? 'text-accent-primary' : 'text-text-primary'}`}>
            {player.name}
            {player.isHost && (
              <span className="ml-1.5 text-xs text-accent-secondary">👑</span>
            )}
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs text-text-secondary">
          <span className="font-mono">{player.wpm} <span className="text-text-muted">WPM</span></span>
          <span className="font-mono">{player.accuracy}%</span>
          {player.isFinished && (
            <span className="text-accent-primary font-bold">#{player.finishOrder}</span>
          )}
        </div>
      </div>

      <div className="w-full h-2 bg-bg-primary rounded-full overflow-hidden">
        <div
          className={`progress-bar-fill h-full rounded-full ${teamClass}`}
          style={{ width: `${player.progress}%` }}
        />
      </div>
    </div>
  );
}

export default ProgressBar;
