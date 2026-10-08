# MemeAI

AI-powered meme creator that turns photos into viral content with context-aware captions, trending templates, community feed, leaderboards, and Pro billing.

![Node](https://img.shields.io/badge/node-%3E%3D20-brightgreen)
![React](https://img.shields.io/badge/react-19-blue)
![Vite](https://img.shields.io/badge/vite-6-purple)
![License](https://img.shields.io/badge/license-MIT-green)

## Features

- **AI captioning** – Gemini generates relatable / sarcastic / absurdist captions from your image
- **Image & video generation** – base meme images + Veo short clips (with graceful fallbacks)
- **Community feed** – like, react, comment; Firebase-backed sync
- **Daily challenges & leaderboards**
- **Pro subscriptions** – Paddle (primary) + PayPal fallback
- **Offline-friendly** – local `memes-db.json` fallback + cached feed

## Tech stack

| Layer | Tech |
|-------|------|
| Frontend | React 19, Vite 6, Tailwind (CDN), html2canvas |
| Backend | Express 5, TypeScript, esbuild |
| AI | Google Gemini (`@google/genai`) – captions, image, TTS, Veo |
| Auth / DB | Firebase Auth + Firestore |
| Payments | Paddle Billing + PayPal Orders v2 |

## Prerequisites

- **Node.js ≥ 20**
- Gemini API key ([Google AI Studio](https://aistudio.google.com/apikey))
- (Optional) Firebase project, Paddle / PayPal credentials

## Quick start

```bash
# 1. Clone & install
git clone <your-repo-url>
cd memeai
npm install

# 2. Configure environment
cp .env.example .env.local
# Edit .env.local and set at least:
#   GEMINI_API_KEY=your_key_here

# 3. Run development server (Vite HMR + Express API on :3000)
npm run dev
```

Open http://localhost:3000

## Production build

```bash
npm run build          # outputs dist/ (client assets + server.cjs)
NODE_ENV=production npm start
```

The production server serves the static SPA from `dist/` and all `/api/*` routes.

## Environment variables

See [`.env.example`](.env.example). Required for full functionality:

| Variable | Purpose |
|----------|---------|
| `GEMINI_API_KEY` | Server-side Gemini access (required for AI features) |
| `PAYPAL_CLIENT_ID` / `PAYPAL_CLIENT_SECRET` | PayPal Orders API |
| `PAYPAL_ENV` | `sandbox` or `live` |
| `PADDLE_CLIENT_TOKEN` / `PADDLE_API_KEY` | Paddle Billing |
| `PADDLE_ENVIRONMENT` | `sandbox` or `production` |
| `PADDLE_PRICE_ANNUAL` / `PADDLE_PRICE_MONTHLY` | Paddle price IDs |

**Never commit real secrets.** Use GitHub Actions secrets or your host’s secret manager.

## GitHub Actions CI

The workflow at [`.github/workflows/ci.yml`](.github/workflows/ci.yml) runs on every push/PR to `main`:

1. `npm ci`
2. `npm run build` (Vite + esbuild)
3. Verifies `dist/index.html` and `dist/server.cjs` exist
4. Uploads the build artifact
5. Smoke-tests that the production server starts and `/api/health` responds

To enable AI/payment features in CI or deployment, add the corresponding secrets in **Repository Settings → Secrets and variables → Actions**.

## Deploying

Any Node host that can run `node dist/server.cjs` works (Railway, Render, Fly.io, Cloud Run, VPS, etc.):

```bash
npm ci
npm run build
NODE_ENV=production node dist/server.cjs
```

Set `PORT` if your platform requires it (default `3000`).

## Security notes for public use

1. **Firestore rules** (`firestore.rules`) currently allow open create/update/delete on the `memes` collection. Tighten them before a real public launch (require auth + ownership for mutations).
2. AI endpoints (`/api/generate-*`) are unauthenticated. Add rate-limiting and/or auth before exposing a production Gemini key.
3. Firebase client config in `firebase-applet-config.json` is public by design; protect the project with domain restrictions and proper security rules.
4. Rotate any keys that were used during development if this repo was previously private.

## Project structure

```
├── App.tsx                 # Root React app
├── components/             # UI tabs & modals
├── services/               # Client-side Gemini & Paddle helpers
├── src/firebase.ts         # Auth + Firestore helpers
├── server.ts               # Express API + production static server
├── public/videos/          # Fallback meme clips
├── memes-db.json           # Local JSON store (dev / fallback)
├── firestore.rules         # Security rules
└── .github/workflows/ci.yml
```

## License

MIT – see [LICENSE](LICENSE).

## Android APK (Capacitor)

MemeAI can be packaged as an Android app via [Capacitor](https://capacitorjs.com/).

### CI (automatic)

On every push to `main`, the **Build Android APK** workflow:

1. Builds the web UI (`vite build`)
2. Adds the Capacitor Android platform
3. Runs `./gradlew assembleDebug`
4. Uploads a **debug APK** as a GitHub Actions artifact

Download it from the **Actions** tab → latest **Build Android APK** run → Artifacts → `memeai-debug-apk-…`.

You can also run it manually: **Actions → Build Android APK → Run workflow**.  
Optional input: `api_base_url` (your deployed Express backend, e.g. `https://your-server.com`).

### Local APK build

```bash
npm install
npm run build:web
npx cap add android    # first time only
npx cap sync android
npx cap open android   # opens Android Studio → Build → APK
# or:
cd android && ./gradlew assembleDebug
# APK: android/app/build/outputs/apk/debug/app-debug.apk
```

### Important: backend for AI features

The APK only contains the **frontend**. Caption / image / video APIs run on the Express server.

1. Deploy the Node server somewhere (Railway, Render, Fly.io, VPS, …).
2. Set `VITE_API_BASE_URL=https://your-server.com` when building the web assets (or pass `api_base_url` in the workflow).
3. Ensure CORS on the server allows your app origin (or use `*` for testing).

Without `VITE_API_BASE_URL`, the app UI still loads; AI/API calls need a reachable backend.
