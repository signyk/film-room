import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { StateResponse } from "../../shared/stats";
import { POSITIONS } from "../../shared/stats";
import { splitWeeks } from "./data/analysis";
import { loadHistory, loadLiveSeason, loadMeta, loadState } from "./data/load";
import { routeUrl, useRoute, VIEWS, type Params, type View } from "./data/url";
import type { Meta, PlayerInfo, Position, Season } from "./data/types";
import { Field, PointTypePicker, PositionToggles, SeasonSelect, Stepper, TeamsPicker, WeeksPicker } from "./components/Controls";
import { Icon } from "./components/Icons";
import { Header } from "./components/Layout";
import { weekRanges } from "./data/format";
import { CompareView } from "./views/CompareView";
import { DataView } from "./views/DataView";
import { Dependability } from "./views/Dependability";
import { Matchups } from "./views/Matchups";
import { PlayerView } from "./views/PlayerView";
import type { ResolvedFilters } from "./views/shared";
import { TopScorers } from "./views/TopScorers";

const DEFAULT_POSITIONS: Position[] = ["QB", "RB", "WR", "TE"];
const DEFAULT_PLAYER = "Lamar Jackson";

/** Which filters each view uses; the rest are hidden there */
const VIEW_FILTERS: Record<View, { weeks: boolean; positions: boolean; teams: boolean; points: boolean; n: boolean }> = {
  top: { weeks: true, positions: true, teams: true, points: true, n: true },
  dependability: { weeks: true, positions: true, teams: true, points: true, n: true },
  player: { weeks: true, positions: false, teams: false, points: true, n: false },
  compare: { weeks: false, positions: false, teams: false, points: false, n: false },
  matchups: { weeks: true, positions: true, teams: true, points: true, n: false },
  data: { weeks: true, positions: true, teams: true, points: true, n: false },
};

type Loaded<T> = { status: "loading" } | { status: "ready"; value: T } | { status: "error"; error: string };

