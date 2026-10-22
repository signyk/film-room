import { filterRows, summarize, topPlayers } from "../data/analysis";
import { pointTypeLabel, pts, teamHue, weeksLabel } from "../data/format";
import { Card, Empty, Header } from "../components/Layout";
import { PlayerLink, type ViewProps } from "./shared";

export function TopScorers({ season, meta, filters, openPlayer }: ViewProps) {
  const top = topPlayers(summarize(filterRows(season, filters)), filters.pointType, filters.n);
  const label = pointTypeLabel[filters.pointType];
  const max = Math.max(...top.map((s) => s[filters.pointType]), 0);

  return (
    <>
      <Header title="Top scorers" season={season} />
      <Card title={`Top ${top.length} by ${label}`} meta={`${weeksLabel(filters.weeks)} · ${season.season}`}>
        {top.length === 0 ? (
          <Empty>No players match these filters. Add a position, a team or a week.</Empty>
        ) : (
          <ol className="barlist">
            {top.map((s, i) => (
              <li key={s.player.key} title={`${s.player.name}, ${s.player.position}, ${meta.teams[s.player.team]?.name ?? s.player.team}`}>
                <span className="rank">{i + 1}</span>
                <span className="who">
                  <PlayerLink player={s.player} openPlayer={openPlayer} short />
                  <span className="tag">
                    {s.player.position} · {s.player.team}
                  </span>
                </span>
                {/* The number sits at the end of its own bar, so it is never read against another row */}
                <span className="track">
                  <span
                    className="bar"
                    style={{
                      width: `calc((100% - 64px) * ${max > 0 ? Math.max(s[filters.pointType], 0) / max : 0})`,
                      background: teamHue(meta.teams[s.player.team]?.color),
                    }}
                  />
                  <span className="value">{pts(s[filters.pointType])}</span>
                </span>
              </li>
            ))}
          </ol>
        )}
      </Card>
    </>
  );
}
