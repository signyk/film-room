import { WeeklyColumns } from "../charts/WeeklyColumns";
import { filterRows, positionRanks, summarize } from "../data/analysis";
import { INJURY_LABELS, injuryLevel, ordinal } from "../data/compare";
import { int, pct, pointTypeLabel, pts, teamFill, teamHue, weeksLabel } from "../data/format";
import { present } from "../data/stats";
import type { PlayerInfo, Position } from "../data/types";
import { PlayerSearch } from "../components/Controls";
import { Card, Empty, Header } from "../components/Layout";
import type { ViewProps } from "./shared";

/** Stat columns shown per position, most relevant first (from the old dashboard) */
const PASSING = ["Passing ATT", "Passing CMP", "Passing YDS", "Passing TD", "Passing 2-PT", "Passing INT", "Passing Sack"];
const RUSHING = ["Rushing ATT", "Rushing YDS", "Rushing TD", "Rushing 2-PT"];
const RECEIVING = ["Receiving TGT", "Receptions", "Receiving YDS", "Receiving TD", "Receiving 2-PT"];
const FUMBLES = ["Fumbles", "Fumbles Lost", "Fumble Recovery TD"];
const STAT_COLUMNS: Record<Position, string[]> = {
  QB: [...PASSING, ...RUSHING, ...RECEIVING, ...FUMBLES],
  RB: [...RUSHING, ...RECEIVING, ...FUMBLES, ...PASSING],
  WR: [...RECEIVING, ...RUSHING, ...FUMBLES, ...PASSING],
  TE: [...RECEIVING, ...RUSHING, ...FUMBLES, ...PASSING],
  K: ["FGA", "FGM", "FGM 0-19", "FGM 20-29", "FGM 30-39", "FGM 40-49", "FGM 50+", "XPA", "XPM"],
  DEF: ["Sacks", "INT", "Forced Fumbles", "Fumble Recoveries", "DEF TD", "RET TD", "Blocked Kicks", "YDS Allowed", "PTS Allowed", "Safeties"],
};

interface Props extends ViewProps {
  player: PlayerInfo | null;
  onPlayer: (p: PlayerInfo) => void;
}

export function PlayerView({ season, meta, filters, player, onPlayer }: Props) {
  const search = <PlayerSearch players={season.players} value={player} onChange={onPlayer} label="Choose player" />;
  if (!player) {
    return (
      <>
        <Header title="Player" aside={search} />
        <Empty>Search for a player to see their season.</Empty>
      </>
    );
  }

  const weekRows = filterRows(season, filters, "none");
  const ranks = positionRanks(summarize(weekRows), filters.pointType);
  const rank = ranks.get(player);
  const rows = weekRows.filter((r) => r.player === player).sort((a, b) => a.week - b.week);
  const games = rows.filter((r) => r.points !== null);
  const points = present(games.map((g) => g.points));
  const avg = points.length ? points.reduce((a, b) => a + b, 0) / points.length : null;
  const best = games.reduce<(typeof games)[number] | null>((b, g) => (b === null || g.points! > b.points! ? g : b), null);
  const beat = games.filter((g) => g.projection !== null && g.points! > g.projection).length;
  const hue = teamHue(meta.teams[player.team]?.color);
  const fill = teamFill(meta.teams[player.team]?.color);
  const level = injuryLevel(player.injury);
  const columns = STAT_COLUMNS[player.position].filter((c) => season.statColumns.includes(c));
  const tableRows = rows.filter((r) => r.opponent);

  return (
    <>
      <Header
        title={
          <span className="player-title">
            <span className="stripe" style={{ background: hue }} />
            {player.name}
            {level > 0 && <span className={`pill ${level >= 3 ? "out" : "warning"}`}>{INJURY_LABELS[player.injury!] ?? player.injury}</span>}
          </span>
        }
        finding={`${player.position} · ${meta.teams[player.team]?.name ?? player.team} · ${weeksLabel(filters.weeks)} of ${season.season}`}
        aside={search}
      />

      <section className="values" aria-label="Season summary">
        <div className="value-box" style={{ background: fill }}>
          <div className="value">{rank && points.length ? ordinal(rank.rank) : "–"}</div>
          <div className="label">Rank among {player.position}s</div>
          <div className="sub">by {pointTypeLabel[filters.pointType]}</div>
        </div>
        <div className="value-box" style={{ background: fill }}>
          <div className="value">{pts(avg)}</div>
          <div className="label">Average points</div>
          <div className="sub">
            over {games.length} {games.length === 1 ? "game" : "games"}
          </div>
        </div>
        <div className="value-box" style={{ background: fill }}>
          <div className="value">{pts(best?.points)}</div>
          <div className="label">Most points</div>
          <div className="sub">{best ? `Week ${best.week} ${best.home === false ? "at" : "vs"} ${best.opponent}` : "No games yet"}</div>
        </div>
        <div className="value-box" style={{ background: fill }}>
          <div className="value">
            {games.length ? pct(beat / games.length) : "–"}
            <small>
              {beat} of {games.length}
            </small>
          </div>
          <div className="label">Weeks above projection</div>
          <div className="ratio" aria-hidden="true">
            <div style={{ width: games.length ? `${(beat / games.length) * 100}%` : 0 }} />
          </div>
        </div>
      </section>

      <Card
        title="Points per week"
        meta={
          <span className="legend">
            <span>
              <i style={{ background: hue }} />
              Scored
            </span>
            <span>
              <i style={{ background: hue, opacity: 0.4 }} />
              Projected
            </span>
          </span>
        }
      >
        {rows.length === 0 ? (
          <Empty>No weeks selected.</Empty>
        ) : (
          <WeeklyColumns
            hue={hue}
            weeks={rows.map((r) => ({ ...r, played: r.week < season.currentWeek }))}
          />
        )}
      </Card>

      <h2 className="section-title">Game log</h2>
      <Card>
        {tableRows.length === 0 ? (
          <Empty>No games in the selected weeks.</Empty>
        ) : (
          <div className="table-frame">
            <table className="data">
              <thead>
                <tr>
                  <th className="sticky">Week</th>
                  <th>Opponent</th>
                  <th className="num">Points</th>
                  <th className="num">Projected</th>
                  {columns.map((c) => (
                    <th key={c} className="num">
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableRows.map((r) => (
                  <tr key={r.week}>
                    <td className="sticky id">{r.week}</td>
                    <td>
                      {r.home === false ? "at " : "vs "}
                      {r.opponent}
                    </td>
                    <td className="num key">{pts(r.points)}</td>
                    <td className="num">{pts(r.projection)}</td>
                    {columns.map((c) => {
                      const v = r.stats?.[season.statColumns.indexOf(c)] ?? null;
                      return (
                        <td key={c} className={`num ${v === 0 ? "zero" : ""}`}>
                          {int(v)}
                        </td>
                      );
                    })}
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
