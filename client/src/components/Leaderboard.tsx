import type { Player } from '@godzilla-type/shared';
import { TeamColor, TEAM_COLORS } from '@godzilla-type/shared';

interface LeaderboardProps {
  players: Player[];
  teamScores?: { team: TeamColor; totalNetWpm: number }[];
}

function Leaderboard({ players, teamScores }: LeaderboardProps) {
  const sorted = [...players].sort((a, b) => {
    if (b.netWpm !== a.netWpm) return b.netWpm - a.netWpm;
    if (b.accuracy !== a.accuracy) return b.accuracy - a.accuracy;
    return (a.finishOrder || 0) - (b.finishOrder || 0);
  });

  return (
    <div className="animate-slide-up w-full">
      {/* Team Results */}
      {teamScores && teamScores.length > 0 && (
        <div className="grid grid-cols-2 gap-4 mb-8">
          {teamScores
            .sort((a, b) => b.totalNetWpm - a.totalNetWpm)
            .map((ts, i) => (
              <div key={ts.team} className="bg-bg-secondary/40 p-4 rounded-lg border border-main-sub/10 text-center">
                <p className="text-[10px] uppercase tracking-widest text-main-sub mb-1">
                  {TEAM_COLORS[ts.team].label} team
                </p>
                <p className={`text-4xl font-bold ${i === 0 ? 'text-main' : 'text-text-primary'}`}>
                  {ts.totalNetWpm}
                </p>
                <p className="text-[10px] text-main-sub mt-1">TOTAL WPM</p>
              </div>
            ))}
        </div>
      )}

      {/* Individual Rankings */}
      <div className="overflow-x-auto">
        <table className="mt-table">
          <thead>
            <tr>
              <th className="w-16">#</th>
              <th>player</th>
              <th className="text-right">wpm</th>
              <th className="text-right">acc</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((player, i) => (
              <tr key={player.id} className={i === 0 ? 'bg-main/5' : ''}>
                <td className="font-mono text-sm">
                   <span className={i === 0 ? 'text-main' : 'text-main-sub'}>
                     {i + 1}
                   </span>
                </td>
                <td>
                  <div className="flex items-center gap-2">
                    {player.team !== TeamColor.NONE && (
                       <span className="w-2 h-2 rounded-full" style={{ backgroundColor: TEAM_COLORS[player.team].bg }} />
                    )}
                    <span className="text-text-primary">{player.name}</span>
                  </div>
                </td>
                <td className="text-right font-mono text-xl text-main">{player.netWpm}</td>
                <td className="text-right font-mono text-text-secondary">{player.accuracy}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Leaderboard;
