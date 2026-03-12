// ===================================
// GODZILLA-TYPE — Practice.tsx
// ===================================

import { useState, useEffect, useCallback, useMemo } from 'react';
import { RotateCcw, Clock, History, Sparkles } from 'lucide-react';
import { useRef } from 'react';
import { useTypingEngine } from '../hooks/useTypingEngine';
import TypingArea from '../components/TypingArea';
import ModeSelector from '../components/ModeSelector';
import { saveResult } from '../lib/db';
import { triggerCloudSync } from '../components/SyncManager';
import AIContentButton from '../components/AIContentButton';
import AIContentModal from '../components/AIContentModal';
import { type PromptMode } from '../typing/promptGenerator';

const MAX_CUSTOM_CHARS = 5000;
const STORAGE_CUSTOM_TEXT = 'godzilla-custom-text';
const STORAGE_CUSTOM_HISTORY = 'godzilla-custom-history';
const STORAGE_PRACTICE_DURATION = 'godzilla-practice-duration';
const STORAGE_PRACTICE_MODE = 'godzilla-practice-mode';

function sanitizeCustomText(text: string): string {
  return text
    .trim()
    .replace(/\s+/g, ' ')
    // Keep printable ASCII and common punctuation
    .replace(/[^\x20-\x7E]/g, '');
}

