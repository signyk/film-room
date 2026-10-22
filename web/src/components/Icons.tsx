// 18px outline icons, 1.5px stroke, one set
import type { View } from "../data/url";

const paths: Record<View | "chevron" | "check" | "info" | "filter", string> = {
  top: "M4 5h12M4 10h9M4 15h14M4 20h6",
  dependability: "M4 19V5M4 19h16M8 15l3-4 3 2 5-6",
  player: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM5 20c.8-3.5 3.6-5.5 7-5.5s6.2 2 7 5.5",
  compare: "M7 4v16M17 4v16M3 8h8M13 16h8",
  matchups: "M12 3 5 6v5c0 4.5 3 8 7 10 4-2 7-5.5 7-10V6l-7-3Z",
  data: "M4 5h16v14H4zM4 10h16M4 14.5h16M10 5v14",
  chevron: "m6 9 6 6 6-6",
  check: "m5 12 5 5 9-10",
  filter: "M4 7h10M18 7h2M4 17h4M12 17h8M14 4v6M8 14v6",
  info: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 11v5M12 8h.01",
};

export function Icon({ name }: { name: keyof typeof paths }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={paths[name]} />
    </svg>
  );
}
