import { useState } from "react";
import { compare, comparePlayer, positionMatchups, STAT_HELP, type ComparePlayer, type Comparison } from "../data/compare";
import { teamHue } from "../data/format";
import type { Meta, PlayerInfo, Season } from "../data/types";
import { PlayerSearch } from "../components/Controls";
import { Header, Stamp } from "../components/Layout";
import { PlayerLink } from "./shared";

interface Props {
  season: Season;
  meta: Meta;
  a: PlayerInfo;
  b: PlayerInfo;
  onChange: (side: "a" | "b", p: PlayerInfo) => void;
  openPlayer: (p: PlayerInfo) => void;
}

export function CompareView({ season, meta, a, b, onChange, openPlayer }: Props) {
  const [openHelp, setOpenHelp] = useState<string | null>(null);
  const matchups = positionMatchups(season);
  const result = compare(comparePlayer(season, a, matchups), comparePlayer(season, b, matchups));
  const pick = result.verdict === "a" ? a : result.verdict === "b" ? b : null;
  const card = (side: "a" | "b", p: ComparePlayer) => (
    <CompareCard
      side={side}
      player={p}
      result={result}
      season={season}
      meta={meta}
      openHelp={openHelp}
      setOpenHelp={setOpenHelp}
      onChange={(np) => onChange(side, np)}
      openPlayer={openPlayer}
    />
  );

  return (
    <>
      <Header
        title="Start or sit"
        aside={<Stamp season={season} />}
        finding={
          pick ? (
            <>
              Week {season.currentWeek}: start <strong>{pick.name}</strong>. {result.reason}.
            </>
          ) : (
            <>
              Week {season.currentWeek}: a toss-up. {result.reason}.
            </>
          )
        }
      />
      <div className="grid halves">
        {card("a", comparePlayer(season, a, matchups))}
        {card("b", comparePlayer(season, b, matchups))}
      </div>
    </>
  );
}

interface CardProps {
  side: "a" | "b";
  player: ComparePlayer;
  result: Comparison;
  season: Season;
  meta: Meta;
  openHelp: string | null;
  setOpenHelp: (s: string | null) => void;
  onChange: (p: PlayerInfo) => void;
  openPlayer: (p: PlayerInfo) => void;
}

function CompareCard({ side, player, result, season, meta, openHelp, setOpenHelp, onChange, openPlayer }: CardProps) {
  const p = player.player;
  const contested = result.rows.filter((r) => r.winner !== "tie").length;
  return (
    <section className="card compare-card" style={{ ["--team" as string]: teamHue(meta.teams[p.team]?.color) }}>
      <PlayerSearch players={season.players} value={p} onChange={onChange} label={`Player ${side.toUpperCase()}`} />
      <div className="compare-name">
        <PlayerLink player={p} openPlayer={openPlayer} />
        {result.verdict === side && <span className="pill start">START</span>}
        {result.verdict === "tie" && <span className="pill tossup">TOSS-UP</span>}
      </div>
      <p className="compare-sub">
        {p.position} at {meta.teams[p.team]?.name ?? p.team} · wins {result.wins[side]} of {contested} stats
      </p>
      {result.rows.map((row) => {
        const stat = row[side];
        const name = row.stat.stat;
        const tone = row.winner === "tie" ? "" : row.winner === side ? "win" : "lose";
        return (
          <div className="stat-row" key={name}>
            <details
              className="stat-help"
              open={openHelp === name}
              onToggle={(e) => {
                const open = (e.currentTarget as HTMLDetailsElement).open;
                if (open) setOpenHelp(name);
                else if (openHelp === name) setOpenHelp(null);
              }}
            >
              <summary>{name}</summary>
              <p>{STAT_HELP[name]}</p>
            </details>
            <span className={`v ${tone}`}>
              {stat.display}
              {stat.note && <small>{stat.note}</small>}
            </span>
          </div>
        );
      })}
    </section>
  );
}
