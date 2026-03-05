import { Link } from 'react-router-dom';

function Home() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-16">
      {/* Hero Section */}
      <div className="text-center mb-20 animate-fade-in">
        <div className="text-7xl mb-6">🦎</div>
        <h1 className="text-6xl font-black mb-4">
          <span className="gradient-text">Godzilla</span>
          <span className="text-text-primary">-Type</span>
        </h1>
        <p className="text-xl text-text-secondary max-w-xl mx-auto leading-relaxed">
          The ultimate typing arena for coworkers. Race, compete, and dominate — on LAN or online.
        </p>
      </div>

      {/* Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
        <Link
          to="/practice"
          className="glass-card glass-card-hover p-8 rounded-2xl transition-all duration-300 group cursor-pointer"
        >
          <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">⌨️</div>
          <h2 className="text-xl font-bold text-text-primary mb-2">Solo Practice</h2>
          <p className="text-text-secondary text-sm leading-relaxed">
            Sharpen your typing speed with timed tests. Choose 15, 30, or 60 second modes.
          </p>
          <div className="mt-4 text-accent-primary text-sm font-medium group-hover:translate-x-1 transition-transform">
            Start Typing →
          </div>
        </Link>

        <Link
          to="/multiplayer"
          className="glass-card glass-card-hover p-8 rounded-2xl transition-all duration-300 group cursor-pointer"
        >
          <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">🏁</div>
          <h2 className="text-xl font-bold text-text-primary mb-2">Multiplayer Race</h2>
          <p className="text-text-secondary text-sm leading-relaxed">
            Create private rooms, invite coworkers, and race head-to-head in real-time.
          </p>
          <div className="mt-4 text-accent-primary text-sm font-medium group-hover:translate-x-1 transition-transform">
            Race Now →
          </div>
        </Link>

        <Link
          to="/stats"
          className="glass-card glass-card-hover p-8 rounded-2xl transition-all duration-300 group cursor-pointer"
        >
          <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">📊</div>
          <h2 className="text-xl font-bold text-text-primary mb-2">Your Stats</h2>
          <p className="text-text-secondary text-sm leading-relaxed">
            Track your progress with detailed charts. See your WPM and accuracy trends.
          </p>
          <div className="mt-4 text-accent-primary text-sm font-medium group-hover:translate-x-1 transition-transform">
            View Stats →
          </div>
        </Link>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
        {[
          { icon: '🌐', label: 'LAN Support' },
          { icon: '👥', label: 'Team Mode' },
          { icon: '🔒', label: 'Private Rooms' },
          { icon: '⚡', label: 'Zero Lag' },
          { icon: '🏆', label: 'Leaderboards' },
          { icon: '📈', label: 'Track Stats' },
          { icon: '🎯', label: 'Accuracy' },
          { icon: '🆓', label: '100% Free' },
        ].map((feature) => (
          <div key={feature.label} className="glass-card p-4 rounded-xl text-center">
            <div className="text-2xl mb-2">{feature.icon}</div>
            <span className="text-sm text-text-secondary">{feature.label}</span>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="text-center text-text-muted text-sm">
        <p>Built for speed. Designed for competition. Works everywhere.</p>
      </div>
    </div>
  );
}

export default Home;
