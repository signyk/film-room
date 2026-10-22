// Start/sit comparison of two players for the current week, ported from the R dashboard.
import { dependability, mean, present, rankDesc, sum } from "./stats";
import type { PlayerInfo, PlayerWeek, Position, Season } from "./types";

export type StatName =
  | "Projected points"
  | "Opponent"
  | "Matchup: points allowed"
  | "Average points"
  | "Total points"
  | "Last 3 games average"
  | "Points vs projection"
  | "Beat projection"
  | "Dependability"
  | "Worst game"
  | "Best game"
  | "Opportunities per game"
  | "Games played"
  | "Injury status";

export const STAT_HELP: Record<StatName, string> = {
  "Projected points": "Sleeper's projection for this week.",
  Opponent: "Who they play this week.",
  "Matchup: points allowed":
    "Average fantasy points this opponent gives up to the position per game. 1st easiest is the best matchup.",
  "Average points": "Points per game played.",
  "Total points": "All points scored this season.",
  "Last 3 games average": "Average over the last 3 games played.",
  "Points vs projection": "Average points above (+) or below (−) the projection per game.",
  "Beat projection": "Share of games where they scored more than projected.",
  Dependability: "How steady the scoring is. 100% means the same score every week.",
  "Worst game": "Lowest score this season.",
  "Best game": "Highest score this season.",
  "Opportunities per game": "QB: pass + rush attempts. RB/WR/TE: carries + targets. K: field goal + extra point attempts.",
  "Games played": "Games played this season.",
  "Injury status": "Latest injury status from Sleeper.",
};

export const INJURY_LABELS: Record<string, string> = {
  Q: "Questionable",
  D: "Doubtful",
  OUT: "Out",
  IR: "IR",
  PUP: "PUP",
  COV: "COV",
  DNR: "DNR",
  SUS: "Suspended",
};

export interface Matchup {
  opponent: string;
  position: Position;
  allowed: number;
  /** 1 is the easiest matchup: the defense that gives up the most */
  rank: number;
}

/** Average points each defense has allowed per game to each position in the played weeks. */
export function positionMatchups(season: Season): Map<string, Matchup> {
  const games = new Map<string, { opponent: string; position: Position; points: number }>();
  for (const r of season.rows) {
    if (!r.opponent || r.week >= season.currentWeek) continue;
    const key = `${r.opponent}|${r.player.position}|${r.week}`;
    const game = games.get(key) ?? { opponent: r.opponent, position: r.player.position, points: 0 };
    game.points += r.points ?? 0;
    games.set(key, game);
  }
  const cells = [...Map.groupBy(games.values(), (g) => `${g.opponent}|${g.position}`).values()].map((list) => ({
    opponent: list[0].opponent,
    position: list[0].position,
    allowed: sum(list.map((g) => g.points)) / list.length,
    rank: 0,
  }));
  for (const group of Map.groupBy(cells, (c) => c.position).values()) {
    for (const [cell, rank] of rankDesc(group, (c) => c.allowed)) cell.rank = rank;
  }
  return new Map(cells.map((c) => [`${c.opponent}|${c.position}`, c]));
}

export interface CompareStat {
  stat: StatName;
  /** The number compared; null when there is nothing to compare */
  value: number | null;
  display: string;
  /** A second, quieter line under the value */
  note?: string;
  better: "higher" | "lower" | "none";
}

export interface ComparePlayer {
  player: PlayerInfo;
  onBye: boolean;
  injuryLevel: number;
  stats: CompareStat[];
}

export function ordinal(n: number): string {
  const suffix = n % 100 >= 11 && n % 100 <= 13 ? "th" : (["th", "st", "nd", "rd"][n % 10] ?? "th");
  return `${n}${suffix}`;
}

export function fmt(x: number | null, digits = 1, { prefix = "", suffix = "" } = {}): string {
  if (x === null || Number.isNaN(x)) return "–";
  return `${prefix}${x.toFixed(digits)}${suffix}`;
}

const signed = (x: number | null) => (x === null ? "–" : x > 0 ? `+${x.toFixed(1)}` : x < 0 ? `−${Math.abs(x).toFixed(1)}` : "0.0");

function opportunities(row: PlayerWeek, columns: readonly string[]): number | null {
  if (!row.stats) return null;
  const stat = (label: string) => row.stats![columns.indexOf(label)] ?? 0;
  switch (row.player.position) {
    case "QB":
      return stat("Passing ATT") + stat("Rushing ATT");
    case "RB":
    case "WR":
    case "TE":
      return stat("Rushing ATT") + stat("Receiving TGT");
    case "K":
      return stat("FGA") + stat("XPA");
    default:
      return null;
  }
}

export function injuryLevel(injury: string | null): number {
  if (!injury) return 0;
  if (injury === "Q") return 1;
  if (injury === "D") return 2;
  return 3;
}

