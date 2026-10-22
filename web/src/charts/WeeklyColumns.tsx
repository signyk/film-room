import { useState } from "react";
import { pts } from "../data/format";
import { linear, ticks, useWidth } from "./scale";

export interface WeekBar {
  week: number;
  opponent: string | null;
  home: boolean | null;
  points: number | null;
  projection: number | null;
  played: boolean;
}

const M = { top: 16, right: 0, bottom: 52, left: 40 };

export function WeeklyColumns({ weeks, hue }: { weeks: WeekBar[]; hue: string }) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<WeekBar | null>(null);
  const height = width < 600 ? 260 : 340;
  const values = weeks.flatMap((w) => [w.points ?? 0, w.projection ?? 0]);
  const yTicks = ticks(Math.min(0, ...values), Math.max(...values, 5), 4);
  const y = linear(yTicks[0], yTicks.at(-1)!, height - M.bottom, M.top);
  const band = (width - M.left - M.right) / Math.max(weeks.length, 1);
  const bar = Math.min(28, (band - 8) / 2);
  const showOpponents = band >= 30;

  return (
    <div className="chart-wrap" ref={ref}>
      {width > 0 && (
        <svg className="chart" width={width} height={height} role="img" aria-label="Fantasy points and projection per week">
          {yTicks.map((t) => (
            <g key={t}>
              <line className={t === 0 ? "baseline" : "gridline"} x1={M.left} x2={width - M.right} y1={y(t)} y2={y(t)} />
              <text x={M.left - 8} y={y(t) + 4} textAnchor="end">
                {t}
              </text>
            </g>
          ))}
          {weeks.map((w, i) => {
            const cx = M.left + band * i + band / 2;
            const zero = y(0);
            const ph = w.points !== null ? zero - y(w.points) : 0;
            const jh = w.projection !== null ? zero - y(w.projection) : 0;
            return (
              <g key={w.week} onMouseEnter={() => setHover(w)} onMouseLeave={() => setHover(null)} opacity={hover && hover !== w ? 0.55 : 1}>
                <rect x={M.left + band * i} y={M.top} width={band} height={height - M.top - M.bottom} fill="transparent" />
                {w.points !== null && <rect x={cx - bar - 1} y={ph >= 0 ? zero - ph : zero} width={bar} height={Math.abs(ph)} fill={hue} />}
                {w.projection !== null && (
                  <rect x={cx + 1} y={jh >= 0 ? zero - jh : zero} width={bar} height={Math.abs(jh)} fill={hue} fillOpacity={0.4} />
                )}
                <text x={cx} y={height - M.bottom + 20} textAnchor="middle" fill={w.played ? "#d2deea" : undefined}>
                  {w.week}
                </text>
                {showOpponents && (
                  <text x={cx} y={height - M.bottom + 38} textAnchor="middle">
                    {w.opponent ? `${w.home === false ? "@" : ""}${w.opponent}` : "bye"}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      )}
      {hover && (
        <div className="tooltip" style={{ left: Math.min(M.left + band * weeks.indexOf(hover) + band, width - 180), top: 0 }}>
          <strong>Week {hover.week}</strong> {hover.opponent ? `${hover.home === false ? "at" : "vs"} ${hover.opponent}` : "· bye"}
          <div>Scored {pts(hover.points)}</div>
          <div className="muted">Projected {pts(hover.projection)}</div>
        </div>
      )}
    </div>
  );
}
