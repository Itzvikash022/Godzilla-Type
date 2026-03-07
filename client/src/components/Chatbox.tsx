import { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import type { ChatMessagePayload } from '@godzilla-type/shared';
import { hashColor } from '../lib/playerColors';

interface ChatboxProps {
    messages: ChatMessagePayload[];
    onSendMessage: (text: string) => void;
    currentPlayerId: string;
}

export default function Chatbox({ messages, onSendMessage, currentPlayerId }: ChatboxProps) {
    const [inputValue, setInputValue] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const text = inputValue.trim();
        if (text) {
            onSendMessage(text);
            setInputValue('');
        }
    };

    return (
        <div className="flex flex-col h-full bg-bg-secondary/20 border border-main-sub/10 rounded-lg overflow-hidden animate-fade-in">
            <div className="bg-bg-secondary/40 px-4 py-2 border-b border-main-sub/10">
                <h3 className="text-xs uppercase tracking-widest text-main-sub">Lobby Chat</h3>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
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
                                <div
                                    className={`px-3 py-2 rounded-lg text-sm break-words ${isMe
                                        ? 'bg-main/10 text-main border border-main/20 rounded-tr-sm'
                                        : 'bg-bg-secondary text-text-secondary border border-main-sub/5 rounded-tl-sm'
                                        }`}
                                >
                                    {msg.text}
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
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
        </div>
    );
}
