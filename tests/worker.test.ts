import { describe, expect, it } from "vitest";
import type { StateResponse } from "../shared/stats";
import { weekMaxAge } from "../worker/src/sleeper";

const state: StateResponse = { season: 2026, week: 7, seasonType: "regular", fetchedAt: "" };
const hour = 3600;
const sunday = new Date("2026-10-25T18:00:00Z");
const wednesday = new Date("2026-10-21T18:00:00Z");

describe("weekMaxAge", () => {
  it("keeps settled weeks for a week", () => {
    expect(weekMaxAge(2026, 3, state, sunday)).toBe(7 * 24 * hour);
    expect(weekMaxAge(2025, 17, state, sunday)).toBe(7 * 24 * hour);
  });
  it("rechecks last week and later weeks four times a day", () => {
    expect(weekMaxAge(2026, 6, state, sunday)).toBe(6 * hour);
    expect(weekMaxAge(2026, 12, state, sunday)).toBe(6 * hour);
  });
  it("refreshes the current week often on game days", () => {
    expect(weekMaxAge(2026, 7, state, sunday)).toBe(hour / 2);
    expect(weekMaxAge(2026, 7, state, wednesday)).toBe(2 * hour);
  });
});
