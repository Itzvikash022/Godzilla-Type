import { useState } from 'react';
import { Sparkles, X, AlertCircle, Loader2, ChevronDown, Lock } from 'lucide-react';
import { generateTypingContent, GeminiRequestOptions } from '../services/geminiService';
import memesData from '../data/memes.json';

interface AIContentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onGenerated: (text: string, isMeme: boolean) => void;
}

export default function AIContentModal({ isOpen, onClose, onGenerated }: AIContentModalProps) {
    const [theme, setTheme] = useState('General random topic');
    const [wordCount, setWordCount] = useState(200);
    const [difficulty, setDifficulty] = useState<GeminiRequestOptions['difficulty']>('Medium');
    const [punctuation, setPunctuation] = useState(false);
    const [isDifficultyOpen, setIsDifficultyOpen] = useState(false);

    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [pin, setPin] = useState('');
    const [isPinCorrect, setIsPinCorrect] = useState(false);
    const [pinError, setPinError] = useState(false);

    if (!isOpen) return null;

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsGenerating(true);
        setError(null);

        try {
            let text = '';

            if (difficulty === 'Meme') {
                const randomIndex = Math.floor(Math.random() * memesData.length);
                text = memesData[randomIndex];
            } else {
                text = await generateTypingContent({
                    theme: theme.trim() || 'General random topic',
                    wordCount,
                    difficulty,
                    punctuation
                });
            }

            onGenerated(text, difficulty === 'Meme');
            onClose();
        } catch (err: any) {
            setError(err?.message || 'Failed to generate content. Check your API key or try again.');
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in text-text-primary">
            <div className="bg-bg-primary border border-main/20 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden shadow-main/5 relative">

                {/* Loading Overlay */}
                {isGenerating && (
                    <div className="absolute inset-0 z-10 bg-bg-primary/80 backdrop-blur-sm flex flex-col items-center justify-center">
                        <Loader2 className="animate-spin text-main mb-4" size={32} />
                        <p className="text-main font-mono text-sm uppercase tracking-widest font-bold animate-pulse">Generating text...</p>
                    </div>
                )}

                <div className="flex items-center justify-between p-5 border-b border-main/10 bg-bg-secondary/30">
                    <div className="flex items-center gap-2 text-main">
                        <Sparkles size={18} />
                        <h2 className="font-bold text-sm uppercase tracking-widest">AI Generator</h2>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={isGenerating}
                        className="text-main-sub hover:text-error transition-colors p-1"
                    >
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleGenerate} className="p-6 space-y-6">

                    {/* Error Banner */}
                    {error && (
                        <div className="bg-error/10 border border-error/20 rounded-lg p-3 flex items-start gap-3 text-error">
                            <AlertCircle size={16} className="shrink-0 mt-0.5" />
                            <p className="text-xs uppercase tracking-wider leading-relaxed">{error}</p>
                        </div>
                    )}

                    {/* Theme */}
                    <div className="space-y-2">
                        <label className="text-[10px] uppercase font-bold tracking-widest text-main-sub flex justify-between">
                            <span>Theme / Topic</span>
                        </label>
                        <input
                            type="text"
                            value={theme}
                            onChange={(e) => setTheme(e.target.value)}
                            disabled={isGenerating || difficulty === 'Meme'}
                            placeholder={difficulty === 'Meme' ? 'Locked in Meme Mode' : 'e.g. Space exploration, History of Rome...'}
                            className={`w-full bg-bg-secondary/50 border border-main-sub/20 rounded-lg px-4 py-2.5 text-sm font-mono focus:border-main/50 outline-none transition-colors placeholder:text-main-sub/30 ${difficulty === 'Meme' ? 'opacity-50 cursor-not-allowed' : ''}`}
                        />
                    </div>

                    {/* Row: Length & Difficulty */}
                    <div className="grid grid-cols-2 gap-4">
                        {/* Word Count */}
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase font-bold tracking-widest text-main-sub">
                                Word Count (approx)
                            </label>
                            <input
                                type="number"
                                min={10}
                                max={500}
                                value={wordCount}
                                onChange={(e) => setWordCount(parseInt(e.target.value) || 200)}
                                disabled={isGenerating || difficulty === 'Meme'}
                                className={`w-full bg-bg-secondary/50 border border-main-sub/20 rounded-lg px-4 py-2.5 text-sm font-mono focus:border-main/50 outline-none transition-colors no-spinner ${difficulty === 'Meme' ? 'opacity-50 cursor-not-allowed' : ''}`}
                            />
                            {difficulty !== 'Meme' && (
                                <p className="text-[9px] uppercase tracking-widest text-main-sub mt-1">
                                    {wordCount > 200 ? 'Limit: 3 requests / min' : 'Limit: 5 requests / min'}
                                </p>
                            )}
                        </div>

                        {/* Difficulty */}
                        <div className="space-y-2 relative">
                            <label className="text-[10px] uppercase font-bold tracking-widest text-main-sub">
                                Difficulty
                            </label>

                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={() => !isGenerating && setIsDifficultyOpen(!isDifficultyOpen)}
                                    disabled={isGenerating}
                                    className={`w-full flex items-center justify-between bg-bg-secondary/50 border ${isDifficultyOpen ? 'border-main/50' : 'border-main-sub/20'} rounded-lg px-4 py-2.5 text-sm font-mono transition-colors cursor-pointer text-text-primary text-left`}
                                >
                                    <span>
                                        {difficulty === 'Easy' && 'Easy'}
                                        {difficulty === 'Medium' && 'Normal'}
                                        {difficulty === 'Hard' && 'Hard'}
                                        {difficulty === 'Meme' && 'Yehh boiii'}
                                    </span>
                                    <ChevronDown size={14} className={`text-main-sub transition-transform ${isDifficultyOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {isDifficultyOpen && (
                                    <div className="absolute top-full left-0 right-0 mt-2 bg-[#2C2E31] border border-main-sub/20 rounded-lg shadow-xl z-50 overflow-hidden animate-fade-in flex flex-col p-1">
                                        {(['Easy', 'Medium', 'Hard', 'Meme'] as const).map((opt) => (
                                            <button
                                                key={opt}
                                                type="button"
                                                onClick={() => {
                                                    setDifficulty(opt);
                                                    setIsDifficultyOpen(false);
                                                    if (opt !== 'Meme') {
                                                        setIsPinCorrect(false);
                                                        setPin('');
                                                    }
                                                }}
                                                className={`w-full text-left px-3 py-2.5 text-sm font-mono transition-colors hover:bg-main/10 hover:text-main rounded-md
                                                ${difficulty === opt ? 'bg-main/10 text-main font-bold' : 'text-text-primary'}`}
                                            >
                                                {opt === 'Easy' && 'Easy'}
                                                {opt === 'Medium' && 'Normal'}
                                                {opt === 'Hard' && 'Hard'}
                                                {opt === 'Meme' && 'Yehh boiii'}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* PIN Entry for Meme Mode */}
                    {difficulty === 'Meme' && !isPinCorrect && (
                        <div className="bg-main/5 border border-main/20 rounded-xl p-5 space-y-4 animate-fade-in">
                            <div className="flex items-center gap-3 text-main">
                                <Lock size={16} />
                                <h3 className="text-[10px] uppercase font-bold tracking-widest">Authorized Access Only</h3>
                            </div>
                            <div className="space-y-2">
                                <input
                                    type="password"
                                    maxLength={5}
                                    placeholder="Enter 5-digit PIN"
                                    value={pin}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setPin(val);
                                        setPinError(false);
                                        const secretPin = import.meta.env.VITE_MEME_PIN || '69420';
                                        if (val === secretPin) {
                                            setIsPinCorrect(true);
                                        }
                                    }}
                                    className={`w-full bg-bg-primary border ${pinError ? 'border-error' : 'border-main/30'} rounded-lg px-4 py-3 text-center text-lg tracking-[0.5em] font-mono focus:border-main outline-none transition-all placeholder:text-[10px] placeholder:tracking-normal`}
                                />
                                {pin.length === 5 && pin !== (import.meta.env.VITE_MEME_PIN || '69420') && (
                                    <p className="text-[10px] text-error uppercase text-center font-bold tracking-tighter">Incorrect Access Code</p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Punctuation */}
                    <div className={`pt-2 transition-opacity ${difficulty === 'Meme' ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
                        <label className="flex items-center gap-3 cursor-pointer group">
                            <div className="relative">
                                <input
                                    type="checkbox"
                                    checked={punctuation}
                                    onChange={(e) => setPunctuation(e.target.checked)}
                                    disabled={isGenerating}
                                    className="sr-only"
                                />
                                <div className={`w-10 h-6 bg-bg-secondary border border-main-sub/20 rounded-full transition-colors ${punctuation ? 'bg-main/20 border-main/50' : ''}`}></div>
                                <div className={`absolute left-1 top-1 w-4 h-4 rounded-full transition-transform ${punctuation ? 'translate-x-4 bg-main' : 'bg-main-sub'}`}></div>
                            </div>
                            <div>
                                <span className="text-sm font-medium text-text-primary block">Allow Punctuation</span>
                                <span className="text-[10px] text-main-sub uppercase tracking-wider block">Include commas, quotes, periods</span>
                            </div>
                        </label>
                    </div>

                    <div className="pt-4 border-t border-main-sub/10">
                        <button
                            type="submit"
                            disabled={isGenerating || (difficulty !== 'Meme' && !theme.trim()) || (difficulty === 'Meme' && !isPinCorrect)}
                            className="w-full flex items-center justify-center gap-2 py-3 bg-main/10 text-main border border-main/30 rounded-lg hover:bg-main hover:text-bg-primary transition-all uppercase tracking-[0.2em] font-bold text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Sparkles size={14} />
                            Generate Text
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
