import { useState, useEffect } from 'react';
import { getStats, clearStats } from '../lib/db';
import CloudSyncBanner from '../components/CloudSyncBanner';
import type { PlayerStats, RaceResult } from '@godzilla-type/shared';

function Stats() {
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStats();

    const onSyncCompleted = () => {
      loadStats();
    };

    window.addEventListener('godzilla-sync-completed', onSyncCompleted);
    return () => {
      window.removeEventListener('godzilla-sync-completed', onSyncCompleted);
    };
  }, []);

  const loadStats = async () => {
    try {
      const data = await getStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to load stats:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearStats = async () => {
    if (confirm('Are you sure you want to clear all your stats?')) {
      await clearStats();
      loadStats();
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-16 text-center">
        <div className="text-4xl mb-4 animate-pulse">📊</div>
        <p className="text-text-secondary">Loading stats...</p>
      </div>
    );
  }

  if (!stats || stats.totalRaces === 0) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-16 text-center">
        <div className="text-6xl mb-4">📊</div>
        <h1 className="text-3xl font-bold text-text-primary mb-2">No Stats Yet</h1>
        <p className="text-text-secondary mb-6">Complete some typing tests to see your stats here.</p>
        <a
          href="/practice"
          className="inline-block px-6 py-3 rounded-xl bg-accent-primary text-bg-primary font-semibold hover:bg-accent-secondary transition-all"
        >
          Start Practicing
        </a>
      </div>
    );
  }

  // Prepare chart data (last 20 races)
  const recentHistory = [...stats.history].slice(0, 20).reverse();
  const maxWpm = Math.max(...recentHistory.map((r) => r.netWpm), 1);

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Your Stats</h1>
          <p className="text-text-secondary text-sm">Track your typing progress</p>
        </div>
        <button
          onClick={handleClearStats}
          className="px-4 py-2 rounded-lg text-sm text-text-muted hover:text-error hover:bg-error/10 transition-all"
        >
          Clear Stats
        </button>
      </div>

      {/* Cloud Sync Banner */}
      <div className="mb-8">
        <CloudSyncBanner />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 animate-slide-up">
        <div className="glass-card p-6 rounded-2xl text-center">
          <p className="text-text-muted text-xs uppercase mb-2">Best WPM</p>
          <p className="text-4xl font-bold gradient-text font-mono">{stats.bestWpm}</p>
        </div>
        <div className="glass-card p-6 rounded-2xl text-center">
          <p className="text-text-muted text-xs uppercase mb-2">Average WPM</p>
          <p className="text-4xl font-bold text-accent-primary font-mono">{stats.avgWpm}</p>
        </div>
        <div className="glass-card p-6 rounded-2xl text-center">
          <p className="text-text-muted text-xs uppercase mb-2">Best Accuracy</p>
          <p className="text-4xl font-bold text-success font-mono">{stats.bestAccuracy}%</p>
        </div>
        <div className="glass-card p-6 rounded-2xl text-center">
          <p className="text-text-muted text-xs uppercase mb-2">Total Races</p>
          <p className="text-4xl font-bold text-text-primary font-mono">{stats.totalRaces}</p>
        </div>
      </div>

      {/* WPM History Chart */}
      <div className="glass-card p-6 rounded-2xl mb-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
        <h3 className="text-lg font-semibold text-text-primary mb-4">📈 WPM History</h3>
        <div className="flex items-end gap-1.5 h-48">
          {recentHistory.map((result, i) => (
            <div key={i} className="flex-1 flex flex-col items-center justify-end h-full gap-1">
              <span className="text-[10px] text-text-muted font-mono">{result.netWpm}</span>
              <div
                className="chart-bar w-full min-h-[4px] bg-main rounded-t"
                style={{
                  height: `${(result.netWpm / Math.max(maxWpm || 100, 1)) * 100}%`,
                  animationDelay: `${i * 50}ms`,
                }}
                title={`${result.netWpm} WPM • ${result.accuracy}% accuracy`}
              />
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2">
          <span className="text-[10px] text-text-muted">Oldest</span>
          <span className="text-[10px] text-text-muted">Most Recent</span>
        </div>
      </div>

      {/* Accuracy History Chart */}
      <div className="glass-card p-6 rounded-2xl mb-6 animate-slide-up" style={{ animationDelay: '0.2s' }}>
        <h3 className="text-lg font-semibold text-text-primary mb-4">🎯 Accuracy History</h3>
        <div className="flex items-end gap-1.5 h-32">
          {recentHistory.map((result, i) => (
            <div key={i} className="flex-1 flex flex-col items-center justify-end h-full gap-1">
              <span className="text-[10px] text-text-muted font-mono">{result.accuracy}%</span>
              <div
                className="w-full min-h-[4px] rounded-t"
                style={{
                  height: `${result.accuracy}%`,
                  background:
                    result.accuracy >= 95
                      ? 'linear-gradient(to top, #4ade80, #22c55e)'
                      : result.accuracy >= 80
                        ? 'linear-gradient(to top, #e2b714, #f59e0b)'
                        : 'linear-gradient(to top, #ca4754, #ef4444)',
                  transition: `height 0.5s ease-out ${i * 50}ms`,
                }}
              />
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2">
          <span className="text-[10px] text-text-muted">Oldest</span>
          <span className="text-[10px] text-text-muted">Most Recent</span>
        </div>
      </div>

      {/* Recent Races Table */}
      <div className="glass-card rounded-2xl overflow-hidden animate-slide-up" style={{ animationDelay: '0.3s' }}>
        <div className="p-6 pb-3">
          <h3 className="text-lg font-semibold text-text-primary">🕐 Recent Races</h3>
        </div>
        <table className="w-full">
          <thead>
            <tr className="text-text-muted text-xs uppercase border-b border-white/5">
              <th className="text-left py-2 px-6">#</th>
              <th className="text-right py-2 px-4">WPM</th>
              <th className="text-right py-2 px-4">Net WPM</th>
              <th className="text-right py-2 px-4">Accuracy</th>
              <th className="text-right py-2 px-4">Mode</th>
              <th className="text-right py-2 px-6">Date</th>
            </tr>
          </thead>
          <tbody>
            {stats.history.slice(0, 15).map((result, i) => (
              <tr key={i} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                <td className="py-3 px-6 text-text-secondary text-sm">{i + 1}</td>
                <td className="py-3 px-4 text-right font-mono text-sm text-text-secondary">{result.wpm}</td>
                <td className="py-3 px-4 text-right font-mono text-sm font-semibold text-text-primary">{result.netWpm}</td>
                <td className="py-3 px-4 text-right font-mono text-sm">
                  <span className={result.accuracy >= 95 ? 'text-success' : result.accuracy >= 80 ? 'text-accent-primary' : 'text-error'}>
                    {result.accuracy}%
                  </span>
                </td>
                <td className="py-3 px-4 text-right text-sm text-text-muted">{result.timerDuration}s</td>
                <td className="py-3 px-6 text-right text-sm text-text-muted">
                  {new Date(result.timestamp).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Stats;
