import { useEffect, useState } from "react";
import { Scatter } from "../charts/Scatter";
import { filterRows, summarize, topPlayers, type PlayerSummary } from "../data/analysis";
import { pct, pointTypeLabel, pts, teamHue, weeksLabel } from "../data/format";
import { Dropdown } from "../components/Controls";
import { Icon } from "../components/Icons";
import { Card, Empty, Header } from "../components/Layout";
import { PlayerLink, type ViewProps } from "./shared";

const PHONE = "(max-width: 860px)";

/** Follows a media query, so the default view can differ between phone and desktop */
function useMatches(query: string): boolean {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const list = window.matchMedia(query);
    const onChange = () => setMatches(list.matches);
    list.addEventListener("change", onChange);
    return () => list.removeEventListener("change", onChange);
  }, [query]);
  return matches;
}

export function Dependability({ season, meta, filters, openPlayer }: ViewProps) {
  // The table reads better on a phone, the chart on a wide screen; a choice made here sticks
  const phone = useMatches(PHONE);
  const [chosen, setChosen] = useState<"chart" | "table" | null>(null);
  const mode = chosen ?? (phone ? "table" : "chart");
  const top = topPlayers(summarize(filterRows(season, filters)), filters.pointType, filters.n);
  const measured = top.filter((s) => s.dependability !== null);
  const left = top.length - measured.length;
  const label = pointTypeLabel[filters.pointType];
  const yLabel = label[0].toUpperCase() + label.slice(1);

  return (
    <>
      <Header title="Dependability" season={season} />
      <Card
        title={`Dependability and ${label}`}
        meta={
          <div className="card-tools">
            <div className="segmented" role="radiogroup" aria-label="Show as">
              {(["chart", "table"] as const).map((m) => (
                <button type="button" role="radio" key={m} aria-checked={mode === m} onClick={() => setChosen(m)}>
                  {m === "chart" ? "Chart" : "Table"}
                </button>
              ))}
            </div>
          <Dropdown
            align="right"
            triggerClass="info-trigger"
            panelClass="info-menu"
            label={
              <>
                <Icon name="info" />
                How is this measured?
              </>
            }
          >
            {() => (
              <>
                <p>Dependability is 100% minus the standard deviation divided by the average of a player's points in the chosen weeks.</p>
                <p>At 100% a player scores the same every week; at 50% their score swings by half their average. Top right is high scoring and steady.</p>
              </>
            )}
          </Dropdown>
          </div>
        }
      >
        {measured.length < 2 ? (
          <Empty>Choose at least two played weeks to measure dependability.</Empty>
        ) : mode === "table" ? (
          <DependabilityTable rows={measured} meta={meta} pointType={filters.pointType} openPlayer={openPlayer} />
        ) : (
          <Scatter
            yLabel={yLabel}
            points={measured.map((s) => ({
              id: s.player.key,
              label: s.player.name,
              sub: `${s.player.position} · ${meta.teams[s.player.team]?.name ?? s.player.team} · ${s.games} games`,
              x: s.dependability!,
              y: s[filters.pointType],
              color: teamHue(meta.teams[s.player.team]?.color),
            }))}
            onSelect={(key) => openPlayer(top.find((s) => s.player.key === key)!.player)}
          />
        )}
        {left > 0 && (
          <p className="muted" style={{ margin: "14px 0 0", fontSize: 13 }}>
            {left} {left === 1 ? "player has" : "players have"} fewer than two games and {left === 1 ? "is" : "are"} not shown. {weeksLabel(filters.weeks)}.
          </p>
        )}
      </Card>
    </>
  );
}

type SortKey = "dependability" | "points";

function DependabilityTable(props: { rows: PlayerSummary[]; meta: ViewProps["meta"]; pointType: ViewProps["filters"]["pointType"]; openPlayer: ViewProps["openPlayer"] }) {
  const { rows, meta, pointType, openPlayer } = props;
  const [sort, setSort] = useState<SortKey>("dependability");
  const value = (r: PlayerSummary) => (sort === "dependability" ? r.dependability! : r[pointType]);
  const sorted = [...rows].sort((a, b) => value(b) - value(a));
  const short: Record<typeof pointType, string> = {
    "Average Points": "Avg pts",
    "Total Points": "Total pts",
    "Average Projected Points": "Avg proj",
    "Total Projected Points": "Total proj",
  };
  const header = (key: SortKey, text: string) => (
    <button type="button" className="sort" aria-sort={sort === key ? "descending" : undefined} onClick={() => setSort(key)}>
      {text}
      {sort === key && " ↓"}
    </button>
  );
  return (
    <table className="data dep-table">
      <thead>
        <tr>
          <th>Player</th>
          <th className="dep-col">{header("dependability", "Dependability")}</th>
          <th className="num">{header("points", short[pointType])}</th>
        </tr>
      </thead>
      <tbody>
        {sorted.map((r) => {
          const hue = teamHue(meta.teams[r.player.team]?.color);
          return (
            <tr key={r.player.key}>
              <td className="id">
                <span className="dep-player">
                  <span className="team-dot" style={{ background: hue }} />
                  <span>
                    <PlayerLink player={r.player} openPlayer={openPlayer} short />
                    <small>
                      {r.player.position} · {r.player.team} · {r.games} games
                    </small>
                  </span>
                </span>
              </td>
              <td className="dep-col">
                <span className="dep-bar">
                  <span className="dep-track">
                    <span style={{ width: `${r.dependability! * 100}%`, background: hue }} />
                  </span>
                  <b>{pct(r.dependability)}</b>
                </span>
              </td>
              <td className="num key">{pts(r[pointType])}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
