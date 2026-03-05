import { Link, useLocation } from 'react-router-dom';

function Navbar() {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'home', icon: '🏠' },
    { path: '/practice', label: 'practice', icon: '⌨️' },
    { path: '/multiplayer', label: 'multiplayer', icon: '👥' },
    { path: '/stats', label: 'stats', icon: '📊' },
  ];

  return (
    <nav className="w-full max-w-5xl mx-auto px-6 py-8 flex items-center justify-between">
      <div className="flex items-center gap-8">
        <Link to="/" className="flex items-center gap-2 group">
          <span className="text-2xl filter grayscale group-hover:grayscale-0 transition-all">🦎</span>
          <span className="text-lg font-bold tracking-tighter text-text-primary">
            godzilla<span className="text-main">type</span>
          </span>
        </Link>

        <div className="flex items-center gap-2">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`btn-minimal ${location.pathname === item.path ? 'active' : ''}`}
              title={item.label}
            >
              <span className="text-xs uppercase tracking-widest">{item.label}</span>
            </Link>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-6">
         {/* Settings / Extra info could go here */}
      </div>
    </nav>
  );
}

export default Navbar;
