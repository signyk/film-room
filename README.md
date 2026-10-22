# Film Room

A fantasy football research dashboard built on [Sleeper](https://docs.sleeper.com/) data: top scorers, how
consistently players score, week-by-week player logs, start/sit comparisons and the points each defense
allows by position. Seasons 2018 to today.

Live at https://fantabolti.signy-kristin8.workers.dev

## How it works

- `web/` is a React + TypeScript app, served as static files from a Cloudflare Worker.
- `worker/` fetches the current season's stats and projections from Sleeper, scores them and caches them
  in KV.
- `ff/` (Python) builds the data that changes rarely: the player list, the schedule and finished seasons
  from `data/`.

## Development

Needs Node 22 and [uv](https://docs.astral.sh/uv/).

```sh
npm install
npm run data   # build the static data
npm run dev    # http://localhost:5173
npm test
```

## Deployment

Cloudflare Workers Builds deploys every push to `main`, with the build command `npm run build:cloudflare`
and the deploy command `npx wrangler deploy --config dist/fantabolti/wrangler.json`.

A daily cron rebuilds the site to pick up injuries and roster moves. It calls the Workers Builds deploy hook
stored in the `DEPLOY_HOOK_URL` secret.

## Adding a season

```sh
npm run season -- 2026
```

Then add the season to `HISTORY_SEASONS` in `ff/build_data.py`.
