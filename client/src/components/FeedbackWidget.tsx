import { useState } from 'react';
import { MessageSquarePlus, X, Send, CheckCircle2, Loader2 } from 'lucide-react';
import { useAction } from 'convex/react';
import { api } from '../../convex/_generated/api';

const MODULES = [
    'Home',
    'Practice — Words',
    'Practice — Quote',
    'Practice — Paragraph',
    'Multiplayer — Lobby',
    'Multiplayer — Race',
    'Stats',
    'Leaderboard',
    'Chat & Meme Picker',
    'Other',
];

const CATEGORIES = [
    'Bug',
    'Suggestion',
    'Feature Request',
    'Timepass',
    'Other',
];

export default function FeedbackWidget() {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState('');
    const [module, setModule] = useState('');
    const [category, setCategory] = useState('');
    const [description, setDescription] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

    const submit = useAction(api.feedback.submit);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !module || !category || !description.trim()) return;

        setStatus('loading');
        try {
            await submit({ name: name.trim(), module, category, description: description.trim() });
            setStatus('success');
            setTimeout(() => {
                setOpen(false);
                setStatus('idle');
                setName('');
                setModule('');
                setCategory('');
                setDescription('');
            }, 2000);
        } catch (err) {
            console.error('Feedback submit failed:', err);
            setStatus('error');
            setTimeout(() => setStatus('idle'), 3000);
        }
    };

    return (
        <>
            {/* Floating Trigger Button */}
            <button
                onClick={() => setOpen(true)}
                title="Send Feedback"
                className="fixed bottom-4 left-4 z-50 flex items-center gap-2 px-3 py-2 rounded-full bg-bg-secondary border border-main-sub/20 text-main-sub/60 hover:text-main hover:border-main/40 hover:bg-main/5 transition-all duration-200 shadow-lg text-[11px] uppercase tracking-widest"
            >
                <MessageSquarePlus size={14} />
                <span>Feedback</span>
            </button>

            {/* Modal Backdrop */}
            {open && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in"
                    onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
                >
                    <div className="relative w-full max-w-md bg-bg-secondary border border-main-sub/20 rounded-2xl shadow-2xl mx-4 animate-slide-up">

                        {/* Header */}
                        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-main-sub/10">
                            <div>
                                <h2 className="text-sm font-bold text-text-primary tracking-wide">Send Feedback</h2>
                                <p className="text-[10px] text-main-sub/50 uppercase tracking-widest mt-0.5">We read every response 🦎</p>
                            </div>
                            <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg text-main-sub/40 hover:text-main hover:bg-main/10 transition-colors">
                                <X size={16} />
                            </button>
                        </div>

                        {/* Success State */}
                        {status === 'success' ? (
                            <div className="flex flex-col items-center justify-center py-12 gap-3 text-center px-6">
                                <CheckCircle2 size={40} className="text-green-400" />
                                <p className="text-sm font-semibold text-text-primary">Feedback Sent!</p>
                                <p className="text-[11px] text-main-sub/50">Thanks for making Godzilla-Type better 🚀</p>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
                                {/* Name */}
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[10px] uppercase tracking-widest text-main-sub/60">Your Name</label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                        placeholder="Anonymous Godzilla..."
                                        maxLength={60}
                                        required
                                        className="w-full bg-bg-primary border border-main-sub/20 rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-main-sub/30 outline-none focus:border-main/40 transition-colors"
                                    />
                                </div>

                                {/* Module */}
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[10px] uppercase tracking-widest text-main-sub/60">Module</label>
                                    <select
                                        value={module}
                                        onChange={e => setModule(e.target.value)}
                                        required
                                        className="w-full bg-bg-primary border border-main-sub/20 rounded-lg px-3 py-2 text-sm text-text-primary outline-none focus:border-main/40 transition-colors appearance-none cursor-pointer"
                                    >
                                        <option value="" disabled>Select a module...</option>
                                        {MODULES.map(m => <option key={m} value={m}>{m}</option>)}
                                    </select>
                                </div>

                                {/* Category */}
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[10px] uppercase tracking-widest text-main-sub/60">Category</label>
                                    <select
                                        value={category}
                                        onChange={e => setCategory(e.target.value)}
                                        required
                                        className="w-full bg-bg-primary border border-main-sub/20 rounded-lg px-3 py-2 text-sm text-text-primary outline-none focus:border-main/40 transition-colors appearance-none cursor-pointer"
                                    >
                                        <option value="" disabled>Select a category...</option>
                                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>

                                {/* Description */}
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[10px] uppercase tracking-widest text-main-sub/60">Description</label>
                                    <textarea
                                        value={description}
                                        onChange={e => setDescription(e.target.value)}
                                        placeholder="Tell us more..."
                                        required
                                        rows={4}
                                        maxLength={1000}
                                        className="w-full bg-bg-primary border border-main-sub/20 rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-main-sub/30 outline-none focus:border-main/40 transition-colors resize-none"
                                    />
                                    <span className="text-[10px] text-main-sub/30 self-end">{description.length}/1000</span>
                                </div>

                                {/* Error message */}
                                {status === 'error' && (
                                    <p className="text-xs text-red-400 text-center">Something went wrong. Please try again.</p>
                                )}

                                {/* Submit */}
                                <button
                                    type="submit"
                                    disabled={status === 'loading'}
                                    className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-main/10 border border-main/30 text-main text-sm font-semibold hover:bg-main/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {status === 'loading' ? (
                                        <><Loader2 size={14} className="animate-spin" /> Sending...</>
                                    ) : (
                                        <><Send size={14} /> Send Feedback</>
                                    )}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
