import type { Player } from '@godzilla-type/shared';
import { TeamColor, TEAM_COLORS } from '@godzilla-type/shared';

interface LeaderboardProps {
  players: Player[];
  teamScores?: { team: TeamColor; totalNetWpm: number }[];
}

function Leaderboard({ players, teamScores }: LeaderboardProps) {
  const sorted = [...players].sort((a, b) => {
    if (a.finishOrder && b.finishOrder) return a.finishOrder - b.finishOrder;
    return b.netWpm - a.netWpm;
  });

  return (
    <div className="animate-slide-up">
      {/* Team Scores */}
      {teamScores && teamScores.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-text-primary mb-3">🏆 Team Results</h3>
          <div className="grid grid-cols-2 gap-4">
            {teamScores
              .sort((a, b) => b.totalNetWpm - a.totalNetWpm)
              .map((ts, i) => (
                <div
                  key={ts.team}
                  className={`glass-card p-4 rounded-xl text-center ${i === 0 ? 'ring-2 ring-accent-primary/50' : ''}`}
                >
                  <span
                    className="inline-block w-4 h-4 rounded-full mb-2"
                    style={{ backgroundColor: TEAM_COLORS[ts.team].bg }}
                  />
                  <p className="text-sm text-text-secondary">{TEAM_COLORS[ts.team].label}</p>
                  <p className="text-3xl font-bold gradient-text mt-1">{ts.totalNetWpm}</p>
                  <p className="text-xs text-text-muted">Combined Net WPM</p>
                  {i === 0 && <span className="text-accent-primary text-sm mt-2 inline-block">🏆 Winner!</span>}
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Individual Results */}
      <h3 className="text-lg font-semibold text-text-primary mb-3">🏅 Individual Rankings</h3>
      <div className="glass-card rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="text-text-muted text-xs uppercase border-b border-white/5">
              <th className="text-left py-3 px-4">Rank</th>
              <th className="text-left py-3 px-4">Player</th>
              <th className="text-right py-3 px-4">WPM</th>
              <th className="text-right py-3 px-4">Net WPM</th>
              <th className="text-right py-3 px-4">Accuracy</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((player, i) => (
              <tr
                key={player.id}
                className={`border-b border-white/5 last:border-0 transition-colors hover:bg-white/5 ${
                  i === 0 ? 'bg-accent-glow' : ''
                }`}
              >
                <td className="py-3 px-4">
                  <span className={`text-sm font-bold ${i === 0 ? 'text-accent-primary' : 'text-text-secondary'}`}>
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    {player.team !== TeamColor.NONE && (
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: TEAM_COLORS[player.team].bg }}
                      />
                    )}
                    <span className="text-sm font-medium text-text-primary">{player.name}</span>
                    {player.isHost && <span className="text-xs">👑</span>}
                  </div>
                </td>
                <td className="py-3 px-4 text-right font-mono text-sm text-text-secondary">
                  {player.wpm}
                </td>
                <td className="py-3 px-4 text-right font-mono text-sm font-semibold text-text-primary">
                  {player.netWpm}
                </td>
                <td className="py-3 px-4 text-right font-mono text-sm">
                  <span className={player.accuracy >= 95 ? 'text-success' : player.accuracy >= 80 ? 'text-accent-primary' : 'text-error'}>
                    {player.accuracy}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Leaderboard;
