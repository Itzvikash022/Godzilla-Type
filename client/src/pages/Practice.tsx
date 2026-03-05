import { useState, useRef } from 'react';
import { RotateCcw } from 'lucide-react';
import { useTypingEngine } from '../hooks/useTypingEngine';
import TypingArea from '../components/TypingArea';
import ModeSelector from '../components/ModeSelector';
import { saveResult } from '../lib/db';
import { triggerCloudSync } from '../components/SyncManager';
import type { PromptMode } from '@godzilla-type/shared';

const MAX_CUSTOM_CHARS = 5000;

function sanitizeCustomText(text: string): string {
  return text
    .trim()
    .replace(/\s+/g, ' ')
    // Keep printable ASCII and common punctuation
    .replace(/[^\x20-\x7E]/g, '');
}

function Practice() {
  const [duration, setDuration] = useState(30);
  const [mode, setMode] = useState<PromptMode>('words');
  const [showResults, setShowResults] = useState(false);

  // Custom mode state
  const [customInput, setCustomInput] = useState('');
  const [customError, setCustomError] = useState('');
  const [customReady, setCustomReady] = useState(false);
  const [activeCustomText, setActiveCustomText] = useState('');

  const isCustomMode = mode === 'custom';
  const showTypingArea = !isCustomMode || customReady;

  const providedWords = customReady ? activeCustomText.split(' ') : undefined;
  const providedPrompt = customReady ? activeCustomText : undefined;

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
    providedWords,
    providedPrompt,
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
        mode,
        synced: false,
      }).catch(console.error);
      triggerCloudSync();
      setShowResults(true);
    },
  });

  const handleRestart = () => {
    setShowResults(false);
    setCustomReady(false);
    setCustomInput('');
    setCustomError('');
    setActiveCustomText('');
    resetTest();
  };

  const handleModeChange = (m: PromptMode) => {
    setMode(m);
    setCustomReady(false);
    setCustomInput('');
    setCustomError('');
    setActiveCustomText('');
    setShowResults(false);
    if (m !== 'custom') resetTest();
  };

  const handleStartCustom = () => {
    const clean = sanitizeCustomText(customInput);
    if (clean.length < 10) {
      setCustomError('Text is too short. Paste at least 10 characters.');
      return;
    }
    if (clean.length > MAX_CUSTOM_CHARS) {
      setCustomError(`Text too long. Max ${MAX_CUSTOM_CHARS} characters.`);
      return;
    }
    setCustomError('');
    setActiveCustomText(clean);
    setCustomReady(true);
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center max-w-[1600px] mx-auto w-full px-6">
      {/* Settings Row */}
      {!isFinished && !showResults && (
        <div className="mb-8">
          <ModeSelector
            selectedMode={mode}
            onSelectMode={handleModeChange}
            selectedDuration={duration}
            onSelectDuration={(d) => { setDuration(d); handleRestart(); }}
          />
        </div>
      )}

      {/* Custom Text Input */}
      {isCustomMode && !customReady && !showResults && (
        <div className="relative w-full max-w-[1500px] mx-auto py-8 select-none mb-8">
          <p className="text-[10px] uppercase tracking-widest text-main-sub mb-3">
            Paste your custom text below (max {MAX_CUSTOM_CHARS} chars)
          </p>
          <textarea
            className="w-full h-40 bg-bg-secondary/40 border border-main-sub/10 rounded-xl p-4 text-text-primary font-mono text-sm resize-none outline-none focus:border-main/30 transition-colors"
            placeholder="Paste any English text here..."
            value={customInput}
            onChange={(e) => {
              setCustomInput(e.target.value.slice(0, MAX_CUSTOM_CHARS));
              setCustomError('');
            }}
          />
          <div className="flex items-center justify-between mt-2">
            <span className={`text-[10px] font-mono ${customInput.length > MAX_CUSTOM_CHARS * 0.9 ? 'text-error' : 'text-main-sub'}`}>
              {customInput.length} / {MAX_CUSTOM_CHARS}
            </span>
            {customError && (
              <span className="text-[10px] text-error uppercase tracking-widest">{customError}</span>
            )}
          </div>
          <button
            onClick={handleStartCustom}
            disabled={customInput.trim().length < 10}
            className="mt-4 w-full py-3 bg-main/5 text-main border border-main/20 rounded hover:bg-main/10 transition-all text-xs uppercase tracking-widest disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Start Typing
          </button>
        </div>
      )}

      {/* Language Indicator (Monkeytype style) */}
      {!isFinished && !showResults && (
        <div className="mb-4 flex items-center gap-2 text-main-sub/40 text-[10px] uppercase tracking-widest">
          <span>🌐 english</span>
        </div>
      )}

      {/* Main Stats — Subtle top row */}
      {!isFinished && currentIndex > 0 && !showResults && showTypingArea && (
        <div className="mb-4 flex gap-10 font-mono text-xl animate-fade-in opacity-50">
          <div className="flex flex-col items-center">
            <span className="text-[10px] uppercase tracking-tighter text-main-sub mb-1">wpm</span>
            <span className="text-main">{netWpm}</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[10px] uppercase tracking-tighter text-main-sub mb-1">acc</span>
            <span className="text-main">{accuracy}%</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[10px] uppercase tracking-tighter text-main-sub mb-1">time</span>
            <span className="text-main">{timeLeft}s</span>
          </div>
        </div>
      )}

      {/* Typing Area */}
      {showTypingArea && !showResults && (
        <div className="w-full flex flex-col items-center">
          <TypingArea
            prompt={prompt}
            charStates={charStates}
            currentIndex={currentIndex}
            onKeyDown={handleKeyPress}
            disabled={isFinished}
          />

          {!isFinished && (
            <button
              onClick={handleRestart}
              className="mt-8 group flex items-center gap-2 text-main-sub hover:text-main transition-all"
              title="Restart (Tab)"
            >
              <RotateCcw size={16} className="group-hover:rotate-180 transition-transform duration-500" />
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
      {!showResults && currentIndex === 0 && showTypingArea && (
        <div className="mt-8 text-main-sub text-[10px] uppercase tracking-widest opacity-20">
          press <span className="bg-main-sub/20 px-1 rounded mx-1">tab</span> to quickly restart
        </div>
      )}
    </div>
  );
}

export default Practice;
