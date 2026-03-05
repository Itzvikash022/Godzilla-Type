import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { ClerkProvider, useAuth } from '@clerk/clerk-react';
import { ConvexProviderWithClerk } from 'convex/react-clerk';
import { ConvexReactClient, ConvexProvider } from 'convex/react';
import { SyncManager } from './components/SyncManager';

const convexUrl = import.meta.env.VITE_CONVEX_URL as string || 'https://example.convex.cloud';
const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string;

// Initialize Convex client once for the whole app
const convex = new ConvexReactClient(convexUrl);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {clerkPubKey ? (
      <ClerkProvider publishableKey={clerkPubKey}>
        <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
          <SyncManager />
          <App />
        </ConvexProviderWithClerk>
      </ClerkProvider>
    ) : (
      <ConvexProvider client={convex}>
        <App />
      </ConvexProvider>
    )}
  </React.StrictMode>
);
