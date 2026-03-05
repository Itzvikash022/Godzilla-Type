import { Link, useLocation } from 'react-router-dom';

function Navbar() {
  const location = useLocation();

  const links = [
    { to: '/', label: 'Home', icon: '🦎' },
    { to: '/practice', label: 'Practice', icon: '⌨️' },
    { to: '/multiplayer', label: 'Multiplayer', icon: '🏁' },
    { to: '/stats', label: 'Stats', icon: '📊' },
  ];

  return (
    <nav className="sticky top-0 z-40 glass-card border-b border-white/5 rounded-none">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <span className="text-2xl">🦎</span>
          <span className="text-xl font-bold gradient-text group-hover:opacity-80 transition-opacity">
            Godzilla-Type
          </span>
        </Link>

        <div className="flex items-center gap-1">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                location.pathname === link.to
                  ? 'bg-accent-primary/20 text-accent-primary'
                  : 'text-text-secondary hover:text-text-primary hover:bg-white/5'
              }`}
            >
              <span className="mr-2">{link.icon}</span>
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
