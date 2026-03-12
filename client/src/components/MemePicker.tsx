import { useState, useRef, useEffect } from 'react';
import { Upload, Volume2, Loader2, AlertTriangle, Search, Library, Film, Sticker, Image as ImageIcon } from 'lucide-react';
import { useMemeLibrary, uploadMeme } from '../services/memeService';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { searchKlipy, getCachedKlipyTrending, KlipyMediaType, KlipyItem, getKlipyPreviewUrl, getKlipyMainUrl } from '../services/klipyService';

interface MemePickerProps {
    onSendMeme: (meme: { memeId: string; imageUrl: string; soundUrl?: string }) => void;
    onClose?: () => void;
}

type Mode = 'library' | 'klipy' | 'upload';

export default function MemePicker({ onSendMeme, onClose }: MemePickerProps) {
    const { memes, isLoading: isLibraryLoading } = useMemeLibrary();
    const [mode, setMode] = useState<Mode>('library');
    const [klipyType, setKlipyType] = useState<KlipyMediaType>('gifs');
    const [searchQuery, setSearchQuery] = useState('');
    const [klipyResults, setKlipyResults] = useState<KlipyItem[]>([]);
    const [isKlipyLoading, setIsKlipyLoading] = useState(false);

    const [uploadError, setUploadError] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [previewImage, setPreviewImage] = useState<File | null>(null);
    const [previewSound, setPreviewSound] = useState<File | null>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);
    const soundInputRef = useRef<HTMLInputElement>(null);

    const saveMeme = useMutation(api.memeMutations.saveMemeMetadata);

    // Klipy search/trending effect
    useEffect(() => {
        if (mode !== 'klipy') return;

        const isTrending = !searchQuery.trim();
        if (isTrending) {
            const cached = getCachedKlipyTrending(klipyType);
            if (cached) {
                setKlipyResults(cached);
                setIsKlipyLoading(false);
                return;
            }
        }

        const timer = setTimeout(async () => {
            setIsKlipyLoading(true);
            try {
                const results = await searchKlipy(searchQuery, klipyType);
                setKlipyResults(results);
            } finally {
                setIsKlipyLoading(false);
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery, mode, klipyType]);

    const handleSendMeme = (meme: { memeId: string; imageUrl: string; soundUrl?: string }) => {
        onSendMeme(meme);
        onClose?.();
    };

    const handleUpload = async () => {
        if (!previewImage) return;
        try {
            setIsUploading(true);
            setUploadError('');
            const result = await uploadMeme(previewImage, previewSound);
            await saveMeme({
                memeId: result.memeId,
                imageUrl: result.imageUrl,
                soundUrl: result.soundUrl,
                type: 'user',
            });
            setPreviewImage(null);
            setPreviewSound(null);
            setMode('library');
        } catch (err: any) {
            setUploadError(err?.message || 'Upload failed.');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-bg-secondary border border-main-sub/20 rounded-lg overflow-hidden shadow-2xl animate-fade-in text-text-primary">
            {/* Header Tabs */}
            <div className="shrink-0 flex bg-bg-primary/40 border-b border-main-sub/10">
                <button
                    onClick={() => setMode('library')}
                    className={`flex-1 py-2 flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest transition-colors ${mode === 'library' ? 'text-main bg-main/5 border-b border-main' : 'text-main-sub/50 hover:text-main-sub'}`}
                >
                    <Library size={12} /> Library
                </button>
                <button
                    onClick={() => setMode('klipy')}
                    className={`flex-1 py-2 flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest transition-colors ${mode === 'klipy' ? 'text-main bg-main/5 border-b border-main' : 'text-main-sub/50 hover:text-main-sub'}`}
                >
                    <Film size={12} /> Klipy
                </button>
                <button
                    onClick={() => setMode('upload')}
                    className={`flex-1 py-2 flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest transition-colors ${mode === 'upload' ? 'text-main bg-main/5 border-b border-main' : 'text-main-sub/50 hover:text-main-sub'}`}
                >
                    <Upload size={12} /> Upload
                </button>
            </div>

            {/* Sub-tabs for Klipy Types */}
            {mode === 'klipy' && (
                <div className="shrink-0 flex bg-bg-secondary/40 border-b border-main-sub/5 p-1 gap-1">
                    {(['gifs', 'stickers', 'static-memes', 'clips'] as KlipyMediaType[]).map((type) => (
                        <button
                            key={type}
                            onClick={() => setKlipyType(type)}
                            className={`flex-1 py-1 text-[8px] uppercase tracking-tighter rounded transition-all ${klipyType === type ? 'bg-main/10 text-main font-bold' : 'text-main-sub/40 hover:text-main-sub/60'}`}
                        >
                            {type.replace('static-', '').replace('s', '')}
                        </button>
                    ))}
                </div>
            )}

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-2" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.1) transparent' }}>

                {mode === 'library' && (
                    <div className="grid grid-cols-3 gap-1.5">
                        {isLibraryLoading ? (
                            <div className="col-span-3 py-10 flex justify-center"><Loader2 size={16} className="animate-spin text-main-sub/50" /></div>
                        ) : memes.length === 0 ? (
                            <div className="col-span-3 py-10 text-center text-[10px] uppercase tracking-widest text-main-sub/30">Empty library</div>
                        ) : (
                            memes.map((m) => (
                                <button
                                    key={m.memeId}
                                    onClick={() => handleSendMeme(m)}
                                    className="relative aspect-square rounded bg-bg-primary/50 border border-main-sub/10 hover:border-main/40 hover:bg-main/5 transition-all p-1"
                                >
                                    <img src={m.imageUrl} className="w-full h-full object-contain" alt="sticker" />
                                    {m.soundUrl && <Volume2 size={8} className="absolute bottom-0.5 right-0.5 text-main/60" />}
                                </button>
                            ))
                        )}
                    </div>
                )}

                {mode === 'klipy' && (
                    <div className="space-y-2">
                        <div className="relative mb-2">
                            <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-main-sub/50" />
                            <input
                                autoFocus
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder={`Search Klipy ${klipyType.replace('static-', '')}...`}
                                className="w-full bg-bg-primary/50 border border-main-sub/10 rounded px-8 py-1.5 text-[11px] outline-none focus:border-main/40 transition-colors"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-1.5">
                            {isKlipyLoading ? (
                                <div className="col-span-2 py-8 flex justify-center"><Loader2 size={16} className="animate-spin text-main-sub/50" /></div>
                            ) : klipyResults.length === 0 ? (
                                <div className="col-span-2 py-8 text-center text-[10px] uppercase tracking-widest text-main-sub/30"> {searchQuery ? 'No Results' : 'Type to search...'} </div>
                            ) : (
                                klipyResults.map((t) => (
                                    <button
                                        key={t.id}
                                        onClick={() => handleSendMeme({ memeId: `klipy-${t.id}`, imageUrl: getKlipyMainUrl(t) })}
                                        className="relative aspect-video rounded bg-bg-primary/50 border border-main-sub/10 hover:border-main/40 overflow-hidden group"
                                    >
                                        <img src={getKlipyPreviewUrl(t)} className="w-full h-full object-cover" alt={t.title} />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            {klipyType === 'clips' && <Film size={16} className="text-main" />}
                                            {klipyType === 'stickers' && <Sticker size={16} className="text-main" />}
                                            {klipyType === 'static-memes' && <ImageIcon size={16} className="text-main" />}
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {mode === 'upload' && (
                    <div className="p-2 space-y-4 animate-slide-up">
                        <div className="bg-orange-500/5 border border-orange-500/10 rounded p-2 flex gap-2 items-start text-orange-400">
                            <AlertTriangle size={12} className="shrink-0 mt-0.5" />
                            <p className="text-[9px] leading-relaxed uppercase tracking-tighter">Public and permanent. No personal info.</p>
                        </div>

                        <div className="space-y-2">
                            <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => setPreviewImage(e.target.files?.[0] ?? null)} />
                            <input ref={soundInputRef} type="file" accept="audio/*" className="hidden" onChange={(e) => setPreviewSound(e.target.files?.[0] ?? null)} />

                            <button onClick={() => imageInputRef.current?.click()} className="w-full text-left p-2 border border-main-sub/10 rounded hover:bg-main/5 text-[10px] truncate text-main-sub">
                                {previewImage ? `🖼️ ${previewImage.name}` : '1. Choose Image (required)'}
                            </button>
                            <button onClick={() => soundInputRef.current?.click()} className="w-full text-left p-2 border border-main-sub/10 rounded hover:bg-main/5 text-[10px] truncate text-main-sub">
                                {previewSound ? `🔊 ${previewSound.name}` : '2. Add Sound (optional)'}
                            </button>
                        </div>

                        {uploadError && <p className="text-[9px] text-red-400 text-center uppercase tracking-widest">{uploadError}</p>}

                        <button
                            onClick={handleUpload}
                            disabled={!previewImage || isUploading}
                            className="w-full py-2 bg-main text-black font-bold text-[10px] uppercase tracking-widest rounded hover:brightness-110 disabled:opacity-40"
                        >
                            {isUploading ? <Loader2 size={12} className="animate-spin mx-auto" /> : 'Start Upload'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
