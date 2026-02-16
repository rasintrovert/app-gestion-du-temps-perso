# Study Coach

A personal study coaching app: plan sessions, focus with a timer, and track your study hours.

## Run the app

1. Install dependencies (if not already done):
   ```bash
   npm install
   ```
2. Start the dev server:
   ```bash
   npm run dev
   ```
3. Open the URL shown in the terminal (e.g. http://localhost:5173).

## Build for production

```bash
npm run build
```

Output is in `dist/`. You can deploy that folder to Vercel, Netlify, or any static host.

## Features (Phase 1)

- **Dashboard** — See study hours this week and start a session.
- **Session generator** — Pick a subject and available time; get a structured plan (focus blocks + breaks).
- **Focus timer** — Countdown per block, pause/start, automatic session saving.
- **Progress** — Completed sessions are stored in localStorage and count toward weekly hours.

Data is stored in your browser only (localStorage). No backend required.
