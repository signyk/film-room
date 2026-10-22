# Fantabolti

Fantasy football research dashboard for the Fantabolti league: top scorers, dependability, a player's
week-by-week log, start/sit comparison and the points each defense allows by position. Data comes from
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
  GitHub Actions rebuilds it daily and on every push to `main`, then deploys.

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

One-time setup:

1. Create a free Cloudflare account and run `npx wrangler login`.
2. `npm run deploy`. Wrangler creates the `SLEEPER_CACHE` KV namespace on the first deploy, and the
   dashboard goes live at `https://fantabolti.<your-subdomain>.workers.dev`.
3. For automatic deploys, add two secrets to the GitHub repository: `CLOUDFLARE_API_TOKEN` (create it
   from the "Edit Cloudflare Workers" template) and `CLOUDFLARE_ACCOUNT_ID`.

After that, `.github/workflows/deploy.yml` tests, builds and deploys on every push to `main` and once a
day, which refreshes injuries and team changes.

### Free plan limits

| Limit | Usage |
| --- | --- |
| 100,000 Worker requests a day | Only `/api/*` counts: about 25 requests for a first visit, fewer after that because the browser caches them |
| 10 ms CPU per request | Each request parses one Sleeper file of about 0.6 MB, around 3–4 ms; cached answers are passed through without parsing |
| 1,000 KV writes a day | About 120 on a busy game day |

If `npx wrangler tail` ever shows requests stopped for exceeding CPU (error 1102), move the trimming
into the GitHub Actions job and have the Worker only read from KV. The API shape stays the same.

## A new season

Seasons 2018 to 2025 are in the dashboard. To add a finished season (or rebuild an old one), fetch it
from Sleeper with `npm run season -- 2026`, which writes `data/2026/weekly_fantasy_points.csv` with
each player's team that season, then add it to `HISTORY_SEASONS` in `ff/build_data.py`. Sleeper has no
projections before 2018.

The live season follows Sleeper's `/state/nfl`, and its schedule is fetched the first time it is missing.
