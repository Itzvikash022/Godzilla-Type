import { useRef, useEffect } from 'react';
import type { MemeMessagePayload } from '@godzilla-type/shared';
import { Volume2, RotateCcw } from 'lucide-react';

interface MemeRoomProps {
    messages: MemeMessagePayload[];
    onReplay: (soundUrl: string) => void;
    currentPlayerId: string;
}

export default function MemeRoom({ messages, onReplay, currentPlayerId }: MemeRoomProps) {
    const feedEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        feedEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    if (messages.length === 0) {
        return (
            <div className="flex-1 flex items-center justify-center overflow-y-auto">
                <p className="text-[10px] uppercase tracking-widest text-main-sub/50">No memes yet. Send one!</p>
            </div>
        );
    }

    return (
        <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-3" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.15) transparent' }}>
            {messages.map((msg) => {
                const isMe = msg.playerId === currentPlayerId;
                const timeStr = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                return (
                    <div
                        key={msg.eventId}
                        className={`flex flex-col gap-1 group ${isMe ? 'items-end' : 'items-start'}`}
                    >
                        {/* Name + time */}
                        <div className={`flex items-baseline gap-2 ${isMe ? 'flex-row-reverse' : ''}`}>
                            {!isMe && (
                                <span className="text-[10px] uppercase font-bold text-main">{msg.playerName}</span>
                            )}
                            <span className="text-[8px] text-main-sub/40">{timeStr}</span>
                        </div>

                        {/* Sticker bubble */}
                        <div className="relative inline-block">
                            <img
                                src={msg.imageUrl}
                                alt={`meme by ${msg.playerName}`}
                                loading="lazy"
                                className={`max-w-[140px] max-h-[140px] rounded-lg border hover:scale-105 transition-transform duration-200 cursor-pointer ${isMe
                                    ? 'border-main/30 rounded-tr-sm'
                                    : 'border-main-sub/10 rounded-tl-sm'
                                    }`}
                            />
                            {/* Replay button — appears on hover */}
                            {msg.soundUrl && (
                                <button
                                    onClick={() => onReplay(msg.soundUrl!)}
                                    title="Replay sound"
                                    className="absolute bottom-1 right-1 p-1 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110"
                                >
                                    <RotateCcw size={12} />
                                </button>
                            )}
                            {msg.soundUrl && (
                                <Volume2 size={10} className="absolute top-1 left-1 text-white/60 pointer-events-none" />
                            )}
                        </div>
                    </div>
                );
            })}
            <div ref={feedEndRef} />
        </div>
    );
}
