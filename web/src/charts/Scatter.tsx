import { useMemo, useState } from "react";
import { pct, pts, shortName } from "../data/format";
import { linear, ticks, useWidth } from "./scale";

export interface ScatterPoint {
  id: string;
  label: string;
  sub: string;
  x: number;
  y: number;
  color: string;
}

interface Props {
  points: ScatterPoint[];
  yLabel: string;
  onSelect?: (id: string) => void;
}

const M = { top: 16, right: 12, bottom: 48, left: 48 };

export function Scatter({ points, yLabel, onSelect }: Props) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<ScatterPoint | null>(null);
  const narrow = width < 600;
  const height = narrow ? 420 : 560;
  const radius = narrow ? 5 : 7;
  const ys = points.map((p) => p.y);
  const yTicks = ticks(Math.min(...ys), Math.max(...ys, 1), 5);
  const x = linear(0, 1, M.left, width - M.right);
  const y = linear(yTicks[0], yTicks.at(-1)!, height - M.bottom, M.top);

  const labels = useMemo(() => {
    if (!width) return [];
    const placed: { x0: number; x1: number; y0: number; y1: number }[] = [];
    const ranked = [...points].sort((a, b) => b.y * (0.5 + b.x) - a.y * (0.5 + a.x));
    const out: { p: ScatterPoint; text: string; tx: number; ty: number; anchor: "start" | "end" }[] = [];
    for (const p of ranked) {
      const text = narrow ? shortName(p.label, 10) : p.label;
      const w = text.length * (narrow ? 6.2 : 6.8) + 4;
      const px = x(p.x);
      const py = y(p.y);
      const anchor = px + 10 + w > width - M.right ? "end" : "start";
      const x0 = anchor === "start" ? px + 9 : px - 9 - w;
      const box = { x0, x1: x0 + w, y0: py - 8, y1: py + 8 };
      const hitsLabel = placed.some((b) => box.x0 < b.x1 && box.x1 > b.x0 && box.y0 < b.y1 && box.y1 > b.y0);
      const hitsDot = points.some((q) => q !== p && x(q.x) > box.x0 - 3 && x(q.x) < box.x1 + 3 && y(q.y) > box.y0 - 3 && y(q.y) < box.y1 + 3);
      if (hitsLabel || hitsDot) continue;
      placed.push(box);
      out.push({ p, text, tx: anchor === "start" ? px + 9 : px - 9, ty: py + 4, anchor });
      if (out.length >= 30) break;
    }
    return out;
  }, [points, width, x, y]);

  const top = Math.max(...ys);
  const bottom = Math.min(...ys);

  return (
    <div className="chart-wrap" ref={ref}>
      {width > 0 && (
        <svg className="chart" width={width} height={height} role="img" aria-label={`Dependability against ${yLabel} for ${points.length} players`}>
          {yTicks.map((t) => (
            <g key={t}>
              <line className={t === 0 ? "baseline" : "gridline"} x1={M.left} x2={width - M.right} y1={y(t)} y2={y(t)} />
              <text x={M.left - 8} y={y(t) + 4} textAnchor="end">
                {t}
              </text>
            </g>
          ))}
          {(narrow ? [0, 0.5, 1] : [0, 0.25, 0.5, 0.75, 1]).map((t) => (
            <text key={t} x={x(t)} y={height - M.bottom + 22} textAnchor={t === 0 ? "start" : t === 1 ? "end" : "middle"}>
              {pct(t)}
            </text>
          ))}
          <text x={(M.left + width - M.right) / 2} y={height - 4} textAnchor="middle">
            Dependability
          </text>
          <text transform={`translate(10 ${(M.top + height - M.bottom) / 2}) rotate(-90)`} textAnchor="middle">
            {yLabel}
          </text>
          {/* The trade-off line from the old dashboard: from the top scorer's level at 0% to the lowest at 100% */}
          {points.length > 1 && <line x1={x(0)} y1={y(top)} x2={x(1)} y2={y(bottom)} stroke="#ffffff" strokeOpacity={0.5} strokeDasharray="5 5" />}
          {points.map((p) => (
            <circle
              key={p.id}
              className="dot"
              cx={x(p.x)}
              cy={y(p.y)}
              r={hover === p ? radius + 2 : radius}
              fill={p.color}
              stroke="#011224"
              strokeWidth={1.5}
              opacity={hover && hover !== p ? 0.4 : 1}
              onMouseEnter={() => setHover(p)}
              onMouseLeave={() => setHover(null)}
              onClick={() => onSelect?.(p.id)}
            />
          ))}
          {labels.map(({ p, text, tx, ty, anchor }) => (
            <text key={p.id} className={`label ${hover === p ? "strong" : ""}`} x={tx} y={ty} textAnchor={anchor} pointerEvents="none">
              {text}
            </text>
          ))}
        </svg>
      )}
      {hover && (
        <div className="tooltip" style={{ left: Math.min(x(hover.x) + 12, width - 200), top: Math.max(y(hover.y) - 64, 0) }}>
          <strong>{hover.label}</strong>
          <div className="muted">{hover.sub}</div>
          <div>
            {yLabel}: {pts(hover.y)} · Dependability {pct(hover.x)}
          </div>
        </div>
      )}
    </div>
  );
}
