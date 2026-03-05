import { Link, useLocation } from 'react-router-dom';
import { Keyboard, Users, BarChart2, Trophy, Zap, Wifi, WifiOff } from 'lucide-react';
import { SignInButton, UserButton, useAuth } from '@clerk/clerk-react';
import { useSocket } from '../hooks/useSocket';

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string;

function AuthButtons() {
  const { isSignedIn } = useAuth();
  if (!isSignedIn) {
    return (
      <SignInButton mode="modal">
        <button className="text-xs uppercase tracking-widest text-main border border-main/20 px-3 py-1.5 rounded hover:bg-main/10 transition-colors">
          Sign In
        </button>
      </SignInButton>
    );
  }
  return <UserButton afterSignOutUrl="/" appearance={{ elements: { userButtonAvatarBox: "w-7 h-7" } }} />;
}

function Navbar() {
  const location = useLocation();
  const { isConnected } = useSocket();

  const navItems = [
    { path: '/practice', label: 'practice', icon: <Keyboard size={12} /> },
    { path: '/multiplayer', label: 'multiplayer', icon: <Users size={12} /> },
    { path: '/leaderboard', label: 'leaderboard', icon: <Trophy size={12} /> },
    { path: '/stats', label: 'stats', icon: <BarChart2 size={12} /> },
  ];

  return (
    <nav className="w-full max-w-5xl mx-auto px-6 py-8 flex items-center justify-between">
      <div className="flex items-center gap-8">
        <Link to="/" className="flex items-center gap-2 group">
          <Zap size={20} className="text-main group-hover:scale-110 transition-transform" />
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

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2" title={isConnected ? 'Connected to Multiplayer Server' : 'Disconnected from Server'}>
          {isConnected ? (
            <Wifi size={14} className="text-green-500/80" />
          ) : (
            <WifiOff size={14} className="text-error/80" />
          )}
        </div>

        {clerkPubKey && (
          <div className="flex items-center gap-4 border-l border-main-sub/20 pl-4 ml-2">
            <AuthButtons />
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
