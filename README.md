# 🦎 Godzilla-Type

> Real-time LAN-compatible typing race platform for coworkers.

A production-ready full-stack web application inspired by Monkeytype, specifically designed for teams to compete in typing races on the same network or over the internet.

## Features

- ⌨️ **Solo Practice** — Timed typing tests (15s / 30s / 60s) with 4 text modes: Words, Sentences, Paragraph, Quote.
- 🏁 **Multiplayer Racing** — Real-time races with live progress bars and active WPM decay.
- 👥 **Team Mode** — Assign players to Red/Blue teams for collective net WPM scoring.
- 🔒 **Private Rooms** — Unique 6-character room codes for private, isolated races.
- ♾️ **Infinite Typing** — Auto-extending text buffers mean you never run out of text during a timed race.
- 🌐 **LAN Mode Support** — Designed specifically to work offline on a local network.
- ☁️ **Cloud Sync** — Sign in with Clerk to automatically sync your local stats, match history, and leaderboard rankings across all devices via Convex.
- 📊 **Stats Dashboard** — Track Best WPM, average accuracy, and recent race history via IndexedDB and Cloud Sync.
- 🆓 **100% Free** — No paid APIs or services. All large text generation datasets (~3000 words, 300+ sentences, 100+ quotes) are stored locally in JSON format.

## Tech Stack

| Layer | Tech |
| -------- | ----------------------------- |
| Frontend | React, Vite, TailwindCSS |
| Backend | Node.js, Express, Socket.IO |
| Auth & Sync | Clerk (Auth), Convex (Database) |
| Database | SQLite (server-side via `sql.js`), IndexedDB (client-side) |
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

**Required for Client:**
You must set up Clerk and Convex for the application to run.
1. `VITE_CLERK_PUBLISHABLE_KEY`: Get this from your [Clerk Dashboard](https://dashboard.clerk.com).
2. `VITE_CONVEX_URL`: Get this from your [Convex Dashboard](https://dashboard.convex.dev).

### 5. Run the Application
Start both the Frontend and Backend concurrently using the root shortcut:
```bash
pnpm dev
```
- **Frontend URL**: [http://localhost:5173](http://localhost:5173)
- **Backend URL**: [http://localhost:3001](http://localhost:3001)

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
