// The TypeScript scoring must give the same points as the old Python pipeline. The fixture holds the
// raw Sleeper stats for 2026 weeks 1–3 next to the points the Python code wrote to the weekly CSV.
import { readFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import { describe, expect, it } from "vitest";
import { fantasyPoints, roundOneDecimal } from "../shared/scoring";
import type { Position, SleeperStats } from "../shared/stats";

interface Case {
  week: number;
  player: string;
  position: Position;
  stats: SleeperStats;
  points: number;
}

const cases: Case[] = JSON.parse(gunzipSync(readFileSync("tests/fixtures/scoring-2026-weeks-1-3.json.gz")).toString("utf8"));

describe("fantasyPoints", () => {
  for (const position of ["QB", "RB", "WR", "TE", "K", "DEF"] as const) {
    it(`matches the Python points for every ${position}`, () => {
      const mine = cases.filter((c) => c.position === position);
      expect(mine.length).toBeGreaterThan(10);
      for (const c of mine) expect(fantasyPoints(c.stats, position), `${c.player} week ${c.week}`).toBe(c.points);
    });
  }
});

describe("roundOneDecimal", () => {
  it("rounds halves to even like Python", () => {
    expect(roundOneDecimal(2.25)).toBe(2.2);
    expect(roundOneDecimal(2.35)).toBe(2.4);
    expect(roundOneDecimal(-0.04)).toBe(0);
    expect(roundOneDecimal(12.76)).toBe(12.8);
  });
});
