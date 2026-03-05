import { useState, useCallback } from 'react';
import { useTypingEngine } from '../hooks/useTypingEngine';
import type { TypingState, PromptMode } from '../hooks/useTypingEngine';
import TypingArea from '../components/TypingArea';
import TimerSelector from '../components/TimerSelector';
import ModeSelector from '../components/ModeSelector';
import { saveResult } from '../lib/db';
import { DEFAULT_TIMER } from '@godzilla-type/shared';

function Practice() {
  const [duration, setDuration] = useState(DEFAULT_TIMER);
  const [mode, setMode] = useState<PromptMode>('words');
  const [showResults, setShowResults] = useState(false);
  const [lastResult, setLastResult] = useState<TypingState | null>(null);

  const handleFinish = useCallback((state: TypingState) => {
    setShowResults(true);
    setLastResult(state);

    saveResult({
      playerName: 'You',
      wpm: state.wpm,
      netWpm: state.netWpm,
      accuracy: state.accuracy,
      finishOrder: 1,
      timestamp: Date.now(),
      roomCode: 'practice',
      timerDuration: duration,
    }).catch(console.error);
  }, [duration]);

  const engine = useTypingEngine({
    duration,
    mode,
    onFinish: handleFinish,
  });

  const handleDurationChange = (newDuration: number) => {
    setDuration(newDuration);
    setShowResults(false);
    setLastResult(null);
    engine.resetTest();
  };

  const handleModeChange = (newMode: PromptMode) => {
    setMode(newMode);
    setShowResults(false);
    setLastResult(null);
    // Force reset with new mode — resetTest will pick up via mode prop on re-render
    engine.resetTest();
  };

  const handleRestart = () => {
    setShowResults(false);
    setLastResult(null);
    engine.resetTest();
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <div className="text-center mb-8 animate-fade-in">
        <h1 className="text-3xl font-bold text-text-primary mb-2">Solo Practice</h1>
        <p className="text-text-secondary">Test your typing speed and accuracy</p>
      </div>

      {/* Controls: mode + timer + restart */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <ModeSelector
          selected={mode}
          onSelect={handleModeChange}
          disabled={engine.isActive}
        />
        <div className="flex items-center gap-4">
          <TimerSelector
            selected={duration}
            onSelect={handleDurationChange}
            disabled={engine.isActive}
          />
          <div
            className={`font-mono text-2xl font-bold min-w-[3rem] text-right tabular-nums ${
              engine.timeLeft <= 5 && engine.isActive ? 'text-error animate-pulse' : 'text-accent-primary'
            }`}
          >
            {engine.timeLeft}s
          </div>
          <button
            onClick={handleRestart}
            className="px-3 py-1.5 rounded-lg bg-bg-primary text-text-muted hover:text-text-primary hover:bg-bg-hover transition-all text-sm"
            title="Restart (Tab)"
          >
            ↻
          </button>
        </div>
      </div>

      {!showResults ? (
        <>
          {/* Live Stats */}
          <div className="grid grid-cols-3 gap-4 mb-5">
            <div className="glass-card p-4 rounded-xl text-center">
              <p className="text-text-muted text-xs uppercase mb-1">WPM</p>
              <p className="text-3xl font-bold gradient-text font-mono tabular-nums">{engine.wpm}</p>
            </div>
            <div className="glass-card p-4 rounded-xl text-center">
              <p className="text-text-muted text-xs uppercase mb-1">Net WPM</p>
              <p className="text-3xl font-bold text-accent-primary font-mono tabular-nums">{engine.netWpm}</p>
            </div>
            <div className="glass-card p-4 rounded-xl text-center">
              <p className="text-text-muted text-xs uppercase mb-1">Accuracy</p>
              <p
                className={`text-3xl font-bold font-mono tabular-nums ${
                  engine.accuracy >= 95 ? 'text-success' : engine.accuracy >= 80 ? 'text-accent-primary' : 'text-error'
                }`}
              >
                {engine.accuracy}%
              </p>
            </div>
          </div>

          {/* Typing Area */}
          <div className="glass-card p-6 rounded-2xl relative overflow-hidden">
            {/* Hint: test doesn't end on text completion, only on timer */}
            {!engine.isActive && (
              <div className="absolute top-3 right-4 text-xs text-text-muted">
                Timer ends the test — text keeps extending ♾️
              </div>
            )}
            <TypingArea
              prompt={engine.prompt}
              charStates={engine.charStates}
              currentIndex={engine.currentIndex}
              onKeyDown={engine.handleKeyPress}
              disabled={engine.isFinished}
            />
          </div>

          {/* Progress (position in current buffer, informational) */}
          <div className="mt-3">
            <div className="w-full h-1 bg-bg-primary rounded-full overflow-hidden">
              <div
                className="progress-bar-fill h-full rounded-full"
                style={{ width: `${engine.progress}%` }}
              />
            </div>
          </div>
        </>
      ) : (
        /* Results */
        <div className="animate-slide-up">
          <div className="glass-card p-8 rounded-2xl text-center mb-6">
            <div className="text-5xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-text-primary mb-6">Test Complete!</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="glass-card p-4 rounded-xl">
                <p className="text-text-muted text-xs uppercase mb-1">WPM</p>
                <p className="text-3xl font-bold gradient-text font-mono">{lastResult?.wpm || 0}</p>
              </div>
              <div className="glass-card p-4 rounded-xl">
                <p className="text-text-muted text-xs uppercase mb-1">Net WPM</p>
                <p className="text-3xl font-bold text-accent-primary font-mono">{lastResult?.netWpm || 0}</p>
              </div>
              <div className="glass-card p-4 rounded-xl">
                <p className="text-text-muted text-xs uppercase mb-1">Accuracy</p>
                <p
                  className={`text-3xl font-bold font-mono ${
                    (lastResult?.accuracy || 0) >= 95 ? 'text-success' : 'text-accent-primary'
                  }`}
                >
                  {lastResult?.accuracy || 0}%
                </p>
              </div>
              <div className="glass-card p-4 rounded-xl">
                <p className="text-text-muted text-xs uppercase mb-1">Characters</p>
                <p className="text-3xl font-bold text-text-primary font-mono">{lastResult?.totalCharsTyped || 0}</p>
              </div>
            </div>
          </div>
          <div className="flex justify-center gap-4">
            <button
              onClick={handleRestart}
              className="px-6 py-3 rounded-xl bg-accent-primary text-bg-primary font-semibold hover:bg-accent-secondary transition-all btn-glow"
            >
              Try Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Practice;
