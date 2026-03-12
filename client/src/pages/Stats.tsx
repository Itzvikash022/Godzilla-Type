import { useState, useEffect } from 'react';
import { getStats, clearStats } from '../lib/db';
import CloudSyncBanner from '../components/CloudSyncBanner';
import type { PlayerStats, RaceResult } from '@godzilla-type/shared';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

// Register ChartJS plugins
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

function Stats() {
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [chartType, setChartType] = useState<'line' | 'bar'>('line');
  const ITEMS_PER_PAGE = 15;

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
  const chartMaxWpm = Math.ceil(maxWpm / 10) * 10 + 10;

  const chartData = {
    labels: recentHistory.map((_, i) => i + 1),
    datasets: [
      {
        label: 'WPM',
        data: recentHistory.map(r => r.netWpm),
        borderColor: '#e2b714',
        backgroundColor: 'rgba(226, 183, 20, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        yAxisID: 'y1',
        pointRadius: 3,
        pointBackgroundColor: '#e2b714',
        pointHoverRadius: 6,
      },
      {
        label: 'Accuracy',
        data: recentHistory.map(r => r.accuracy),
        borderColor: '#4ade80',
        backgroundColor: 'transparent',
        borderWidth: 2,
        fill: false,
        tension: 0.4,
        yAxisID: 'y',
        pointRadius: 2,
        pointBackgroundColor: '#4ade80',
        pointHoverRadius: 5,
        borderDash: [5, 5],
      }
    ]
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    scales: {
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        min: 0,
        max: 100,
        grid: {
          color: 'rgba(100, 102, 105, 0.1)',
          drawBorder: false,
        },
        ticks: {
          color: '#646669',
          font: { family: 'JetBrains Mono', size: 10 },
          callback: (value: any) => `${value}%`,
        },
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        min: 0,
        max: chartMaxWpm,
        grid: {
          drawOnChartArea: false,
        },
        ticks: {
          color: '#646669',
          font: { family: 'JetBrains Mono', size: 10 },
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          display: false,
        },
      },
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: '#2c2e31',
        titleFont: { family: 'JetBrains Mono', size: 12 },
        bodyFont: { family: 'JetBrains Mono', size: 12 },
        padding: 12,
        borderColor: 'rgba(226, 183, 20, 0.2)',
        borderWidth: 1,
        displayColors: true,
        callbacks: {
          label: (context: any) => {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += context.datasetIndex === 1 ? `${context.parsed.y}%` : `${context.parsed.y} WPM`;
            }
            return label;
          }
        }
      }
    },
  };

  const barData = {
    labels: recentHistory.map((_, i) => i + 1),
    datasets: [
      {
        label: 'Net WPM',
        data: recentHistory.map(r => r.netWpm),
        backgroundColor: '#e2b714',
        borderRadius: 4,
        hoverBackgroundColor: '#f1c40f',
      }
    ]
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(100, 102, 105, 0.1)',
        },
        ticks: {
          color: '#646669',
          font: { family: 'JetBrains Mono', size: 10 },
        }
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          display: false,
        }
      }
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#2c2e31',
        padding: 10,
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Your Stats</h1>
          <p className="text-text-secondary text-sm">Track your typing progress</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex bg-bg-secondary/40 rounded-lg p-1 border border-white/5">
            <button
              onClick={() => setChartType('line')}
              className={`px-3 py-1 rounded-md text-[10px] uppercase tracking-widest transition-all ${chartType === 'line' ? 'bg-main text-bg-primary font-bold' : 'text-main-sub hover:text-text-primary'}`}
            >
              Line
            </button>
            <button
              onClick={() => setChartType('bar')}
              className={`px-3 py-1 rounded-md text-[10px] uppercase tracking-widest transition-all ${chartType === 'bar' ? 'bg-main text-bg-primary font-bold' : 'text-main-sub hover:text-text-primary'}`}
            >
              Bar
            </button>
          </div>
          <button
            onClick={handleClearStats}
            className="px-4 py-2 rounded-lg text-sm text-text-muted hover:text-error hover:bg-error/10 transition-all font-mono"
          >
            Clear Stats
          </button>
        </div>
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

      {/* Main Stats Chart */}
      <div className="glass-card p-8 rounded-2xl mb-8 animate-slide-up" style={{ animationDelay: '0.1s' }}>
        <h3 className="text-sm font-semibold text-text-muted mb-8 flex items-center justify-between uppercase tracking-widest">
          <div className="flex items-center gap-6">
            <span className="text-text-primary flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#e2b714]" />
              {chartType === 'line' ? 'WPM Trend' : 'WPM History'}
            </span>
            {chartType === 'line' && (
              <span className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#4ade80] opacity-60" />
                Accuracy
              </span>
            )}
          </div>
          <span className="text-[10px] opacity-40">Last 20 sessions</span>
        </h3>

        <div className="h-64 w-full">
          {chartType === 'line' ? (
            <Line data={chartData} options={lineOptions} />
          ) : (
            <Bar data={barData} options={barOptions} />
          )}
        </div>

        <div className="flex justify-between mt-10 border-t border-white/5 pt-4">
          <span className="text-[10px] text-text-muted uppercase tracking-widest">Oldest session</span>
          <span className="text-[10px] text-text-muted uppercase tracking-widest">Latest result</span>
        </div>
      </div>

      {/* Accuracy History Chart (Separate only in bar mode) */}
      {chartType === 'bar' && (
        <div className="glass-card p-6 rounded-2xl mb-8 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <h3 className="text-lg font-semibold text-text-primary mb-4">🎯 Accuracy History</h3>
          <div className="h-40">
            <Bar
              data={{
                labels: recentHistory.map((_, i) => i + 1),
                datasets: [{
                  label: 'Accuracy',
                  data: recentHistory.map(r => r.accuracy),
                  backgroundColor: recentHistory.map(r =>
                    r.accuracy >= 95 ? '#4ade80' : r.accuracy >= 80 ? '#e2b714' : '#ca4754'
                  ),
                  borderRadius: 4,
                }]
              }}
              options={barOptions}
            />
          </div>
        </div>
      )}

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
            {stats.history.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE).map((result, i) => (
              <tr key={i} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                <td className="py-3 px-6 text-text-secondary text-sm">{(currentPage - 1) * ITEMS_PER_PAGE + i + 1}</td>
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

        {/* Pagination Controls */}
        {stats.history.length > ITEMS_PER_PAGE && (
          <div className="p-4 border-t border-white/5 flex items-center justify-between bg-white/5">
            <p className="text-xs text-text-muted">
              Showing <span className="text-text-primary">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to <span className="text-text-primary">{Math.min(currentPage * ITEMS_PER_PAGE, stats.history.length)}</span> of <span className="text-text-primary">{stats.history.length}</span> races
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-white/5 rounded text-xs text-text-primary transition-all uppercase tracking-widest disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <div className="flex items-center gap-2 mx-2">
                {[...Array(Math.ceil(stats.history.length / ITEMS_PER_PAGE))].map((_, idx) => {
                  const p = idx + 1;
                  // Only show current, first, last, and neighbors if many pages
                  const total = Math.ceil(stats.history.length / ITEMS_PER_PAGE);
                  if (total > 7 && p !== 1 && p !== total && Math.abs(p - currentPage) > 1) {
                    if (p === 2 || p === total - 1) return <span key={p} className="text-text-muted text-[10px]">...</span>;
                    return null;
                  }
                  return (
                    <button
                      key={p}
                      onClick={() => setCurrentPage(p)}
                      className={`w-6 h-6 flex items-center justify-center rounded text-[10px] transition-all ${currentPage === p ? 'bg-main text-bg-primary font-bold' : 'text-text-muted hover:text-text-primary'}`}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => setCurrentPage(prev => Math.min(Math.ceil(stats.history.length / ITEMS_PER_PAGE), prev + 1))}
                disabled={currentPage === Math.ceil(stats.history.length / ITEMS_PER_PAGE)}
                className="px-3 py-1 bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-white/5 rounded text-xs text-text-primary transition-all uppercase tracking-widest disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Stats;
