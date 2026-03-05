import { useNavigate } from 'react-router-dom';

function Home() {
  const navigate = useNavigate();

  return (
    <div className="flex-1 flex flex-col items-center justify-center max-w-5xl mx-auto w-full px-6 text-center">
      <div className="animate-fade-in space-y-12">
        <div className="space-y-4">
          <div className="text-6xl filter grayscale hover:grayscale-0 transition-all cursor-default transform hover:scale-110 duration-500">🦎</div>
          <h1 className="text-5xl font-bold tracking-tighter text-text-primary">
            godzilla<span className="text-main">type</span>
          </h1>
          <p className="text-main-sub text-sm uppercase tracking-[0.4em] opacity-80">
            minimal typing experience
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-4">
          <button
            onClick={() => navigate('/practice')}
            className="group px-8 py-4 bg-bg-secondary border border-main-sub/20 rounded-lg hover:border-main/40 transition-all"
          >
            <span className="block text-main group-hover:scale-110 transition-transform text-xl mb-1">⌨️</span>
            <span className="text-[10px] uppercase tracking-widest text-main-sub group-hover:text-text-primary">Practice</span>
          </button>

          <button
            onClick={() => navigate('/multiplayer')}
            className="group px-8 py-4 bg-bg-secondary border border-main-sub/20 rounded-lg hover:border-main/40 transition-all"
          >
            <span className="block text-main group-hover:scale-110 transition-transform text-xl mb-1">👥</span>
            <span className="text-[10px] uppercase tracking-widest text-main-sub group-hover:text-text-primary">Race Mode</span>
          </button>

          <button
            onClick={() => navigate('/stats')}
            className="group px-8 py-4 bg-bg-secondary border border-main-sub/20 rounded-lg hover:border-main/40 transition-all"
          >
            <span className="block text-main group-hover:scale-110 transition-transform text-xl mb-1">📊</span>
            <span className="text-[10px] uppercase tracking-widest text-main-sub group-hover:text-text-primary">My Stats</span>
          </button>
        </div>

        <div className="pt-12 grid grid-cols-1 md:grid-cols-3 gap-8 text-left max-w-3xl mx-auto opacity-40 hover:opacity-100 transition-opacity">
          <div>
             <h3 className="text-[10px] font-bold uppercase tracking-widest text-main mb-2">fast</h3>
             <p className="text-xs text-main-sub leading-relaxed">No bloat. Built for zero-latency typing and instant feedback.</p>
          </div>
          <div>
             <h3 className="text-[10px] font-bold uppercase tracking-widest text-main mb-2">minimal</h3>
             <p className="text-xs text-main-sub leading-relaxed">Focused design. No distractions, just you and the words.</p>
          </div>
          <div>
             <h3 className="text-[10px] font-bold uppercase tracking-widest text-main mb-2">social</h3>
             <p className="text-xs text-main-sub leading-relaxed">Compete with friends over LAN or the web in real-time.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;
