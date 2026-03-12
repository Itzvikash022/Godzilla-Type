# 🦎 Godzilla-Type

> Real-time LAN-compatible typing race platform for coworkers.

A production-ready full-stack web application inspired by Monkeytype, specifically designed for teams to compete in typing races on the same network or over the internet.

## ✨ Features

- ⌨️ **Solo Practice** — Timed typing tests (15s / 30s / 60s) with 3 core text modes: Words, Paragraph, and Quote.
- 🏁 **Multiplayer Racing** — Real-time races with live progress bars and active WPM decay.
- 👥 **Team Mode** — Assign players to Red/Blue teams for collective net WPM scoring.
- 🔒 **Private Rooms** — Unique 6-character room codes for private, isolated races.
- 💬 **Integrated Chat & Klipy** — Unified communication feed with a compact **Meme Picker** supporting anonymous uploads and millions of **Klipy** GIFs, Stickers, Memes, and Clips.
- 🧠 **AI Content Generator** — Generate custom typing prompts using Google Gemini AI, bank them up for later with "Save locally", and experiment with explicit difficulty tiers including "Yehh boiii" Meme Mode.
- ♾️ **Infinite Typing** — Auto-extending text buffers mean you never run out of text during a timed race.
- 🏁 **Lobby Ready & Kick** — Hosts can moderate rooms by kicking players, and races only start once everyone toggles their **Ready** status.
- 🎲 **Multiplayer Randomizer** — Hosts can trigger races with randomized durations and text modes in a single click.
- ⚡ **Ultra-Low Latency Engine** — Bypasses React's diffing algorithm for DOM manipulation, matching native desktop app speeds for cursor rendering.
- 🌐 **LAN Mode Support** — Designed specifically to work offline on a local network with auto-detecting IP broadcasting.
- ☁️ **Cloud Sync & Storage** — Uses Clerk for auth profiles, Convex for synced leaderboards, and Cloudinary for hosting permanent global user-uploaded meme assets dynamically cached locally.
- 📊 **Professional Stats Dashboard** — High-end performance tracking via **Chart.js**. Features a dual-axis integrated trend (WPM & Accuracy) with smooth bezier curves and interactive tooltips.
- 💬 **Feedback Widget** — A floating in-app feedback button (bottom-left corner) lets users submit bug reports, suggestions, and feature requests directly — saved to Convex and delivered instantly to a configurable Telegram bot.
- 🆓 **100% Free** — All large human-curated datasets are stored locally, avoiding expensive APIs.

## 🛠️ Tech Stack

| Layer | Tech |
| -------- | ----------------------------- |
| Frontend | React, Vite, TailwindCSS |
| Backend | Node.js, Express, Socket.IO |
| Auth & Sync | Clerk (Auth), Convex (Database) |
| Visualization | Chart.js (via `react-chartjs-2`) |
| Database | SQLite (server-side via `sql.js`), IndexedDB (client-side) |
| AI | Google Gemini API (via server-side wrapper) |
| Architecture | Monorepo structure managed by `pnpm` workspaces |

## 🚀 Quick Start (Local Development)

### 1. Install pnpm (If not already installed)
This project uses **pnpm workspaces**. If you don't have pnpm, install it globally via npm:
```bash
npm install -g pnpm
```

### 2. Install Dependencies
Install all dependencies for the entire monorepo from the root directory:
```bash
pnpm install
```

### 3. Build Shared Library (Required)
The server and client both depend on the `@godzilla-type/shared` package. You **must** build this first to generate the necessary type definitions and library code:
```bash
pnpm --filter shared build
```

### 4. Environment Setup
Create `.env` files in both `client/` and `server/` directories based on the provided `.env.example` files.

