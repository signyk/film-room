import { useMemo, useState } from "react";
import { filterRows, summarize, type PlayerSummary } from "../data/analysis";
import { pct, pts, weeksLabel } from "../data/format";
import { Card, Empty, Header, TeamDot } from "../components/Layout";
import { PlayerLink, type ViewProps } from "./shared";

type Key = "name" | "team" | "position" | "games" | "Average Points" | "Total Points" | "Average Projected Points" | "Total Projected Points" | "dependability";

const COLUMNS: { key: Key; label: string; num: boolean }[] = [
  { key: "name", label: "Player", num: false },
  { key: "team", label: "Team", num: false },
  { key: "position", label: "Pos", num: false },
  { key: "games", label: "Games", num: true },
  { key: "Average Points", label: "Avg points", num: true },
  { key: "Total Points", label: "Total points", num: true },
  { key: "Average Projected Points", label: "Avg projected", num: true },
  { key: "Total Projected Points", label: "Total projected", num: true },
  { key: "dependability", label: "Dependability", num: true },
];

function get(s: PlayerSummary, key: Key): string | number {
  if (key === "name" || key === "team" || key === "position") return s.player[key];
  return s[key] ?? -1;
}

function csv(rows: PlayerSummary[]): string {
  const header = COLUMNS.map((c) => c.label);
  const lines = rows.map((s) =>
    COLUMNS.map((c) => {
      const v = get(s, c.key);
      if (typeof v === "string") return `"${v.replaceAll('"', '""')}"`;
      if (c.key === "dependability") return s.dependability === null ? "" : s.dependability.toFixed(3);
      return Number.isInteger(v) ? String(v) : v.toFixed(2);
    }).join(","),
  );
  return [header.join(","), ...lines].join("\n");
}

export function DataView({ season, meta, filters, openPlayer }: ViewProps) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<{ key: Key; desc: boolean }>({ key: filters.pointType, desc: true });
  const summary = useMemo(() => summarize(filterRows(season, filters)), [season, filters]);
  const q = query.trim().toLowerCase();
  const rows = summary
    .filter((s) => !q || s.player.name.toLowerCase().includes(q) || s.player.team.toLowerCase() === q)
    .sort((x, y) => {
      const a = get(x, sort.key);
      const b = get(y, sort.key);
      const cmp = typeof a === "string" ? a.localeCompare(b as string) : a - (b as number);
      return sort.desc ? -cmp : cmp;
    });

  const download = () => {
    const url = URL.createObjectURL(new Blob([csv(rows)], { type: "text/csv" }));
    const link = Object.assign(document.createElement("a"), { href: url, download: `fantabolti-${season.season}.csv` });
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <Header title="All players" season={season} finding={`${summary.length} players, ${weeksLabel(filters.weeks).toLowerCase()} of ${season.season}.`} />
      <Card
        title={`${rows.length} ${rows.length === 1 ? "player" : "players"}`}
        meta={
          <span className="toolbar">
            <input className="search" type="search" placeholder="Search name or team" aria-label="Search players" value={query} onChange={(e) => setQuery(e.target.value)} />
            <button type="button" className="control" onClick={download} disabled={!rows.length}>
              Download CSV
            </button>
          </span>
        }
      >
        {rows.length === 0 ? (
          <Empty>No players match.</Empty>
        ) : (
          <div className="table-frame" style={{ maxHeight: "70vh" }}>
            <table className="data">
              <thead>
                <tr>
                  {COLUMNS.map((c, i) => (
                    <th key={c.key} className={`${c.num ? "num" : ""} ${i === 0 ? "sticky" : ""}`} aria-sort={sort.key === c.key ? (sort.desc ? "descending" : "ascending") : undefined}>
                      <button
                        type="button"
                        className="sort"
                        aria-sort={sort.key === c.key ? (sort.desc ? "descending" : "ascending") : undefined}
                        onClick={() => setSort({ key: c.key, desc: sort.key === c.key ? !sort.desc : c.num })}
                      >
                        <span>{c.label}</span>
                        {sort.key === c.key && (sort.desc ? " ↓" : " ↑")}
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((s) => (
                  <tr key={s.player.key}>
                    <td className="sticky id">
                      <PlayerLink player={s.player} openPlayer={openPlayer} />
                    </td>
                    <td>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                        <TeamDot color={meta.teams[s.player.team]?.color} />
                        {s.player.team}
                      </span>
                    </td>
                    <td>{s.player.position}</td>
                    <td className="num">{s.games}</td>
                    <td className="num key">{pts(s["Average Points"])}</td>
                    <td className="num">{pts(s["Total Points"])}</td>
                    <td className="num">{pts(s["Average Projected Points"])}</td>
                    <td className="num">{pts(s["Total Projected Points"])}</td>
                    <td className="num">{pct(s.dependability)}</td>
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
