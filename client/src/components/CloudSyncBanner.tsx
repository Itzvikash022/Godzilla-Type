import { Cloud, CloudOff, CheckCircle, RefreshCw } from 'lucide-react';
import { SignInButton, useAuth, useUser } from '@clerk/clerk-react';
import { triggerFullCloudSync } from './SyncManager';

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string;

function CloudSyncBanner() {
    // If Clerk isn't configured at all, we show a setup prompt instead of failing on old logic
    if (!clerkPubKey) {
        return (
            <div className="bg-bg-secondary/40 border border-main-sub/10 rounded-xl p-6 animate-fade-in mb-8">
                <div className="flex items-start gap-4">
                    <CloudOff size={20} className="text-error mt-0.5 shrink-0" />
                    <div className="flex-1">
                        <h3 className="text-text-primary text-sm font-medium mb-1">Authentication Required</h3>
                        <p className="text-main-sub text-[10px] uppercase tracking-wider mb-2">
                            To sync your stats to the global leaderboard, you need to configure Clerk Auth.
                        </p>
                        <p className="text-main-sub text-[10px] uppercase tracking-wider opacity-60">
                            Please add VITE_CLERK_PUBLISHABLE_KEY to your .env.local file.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    const { isSignedIn } = useAuth();
    const { user } = useUser();

    if (isSignedIn) {
        return (
            <div className="flex items-center justify-between bg-bg-secondary/20 border border-main-sub/10 rounded-xl px-4 py-3 mb-8 animate-fade-in">
                <div className="flex items-center gap-2 text-green-400 text-[10px] uppercase tracking-widest">
                    <CheckCircle size={14} />
                    <span>Syncing as {user?.firstName || user?.username || 'Authenticated User'}</span>
                </div>
                <button
                    onClick={() => triggerFullCloudSync()}
                    className="flex items-center gap-2 text-main-sub hover:text-main text-[10px] uppercase tracking-widest transition-colors"
                    title="Push past offline races to your cloud account"
                >
                    <RefreshCw size={12} />
                    <span>Sync Past Local Races</span>
                </button>
            </div>
        );
    }

    return (
        <div className="bg-bg-secondary/40 border border-main-sub/10 rounded-xl p-6 animate-fade-in mb-8">
            <div className="flex items-start gap-4">
                <Cloud size={20} className="text-main mt-0.5 shrink-0" />
                <div className="flex-1">
                    <h3 className="text-text-primary text-sm font-medium mb-1">Join the Global Leaderboard</h3>
                    <p className="text-main-sub text-[10px] uppercase tracking-wider mb-4">
                        Sign in to securely sync your races to the cloud and compete worldwide.
                    </p>
                    <SignInButton mode="modal">
                        <button className="flex items-center gap-2 px-4 py-2 bg-main/5 text-main border border-main/20 rounded hover:bg-main/10 transition-all text-[10px] uppercase tracking-widest">
                            Sign In to Sync
                        </button>
                    </SignInButton>
                </div>
            </div>
        </div>
    );
}

export default CloudSyncBanner;
