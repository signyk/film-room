// The ported analysis must give the same answers as the R dashboard did. The fixtures were made by
// running the R code (before it was removed) on data/2026 and data/2025 at week 7; the seasons are
// the exports ff/build_data.py made of those CSV files.
import { readFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { filterRows, summarize, topPlayers } from "../web/src/data/analysis";
import { compare, comparePlayer, positionMatchups } from "../web/src/data/compare";
import { loadHistory } from "../web/src/data/load";
import type { Season } from "../web/src/data/types";

const files: Record<string, () => string> = {
  "/data/history/2026.json": () => gunzipSync(readFileSync("tests/fixtures/season-2026.json.gz")).toString("utf8"),
  "/data/history/2025.json": () => gunzipSync(readFileSync("tests/fixtures/season-2025.json.gz")).toString("utf8"),
};
vi.stubGlobal("fetch", async (url: string) => new Response(files[url]()));

const r = JSON.parse(readFileSync("tests/fixtures/r-fixtures.json", "utf8"));
let season2026: Season;
let season2025: Season;

beforeAll(async () => {
  season2026 = { ...(await loadHistory(2026)), currentWeek: 7 };
  season2025 = await loadHistory(2025);
});

describe("positionMatchups", () => {
  it("matches R's position_matchups", () => {
    const matchups = positionMatchups(season2026);
    expect(matchups.size).toBe(r.matchups.length);
    for (const m of r.matchups) {
      const ours = matchups.get(`${m.Opponent}|${m.Position}`)!;
      expect(ours.allowed).toBeCloseTo(m.allowed, 6);
      expect(ours.rank).toBe(m.allowed_rank);
    }
  });
});

describe("compare", () => {
  for (const pair of r.compare) {
    it(`${pair.a} vs ${pair.b}`, () => {
      const matchups = positionMatchups(season2026);
      const find = (name: string) => season2026.players.find((p) => p.name === name)!;
      const result = compare(comparePlayer(season2026, find(pair.a), matchups), comparePlayer(season2026, find(pair.b), matchups));
      expect(result.verdict).toBe(pair.verdict);
      pair.rows.forEach((row: { stat: string; value_a: number | null; value_b: number | null; winner: string }, i: number) => {
        const ours = result.rows[i];
        expect(ours.stat.stat).toBe(row.stat);
        expect(ours.winner, row.stat).toBe(row.winner);
        if (row.value_a !== null) expect(ours.a.value, `${row.stat} a`).toBeCloseTo(row.value_a, 6);
        if (row.value_b !== null) expect(ours.b.value, `${row.stat} b`).toBeCloseTo(row.value_b, 6);
      });
    });
  }
});

describe("summarize", () => {
  it("matches R's player summary for 2025 QBs and WRs", () => {
    const rows = filterRows(season2025, {
      weeks: season2025.weeks,
      positions: ["QB", "WR"],
      teams: [...new Set(season2025.players.map((p) => p.team))],
    });
    const top = topPlayers(summarize(rows), "Average Points", 10);
    r.summary2025.forEach((expected: { Player: string; total: number; avg: number; tproj: number; aproj: number; dependability: number }, i: number) => {
      const ours = top[i];
      expect(ours.player.name).toBe(expected.Player);
      expect(ours["Total Points"]).toBeCloseTo(expected.total, 6);
      expect(ours["Average Points"]).toBeCloseTo(expected.avg, 6);
      expect(ours["Total Projected Points"]).toBeCloseTo(expected.tproj, 6);
      expect(ours["Average Projected Points"]).toBeCloseTo(expected.aproj, 6);
      expect(ours.dependability!).toBeCloseTo(expected.dependability, 6);
    });
  });
});
