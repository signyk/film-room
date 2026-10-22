import { REGULAR_SEASON_WEEKS, STAT_LABELS, type ProjectionsResponse, type StateResponse, type StatsResponse } from "../../../shared/stats";
import type { Meta, PlayerInfo, PlayerWeek, Position, Season } from "./types";

async function getJson<T>(url: string): Promise<{ data: T; stale: boolean }> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${url} answered ${response.status}`);
  return { data: (await response.json()) as T, stale: response.headers.get("x-stale") === "1" };
}

export const loadMeta = () => getJson<Meta>("/data/meta.json").then((r) => r.data);
export const loadState = () => getJson<StateResponse>("/api/state").then((r) => r.data);

/** Fantasy points are blank, not 0, for a player with neither points nor a projection (as in the old dashboard). */
function points(points: number | null, projection: number | null): number | null {
  return points === 0 && (projection === 0 || projection === null) ? null : points;
}

const playerKey = (name: string, team: string, position: string) => `${name}|${team}|${position}`;

interface HistoryFile {
  season: number;
  statColumns: string[];
  players: [name: string, position: Position, team: string, injury: string | null][];
  rows: [player: number, week: number, opponent: string | null, points: number | null, projection: number | null, stats: (number | null)[]][];
}

export async function loadHistory(season: number): Promise<Season> {
  const { data } = await getJson<HistoryFile>(`/data/history/${season}.json`);
  const players: PlayerInfo[] = data.players.map(([name, position, team, injury]) => ({
    key: playerKey(name, team, position),
    name,
    team,
    position,
    injury,
  }));
  const rows: PlayerWeek[] = data.rows.map(([p, week, opponent, pts, projection, stats]) => ({
    player: players[p],
    week,
    opponent,
    home: null,
    points: points(pts, projection),
    projection,
    stats: stats.every((s) => s === null) ? null : stats.map((s) => s ?? 0),
  }));
  const weeks = [...new Set(rows.map((r) => r.week))].sort((a, b) => a - b);
  return {
    season,
    live: false,
    currentWeek: Math.max(...weeks) + 1,
    weeks,
    statColumns: data.statColumns,
    players,
    rows,
    fetchedAt: null,
    stale: false,
  };
}

interface PlayersFile {
  updatedAt: string;
  players: { id: string; name: string; position: Position; team: string; injury: string | null }[];
}

export async function loadLiveSeason(season: number, state: StateResponse): Promise<Season> {
  const currentWeek = season < state.season ? REGULAR_SEASON_WEEKS + 1 : state.week;
  const weekNumbers = Array.from({ length: REGULAR_SEASON_WEEKS }, (_, i) => i + 1);
  const played = weekNumbers.filter((w) => w < currentWeek);
  const [playersFile, schedule, projections, stats] = await Promise.all([
    getJson<PlayersFile>("/data/players.json"),
    getJson<[week: number, home: string, away: string][]>(`/data/schedule/${season}.json`),
    Promise.all(weekNumbers.map((w) => getJson<ProjectionsResponse>(`/api/projections/${season}/${w}`))),
    Promise.all(played.map((w) => getJson<StatsResponse>(`/api/stats/${season}/${w}`))),
  ]);

  const opponents = new Map<string, { opponent: string; home: boolean }>();
  for (const [week, home, away] of schedule.data) {
    opponents.set(`${week}|${home}`, { opponent: away, home: true });
    opponents.set(`${week}|${away}`, { opponent: home, home: false });
  }
  const statsByWeek = new Map(stats.map((s) => [s.data.week, s.data]));

  const players = playersFile.data.players.map((p) => ({ ...p, key: playerKey(p.name, p.team, p.position) }));
  const rows: PlayerWeek[] = [];
  for (const { data: proj } of projections) {
    const weekStats = statsByWeek.get(proj.week);
    // Cached stats may predate a new column; map them onto today's columns by label
    const columnMap = weekStats?.statColumns.map((label) => STAT_LABELS.indexOf(label as (typeof STAT_LABELS)[number]));
    for (const player of players) {
      const entry = weekStats?.players[player.id];
      const game = opponents.get(`${proj.week}|${player.team}`);
      const projection = proj.players[player.id] ?? null;
      let row: number[] | null = null;
      if (entry && columnMap) {
        row = new Array<number>(STAT_LABELS.length).fill(0);
        columnMap.forEach((to, from) => to >= 0 && (row![to] = entry[1][from]));
      }
      rows.push({
        player,
        week: proj.week,
        opponent: game?.opponent ?? null,
        home: game?.home ?? null,
        points: points(entry?.[0] ?? null, projection),
        projection,
        stats: row,
      });
    }
  }

  const all = [...projections, ...stats];
  return {
    season,
    live: true,
    currentWeek,
    weeks: weekNumbers,
    statColumns: STAT_LABELS,
    players,
    rows,
    fetchedAt: all.map((r) => r.data.fetchedAt).sort().at(-1) ?? null,
    stale: all.some((r) => r.stale),
  };
}
