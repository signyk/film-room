# Film Room

Fantasy football research dashboard: top scorers, dependability, a player's week-by-week log, start/sit
comparison and the points each defense allows by position. Data comes from
[Sleeper](https://docs.sleeper.com/).

It runs on a Cloudflare Worker on the free plan:

- **The dashboard** (`web/`, React + TypeScript, built with Vite) is served as static assets, so page
  loads do not count as Worker requests.
- **The Worker** (`worker/`) answers `/api/*`: it fetches one week's stats or projections from Sleeper,
  trims them to fantasy-relevant players, scores them and caches the result in KV. Played weeks are kept
  for a week, the current week is refreshed every 30 minutes on game days, and if Sleeper is down the
  last good copy is served.
- **The static data** (`ff/`, Python) is what changes rarely: the player list (Sleeper asks that
  `/players/nfl` is fetched at most once a day), the schedule, and the finished 2024 and 2025 seasons.
  Cloudflare rebuilds it on every push to `main` and once a day, then deploys.

```
shared/        scoring and stat columns used by both the Worker and the dashboard
worker/src/    the API: /api/state, /api/stats/:season/:week, /api/projections/:season/:week
web/src/       the dashboard: data/ (loading and analysis), views/, charts/, components/
ff/            Python: build_data.py writes web/public/data/
data/          finished seasons as CSV, schedules, team names, colours and divisions
scripts/       fetch-season.ts: builds a finished season's CSV from Sleeper
tests/         Vitest: scoring and analysis checked against the old Python and R output
```

## Develop

Needs Node 22 and [uv](https://docs.astral.sh/uv/).

```sh
npm install
npm run data          # build web/public/data (fetches the player list from Sleeper)
npm run data:offline  # or: rebuild from the player list cached by the last `npm run data`
npm run dev           # dashboard and Worker together on http://localhost:5173
npm test
```

## Deploy

The dashboard runs at https://fantabolti.signy-kristin8.workers.dev. Cloudflare builds and deploys it
from GitHub (Workers Builds), so there is nothing to run by hand. One-time setup in the Cloudflare
dashboard, under Workers & Pages → fantabolti (the Worker keeps its original name, which is in the
address) → Settings → Builds:

1. **Connect** the `signyk/FantasyNFL` repository, with `main` as the production branch.
2. **Build command:** `npm run build:cloudflare` (fetches the player list from Sleeper, builds the
   static data, runs the tests and builds the dashboard). **Deploy command:**
   `npx wrangler deploy --config dist/fantabolti/wrangler.json`.
3. **Daily refresh:** under Deploy Hooks, create a hook for `main` and copy its URL. Then run
   `npx wrangler secret put DEPLOY_HOOK_URL` and paste it. The Worker's daily cron calls the hook, which
   rebuilds with today's injuries and team changes.

Every push to `main` then deploys. To deploy from your own machine instead, run `npx wrangler login`
once and then `npm run deploy`.

### Free plan limits

| Limit | Usage |
| --- | --- |
| 100,000 Worker requests a day | Only `/api/*` counts: about 25 requests for a first visit, fewer after that because the browser caches them |
| 10 ms CPU per request | Each request parses one Sleeper file of about 0.6 MB, around 3–4 ms; cached answers are passed through without parsing |
| 1,000 KV writes a day | About 120 on a busy game day |

If `npx wrangler tail` ever shows requests stopped for exceeding CPU (error 1102), move the trimming
into the build and have the Worker only read from KV. The API shape stays the same.

## A new season

Seasons 2018 to 2025 are in the dashboard. To add a finished season (or rebuild an old one), fetch it
from Sleeper with `npm run season -- 2026`, which writes `data/2026/weekly_fantasy_points.csv` with
each player's team that season, then add it to `HISTORY_SEASONS` in `ff/build_data.py`. Sleeper has no
projections before 2018.

The live season follows Sleeper's `/state/nfl`, and its schedule is fetched the first time it is missing.
