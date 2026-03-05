import { useState } from 'react';
import { useTypingEngine } from '../hooks/useTypingEngine';
import TypingArea from '../components/TypingArea';
import ModeSelector from '../components/ModeSelector';
import { saveResult } from '../lib/db';
import type { PromptMode } from '@godzilla-type/shared';

function Practice() {
  const [duration, setDuration] = useState(30);
  const [mode, setMode] = useState<PromptMode>('words');
  const [showResults, setShowResults] = useState(false);

  const {
    prompt,
    charStates,
    currentIndex,
    netWpm,
    accuracy,
    timeLeft,
    isFinished,
    handleKeyPress,
    resetTest,
  } = useTypingEngine({
    duration,
    mode,
    onFinish: (result) => {
      saveResult({
        playerName: localStorage.getItem('godzilla-player-name') || 'Local User',
        wpm: result.wpm,
        netWpm: result.netWpm,
        accuracy: result.accuracy,
        finishOrder: 1,
        timestamp: Date.now(),
        roomCode: 'PRACTICE',
        timerDuration: duration,
      }).catch(console.error);
      setShowResults(true);
    },
  });

  const handleRestart = () => {
    setShowResults(false);
    resetTest();
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center max-w-[1200px] mx-auto w-full px-6">
      {/* Settings Row: Modes & Durations */}
      {!isFinished && !showResults && (
        <div className="mb-8">
          <ModeSelector 
            selectedMode={mode} 
            onSelectMode={(m) => { setMode(m); handleRestart(); }} 
            selectedDuration={duration} 
            onSelectDuration={(d) => { setDuration(d); handleRestart(); }}
          />
        </div>
      )}

      {/* Main Stats (Visible only when racing) */}
      {!isFinished && currentIndex > 0 && !showResults && (
        <div className="mb-8 flex gap-12 font-mono text-2xl animate-fade-in opacity-80">
          <div className="flex flex-col items-center">
            <span className="text-[10px] uppercase tracking-widest text-main-sub">wpm</span>
            <span className="text-main">{netWpm}</span>
          </div>
          <div className="flex flex-col items-center">
             <span className="text-[10px] uppercase tracking-widest text-main-sub">acc</span>
             <span className="text-main">{accuracy}%</span>
          </div>
          <div className="flex flex-col items-center">
             <span className="text-[10px] uppercase tracking-widest text-main-sub">time</span>
             <span className="text-main">{timeLeft}s</span>
          </div>
        </div>
      )}

      {/* Typing Area */}
      {!showResults && (
        <div className="w-full flex flex-col items-center">
          <TypingArea
            prompt={prompt}
            charStates={charStates}
            currentIndex={currentIndex}
            onKeyDown={handleKeyPress}
            disabled={isFinished}
          />
          
          {/* Bottom Restart Button */}
          {!isFinished && (
            <button
              onClick={handleRestart}
              className="mt-8 group flex items-center gap-2 text-main-sub hover:text-main transition-all"
              title="Restart (Tab)"
            >
              <span className="text-xl group-hover:rotate-180 transition-transform duration-500">🔄</span>
              <span className="text-[10px] uppercase tracking-[0.2em] font-medium">Restart Test</span>
            </button>
          )}
        </div>
      )}

      {/* Results Screen */}
      {showResults && (
        <div className="animate-slide-up bg-bg-secondary/30 p-12 rounded-2xl border border-main-sub/10 w-full max-w-3xl text-center">
          <div className="flex justify-between items-start mb-12">
            <div className="text-left">
              <span className="text-xs uppercase text-main-sub tracking-widest">net wpm</span>
              <p className="text-8xl font-bold text-main">{netWpm}</p>
            </div>
            <div className="text-left">
               <span className="text-xs uppercase text-main-sub tracking-widest">accuracy</span>
               <p className="text-8xl font-bold text-main">{accuracy}%</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-12">
             <div className="bg-bg-primary/40 p-4 rounded border border-main-sub/5 text-left">
                <span className="text-[10px] uppercase text-main-sub">mode</span>
                <p className="text-text-primary uppercase text-sm tracking-widest">{mode}</p>
             </div>
             <div className="bg-bg-primary/40 p-4 rounded border border-main-sub/5 text-left">
                <span className="text-[10px] uppercase text-main-sub">time</span>
                <p className="text-text-primary text-sm tracking-widest">{duration}s</p>
             </div>
          </div>

          <button
            onClick={handleRestart}
            className="w-full py-4 border border-main/20 text-main-sub hover:text-main hover:bg-main/5 transition-all text-xs uppercase tracking-[0.3em] rounded"
          >
            Restart (Tab)
          </button>
        </div>
      )}

      {/* Quick navigation hint */}
      {!showResults && currentIndex === 0 && (
         <div className="mt-8 text-main-sub text-[10px] uppercase tracking-widest opacity-20">
           press <span className="bg-main-sub/20 px-1 rounded mx-1">tab</span> to quickly restart
         </div>
      )}
    </div>
  );
}

export default Practice;
