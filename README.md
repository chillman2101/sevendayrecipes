# SevenDay Recipes

Generate menu masakan 1–7 hari, cari resep dari bahan yang ada, cetak kartu menu dengan QR code.

## Setup

```bash
npm install
cp .env.example .env.local
npm run build:db   # recipes.json -> data/recipes.db
npm run dev
```

## Deploy (Vercel / Netlify)

1. Set environment variable `NEXT_PUBLIC_BASE_URL` ke URL production (untuk QR code)
2. Build otomatis menjalankan `prebuild` -> `build:db` sebelum `next build`
3. Pastikan `data/recipes.json` ada di repo (DB di-generate saat build)

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server |
| `npm run build:db` | Build SQLite dari recipes.json |
| `npm run build` | Production build |
| `npm start` | Start production server |
