import { dependability, mean, present, rankDesc, sum } from "./stats";
import type { PlayerInfo, PlayerWeek, PointType, Position, Season } from "./types";

export interface Filters {
  weeks: number[];
  positions: Position[];
  teams: string[];
}

export function filterRows(season: Season, f: Filters, by: "team" | "none" = "team"): PlayerWeek[] {
  const weeks = new Set(f.weeks);
  const positions = new Set(f.positions);
  const teams = new Set(f.teams);
  return season.rows.filter(
    (r) => weeks.has(r.week) && (by === "none" || (positions.has(r.player.position) && teams.has(r.player.team))),
  );
}

export interface PlayerSummary {
  player: PlayerInfo;
  games: number;
  "Total Points": number;
  "Average Points": number;
  "Total Projected Points": number;
  "Average Projected Points": number;
  dependability: number | null;
}

export function summarize(rows: PlayerWeek[]): PlayerSummary[] {
  const byPlayer = new Map<PlayerInfo, PlayerWeek[]>();
  for (const r of rows) {
    const list = byPlayer.get(r.player);
    if (list) list.push(r);
    else byPlayer.set(r.player, [r]);
  }
  return [...byPlayer].map(([player, weeks]) => {
    const pts = present(weeks.map((w) => w.points));
    const proj = present(weeks.map((w) => w.projection));
    return {
      player,
      games: pts.length,
      "Total Points": sum(pts),
      "Average Points": mean(pts) ?? 0,
      "Total Projected Points": sum(proj),
      "Average Projected Points": mean(proj) ?? 0,
      dependability: dependability(pts),
    };
  });
}

export function topPlayers(summary: PlayerSummary[], pointType: PointType, n: number): PlayerSummary[] {
  return [...summary].sort((a, b) => b[pointType] - a[pointType] || a.player.name.localeCompare(b.player.name)).slice(0, n);
}

export function positionRanks(summary: PlayerSummary[], pointType: PointType): Map<PlayerInfo, { rank: number; of: number }> {
  const out = new Map<PlayerInfo, { rank: number; of: number }>();
  const byPosition = Map.groupBy(summary, (s) => s.player.position);
  for (const group of byPosition.values()) {
    const ranks = rankDesc(group, (s) => s[pointType]);
    for (const [s, rank] of ranks) out.set(s.player, { rank, of: group.length });
  }
  return out;
}

export interface OpponentCell {
  opponent: string;
  position: Position;
  "Total Points": number;
  "Average Points": number;
  "Total Projected Points": number;
  "Average Projected Points": number;
}

export function opponentTable(rows: PlayerWeek[], season: Season): OpponentCell[] {
  const games = new Map<string, { opponent: string; position: Position; week: number; points: number; projection: number }>();
  for (const r of rows) {
    if (!r.opponent) continue;
    const key = `${r.opponent}|${r.player.position}|${r.week}`;
    const game = games.get(key) ?? { opponent: r.opponent, position: r.player.position, week: r.week, points: 0, projection: 0 };
    game.points += r.points ?? 0;
    game.projection += r.projection ?? 0;
    games.set(key, game);
  }
  const cells = Map.groupBy(games.values(), (g) => `${g.opponent}|${g.position}`);
  return [...cells.values()].map((list) => {
    const played = list.filter((g) => g.week < season.currentWeek).map((g) => g.points);
    const projected = list.map((g) => g.projection);
    return {
      opponent: list[0].opponent,
      position: list[0].position,
      "Total Points": sum(played),
      "Average Points": mean(played) ?? 0,
      "Total Projected Points": sum(projected),
      "Average Projected Points": mean(projected) ?? 0,
    };
  });
}

export function splitWeeks(season: Season): { past: number[]; future: number[] } {
  return {
    past: season.weeks.filter((w) => w < season.currentWeek),
    future: season.weeks.filter((w) => w >= season.currentWeek),
  };
}
