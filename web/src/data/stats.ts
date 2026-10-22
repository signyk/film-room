export const present = (values: (number | null)[]): number[] => values.filter((v): v is number => v !== null);

export const sum = (values: number[]): number => values.reduce((a, b) => a + b, 0);

export const mean = (values: number[]): number | null => (values.length ? sum(values) / values.length : null);

export function sd(values: number[]): number | null {
  if (values.length < 2) return null;
  const m = sum(values) / values.length;
  return Math.sqrt(sum(values.map((v) => (v - m) ** 2)) / (values.length - 1));
}

export function rankDesc<T>(items: T[], value: (item: T) => number): Map<T, number> {
  const sorted = [...items].sort((a, b) => value(b) - value(a));
  const ranks = new Map<T, number>();
  sorted.forEach((item, i) => {
    const prev = sorted[i - 1];
    ranks.set(item, prev !== undefined && value(prev) === value(item) ? ranks.get(prev)! : i + 1);
  });
  return ranks;
}

export function dependability(points: number[]): number | null {
  const m = mean(points);
  const s = sd(points);
  if (m === null || s === null || m <= 0) return null;
  return Math.max(0, 1 - s / m);
}