export function App() {
  const [route, navigate] = useRoute();
  const [base, setBase] = useState<Loaded<{ meta: Meta; state: StateResponse }>>({ status: "loading" });
  const [seasons, setSeasons] = useState<Record<number, Loaded<Season>>>({});
  const requested = useRef(new Set<number>());

  const loadBase = useCallback(() => {
    setBase({ status: "loading" });
    Promise.all([loadMeta(), loadState()])
      .then(([meta, state]) => setBase({ status: "ready", value: { meta, state } }))
      .catch((e: Error) => setBase({ status: "error", error: e.message }));
  }, []);
  useEffect(loadBase, [loadBase]);

  const ready = base.status === "ready" ? base.value : null;
  const live = ready?.meta.liveSeason;
  const seasonNumber = route.view === "compare" ? live : (route.params.season ?? live);

  const loadSeason = useCallback(
    (n: number, force = false) => {
      if (!ready || (requested.current.has(n) && !force)) return;
      requested.current.add(n);
      setSeasons((s) => ({ ...s, [n]: { status: "loading" } }));
      const promise = n === ready.meta.liveSeason ? loadLiveSeason(n, ready.state) : loadHistory(n);
      promise
        .then((value) => setSeasons((s) => ({ ...s, [n]: { status: "ready", value } })))
        .catch((e: Error) => setSeasons((s) => ({ ...s, [n]: { status: "error", error: e.message } })));
    },
    [ready],
  );
  useEffect(() => {
    if (seasonNumber) loadSeason(seasonNumber);
  }, [seasonNumber, loadSeason]);

  const loaded = seasonNumber ? seasons[seasonNumber] : undefined;
  const season = loaded?.status === "ready" ? loaded.value : null;

  const filters = useMemo<ResolvedFilters | null>(() => {
    if (!season || !ready) return null;
    const { past } = splitWeeks(season);
    const p = route.params;
    return {
      weeks: (p.weeks ?? (past.length ? past : season.weeks)).filter((w) => season.weeks.includes(w)),
      positions: p.positions ?? DEFAULT_POSITIONS,
      teams: p.teams ?? Object.values(ready.meta.divisions).flat(),
      pointType: p.pointType ?? "Average Points",
      n: Math.min(50, Math.max(1, p.n ?? 20)),
    };
  }, [season, ready, route.params]);

  const update = (patch: Params, view: View = route.view, replace = true) =>
    navigate({ view, params: { ...route.params, ...patch } }, { replace });

  const openPlayer = (player: PlayerInfo) =>
    navigate({ view: "player", params: { ...route.params, season: season?.season, player: player.name } });

  const findPlayer = (name: string | undefined) => (name ? season?.players.find((p) => p.name === name) : undefined);

  // On a phone the sidebar becomes a sheet that slides up from the bottom
  const [filtersOpen, setFiltersOpen] = useState(false);
  useEffect(() => {
    if (!filtersOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setFiltersOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.classList.add("sheet-open");
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.classList.remove("sheet-open");
    };
  }, [filtersOpen]);
  useEffect(() => setFiltersOpen(false), [route.view]);

  const topbar = (filterSummary: string | null) => (
    <header className="topbar">
      <a className="brand" href="/" aria-label="Film Room home">
        <img src="/mark.svg" alt="" width={44} height={44} />
        <span>Film Room</span>
      </a>
      <nav className="tabs" aria-label="Views">
        {VIEWS.map((v) => (
          <a
            key={v.id}
            href={routeUrl({ view: v.id, params: route.params })}
            aria-current={route.view === v.id ? "page" : undefined}
            onClick={(e) => {
              if (e.metaKey || e.ctrlKey || e.shiftKey) return;
              e.preventDefault();
              navigate({ view: v.id, params: route.params });
            }}
          >
            <Icon name={v.id} />
            <span>{v.short}</span>
          </a>
        ))}
      </nav>
      {filterSummary !== null && (
        <button type="button" className="filter-button" aria-expanded={filtersOpen} onClick={() => setFiltersOpen(true)}>
          <Icon name="filter" />
          <span>Filters</span>
        </button>
      )}
    </header>
  );

  const title = VIEWS.find((v) => v.id === route.view)!.title;
  let body;
  let sidebar: React.ReactNode = null;
  let filterSummary: string | null = null;
  if (base.status === "error" || loaded?.status === "error") {
    const message = base.status === "error" ? base.error : loaded?.status === "error" ? loaded.error : "";
    body = (
      <>
        <Header title={title} />
        <div className="card" style={{ marginTop: 24 }}>
          <p className="error">
            Couldn't load the data ({message}).
            <button type="button" className="text-button" onClick={() => (base.status === "error" ? loadBase() : loadSeason(seasonNumber!, true))}>
              Retry
            </button>
          </p>
        </div>
      </>
    );
  } else if (!ready || !season || !filters) {
    body = <Loading title={title} season={seasonNumber} />;
  } else {
    const show = VIEW_FILTERS[route.view];
    const { past, future } = splitWeeks(season);
    const allTeams = Object.values(ready.meta.divisions).flat();
    const summary = [
      show.weeks ? `Weeks ${weekRanges(filters.weeks) || "none"}` : null,
      show.positions ? filters.positions.join(" ") || "No positions" : null,
    ]
      .filter(Boolean)
      .join(" · ");
    filterSummary = `${season.season} · ${summary}`;
    sidebar = (
      <aside className={`sidebar ${filtersOpen ? "open" : ""}`} aria-label="Filters">
        <div className="sheet-head">
          <div>
            <strong>Filters</strong>
            <small>{filterSummary}</small>
          </div>
          <button type="button" className="done-button" onClick={() => setFiltersOpen(false)}>
            Done
          </button>
        </div>
        {season.live && season.currentWeek <= season.weeks.length && (
          <div className="week-now">
            Week {season.currentWeek} is next
            <small>Weeks before it are played</small>
          </div>
        )}
        <SeasonSelect
          seasons={[ready.meta.liveSeason, ...ready.meta.historySeasons].sort((a, b) => b - a)}
          value={season.season}
          onChange={(s) => update({ season: s === ready.meta.liveSeason ? undefined : s, weeks: undefined })}
        />
        {show.weeks && (
          <Field label="Weeks">
            <WeeksPicker past={past} future={future} value={filters.weeks} onChange={(weeks) => update({ weeks })} />
          </Field>
        )}
        {show.positions && (
          <PositionToggles
            value={filters.positions}
            onChange={(positions) => update({ positions: POSITIONS.filter((p) => positions.includes(p)) })}
          />
        )}
        {show.teams && (
          <Field label="Teams">
            <TeamsPicker meta={ready.meta} value={filters.teams} onChange={(teams) => update({ teams: teams.length === allTeams.length ? undefined : teams })} />
          </Field>
        )}
        {show.points && <PointTypePicker value={filters.pointType} onChange={(pointType) => update({ pointType })} />}
        {show.n && <Stepper label="Players to show" value={filters.n} min={1} max={50} onChange={(n) => update({ n })} />}
      </aside>
    );
    const props = { season, meta: ready.meta, filters, openPlayer };

    switch (route.view) {
      case "top":
        body = <TopScorers {...props} />;
        break;
      case "dependability":
        body = <Dependability {...props} />;
        break;
      case "player":
        body = (
          <PlayerView
            {...props}
            player={findPlayer(route.params.player) ?? findPlayer(DEFAULT_PLAYER) ?? season.players[0] ?? null}
            onPlayer={(p) => update({ player: p.name }, "player", false)}
          />
        );
        break;
      case "compare": {
        sidebar = null;
        filterSummary = null;
        // Default to the two highest projected players this week
        const byProjection = season.rows
          .filter((r) => r.week === season.currentWeek && r.projection !== null)
          .sort((x, y) => y.projection! - x.projection!)
          .map((r) => r.player);
        const a = findPlayer(route.params.a) ?? byProjection[0] ?? season.players[0];
        const b = findPlayer(route.params.b) ?? byProjection.find((p) => p !== a) ?? season.players[1];
        body = (
          <CompareView
            season={season}
            meta={ready.meta}
            a={a}
            b={b}
            onChange={(side, p) => update({ [side]: p.name }, "compare", false)}
            openPlayer={openPlayer}
          />
        );
        break;
      }
      case "matchups":
        body = <Matchups {...props} />;
        break;
      case "data":
        body = <DataView {...props} />;
        break;
    }
  }

  useEffect(() => {
    document.title = `${title} · Film Room`;
  }, [title]);

  return (
    <>
      {topbar(filterSummary)}
      <div className={`layout ${sidebar ? "" : "no-sidebar"}`}>
        {sidebar && filtersOpen && <div className="sheet-backdrop" onClick={() => setFiltersOpen(false)} />}
        {sidebar}
        <main className="canvas">{body}</main>
      </div>
    </>
  );
}

function Loading({ title, season }: { title: string; season: number | undefined }) {
  return (
    <div aria-busy="true">
      <Header title={title} finding={season ? `Loading the ${season} season from Sleeper…` : "Loading…"} />
      <div className="grid">
        <div className="card">
          {Array.from({ length: 12 }, (_, i) => (
            <div key={i} className="skeleton" style={{ height: 10, width: `${90 - i * 6}%`, margin: "10px 0 20px" }} />
          ))}
        </div>
      </div>
    </div>
  );
}
