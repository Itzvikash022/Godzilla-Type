import { useState, useRef } from 'react';
import { Upload, X, Volume2, Loader2, AlertTriangle } from 'lucide-react';
import { useMemeLibrary, uploadMeme } from '../services/memeService';
import type { MemeItem } from '../services/memeService';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';

interface MemePickerProps {
    onSendMeme: (meme: { memeId: string; imageUrl: string; soundUrl?: string }) => void;
}

export default function MemePicker({ onSendMeme }: MemePickerProps) {
    const { memes, isLoading } = useMemeLibrary();
    const [uploadError, setUploadError] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [previewImage, setPreviewImage] = useState<File | null>(null);
    const [previewSound, setPreviewSound] = useState<File | null>(null);
    const [showUploadPanel, setShowUploadPanel] = useState(false);
    const imageInputRef = useRef<HTMLInputElement>(null);
    const soundInputRef = useRef<HTMLInputElement>(null);

    const saveMeme = useMutation(api.memeMutations.saveMemeMetadata);

    const handleSend = (meme: MemeItem) => {
        onSendMeme({ memeId: meme.memeId, imageUrl: meme.imageUrl, soundUrl: meme.soundUrl });
    };

    const handleUpload = async () => {
        if (!previewImage) {
            setUploadError('An image is required.');
            return;
        }
        try {
            setIsUploading(true);
            setUploadError('');

            // Upload to Cloudinary via backend anonymously
            const result = await uploadMeme(previewImage, previewSound);

            // Save metadata to Convex instantly
            await saveMeme({
                memeId: result.memeId,
                imageUrl: result.imageUrl,
                soundUrl: result.soundUrl,
                type: 'user',
            });

            setPreviewImage(null);
            setPreviewSound(null);
            setShowUploadPanel(false);
        } catch (err: any) {
            setUploadError(err?.message || 'Upload failed.');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="flex-1 min-h-0 flex flex-col bg-bg-secondary/10">
            {/* Sticker Grid */}
            <div className="flex-1 min-h-0 overflow-y-auto p-3" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.1) transparent' }}>
                <p className="text-[9px] uppercase tracking-widest text-main-sub/50 mb-3 flex items-center justify-between">
                    <span>Library</span>
                    {isLoading && <Loader2 size={10} className="animate-spin" />}
                </p>

                {memes.length === 0 && !isLoading ? (
                    <div className="py-8 text-center text-[10px] uppercase text-main-sub/40">
                        Library is empty
                    </div>
                ) : (
                    <div className="grid grid-cols-3 gap-2 pb-4">
                        {memes.map((meme) => (
                            <button
                                key={meme.memeId}
                                onClick={() => handleSend(meme)}
                                className="relative flex flex-col items-center justify-center rounded-lg border border-main-sub/10 p-2 hover:border-main/30 hover:bg-main/5 transition-all group aspect-square"
                            >
                                <img
                                    src={meme.imageUrl}
                                    alt="meme"
                                    loading="lazy"
                                    className="max-w-full max-h-full object-contain rounded"
                                />
                                {meme.soundUrl && (
                                    <Volume2 size={10} className="absolute bottom-1 right-1 text-main/60 opacity-50 group-hover:opacity-100 transition-opacity" />
                                )}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Upload Panel */}
            {showUploadPanel ? (
                <div className="shrink-0 border-t border-main-sub/10 p-3 bg-bg-secondary/60 flex flex-col gap-3 animate-fade-in shadow-[0_-4px_24px_rgba(0,0,0,0.2)]">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-main flex items-center gap-1.5">
                            <Upload size={12} />
                            Upload Meme
                        </span>
                        <button onClick={() => setShowUploadPanel(false)} className="text-main-sub/50 hover:text-main">
                            <X size={14} />
                        </button>
                    </div>

                    {/* Security Warning */}
                    <div className="bg-orange-500/10 border border-orange-500/20 rounded-md p-2 flex gap-2 items-start text-orange-400">
                        <AlertTriangle size={12} className="shrink-0 mt-0.5" />
                        <p className="text-[9px] uppercase leading-relaxed tracking-wider">
                            Uploads are public and permanent. Files cannot be edited or deleted later. Do not upload personal information.
                        </p>
                    </div>

                    <input
                        ref={imageInputRef}
                        type="file"
                        accept="image/webp,image/gif,image/png,image/jpeg"
                        className="hidden"
                        onChange={(e) => setPreviewImage(e.target.files?.[0] ?? null)}
                    />
                    <input
                        ref={soundInputRef}
                        type="file"
                        accept="audio/mpeg,audio/ogg"
                        className="hidden"
                        onChange={(e) => setPreviewSound(e.target.files?.[0] ?? null)}
                    />

                    <div className="flex flex-col gap-1.5">
                        <button
                            onClick={() => imageInputRef.current?.click()}
                            className="text-[10px] py-1.5 px-3 border border-main-sub/20 rounded hover:border-main/40 text-main-sub hover:text-main transition-colors text-left truncate"
                        >
                            {previewImage ? `🖼️ ${previewImage.name}` : '1. Choose Image (req, max 2MB)'}
                        </button>
                        <button
                            onClick={() => soundInputRef.current?.click()}
                            className="text-[10px] py-1.5 px-3 border border-main-sub/20 rounded hover:border-main/40 text-main-sub hover:text-main transition-colors text-left truncate"
                        >
                            {previewSound ? `🔊 ${previewSound.name}` : '2. Add Sound (opt, max 500KB)'}
                        </button>
                    </div>

                    {uploadError && (
                        <p className="text-[9px] text-red-400 uppercase tracking-widest bg-red-400/10 p-1.5 rounded text-center">{uploadError}</p>
                    )}

                    <button
                        onClick={handleUpload}
                        disabled={!previewImage || isUploading}
                        className="py-2.5 mt-1 bg-main text-black font-bold text-[10px] uppercase tracking-widest rounded hover:bg-main/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        {isUploading ? (
                            <><Loader2 size={12} className="animate-spin" /> Uploading to Cloudinary...</>
                        ) : (
                            'Upload & Add to Library'
                        )}
                    </button>
                </div>
            ) : (
                <div className="shrink-0 border-t border-main-sub/10 p-2 bg-bg-secondary/40">
                    <button
                        onClick={() => setShowUploadPanel(true)}
                        className="w-full flex items-center justify-center gap-2 py-2 text-[10px] uppercase tracking-widest text-main-sub border border-transparent hover:border-main-sub/20 hover:bg-white/5 rounded transition-colors"
                    >
                        <Upload size={12} />
                        Upload Custom Meme
                    </button>
                </div>
            )}
        </div>
    );
}
