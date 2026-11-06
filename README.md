# LGVIBE

Next.js 14 (App Router) + Tailwind + Framer Motion + Upstash Redis.

## Run locally
```bash
npm install
cp .env.example .env.local   # optional: add Upstash credentials
npm run dev
```
Without Upstash credentials the API falls back to in-memory storage (resets on restart).

## Deploy to Vercel
1. Push this folder to GitHub and import it in Vercel.
2. Add Upstash Redis from the Vercel Marketplace (or set `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`).
3. Set `ADMIN_PASSPHRASE` to your own passphrase. If unset, `@12345@` is used.
4. Deploy. Open `/admin` to manage courses, YouTube mappings and the quiz bank.
