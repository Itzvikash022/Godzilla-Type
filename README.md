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
- 📊 **Stats Dashboard** — Track Best WPM, average accuracy, and recent race history via IndexedDB.
- 🆓 **100% Free** — No paid APIs or services. All large text generation datasets (~3000 words, 300+ sentences, 100+ quotes) are stored locally in JSON format.

## Tech Stack

| Layer | Tech |
| -------- | ----------------------------- |
| Frontend | React, Vite, TailwindCSS |
| Backend | Node.js, Express, Socket.IO |
| Database | SQLite (server-side via `sql.js`), IndexedDB (client-side) |
| Architecture | Monorepo structure managed by `pnpm` workspaces |

## Quick Start (Local Development)

```bash
# 1. Install all dependencies recursively
pnpm install

# 2. Start the Backend Server (Terminal 1)
pnpm --filter server dev

# 3. Start the Frontend Client (Terminal 2)
pnpm dev:client
```
- **Frontend URL**: [http://localhost:5173](http://localhost:5173)
- **Backend URL**: [http://localhost:3001](http://localhost:3001)

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
   - Build Command: `npm install -g pnpm && pnpm install && pnpm --filter server build`
   - Start Command: `cd server && pnpm start`
5. Deploy. Render will provide a URL like `https://godzilla-type-server.onrender.com`.

### Step 2: Deploy Frontend to Vercel (Free Tier)
1. Go to [Vercel.com](https://vercel.com) and create a New **Project**.
2. Connect your GitHub repository.
3. Settings:
   - Root Directory: **`client`** *(Vercel will detect Vite + pnpm automatically)*
   - Environment Variables: Add `VITE_SERVER_URL` and set the value to your Render URL.
4. Deploy. Vercel will provide a URL like `https://godzilla-type.vercel.app`.

### Step 3: Allow CORS
1. Go back to your Render Dashboard -> Environment.
2. Add the variable `CORS_ORIGIN` and set the value to your Vercel URL.
3. Restart the Render server.

## License

MIT
