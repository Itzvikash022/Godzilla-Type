# LAN Multiplayer Setup Guide

This guide explains how to share the Godzilla-Type application with coworkers on the same local network **without hosting it online or deploying to a server**.

## Requirements

1. **Shared Network**: All players must be connected to the exact same local network (e.g., the same office Wi-Fi or LAN).
2. **Host Machine**: One person (the host) runs the development servers on their computer.
3. **Host's Local IP**: You need the host's IPv4 address (e.g., `192.168.x.x`).

---

## Instructions for the Host

To allow other computers on the network to connect to your local servers, you must start the frontend and backend with specific environment variables and flags.

Assuming your local IPv4 address is **`192.168.0.208`**:

### 1. Start the Backend Server (Termimal 1)
The backend must be told to accept Cross-Origin Resource Sharing (CORS) requests coming from your specific IP address on the network, rather than just `localhost`.

Instead of running `pnpm --filter server dev`, run:
```powershell
$env:CORS_ORIGIN="http://192.168.0.208:5173"; pnpm --filter server dev
```

### 2. Start the Frontend Client (Terminal 2)
The frontend must be told two things:
1. Expose itself to the local network (using the `--host` flag).
2. Tell the React app exactly where to find the WebSocket backend (using the `VITE_SERVER_URL` variable).

Instead of running `pnpm dev:client`, run:
```powershell
$env:VITE_SERVER_URL="http://192.168.0.208:3001"; pnpm dev:client --host
```

*(Note: Depending on your firewall settings, Windows/macOS might pop up asking if Node.js is allowed to accept incoming connections. You must click **Allow**).*

---

## Instructions for Coworkers (Players)

Once the host has started both servers successfully using the commands above, coworkers do not need to install anything.

1. Open any modern web browser (Chrome, Edge, Firefox, Safari).
2. In the URL bar, type the host's IP address and the frontend port:
   👉 **`http://192.168.0.208:5173`**
3. The Godzilla-Type application will load.
4. Go to **Multiplayer** -> Enter your name -> Enter the 6-character Room Code provided by the host.
5. Enjoy the race!
