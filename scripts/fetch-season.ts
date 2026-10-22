// Writes data/<season>/weekly_fantasy_points.csv for finished seasons: npm run season -- 2023 2024
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fantasyPoints } from "../shared/scoring";
import { POSITIONS, STAT_COLUMNS, type Position, type SleeperStats } from "../shared/stats";

const API = "https://api.sleeper.com";
const QUERY = "season_type=regular&" + POSITIONS.map((p) => `position[]=${p}`).join("&");
const RENAMED: Record<string, string> = { OAK: "LV", SD: "LAC", STL: "LAR", LA: "LAR", JAC: "JAX", WSH: "WAS" };

const teamNames: Record<string, string> = JSON.parse(readFileSync("data/team_names.json", "utf8"));

interface Row {
  player_id: string;
  team: string | null;
  opponent: string | null;
  stats: SleeperStats | null;
  player: { first_name?: string; last_name?: string; position?: string };
}

const team = (code: string | null | undefined) => (code ? (RENAMED[code] ?? code) : null);

async function get<T>(path: string): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    const response = await fetch(`${API}/${path}`);
    if (response.ok) return (await response.json()) as T;
    if (attempt === 3) throw new Error(`${path} answered ${response.status}`);
    await new Promise((r) => setTimeout(r, 1000 * attempt));
  }
}

interface Player {
  name: string;
  position: Position;
  teams: Map<number, string>;
}

async function fetchSeason(season: number): Promise<number> {
  const schedule = await get<{ week: number; home: string; away: string; status: string }[]>(`schedule/nfl/regular/${season}`);
  const weeks = Math.max(...schedule.map((g) => g.week));
  const opponents = new Map<string, string>();
  for (const g of schedule) {
    if (g.status === "canceled") continue;
    opponents.set(`${g.week}|${team(g.home)}`, team(g.away)!);
    opponents.set(`${g.week}|${team(g.away)}`, team(g.home)!);
  }

  const weekNumbers = Array.from({ length: weeks }, (_, i) => i + 1);
  const [stats, projections] = await Promise.all([
    Promise.all(weekNumbers.map((w) => get<Row[]>(`stats/nfl/${season}/${w}?${QUERY}`))),
    Promise.all(weekNumbers.map((w) => get<Row[]>(`projections/nfl/${season}/${w}?${QUERY}`))),
  ]);

  const players = new Map<string, Player>();
  const know = (row: Row, week: number | null) => {
    const position = row.player.position as Position;
    if (!POSITIONS.includes(position)) return;
    let p = players.get(row.player_id);
    if (!p) {
      const name = position === "DEF" ? teamNames[team(row.player_id)!] : `${row.player.first_name ?? ""} ${row.player.last_name ?? ""}`.trim();
      if (!name) return;
      p = { name, position, teams: new Map() };
      players.set(row.player_id, p);
    }
    if (week !== null && row.team) p.teams.set(week, team(row.team)!);
  };

  const statsByWeek = stats.map((rows, i) => {
    const map = new Map<string, Row>();
    for (const row of rows) {
      know(row, i + 1);
      map.set(row.player_id, row);
    }
    return map;
  });
  const projByWeek = projections.map((rows) => {
    const map = new Map<string, number>();
    for (const row of rows) {
      const pts = row.stats?.pts_ppr;
      if (pts === undefined || pts === null) continue;
      know(row, null);
      map.set(row.player_id, pts);
    }
    return map;
  });

  const header = ["Player", "Position", "Injury Status", "Team", "Opponent", "Week", "Fantasy Points", "Projection", ...STAT_COLUMNS.map((c) => c.label)];
  const lines = [header.join(",")];
  let kept = 0;
  for (const [id, p] of players) {
    const projected = projByWeek.some((m) => m.has(id));
    if (!p.teams.size && !projected) continue;
    const seasonTeam = p.teams.size ? [...p.teams.entries()].sort((a, b) => b[0] - a[0])[0][1] : p.position === "DEF" ? team(id) : null;
    if (!seasonTeam) continue;
    kept++;
    for (const week of weekNumbers) {
      const row = statsByWeek[week - 1].get(id);
      const weekTeam = p.teams.get(week) ?? seasonTeam;
      const opponent = team(row?.opponent) ?? opponents.get(`${week}|${weekTeam}`) ?? "";
      const s = row?.stats ?? null;
      const projection = projByWeek[week - 1].get(id);
      const statCells = s ? STAT_COLUMNS.map((c) => c.fields.reduce((sum, f) => sum + (s[f] ?? 0), 0)) : STAT_COLUMNS.map(() => "");
      const cells = [
        p.name.includes(",") ? `"${p.name}"` : p.name,
        p.position,
        "",
        seasonTeam,
        opponent,
        week,
        s ? fantasyPoints(s, p.position) : "",
        projection ?? "",
        ...statCells,
      ];
      lines.push(cells.join(","));
    }
  }

  mkdirSync(`data/${season}`, { recursive: true });
  writeFileSync(`data/${season}/weekly_fantasy_points.csv`, lines.join("\n") + "\n");
  return kept;
}

const seasons = process.argv.slice(2).map(Number).filter(Boolean);
if (!seasons.length) {
  console.error("usage: npx tsx scripts/fetch-season.ts <season> [season ...]");
  process.exit(1);
}
for (const season of seasons) {
  const kept = await fetchSeason(season);
  console.log(`${season}: ${kept} players written to data/${season}/weekly_fantasy_points.csv`);
}
