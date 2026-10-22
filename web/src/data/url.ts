// The view and every filter live in the URL, so any view can be bookmarked or shared.
import { useCallback, useEffect, useState } from "react";
import { POSITIONS } from "../../../shared/stats";
import type { PointType, Position } from "./types";

export type View = "top" | "dependability" | "player" | "compare" | "matchups" | "data";

export const VIEWS: { id: View; path: string; short: string; title: string }[] = [
  { id: "top", path: "/", short: "Top", title: "Top scorers" },
  { id: "dependability", path: "/dependability", short: "Steady", title: "Dependability" },
  { id: "player", path: "/player", short: "Player", title: "Player" },
  { id: "compare", path: "/compare", short: "Compare", title: "Start or sit" },
  { id: "matchups", path: "/matchups", short: "Matchups", title: "Points allowed" },
  { id: "data", path: "/data", short: "Table", title: "All players" },
];

export interface Params {
  season?: number;
  weeks?: number[];
  positions?: Position[];
  teams?: string[];
  pointType?: PointType;
  n?: number;
  player?: string;
  a?: string;
  b?: string;
}

const POINT_CODES: Record<string, PointType> = {
  avg: "Average Points",
  total: "Total Points",
  "avg-proj": "Average Projected Points",
  "total-proj": "Total Projected Points",
};
const pointCode = (t: PointType) => Object.entries(POINT_CODES).find(([, v]) => v === t)![0];

function parseWeeks(s: string): number[] {
  if (s === "none") return [];
  return s.split(",").flatMap((part) => {
    const [from, to] = part.split("-").map(Number);
    if (!Number.isFinite(from)) return [];
    return to ? Array.from({ length: to - from + 1 }, (_, i) => from + i) : [from];
  });
}

function formatWeeks(weeks: number[]): string {
  if (!weeks.length) return "none";
  const sorted = [...weeks].sort((a, b) => a - b);
  const parts: string[] = [];
  for (let i = 0; i < sorted.length; i++) {
    let j = i;
    while (j + 1 < sorted.length && sorted[j + 1] === sorted[j] + 1) j++;
    parts.push(i === j ? `${sorted[i]}` : `${sorted[i]}-${sorted[j]}`);
    i = j;
  }
  return parts.join(",");
}

export interface Route {
  view: View;
  params: Params;
}

export function parseRoute(location: Location): Route {
  const view = VIEWS.find((v) => v.path === location.pathname.replace(/\/$/, "") || (v.path === "/" && location.pathname === "/"))?.id ?? "top";
  const q = new URLSearchParams(location.search);
  const params: Params = {};
  if (q.get("season")) params.season = Number(q.get("season"));
  if (q.get("weeks")) params.weeks = parseWeeks(q.get("weeks")!);
  if (q.get("pos")) params.positions = q.get("pos")!.split(",").filter((p): p is Position => POSITIONS.includes(p as Position));
  if (q.get("teams")) params.teams = q.get("teams")!.split(",");
  if (q.get("points") && POINT_CODES[q.get("points")!]) params.pointType = POINT_CODES[q.get("points")!];
  if (q.get("n")) params.n = Number(q.get("n"));
  for (const key of ["player", "a", "b"] as const) if (q.get(key)) params[key] = q.get(key)!;
  return { view, params };
}

export function routeUrl({ view, params }: Route): string {
  const q = new URLSearchParams();
  if (params.season) q.set("season", String(params.season));
  if (params.weeks) q.set("weeks", formatWeeks(params.weeks));
  if (params.positions) q.set("pos", params.positions.join(","));
  if (params.teams) q.set("teams", params.teams.join(","));
  if (params.pointType) q.set("points", pointCode(params.pointType));
  if (params.n) q.set("n", String(params.n));
  for (const key of ["player", "a", "b"] as const) if (params[key]) q.set(key, params[key]!);
  const path = VIEWS.find((v) => v.id === view)!.path;
  const search = q.toString().replaceAll("%2C", ",");
  return search ? `${path}?${search}` : path;
}

export function useRoute(): [Route, (next: Route, options?: { replace?: boolean }) => void] {
  const [route, setRoute] = useState(() => parseRoute(window.location));
  useEffect(() => {
    const onPop = () => setRoute(parseRoute(window.location));
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);
  const navigate = useCallback((next: Route, { replace = false } = {}) => {
    const url = routeUrl(next);
    if (replace) window.history.replaceState(null, "", url);
    else window.history.pushState(null, "", url);
    setRoute(next);
    if (!replace) window.scrollTo(0, 0);
  }, []);
  return [route, navigate];
}