function Practice() {
  const [duration, setDuration] = useState(() => {
    const saved = localStorage.getItem(STORAGE_PRACTICE_DURATION);
    return saved ? parseInt(saved, 10) : 30;
  });
  const [mode, setMode] = useState<PromptMode>(() => {
    const saved = localStorage.getItem(STORAGE_PRACTICE_MODE) as PromptMode;
    return saved || 'words';
  });
  const [showResults, setShowResults] = useState(false);

  // Custom mode state
  const [customInput, setCustomInput] = useState('');
  const [customHistory, setCustomHistory] = useState<string[]>([]);
  const [customError, setCustomError] = useState('');
  const [customReady, setCustomReady] = useState(false);
  const [activeCustomText, setActiveCustomText] = useState('');

  // AI Modal state
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [isAIGenerated, setIsAIGenerated] = useState(false);
  const [isMemeSource, setIsMemeSource] = useState(false);
  const [isSavingLocal, setIsSavingLocal] = useState(false);

  const restartBtnRef = useRef<HTMLButtonElement>(null);
  const resultsRestartBtnRef = useRef<HTMLButtonElement>(null);
  const showResultsRef = useRef(showResults);

  // Keep ref in sync for the global key listener
  useEffect(() => {
    showResultsRef.current = showResults;
  }, [showResults]);

  // Load custom text and history on mount
  useEffect(() => {
    const savedText = localStorage.getItem(STORAGE_CUSTOM_TEXT);
    if (savedText) setCustomInput(savedText);

    const savedHistory = localStorage.getItem(STORAGE_CUSTOM_HISTORY);
    if (savedHistory) {
      try {
        setCustomHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error('Failed to parse custom history', e);
      }
    }

    // Global Tab to Focus Restart (not immediate reset)
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        if (showResultsRef.current) {
          resultsRestartBtnRef.current?.focus();
        } else {
          restartBtnRef.current?.focus();
        }
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // Persist settings
  useEffect(() => {
    localStorage.setItem(STORAGE_PRACTICE_DURATION, duration.toString());
  }, [duration]);

  useEffect(() => {
    localStorage.setItem(STORAGE_PRACTICE_MODE, mode);
  }, [mode]);

  const handleCustomInputChange = (text: string, fromAI = false, isMeme = false) => {
    const val = text.slice(0, MAX_CUSTOM_CHARS);
    setCustomInput(val);
    setCustomError('');
    setIsAIGenerated(fromAI);
    setIsMemeSource(fromAI ? isMeme : false); // Reset isMemeSource if not from AI
    localStorage.setItem(STORAGE_CUSTOM_TEXT, val);
  };

  const isCustomMode = mode === 'custom';
  const showTypingArea = !isCustomMode || customReady;

  const providedWords = useMemo(() =>
    customReady ? activeCustomText.split(' ') : undefined
    , [customReady, activeCustomText]);

  const providedPrompt = useMemo(() =>
    customReady ? activeCustomText : undefined
    , [customReady, activeCustomText]);

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
    extraChars,
    isTyping,
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

  const handleRestart = useCallback(() => {
    setShowResults(false);
    setCustomReady(false);
    setActiveCustomText('');
    resetTest();
  }, [resetTest]);

  const handleModeChange = (m: PromptMode) => {
    setMode(m);
    setCustomReady(false);
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

    // Update History (Dedupe, max 5)
    setCustomHistory(prev => {
      const filtered = prev.filter(t => t !== clean);
      const nextHistory = [clean, ...filtered].slice(0, 5);
      localStorage.setItem(STORAGE_CUSTOM_HISTORY, JSON.stringify(nextHistory));
      return nextHistory;
    });
  };

  const handleSaveCustomLocal = () => {
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

    // Save to history exactly like Start Custom, but without launching the race
    setCustomHistory(prev => {
      const filtered = prev.filter(t => t !== clean);
      const nextHistory = [clean, ...filtered].slice(0, 5);
      localStorage.setItem(STORAGE_CUSTOM_HISTORY, JSON.stringify(nextHistory));
      return nextHistory;
    });

    // Provide visual feedback
    setIsSavingLocal(true);
    setTimeout(() => setIsSavingLocal(false), 2000);
  };

  const handleAIGenerated = (text: string, isMeme: boolean) => {
    handleCustomInputChange(text, true, isMeme);
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
            onSelectDuration={(d) => setDuration(d)}
          />
        </div>
      )}

      {/* Custom Text Input */}
      {isCustomMode && !customReady && !showResults && (
        <div className="relative w-full max-w-[1500px] mx-auto py-8 select-none mb-8">

          <div className="flex items-end justify-between mb-3">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-main-sub">
                Paste your custom text below (max {MAX_CUSTOM_CHARS} chars)
              </p>
              {isAIGenerated && (
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-main/10 border border-main/30 text-main animate-fade-in mb-3 w-fit">
                  <Sparkles size={12} className="shrink-0" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">
                    {isMemeSource ? 'Generated by Boiiii' : 'Generated by AI'}
                  </span>
                </div>
              )}
            </div>
            <AIContentButton onClick={() => setIsAIModalOpen(true)} />
          </div>

          <textarea
            className="w-full h-40 bg-bg-secondary/40 border border-main-sub/10 rounded-xl p-4 text-text-primary font-mono text-sm resize-none outline-none focus:border-main/30 transition-colors no-scrollbar"
            placeholder="Paste any English text here..."
            value={customInput}
            onChange={(e) => handleCustomInputChange(e.target.value)}
          />
          <div className="flex items-center justify-between mt-2">
            <span className={`text-[10px] font-mono ${customInput.length > MAX_CUSTOM_CHARS * 0.9 ? 'text-error' : 'text-main-sub'}`}>
              {customInput.length} / {MAX_CUSTOM_CHARS}
            </span>
            {customError && (
              <span className="text-[10px] text-error uppercase tracking-widest">{customError}</span>
            )}
          </div>
          <div className="mt-4 flex gap-4 w-full">
            <button
              onClick={handleSaveCustomLocal}
              disabled={customInput.trim().length < 10 || isSavingLocal}
              className={`w-1/3 py-3 border rounded text-xs uppercase tracking-widest transition-all disabled:opacity-30 disabled:cursor-not-allowed
                ${isSavingLocal
                  ? 'bg-main text-bg-primary border-main'
                  : 'bg-transparent text-main-sub border-main-sub/20 hover:border-main/50 hover:text-main'}`}
            >
              {isSavingLocal ? 'Saved!' : 'Save for Later'}
            </button>
            <button
              onClick={handleStartCustom}
              disabled={customInput.trim().length < 10}
              className="flex-1 py-3 bg-main/5 text-main border border-main/20 rounded hover:bg-main/10 transition-all text-xs uppercase tracking-widest disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Start Typing
            </button>
          </div>

          {/* History Section */}
          {customHistory.length > 0 && (
            <div className="mt-8">
              <div className="flex items-center gap-2 text-main-sub mb-3">
                <History size={14} />
                <span className="text-[10px] uppercase tracking-widest">Recent Custom Texts</span>
              </div>
              <div className="flex flex-col gap-2">
                {customHistory.map((historyText, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleCustomInputChange(historyText)}
                    className="w-full text-left px-4 py-3 rounded-lg bg-bg-secondary/20 border border-main-sub/5 hover:border-main/20 hover:bg-main/5 group transition-all flex items-center gap-3"
                  >
                    <Clock size={12} className="text-main-sub group-hover:text-main opacity-50 shrink-0" />
                    <span className="font-mono text-xs text-text-secondary group-hover:text-text-primary truncate">
                      {historyText.length > 100 ? `${historyText.slice(0, 100)}...` : historyText}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Language Indicator (Monkeytype style) */}
      {!isFinished && !showResults && (
        <div className="mb-4 flex items-center gap-2 text-main-sub/40 text-[10px] uppercase tracking-widest">
          <span>🌐 english</span>
        </div>
      )}

      {/* Main Stats — Subtle top row */}
      {!isFinished && !showResults && showTypingArea && (
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
            extraChars={extraChars}
            isTyping={isTyping}
            disabled={isFinished}
          />

          {!isFinished && (
            <button
              ref={restartBtnRef}
              onClick={handleRestart}
              className="mt-8 group flex items-center gap-2 text-main-sub hover:text-main focus:text-main focus:bg-main/10 focus:outline-none focus:ring-1 focus:ring-main/50 px-4 py-2 rounded transition-all"
              title="Restart (Tab)"
            >
              <RotateCcw size={16} className="group-hover:rotate-180 group-focus:rotate-180 transition-transform duration-500" />
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
            ref={resultsRestartBtnRef}
            onClick={handleRestart}
            className="w-full py-4 border border-main/20 text-main-sub hover:text-main hover:bg-main/5 focus:text-main focus:bg-main/10 focus:outline-none focus:ring-1 focus:ring-main/50 transition-all text-xs uppercase tracking-[0.3em] rounded"
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

      {/* Modals */}
      <AIContentModal
        isOpen={isAIModalOpen}
        onClose={() => setIsAIModalOpen(false)}
        onGenerated={handleAIGenerated}
      />
    </div>
  );
}

export default Practice;
