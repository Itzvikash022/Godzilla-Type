import { useState, useRef, useEffect, useMemo } from 'react';
import { Send, Smile, ImagePlus, RotateCcw, Volume2 } from 'lucide-react';
import type { ChatMessagePayload, MemeMessagePayload } from '@godzilla-type/shared';
import { hashColor } from '../lib/playerColors';
import MemePicker from './MemePicker';
import { useMemeSound } from '../hooks/useMemeSound';

interface ChatboxProps {
    messages: ChatMessagePayload[];
    memeMessages: MemeMessagePayload[];
    onSendMessage: (text: string) => void;
    onSendMeme: (meme: { memeId: string; imageUrl: string; soundUrl?: string }) => void;
    currentPlayerId: string;
}

export default function Chatbox({ messages, memeMessages, onSendMessage, onSendMeme, currentPlayerId }: ChatboxProps) {
    const [inputValue, setInputValue] = useState('');
    const [showMemePicker, setShowMemePicker] = useState(false);
    const [memeCooldownUntil, setMemeCooldownUntil] = useState<number>(0);
    const [, forceUpdate] = useState(0);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const { playOnce, replay } = useMemeSound();

    // Unified chronological feed
    const combinedFeed = useMemo(() => {
        const feed = [
            ...messages.map(m => ({ ...m, type: 'text' as const })),
            ...memeMessages.map(m => ({ ...m, type: 'meme' as const }))
        ];
        return feed.sort((a, b) => a.timestamp - b.timestamp);
    }, [messages, memeMessages]);

    // Update cooldown display
    useEffect(() => {
        if (memeCooldownUntil <= Date.now()) return;
        const interval = setInterval(() => forceUpdate(n => n + 1), 500);
        return () => clearInterval(interval);
    }, [memeCooldownUntil]);

    // Auto-fire sounds
    useEffect(() => {
        const latestMeme = memeMessages[memeMessages.length - 1];
        if (latestMeme?.soundUrl && !latestMeme.isHistory) {
            playOnce(latestMeme.eventId, latestMeme.soundUrl, false);
        }
    }, [memeMessages, playOnce]);

    // Auto-scroll
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [combinedFeed]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const text = inputValue.trim();
        if (text) {
            onSendMessage(text);
            setInputValue('');
        }
    };

    const handleSendMeme = (meme: { memeId: string; imageUrl: string; soundUrl?: string }) => {
        const now = Date.now();
        if (memeCooldownUntil > now) return;
        onSendMeme(meme);
        setMemeCooldownUntil(now + 3000);
        setShowMemePicker(false);
    };

    return (
        <div className="flex flex-col h-full bg-bg-secondary/20 border border-main-sub/10 rounded-lg overflow-hidden animate-fade-in relative">

            {/* Unified Feed */}
            <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.15) transparent' }}>
                {combinedFeed.length === 0 ? (
                    <div className="h-full flex items-center justify-center">
                        <p className="text-[10px] uppercase tracking-widest text-main-sub/40">Say hi to the lobby...</p>
                    </div>
                ) : (
                    combinedFeed.map((item, i) => {
                        const isMe = item.playerId === currentPlayerId;
                        const timeStr = new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                        return (
                            <div key={i} className={`flex flex-col max-w-[85%] ${isMe ? 'items-end self-end ml-auto' : 'items-start'}`}>
                                <div className={`flex items-baseline gap-2 mb-1 ${isMe ? 'flex-row-reverse' : ''}`}>
                                    {!isMe && (
                                        <span className="text-[10px] uppercase font-bold" style={{ color: hashColor(item.playerName, item.playerId) }}>
                                            {item.playerName}
                                        </span>
                                    )}
                                    <span className="text-[8px] text-main-sub/40">{timeStr}</span>
                                </div>

                                {item.type === 'text' ? (
                                    <div className={`px-3 py-2 rounded-lg text-sm break-words ${isMe
                                        ? 'bg-main/10 text-main border border-main/20 rounded-tr-none'
                                        : 'bg-bg-secondary text-text-secondary border border-main-sub/10 rounded-tl-none shadow-sm'
                                        }`}>
                                        {(item as ChatMessagePayload).text}
                                    </div>
                                ) : (
                                    <div className="relative group/meme">
                                        <img
                                            src={(item as MemeMessagePayload).imageUrl}
                                            alt="meme"
                                            className={`max-w-[160px] max-h-[160px] rounded-lg border hover:scale-[1.02] transition-transform duration-200 cursor-pointer shadow-md ${isMe
                                                ? 'border-main/30 rounded-tr-none'
                                                : 'border-main-sub/10 rounded-tl-none'
                                                }`}
                                        />
                                        {(item as MemeMessagePayload).soundUrl && (
                                            <>
                                                <button
                                                    onClick={() => replay((item as MemeMessagePayload).soundUrl!)}
                                                    className="absolute bottom-1 right-1 p-1 rounded-full bg-black/60 text-white opacity-0 group-hover/meme:opacity-100 transition-opacity hover:scale-110"
                                                >
                                                    <RotateCcw size={10} />
                                                </button>
                                                <Volume2 size={8} className="absolute top-1 left-1 text-white/50" />
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Meme Picker Popover */}
            {showMemePicker && (
                <div className="absolute bottom-[60px] left-2 right-2 h-[350px] z-50 animate-slide-up shadow-2xl">
                    <MemePicker onSendMeme={handleSendMeme} onClose={() => setShowMemePicker(false)} />
                </div>
            )}

            {/* Unified Input Area */}
            <form onSubmit={handleSubmit} className="shrink-0 p-2 border-t border-main-sub/10 bg-bg-secondary/40 flex items-center gap-1">
                <div className="flex items-center gap-0.5 px-1">
                    <button
                        type="button"
                        onClick={() => setShowMemePicker(!showMemePicker)}
                        className={`p-1.5 rounded transition-colors ${showMemePicker ? 'text-main bg-main/10' : 'text-main-sub/50 hover:text-main'}`}
                        title="Stickers & GIFs"
                    >
                        <Smile size={18} />
                    </button>
                </div>

                <div className="flex-1 relative flex items-center">
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder={memeCooldownUntil > Date.now() ? "Meme cooldown..." : "Type a message..."}
                        className="w-full bg-transparent border-none outline-none px-2 py-2 text-sm text-text-primary placeholder:text-main-sub/30 font-mono"
                        maxLength={100}
                    />
                    {memeCooldownUntil > Date.now() && (
                        <div className="absolute right-2 text-[10px] text-main font-mono opacity-60">
                            {Math.ceil((memeCooldownUntil - Date.now()) / 1000)}s
                        </div>
                    )}
                </div>

                <button
                    type="submit"
                    disabled={!inputValue.trim()}
                    className="p-2 text-main bg-main/5 hover:bg-main/10 rounded transition-colors disabled:opacity-20 translate-y-[1px]"
                >
                    <Send size={16} />
                </button>
            </form>
        </div>
    );
}
