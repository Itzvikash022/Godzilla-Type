import { useState, useEffect } from 'react';
import { Trophy, ChevronUp, ChevronDown, Cloud, Monitor } from 'lucide-react';
import { getConvexClient, isConvexConfigured } from '../services/convexClient';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

// ── Types ─────────────────────────────────────────────────────────────────────

interface LocalEntry {
    playerName: string;
    bestWpm: number;
    avgWpm: number;
    bestAccuracy: number;
    avgAccuracy: number;
    totalRaces: number;
}

interface CloudEntry {
    _id: string;
    username: string;
    avgWpm: number;
    maxWpm: number;
    avgAccuracy: number;
    racesPlayed: number;
}

type SortField = 'bestWpm' | 'avgWpm' | 'bestAccuracy';
type CloudSortField = 'maxWpm' | 'avgWpm' | 'avgAccuracy';

// ── Helpers ───────────────────────────────────────────────────────────────────

function SortIcon({ active, desc }: { active: boolean; desc: boolean }) {
    if (!active) return null;
    return desc ? <ChevronDown size={11} className="inline ml-1 text-main" /> : <ChevronUp size={11} className="inline ml-1 text-main" />;
}

// ── Local Leaderboard Tab ─────────────────────────────────────────────────────

function LocalTab() {
    const [entries, setEntries] = useState<LocalEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [sortBy, setSortBy] = useState<SortField>('bestWpm');
    const [sortDesc, setSortDesc] = useState(true);

    useEffect(() => {
        setLoading(true);
        fetch(`${SERVER_URL}/api/leaderboard`)
            .then((r) => r.json())
            .then((data) => { setEntries(Array.isArray(data) ? data : []); setLoading(false); })
            .catch(() => { setError('Could not load — is the server running?'); setLoading(false); });
    }, []);

    const handleSort = (field: SortField) => {
        if (sortBy === field) setSortDesc(!sortDesc);
        else { setSortBy(field); setSortDesc(true); }
    };

    const sorted = [...entries].sort((a, b) => {
        const diff = (b[sortBy] ?? 0) - (a[sortBy] ?? 0);
        return sortDesc ? diff : -diff;
    });

    if (loading) return <div className="text-main-sub text-xs uppercase tracking-widest animate-pulse text-center py-16">Loading...</div>;
    if (error) return <div className="text-error text-xs uppercase tracking-widest text-center py-16">{error}</div>;
    if (sorted.length === 0) return <div className="text-center py-16 text-main-sub text-[10px] uppercase tracking-widest">No races recorded yet</div>;

    return (
        <div className="overflow-x-auto">
            <table className="mt-table">
                <thead>
                    <tr>
                        <th className="w-12 text-center">#</th>
                        <th>player</th>
                        <th className="text-right cursor-pointer" onClick={() => handleSort('bestWpm')}>best wpm<SortIcon active={sortBy === 'bestWpm'} desc={sortDesc} /></th>
                        <th className="text-right cursor-pointer" onClick={() => handleSort('avgWpm')}>avg wpm<SortIcon active={sortBy === 'avgWpm'} desc={sortDesc} /></th>
                        <th className="text-right cursor-pointer" onClick={() => handleSort('bestAccuracy')}>accuracy<SortIcon active={sortBy === 'bestAccuracy'} desc={sortDesc} /></th>
                        <th className="text-right">races</th>
                    </tr>
                </thead>
                <tbody>
                    {sorted.map((entry, i) => (
                        <tr key={entry.playerName} className={i === 0 ? 'bg-main/5' : ''}>
                            <td className="text-center"><span className={`font-mono text-sm ${i === 0 ? 'text-main' : 'text-main-sub'}`}>{i === 0 ? '🥇' : i + 1}</span></td>
                            <td><span className="text-text-primary font-medium">{entry.playerName}</span></td>
                            <td className="text-right font-mono text-xl text-main">{entry.bestWpm}</td>
                            <td className="text-right font-mono text-text-secondary">{entry.avgWpm}</td>
                            <td className="text-right font-mono text-text-secondary">{entry.bestAccuracy}%</td>
                            <td className="text-right font-mono text-main-sub text-sm">{entry.totalRaces}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

// ── Cloud Leaderboard Tab ─────────────────────────────────────────────────────

function CloudTab() {
    const [entries, setEntries] = useState<CloudEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [sortBy, setSortBy] = useState<CloudSortField>('maxWpm');
    const [sortDesc, setSortDesc] = useState(true);

    const fetchLeaderboard = async (sort: CloudSortField) => {
        const client = getConvexClient();
        if (!client) { setError('Convex not configured'); setLoading(false); return; }
        setLoading(true);
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const data = await (client as any).query('queries:getLeaderboard', { sortBy: sort, limit: 50 });
            setEntries(Array.isArray(data) ? data : []);
        } catch {
            setError('Failed to load cloud leaderboard');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchLeaderboard(sortBy); }, []);

    const handleSort = (field: CloudSortField) => {
        if (sortBy === field) setSortDesc(!sortDesc);
        else { setSortBy(field); setSortDesc(true); fetchLeaderboard(field); }
    };

    const sorted = [...entries].sort((a, b) => {
        const diff = (b[sortBy] ?? 0) - (a[sortBy] ?? 0);
        return sortDesc ? diff : -diff;
    });

    if (loading) return <div className="text-main-sub text-xs uppercase tracking-widest animate-pulse text-center py-16">Loading cloud data...</div>;
    if (error) return <div className="text-error text-xs uppercase tracking-widest text-center py-16">{error}</div>;
    if (sorted.length === 0) return (
        <div className="text-center py-16">
            <p className="text-main-sub text-[10px] uppercase tracking-widest">No cloud results yet</p>
            <p className="text-main-sub text-[10px] uppercase tracking-widest opacity-50 mt-2">Enable Cloud Sync in the Stats page to appear here</p>
        </div>
    );

    return (
        <div className="overflow-x-auto">
            <table className="mt-table">
                <thead>
                    <tr>
                        <th className="w-12 text-center">#</th>
                        <th>player</th>
                        <th className="text-right cursor-pointer" onClick={() => handleSort('maxWpm')}>best wpm<SortIcon active={sortBy === 'maxWpm'} desc={sortDesc} /></th>
                        <th className="text-right cursor-pointer" onClick={() => handleSort('avgWpm')}>avg wpm<SortIcon active={sortBy === 'avgWpm'} desc={sortDesc} /></th>
                        <th className="text-right cursor-pointer" onClick={() => handleSort('avgAccuracy')}>accuracy<SortIcon active={sortBy === 'avgAccuracy'} desc={sortDesc} /></th>
                        <th className="text-right">races</th>
                    </tr>
                </thead>
                <tbody>
                    {sorted.map((entry, i) => (
                        <tr key={entry._id} className={i === 0 ? 'bg-main/5' : ''}>
                            <td className="text-center"><span className={`font-mono text-sm ${i === 0 ? 'text-main' : 'text-main-sub'}`}>{i === 0 ? '🥇' : i + 1}</span></td>
                            <td><span className="text-text-primary font-medium">{entry.username}</span></td>
                            <td className="text-right font-mono text-xl text-main">{entry.maxWpm}</td>
                            <td className="text-right font-mono text-text-secondary">{entry.avgWpm}</td>
                            <td className="text-right font-mono text-text-secondary">{entry.avgAccuracy}%</td>
                            <td className="text-right font-mono text-main-sub text-sm">{entry.racesPlayed}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

// ── Page ──────────────────────────────────────────────────────────────────────

type TabType = 'local' | 'cloud';

function LeaderboardPage() {
    const [tab, setTab] = useState<TabType>('cloud');
    const convexConfigured = isConvexConfigured();

    return (
        <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full px-6 py-12">
            {/* Header */}
            <div className="flex items-center gap-3 mb-2">
                <Trophy size={20} className="text-main" />
                <h1 className="text-2xl font-bold tracking-tighter text-text-primary">Leaderboard</h1>
            </div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-main-sub mb-8">
                Global rankings — compete against the world
            </p>

            {/* Tab Toggle */}
            <div className="flex items-center gap-1 bg-bg-secondary/40 rounded-xl p-1 border border-main-sub/5 w-fit mb-8">
                <button
                    onClick={() => setTab('cloud')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] uppercase tracking-widest transition-all ${tab === 'cloud' ? 'bg-main/10 text-main' : 'text-main-sub hover:text-text-primary'
                        }`}
                >
                    <Cloud size={11} />
                    Global (Convex)
                </button>
                <button
                    onClick={() => setTab('local')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] uppercase tracking-widest transition-all ${tab === 'local' ? 'bg-main/10 text-main' : 'text-main-sub hover:text-text-primary'
                        }`}
                >
                    <Monitor size={11} />
                    This Server
                </button>
            </div>

            {/* Content */}
            {tab === 'cloud' && !convexConfigured ? (
                <div className="text-center py-16 bg-bg-secondary/20 rounded-xl border border-main-sub/5">
                    <Cloud size={32} className="text-main-sub mx-auto mb-4 opacity-30" />
                    <p className="text-main-sub text-[10px] uppercase tracking-widest">Convex not configured</p>
                    <p className="text-main-sub text-[10px] uppercase tracking-widest opacity-50 mt-2">Add VITE_CONVEX_URL to .env.local</p>
                </div>
            ) : tab === 'cloud' ? (
                <CloudTab />
            ) : (
                <LocalTab />
            )}
        </div>
    );
}

export default LeaderboardPage;
