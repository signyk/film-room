import type { PointType } from "./types";

const nf1 = new Intl.NumberFormat("en", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

/** Fantasy points, one decimal, true minus sign */
export const pts = (x: number | null | undefined): string =>
  x === null || x === undefined || Number.isNaN(x) ? "–" : nf1.format(x).replace("-", "−");

export const pct = (x: number | null | undefined): string =>
  x === null || x === undefined ? "–" : `${Math.round(x * 100)}%`;

export const int = (x: number | null | undefined): string => (x === null || x === undefined ? "–" : String(Math.round(x)));

/** "1–6", "1–4, 6, 9–10" */
export function weekRanges(weeks: number[]): string {
  const sorted = [...weeks].sort((a, b) => a - b);
  const parts: string[] = [];
  for (let i = 0; i < sorted.length; i++) {
    let j = i;
    while (j + 1 < sorted.length && sorted[j + 1] === sorted[j] + 1) j++;
    parts.push(i === j ? `${sorted[i]}` : `${sorted[i]}–${sorted[j]}`);
    i = j;
  }
  return parts.join(", ");
}

export const weeksLabel = (weeks: number[]): string =>
  weeks.length === 0 ? "No weeks" : `${weeks.length === 1 ? "Week" : "Weeks"} ${weekRanges(weeks)}`;

export const pointTypeLabel: Record<PointType, string> = {
  "Average Points": "average points",
  "Total Points": "total points",
  "Average Projected Points": "average projection",
  "Total Projected Points": "total projection",
};

function hsl(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  const r = ((n >> 16) & 255) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
    h /= 6;
  }
  return [Math.round(h * 360), Math.round(s * 100), l];
}

/** A team colour lifted so it reads as a mark on the navy ground */
export function teamHue(hex: string | null | undefined): string {
  if (!hex) return "#9fb3c8";
  if (!hex.startsWith("#")) return hex;
  const [h, s, l] = hsl(hex);
  return `hsl(${h} ${s}% ${Math.round(Math.max(l, 0.58) * 100)}%)`;
}

/** A team colour deep enough to carry white text, for filled boxes */
export function teamFill(hex: string | null | undefined): string {
  if (!hex) return "#123a66";
  const [h, s, l] = hsl(hex);
  return `hsl(${h} ${Math.min(s, 70)}% ${Math.round(Math.min(Math.max(l, 0.3), 0.4) * 100)}%)`;
}

export function timeAgo(iso: string | null): string {
  if (!iso) return "";
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  return new Date(iso).toLocaleDateString("en", { month: "short", day: "numeric" });
}

/** Long names keep the last name whole and shorten the first: "Jaxon Smith-Njigba" → "J. Smith-Njigba" */
export function shortName(name: string, max = 14): string {
  if (name.length <= max) return name;
  const [first, ...rest] = name.split(" ");
  if (!rest.length || first.endsWith(".")) return name;
  return `${first[0]}. ${rest.join(" ")}`;
}
