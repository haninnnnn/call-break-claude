# Call Break

Real-time multiplayer Call Break — play with friends over a private room code.

## Structure

```
backend/    Node.js + Socket.io game server
frontend/   React + Vite web client
```

## Running locally

**Backend**
```
cd backend
npm install
npm start          # runs on http://localhost:3001
```

**Frontend**
```
cd frontend
npm install
npm run dev         # runs on http://localhost:5173
```

The frontend connects to `http://localhost:3001` by default. To point it at a different backend (e.g. a deployed one), set `VITE_SERVER_URL`:
```
VITE_SERVER_URL=https://your-backend.onrender.com npm run dev
```

## Playing on the same WiFi (no deployment needed)

1. Find your computer's local IP (e.g. `192.168.1.5`)
2. Backend: `npm start` (already listens on all interfaces)
3. Frontend: `VITE_SERVER_URL=http://192.168.1.5:3001 npm run dev -- --host`
4. Friends on the same WiFi open `http://192.168.1.5:5173`

## Deploying

**Backend → Render**
- Push this repo to GitHub, create a new Web Service on Render, point it at the `backend/` directory (set root directory to `backend` in Render's settings)
- `render.yaml` pre-fills the build/start commands
- Set the `FRONTEND_URL` environment variable to your deployed frontend's URL once you have it (tightens CORS)

**Frontend → Vercel/Netlify**
- Point either at the `frontend/` directory as the project root
- Set the `VITE_SERVER_URL` environment variable to your deployed backend's URL

## How to play

1. Host creates a room, picks number of rounds (5/7/8), shares the room code
2. Friends join with the code — game auto-starts once 4 players are in
3. Standard Call Break rules: bid 1–13 tricks, follow suit, spades are always trump
4. Scoring: hit your bid = bid×10 (+0.1/overtrick), miss it = −10×bid