export function comparePlayer(season: Season, player: PlayerInfo, matchups: Map<string, Matchup>): ComparePlayer {
  const rows = season.rows.filter((r) => r.player === player).sort((a, b) => a.week - b.week);
  const games = rows.filter((r) => r.week < season.currentWeek && r.points !== null);
  const points = games.map((g) => g.points!);
  const hasGames = points.length > 0;
  const avg = mean(points);
  const vsProjection = games.map((g) => g.points! - (g.projection ?? 0));

  const thisWeek = rows.find((r) => r.week === season.currentWeek);
  const onBye = !thisWeek?.opponent;
  const projection = onBye ? 0 : (thisWeek?.projection ?? 0);
  const matchup = thisWeek?.opponent ? matchups.get(`${thisWeek.opponent}|${player.position}`) : undefined;

  const level = injuryLevel(player.injury);
  const last3 = hasGames ? mean(points.slice(-3)) : null;
  const vsProj = hasGames ? mean(vsProjection) : null;
  const beat = hasGames ? vsProjection.filter((v) => v > 0).length / vsProjection.length : null;
  const dep = dependability(points);
  const opps = present(games.map((g) => opportunities(g, season.statColumns)));
  const oppsPerGame = hasGames ? mean(opps) : null;

  const stats: CompareStat[] = [
    { stat: "Projected points", value: projection, display: fmt(projection), better: "higher" },
    {
      stat: "Opponent",
      value: null,
      display: onBye ? "Bye" : `${thisWeek!.home === false ? "@" : "vs"} ${thisWeek!.opponent}`,
      better: "none",
    },
    {
      // Compared on rank so players at different positions (e.g. RB vs WR) are comparable
      stat: "Matchup: points allowed",
      value: matchup?.rank ?? null,
      display: matchup ? `${ordinal(matchup.rank)} easiest` : "–",
      note: matchup ? `${fmt(matchup.allowed)} to ${player.position}s a game` : undefined,
      better: "lower",
    },
    { stat: "Average points", value: avg, display: fmt(avg), better: "higher" },
    { stat: "Total points", value: sum(points), display: fmt(sum(points)), better: "higher" },
    { stat: "Last 3 games average", value: last3, display: fmt(last3), better: "higher" },
    { stat: "Points vs projection", value: vsProj, display: signed(vsProj), better: "higher" },
    { stat: "Beat projection", value: beat, display: fmt(beat === null ? null : beat * 100, 0, { suffix: "%" }), better: "higher" },
    { stat: "Dependability", value: dep, display: fmt(dep === null ? null : dep * 100, 0, { suffix: "%" }), better: "higher" },
    { stat: "Worst game", value: hasGames ? Math.min(...points) : null, display: fmt(hasGames ? Math.min(...points) : null), better: "higher" },
    { stat: "Best game", value: hasGames ? Math.max(...points) : null, display: fmt(hasGames ? Math.max(...points) : null), better: "higher" },
    { stat: "Opportunities per game", value: oppsPerGame, display: fmt(oppsPerGame), better: "higher" },
    { stat: "Games played", value: points.length, display: String(points.length), better: "higher" },
    {
      stat: "Injury status",
      value: level,
      display: level === 0 ? "Healthy" : (INJURY_LABELS[player.injury!] ?? player.injury!),
      better: "lower",
    },
  ];
  return { player, onBye, injuryLevel: level, stats };
}

export type Side = "a" | "b" | "tie";

export interface Comparison {
  rows: { stat: CompareStat; a: CompareStat; b: CompareStat; winner: Side }[];
  wins: { a: number; b: number };
  verdict: Side;
  /** Why the verdict went that way, in a few words */
  reason: string;
}

const round2 = (x: number) => Math.round(x * 100) / 100;

export function compare(a: ComparePlayer, b: ComparePlayer): Comparison {
  const rows = a.stats.map((sa, i) => {
    const sb = b.stats[i];
    let winner: Side;
    if (sa.better === "none" || sa.value === null || sb.value === null) winner = "tie";
    else if (round2(sa.value) === round2(sb.value)) winner = "tie";
    else if (sa.better === "higher") winner = sa.value > sb.value ? "a" : "b";
    else winner = sa.value < sb.value ? "a" : "b";
    return { stat: sa, a: sa, b: sb, winner };
  });
  const wins = { a: rows.filter((r) => r.winner === "a").length, b: rows.filter((r) => r.winner === "b").length };

  // A player on bye or ruled out (Out, IR, ...) never gets the start over one who can play
  const outA = a.onBye || a.injuryLevel >= 3;
  const outB = b.onBye || b.injuryLevel >= 3;
  const why = (p: ComparePlayer) => (p.onBye ? "is on bye" : `is ${(INJURY_LABELS[p.player.injury!] ?? p.player.injury)?.toLowerCase()}`);
  if (outA !== outB) {
    const out = outA ? a : b;
    return { rows, wins, verdict: outA ? "b" : "a", reason: `${out.player.name} ${why(out)}` };
  }
  if (wins.a !== wins.b) {
    const verdict = wins.a > wins.b ? "a" : "b";
    return { rows, wins, verdict, reason: `Wins ${Math.max(wins.a, wins.b)} of ${wins.a + wins.b} stats` };
  }
  const pa = a.stats[0].value ?? 0;
  const pb = b.stats[0].value ?? 0;
  if (pa === pb) return { rows, wins, verdict: "tie", reason: `${wins.a} stats each and the same projection` };
  return { rows, wins, verdict: pa > pb ? "a" : "b", reason: `${wins.a} stats each; the higher projection decides` };
}
