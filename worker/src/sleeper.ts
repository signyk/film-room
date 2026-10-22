import { fantasyPoints } from "../../shared/scoring";
import {
  STAT_COLUMNS,
  STAT_LABELS,
  type Position,
  type ProjectionsResponse,
  type SleeperStats,
  type StateResponse,
  type StatsResponse,
} from "../../shared/stats";

const API = "https://api.sleeper.app/v1";

export interface Env {
  ASSETS: Fetcher;
  SLEEPER_CACHE: KVNamespace;
}

interface CacheMeta {
  fetchedAt: number;
}

// Kept for 30 days so a stale copy can be served when Sleeper is down
const KV_EXPIRATION = 30 * 24 * 3600;

async function sleeperJson<T>(path: string, cacheTtl: number): Promise<T> {
  const response = await fetch(`${API}/${path}`, { cf: { cacheTtl, cacheEverything: true } });
  if (!response.ok) throw new Error(`Sleeper ${path} answered ${response.status}`);
  return response.json<T>();
}

/**
 * Returns the cached value while it is younger than maxAge seconds, otherwise loads a fresh one.
 * A failed load falls back to the stale copy, so the dashboard keeps working when Sleeper is down.
 */
async function cached(
  env: Env,
  ctx: ExecutionContext,
  key: string,
  maxAge: number,
  load: () => Promise<string>,
): Promise<{ body: string; stale: boolean }> {
  const hit = await env.SLEEPER_CACHE.getWithMetadata<CacheMeta>(key);
  const age = hit.metadata ? (Date.now() - hit.metadata.fetchedAt) / 1000 : Infinity;
  if (hit.value !== null && age < maxAge) return { body: hit.value, stale: false };
  try {
    const body = await load();
    ctx.waitUntil(
      env.SLEEPER_CACHE.put(key, body, {
        expirationTtl: KV_EXPIRATION,
        metadata: { fetchedAt: Date.now() } satisfies CacheMeta,
      }),
    );
    return { body, stale: false };
  } catch (error) {
    if (hit.value !== null) return { body: hit.value, stale: true };
    throw error;
  }
}

export async function getState(env: Env, ctx: ExecutionContext): Promise<StateResponse> {
  const { body } = await cached(env, ctx, "state", 3600, async () => {
    const state = await sleeperJson<{ season: string; week: number; season_type: string }>("state/nfl", 600);
    // Out of the regular season Sleeper's week is 0 (preseason) or counts the playoffs
    const week = state.season_type === "regular" ? state.week : state.season_type === "pre" ? 1 : 19;
    return JSON.stringify({
      season: Number(state.season),
      week,
      seasonType: state.season_type,
      fetchedAt: new Date().toISOString(),
    } satisfies StateResponse);
  });
  return JSON.parse(body);
}

/**
 * How long a week's data stays fresh, given the current week. Worst case this is about 120 KV
 * writes a day (free plan: 1,000): state hourly, the current week every 30 min on game days, every
 * other open week four times a day.
 */
export function weekMaxAge(season: number, week: number, state: StateResponse, now = new Date()): number {
  const hour = 3600;
  if (season < state.season || week < state.week - 1) return 7 * 24 * hour; // settled
  if (week !== state.week) return 6 * hour; // last week's stat corrections, or projections for later weeks
  // This week's projections move with injury news, most of all on game days (Thu, Sun, Mon in the US)
  const usDay = new Date(now.getTime() - 5 * hour * 1000).getUTCDay();
  return [0, 1, 4].includes(usDay) ? hour / 2 : 2 * hour;
}

let playersPromise: Promise<Map<string, Position>> | null = null;

/** The fantasy relevant players, from the static players.json built daily by CI. */
function relevantPlayers(env: Env, origin: string): Promise<Map<string, Position>> {
  playersPromise ??= env.ASSETS.fetch(new URL("/data/players.json", origin))
    .then((r) => {
      if (!r.ok) throw new Error(`players.json answered ${r.status}`);
      return r.json<{ players: { id: string; position: Position }[] }>();
    })
    .then(({ players }) => new Map(players.map((p) => [p.id, p.position])))
    .catch((error) => {
      playersPromise = null;
      throw error;
    });
  return playersPromise;
}

const FIELD_COLUMN = new Map<string, number>();
STAT_COLUMNS.forEach((column, i) => column.fields.forEach((field) => FIELD_COLUMN.set(field, i)));

/** The dashboard's stat columns, walking the player's own fields once (it is the hot loop) */
function statRow(stats: SleeperStats): number[] {
  const row = new Array<number>(STAT_COLUMNS.length).fill(0);
  for (const field in stats) {
    const i = FIELD_COLUMN.get(field);
    if (i !== undefined) row[i] += stats[field] ?? 0;
  }
  return row;
}

export type Part = "stats" | "projections";

/**
 * One week's stats or projections from Sleeper, trimmed to the fantasy relevant players.
 * Each part is its own request so a Worker invocation parses one ~0.6 MB file and stays well
 * inside the free plan's 10 ms of CPU.
 */
export async function getWeekPart(
  env: Env,
  ctx: ExecutionContext,
  origin: string,
  part: Part,
  season: number,
  week: number,
): Promise<{ body: string; maxAge: number; stale: boolean } | null> {
  const state = await getState(env, ctx);
  // Stats exist only for weeks that are played
  if (part === "stats" && season === state.season && week >= state.week) return null;
  if (season > state.season) return null;
  const maxAge = weekMaxAge(season, week, state);

  const result = await cached(env, ctx, `${part}:${season}:${week}`, maxAge, async () => {
    const [players, raw] = await Promise.all([
      relevantPlayers(env, origin),
      sleeperJson<Record<string, SleeperStats>>(`${part}/nfl/regular/${season}/${week}`, 300),
    ]);
    const fetchedAt = new Date().toISOString();

    if (part === "projections") {
      const out: Record<string, number> = {};
      // A listed player without a projection counts as projected 0, as in the old pipeline
      for (const id of players.keys()) if (raw[id]) out[id] = raw[id].pts_ppr ?? 0;
      return JSON.stringify({ season, week, fetchedAt, players: out } satisfies ProjectionsResponse);
    }

    const out: StatsResponse["players"] = {};
    for (const [id, position] of players) {
      const s = raw[id];
      if (s) out[id] = [fantasyPoints(s, position), statRow(s)];
    }
    return JSON.stringify({ season, week, fetchedAt, statColumns: STAT_LABELS, players: out } satisfies StatsResponse);
  });
  return { ...result, maxAge };
}
