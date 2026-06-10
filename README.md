# FR 45-Day Ledger

A static, installable CA Final Financial Reporting study ledger for the fixed 10 Jun - 24 Jul 2026 plan.

## What is included

- Vite + React + TypeScript + Tailwind CSS.
- Exact 45-day / 204-hour schedule extracted from `fr-45day-tracker-v2.html`.
- Local-only versioned storage with JSON export/import.
- Migration path for old HTML backup text.
- PWA manifest and service worker for offline use after first load.
- GitHub Pages deployment workflow in `.github/workflows/deploy.yml`.

## Local run

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## GitHub Pages deploy

1. Push this app to a GitHub repository.
2. In GitHub, open Settings -> Pages.
3. Set Source to GitHub Actions.
4. Push to `main`.
5. The workflow builds `dist/` and publishes the app.

The app uses `base: './'`, so it works under a normal GitHub Pages repository URL.

## Phone install

Android Chrome:

1. Open the GitHub Pages URL.
2. Open the browser menu.
3. Tap Install app or Add to Home screen.

iPhone Safari:

1. Open the GitHub Pages URL.
2. Tap Share.
3. Tap Add to Home Screen.

Progress is stored only on that phone/browser. Use Export JSON from the Vault tab every few days and keep the backup somewhere safe.
