// ==========================================
// GODZILLA-TYPE — Server Entry Point
// ==========================================

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';
import { registerSocketHandlers } from './socket-handlers.js';
import { initDatabase, getPlayerStats, getLeaderboard } from './db.js';
import { generateTypingTextHandler } from './geminiHandler.js';
import { geminiRateLimiter } from './geminiLimiter.js';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load variables from server/.env explicitly
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const PORT = parseInt(process.env.PORT || '3001', 10);
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*'; // Fall back to all for easy dev
const isProduction = process.env.NODE_ENV === 'production';

// ---- Express App ----
const app = express();
app.use(cors({ origin: CORS_ORIGIN }));
app.use(express.json());

// Serve static frontend in production/LAN mode
if (isProduction) {
  const clientDist = path.join(__dirname, '..', '..', 'client', 'dist');
  app.use(express.static(clientDist));
}

// ---- HTTP Routes ----
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

app.get('/api/stats/:playerName', (req, res) => {
  const data = getPlayerStats(req.params.playerName);
  res.json(data);
});

app.get('/api/leaderboard', (req, res) => {
  const duration = req.query.duration ? parseInt(req.query.duration as string, 10) : undefined;
  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
  const data = getLeaderboard(limit, duration);
  res.json(data);
});

// Secure endpoint for AI Generation (Rate Limited)
app.post('/api/generate-typing-text', geminiRateLimiter, generateTypingTextHandler);

// Catch-all for SPA in production
if (isProduction) {
  app.get('*', (_req, res) => {
    const clientDist = path.join(__dirname, '..', '..', 'client', 'dist');
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

// ---- HTTP Server + Socket.IO ----
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: CORS_ORIGIN,
    methods: ['GET', 'POST'],
  },
});

// ---- Initialize ----
(async () => {
  await initDatabase();
})();
registerSocketHandlers(io);

// ---- Start Server ----
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log('');
  console.log('  🦎 ══════════════════════════════════════');
  console.log('  🦎  GODZILLA-TYPE Server');
  console.log(`  🦎  Running on port ${PORT}`);
  console.log('  🦎 ══════════════════════════════════════');
  console.log('');

  // Display LAN IPs for LAN mode
  const interfaces = os.networkInterfaces();
  const lanIPs: string[] = [];
  for (const iface of Object.values(interfaces)) {
    if (!iface) continue;
    for (const config of iface) {
      if (config.family === 'IPv4' && !config.internal) {
        lanIPs.push(config.address);
      }
    }
  }

  if (lanIPs.length > 0) {
    console.log('  📡 LAN Mode — Share these addresses with your coworkers:');
    lanIPs.forEach((ip) => {
      console.log(`     → http://${ip}:${PORT}`);
    });
    console.log('');
  }
});