**Required for Client (`client/.env`):**
1. `VITE_CLERK_PUBLISHABLE_KEY`: Get this from your [Clerk Dashboard](https://dashboard.clerk.com) for authentication.
2. `VITE_CONVEX_URL` & `VITE_CONVEX_SITE_URL`: Get these from your [Convex Dashboard](https://dashboard.convex.dev) for real-time leaderboards.
3. `VITE_KLIPY_APP_KEY`: Get this from the [Klipy Partner Dashboard](https://partner.klipy.com) to enable the Meme/GIF search picker.

**Convex Environment Variables (set via CLI — NOT in any `.env` file):**

Convex functions run on Convex's cloud, separate from your local server or Vercel. Their env vars must be set using the Convex CLI:
```bash
cd client
# Local dev
npx convex env set TELEGRAM_BOT_TOKEN your_bot_token
npx convex env set TELEGRAM_CHAT_ID your_chat_id
# Production
npx convex env set TELEGRAM_BOT_TOKEN your_bot_token --prod
npx convex env set TELEGRAM_CHAT_ID your_chat_id --prod
```
- `TELEGRAM_BOT_TOKEN`: Create a bot via [@BotFather](https://t.me/BotFather). Copy the **full** token — it must include the numeric bot ID and a colon, e.g. `7123456789:AAEKMIkl...`
- `TELEGRAM_CHAT_ID`: See below for how to get this correctly.

**Getting your Chat ID (do NOT rely on @userinfobot alone):**
1. Send any message to your bot (e.g. `@Godzilla_type_feedback_bot`) from your Telegram account.
2. Open this URL in your browser (replace token):
   ```
   https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates
   ```
3. Find `"chat":{"id": XXXXXXXXX}` in the response — that number is your Chat ID.

**Telegram Troubleshooting:**

| Error | Cause | Fix |
|---|---|---|
| `404 Not Found` | Bot token is missing the numeric prefix (e.g. `1234567:`) | Get full token from BotFather via `/mybots` → API Token |
| `403 Forbidden: bots can't send messages to bots` | Chat ID is the ID of another bot, not your user | Use `getUpdates` API (see above) to get your real Chat ID |
| `400 Bad Request: chat not found` | Bot has never received a message from that Chat ID | Send a `/start` message to your bot first, then retry |

Check Convex function logs at **Convex Dashboard → Logs → feedback:submit** for the exact Telegram error response.

Alternatively, you can set these directly in the [Convex Dashboard](https://dashboard.convex.dev) under **Settings → Environment Variables**.

**Required for Server (`server/.env`):**
1. `GEMINI_API_KEY`: Get this from [Google AI Studio](https://aistudio.google.com) to unlock AI-generated typing prompts.
2. `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`: Get these from [Cloudinary](https://cloudinary.com) to host uploaded meme assets.

### 5. Run the Application
Start both the Frontend and Backend concurrently using the root shortcut:
```bash
pnpm dev
```
- **Frontend URL**: [http://localhost:5173](http://localhost:5173)
- **Backend URL**: [http://localhost:3001](http://localhost:3001)

- **Backend**: [http://localhost:3001](http://localhost:3001)

---

## 📜 Detailed Changelog & Bug Fixes

### 🚀 Recent Features
- **Meme Room v2 (Cloudinary + Caching)**: Replaced static local memes with a full Cloudinary integration. Users can anonymously upload `.webp/.gif` images and `.mp3/.ogg` sounds which are instantly available globally.
- **Background Asset Preloader**: Added an intelligent `IndexedDB/localStorage` caching logic. The app secretly preloads Cloudinary URLs into the browser disk cache behind the scenes, so opening the meme library operates with 0ms latency.
- **Audio Overlap Protection**: Rewrote the meme sound engine to deduplicate Socket.IO broadcasts and securely prevent overlapping replays, with an enforced 3s global cooldown to stop spam. 
- **AI Content Generator**: Added a dedicated generator for custom typing prompts with local history saving and better quality tuning.
- **Content Banking (Save for Later)**: Added a "Save Local" button in Custom mode that banks generated AI content into an offline array, allowing users to queue up dozens of prompts silently without starting a race.
- **Custom Content Persistency**: The custom text mode now remembers and persists your last generated/typed input perfectly across complete browser reloads.
- **Yehh boiii Difficulty**: Added a fun meme mode difficulty tier with completely unhinged formatting mechanics natively via AI.
- **Multiplayer Chat Lobby**: Integrated a real-time reactive chatbox for players to communicate inside rooms, built heavily with Flexbox styling constraints.
- **Unified Communication & Klipy Integration**: Merged the Meme Room and Chat into a single synchronous feed. Replaced Tenor with the versatile Klipy API, enabling instant, in-chat search for millions of GIFs, Stickers, Memes, and Video Clips via a sleek compact picker.
- **Feedback Widget**: Added a global floating feedback button in the bottom-left corner, available on every page. Opens a modal form with Name, Module (dropdown), Category (Bug / Suggestion / Feature Request etc.), and Description fields. On submit, feedback is saved to the Convex `feedback` table and a formatted notification is pushed to a Telegram bot. Telegram credentials are stored securely as Convex environment variables (not in any `.env` file) using `npx convex env set`.
- **Multiplayer Randomizer**: Added ability for hosts to instantly start races with randomized time and text modes.
- **Lobby Ready & Kick System**: Implemented mandatory "Ready" status for all players. Hosts can moderate rooms with a "Kick" button, immediately evicting disruptive players from the session.
- **Persistent Practice Settings**: The solo practice mode now remembers your last selected duration and text mode perfectly across refreshes, so you never have to re-configure your training setup.
- **Text Mode Consolidation**: Removed "Sentences" mode to minimize training distractions. "Paragraph" mode remains the standard for punctuated, natural-text training.
- **Random Start Time**: Added a toggle for non-deterministic visual countdowns (0-12s) to heighten challenge focus.
- **Strategic AI Rate Limiting**: Implemented a highly custom multi-tiered IP-based rate limiter (3/min and 5/min tiers) built from scratch natively, circumventing off-the-shelf express rate limiters for silent delays instead of hard block screens.
- **Professional Performance Dashboard (Chart.js)**: Replaced custom SVG charts with full **Chart.js** integration. Achievement-style dual-axis graph overlays WPM Trend and Accuracy with smooth Cubic Bezier interpolation for a world-class Monkeytype aesthetic.
- **Always-on Stats**: Refactored the UI to show WPM, Accuracy, and Timer immediately upon race start, ticking synchronously via Socket.IO regardless of who typed.

### 🐛 Critical Bug Fixes
1. **Ultra-Low Latency Cursor**: Completely neutralized the input latency bug. Optimized typing responsiveness to 0 lag by stripping React `useState` re-renders from the critical keystroke sequence, transitioning entirely to direct manual DOM manipulation for character coloring and caret transform tracing.
2. **Infinite Flex Layout Fix**: Resolved massive UI layout shifts where dynamically expanding components (like the new unified MemePicker library) would force standard Chatbox UI buttons natively off the bottom bound. Explicit `min-h-0` and `shrink-0` definitions now constrain height inheritance perfectly.
3. **Audio Desync & Replay Loops**: Fixed the overlapping meme sound bug. Tracking currently active audio refs forcefully halts previously playing callbacks reliably.
4. **Text Content Quality & Accuracy**: Hardened the `promptGenerator` JSON schema outputs. It flawlessly repairs chopped complex JSON fragments returned by the `gemini-1.5-flash` model, ensuring formatting accuracy directly across 30k+ line large internal datasets.
5. **Stats Saving Freeze**: Fixed a SQLite schema mismatch in `race_results` by correctly mapping missing values and correctly resolving the race sequence where idle typers previously gained `100%` accuracy upon timeout.
6. **Multiplayer Sync Fixes**: Hardened the backend relative paths and unified start timers meaning the race begins exactly on queue without drifting among clients. 
7. **Convex Data Backfill**: Intercepted missing user profiles cleanly by lazily creating Convex entries if absent inside core mutations.
8. **Stats Reference Fix**: Resolved a critical `ReferenceError` on the Stats page caused by missing React hook imports during the Chart.js migration.

---

## LAN Mode / Office Sharing

If you want coworkers on your same Wi-Fi router or office network to connect to your local server without hosting it on the internet, read the detailed instructions in [LAN_SETUP.md](./LAN_SETUP.md).

It involves setting `CORS_ORIGIN` and `VITE_SERVER_URL` to your local IPv4 address (e.g., `192.168.0.x`).

## Public Deployment (Vercel + Render)

Godzilla-Type is built to be deployed for free across two services: **Vercel** (for the static React frontend) and **Render** (for the always-on Socket.IO backend).

### Step 1: Deploy Backend to Render (Free Tier)
1. Push this repository to GitHub.
2. Go to [Render.com](https://render.com) and create a New **Web Service**.
3. Connect your GitHub repository.
4. Settings:
   - Name: `godzilla-type-server`
   - Language: `Node`
   - Root Directory: *(Leave completely blank)*
   - Build Command: `npm install -g pnpm && pnpm install && pnpm build`
   - Start Command: `cd server && pnpm start`
5. Deploy. Render will provide a URL like `https://godzilla-type-server.onrender.com`.

### Step 2: Deploy Frontend to Vercel (Free Tier)
1. Go to [Vercel.com](https://vercel.com) and create a New **Project**.
2. Connect your GitHub repository.
3. Settings:
   - Root Directory: **`client`** *(Vercel will detect Vite + pnpm automatically)*
   - Environment Variables: 
     - `VITE_SERVER_URL`: Set to your Render URL.
     - `VITE_CLERK_PUBLISHABLE_KEY`: Set to your Clerk Publishable Key.
     - `VITE_CONVEX_URL`: Set to your Convex deployment URL.
4. Deploy. Vercel will provide a URL like `https://godzilla-type.vercel.app`.

### Step 3: Allow CORS
1. Go back to your Render Dashboard -> Environment.
2. Add the variable `CORS_ORIGIN` and set the value to your Vercel URL.
3. Restart the Render server.

## License

MIT
