import { useState } from "react";
import { POSITIONS } from "../../../shared/stats";
import { filterRows, opponentTable, type OpponentCell } from "../data/analysis";
import { ordinal } from "../data/compare";
import { pointTypeLabel, pts, weeksLabel } from "../data/format";
import { rankDesc } from "../data/stats";
import type { Position } from "../data/types";
import { Card, Empty, Header, TeamDot } from "../components/Layout";
import type { ViewProps } from "./shared";

type Column = Position | "Total";

export function Matchups({ season, meta, filters }: ViewProps) {
  const [mode, setMode] = useState<"chart" | "table">("chart");
  const [sortBy, setSortBy] = useState<Column>("Total");
  const [hover, setHover] = useState<{ opp: string; position: Position | null } | null>(null);
  const cells = opponentTable(filterRows(season, filters), season);
  const type = filters.pointType;
  const positions = POSITIONS.filter((p) => filters.positions.includes(p) && cells.some((c) => c.position === p));
  const columns: Column[] = positions.length > 1 ? ["Total", ...positions] : positions;
  const sortColumn = columns.includes(sortBy) ? sortBy : columns[0];

  const byOpponent = new Map<string, Map<Position, OpponentCell>>();
  for (const c of cells) {
    if (!byOpponent.has(c.opponent)) byOpponent.set(c.opponent, new Map());
    byOpponent.get(c.opponent)!.set(c.position, c);
  }
  const value = (opp: string, col: Column) =>
    col === "Total" ? positions.reduce((s, p) => s + Math.max(byOpponent.get(opp)!.get(p)?.[type] ?? 0, 0), 0) : (byOpponent.get(opp)!.get(col)?.[type] ?? 0);
  const order = mode === "chart" ? "Total" : sortColumn;
  const opponents = [...byOpponent.keys()].sort((x, y) => value(y, order) - value(x, order) || x.localeCompare(y));
  const ranks = new Map(columns.map((col) => [col, rankDesc(opponents, (o) => value(o, col))]));
  const maxTotal = Math.max(...opponents.map((o) => value(o, "Total")), 0);
  const label = pointTypeLabel[type];
  const positionRank = (opp: string, p: Position) => ranks.get(p)?.get(opp) ?? rankDesc(opponents, (o) => value(o, p)).get(opp)!;

  return (
    <>
      <Header title="Points allowed" season={season} />
      <Card
        title={`Fantasy ${label} allowed by each defense`}
        meta={
          <div className="segmented" role="radiogroup" aria-label="Show as" style={{ width: 200 }}>
            {(["chart", "table"] as const).map((m) => (
              <button type="button" role="radio" key={m} aria-checked={mode === m} onClick={() => setMode(m)}>
                {m === "chart" ? "Chart" : "Table"}
              </button>
            ))}
          </div>
        }
      >
        {opponents.length === 0 ? (
          <Empty>No games in this selection. Add a week or a position.</Empty>
        ) : mode === "chart" ? (
          <>
            <div className="legend" style={{ marginBottom: 16 }}>
              {positions.map((p) => (
                <span key={p}>
                  <i style={{ background: `var(--pos-${p})` }} />
                  {p}
                </span>
              ))}
              <span className="muted">· {weeksLabel(filters.weeks)} · {season.season} · hover a bar for the details</span>
            </div>
            <ul className={`stacked ${hover ? "dim" : ""}`} onMouseLeave={() => setHover(null)}>
              {opponents.map((opp) => (
                <li key={opp} style={{ position: "relative" }}>
                  <span className="team" title={meta.teams[opp]?.name}>
                    <TeamDot color={meta.teams[opp]?.color} />
                    {opp}
                  </span>
                  <span className="track">
                    {positions.map((p) => {
                      const v = Math.max(value(opp, p), 0);
                      return (
                        <span
                          key={p}
                          className={`seg ${hover?.opp === opp && (hover.position === null || hover.position === p) ? "on" : ""}`}
                          style={{ width: `${maxTotal > 0 ? (v / maxTotal) * 100 : 0}%`, background: `var(--pos-${p})` }}
                          onMouseEnter={() => setHover({ opp, position: p })}
                        />
                      );
                    })}
                  </span>
                  <span className="value">{pts(value(opp, "Total"))}</span>
                  {hover?.opp === opp && (
                    <div className="tooltip" style={{ left: 88, top: 34 }}>
                      <strong>{meta.teams[opp]?.name ?? opp}</strong>
                      {positions.map((p) => (
                        <div key={p} style={{ fontWeight: hover.position === p ? 700 : 400 }}>
                          <i style={{ background: `var(--pos-${p})` }} />
                          {p}: {pts(value(opp, p))} <span className="muted">({ordinal(positionRank(opp, p))} most)</span>
                        </div>
                      ))}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </>
        ) : (
          <div className="table-frame">
            <table className="data">
              <thead>
                <tr>
                  <th className="sticky">Defense</th>
                  {columns.map((col) => (
                    <th key={col} className="num">
                      <button type="button" className="sort" aria-sort={sortColumn === col ? "descending" : undefined} onClick={() => setSortBy(col)}>
                        {col !== "Total" && <i className="team-dot" style={{ background: `var(--pos-${col})`, marginRight: 6 }} />}
                        {col}
                        {sortColumn === col && " ↓"}
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {opponents.map((opp) => (
                  <tr key={opp}>
                    <td className="sticky id">
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                        <TeamDot color={meta.teams[opp]?.color} />
                        {meta.teams[opp]?.name ?? opp}
                      </span>
                    </td>
                    {columns.map((col) => (
                      <td key={col} className={`num ${col === sortColumn ? "key" : ""}`}>
                        {pts(value(opp, col))} <span className="muted" style={{ fontSize: 12 }}>({ranks.get(col)!.get(opp)})</span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
