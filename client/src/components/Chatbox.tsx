import { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import type { ChatMessagePayload, MemeMessagePayload } from '@godzilla-type/shared';
import { hashColor } from '../lib/playerColors';
import MemeRoom from './MemeRoom';
import MemePicker from './MemePicker';
import { useMemeSound } from '../hooks/useMemeSound';

interface ChatboxProps {
    messages: ChatMessagePayload[];
    memeMessages: MemeMessagePayload[];
    onSendMessage: (text: string) => void;
    onSendMeme: (meme: { memeId: string; imageUrl: string; soundUrl?: string }) => void;
    currentPlayerId: string;
}

type Tab = 'chat' | 'meme';

export default function Chatbox({ messages, memeMessages, onSendMessage, onSendMeme, currentPlayerId }: ChatboxProps) {
    const [activeTab, setActiveTab] = useState<Tab>('chat');
    const [inputValue, setInputValue] = useState('');
    const [showMemePicker, setShowMemePicker] = useState(false);
    const [memeCooldownUntil, setMemeCooldownUntil] = useState<number>(0);
    const [, forceUpdate] = useState(0);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const { playOnce, replay } = useMemeSound();

    // Tick every second to update the cooldown countdown display
    useEffect(() => {
        if (memeCooldownUntil <= Date.now()) return;
        const interval = setInterval(() => forceUpdate(n => n + 1), 500);
        return () => clearInterval(interval);
    }, [memeCooldownUntil]);

    // Auto-fire meme sounds whenever memeMessages updates
    // Because Chatbox stays mounted, dedup state persists perfectly across tabs/pickers
    useEffect(() => {
        const latest = memeMessages[memeMessages.length - 1];
        if (latest?.soundUrl && !latest.isHistory) {
            playOnce(latest.eventId, latest.soundUrl, false);
        }
    }, [memeMessages, playOnce]);

    // Auto-scroll chat on new message
    useEffect(() => {
        if (activeTab === 'chat') {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, activeTab]);

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
        if (memeCooldownUntil > now) return; // Still on cooldown — ignore
        onSendMeme(meme);
        setMemeCooldownUntil(now + 3000); // 3s client-side mirror of server cooldown
        setShowMemePicker(false);
    };

    return (
        <div className="flex flex-col h-full bg-bg-secondary/20 border border-main-sub/10 rounded-lg overflow-hidden animate-fade-in">

            {/* Tab Header */}
            <div className="shrink-0 bg-bg-secondary/40 border-b border-main-sub/10 flex">
                {(['chat', 'meme'] as Tab[]).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => { setActiveTab(tab); setShowMemePicker(false); }}
                        className={`flex-1 py-2 text-[10px] uppercase tracking-widest transition-colors ${activeTab === tab
                            ? 'text-main border-b-2 border-main'
                            : 'text-main-sub/50 hover:text-main-sub'
                            }`}
                    >
                        {tab === 'chat' ? 'Chat' : '🎭 Meme Room'}
                    </button>
                ))}
            </div>

            {activeTab === 'chat' ? (
                <>
                    {/* Chat Messages */}
                    <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.15) transparent' }}>
                        {messages.length === 0 ? (
                            <div className="h-full flex items-center justify-center">
                                <p className="text-[10px] uppercase tracking-widest text-main-sub/50">No messages yet</p>
                            </div>
                        ) : (
                            messages.map((msg, i) => {
                                const isMe = msg.playerId === currentPlayerId;
                                const timeStr = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                return (
                                    <div key={i} className={`flex flex-col max-w-[90%] ${isMe ? 'items-end self-end ml-auto' : 'items-start'}`}>
                                        <div className="flex items-baseline gap-2 mb-1">
                                            {!isMe && (
                                                <span className="text-[10px] uppercase font-bold" style={{ color: hashColor(msg.playerName, msg.playerId) }}>
                                                    {msg.playerName}
                                                </span>
                                            )}
                                            <span className="text-[8px] text-main-sub/50">{timeStr}</span>
                                        </div>
                                        <div className={`px-3 py-2 rounded-lg text-sm break-words ${isMe
                                            ? 'bg-main/10 text-main border border-main/20 rounded-tr-sm'
                                            : 'bg-bg-secondary text-text-secondary border border-main-sub/5 rounded-tl-sm'
                                            }`}>
                                            {msg.text}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                    {/* Chat Input */}
                    <form onSubmit={handleSubmit} className="p-2 border-t border-main-sub/10 bg-bg-secondary/40 flex gap-2">
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder="Type a message..."
                            className="flex-1 bg-transparent border-none outline-none px-2 text-sm text-text-primary placeholder:text-main-sub/40 font-mono"
                            maxLength={100}
                        />
                        <button
                            type="submit"
                            disabled={!inputValue.trim()}
                            className="p-2 text-main bg-main/5 hover:bg-main/10 rounded transition-colors disabled:opacity-30 disabled:hover:bg-main/5"
                        >
                            <Send size={14} />
                        </button>
                    </form>
                </>
            ) : (
                <>
                    {/* Meme Feed */}
                    {showMemePicker ? (
                        <MemePicker onSendMeme={handleSendMeme} />
                    ) : (
                        <MemeRoom messages={memeMessages} onReplay={replay} currentPlayerId={currentPlayerId} />
                    )}
                    {/* Meme Room Footer */}
                    <div className="shrink-0 border-t border-main-sub/10 p-2 bg-bg-secondary/40 flex justify-center">
                        {(() => {
                            const cooldownLeft = Math.ceil((memeCooldownUntil - Date.now()) / 1000);
                            const onCooldown = cooldownLeft > 0;
                            return (
                                <button
                                    onClick={() => setShowMemePicker((p) => !p)}
                                    disabled={onCooldown}
                                    className="w-full py-1.5 text-[10px] uppercase tracking-widest border border-main/20 bg-main/5 rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-main hover:bg-main/10"
                                >
                                    {onCooldown
                                        ? `⏳ Wait ${cooldownLeft}s...`
                                        : showMemePicker ? '← Back to Feed' : '🎭 Send a Meme'
                                    }
                                </button>
                            );
                        })()}
                    </div>
                </>
            )}
        </div>
    );
}
