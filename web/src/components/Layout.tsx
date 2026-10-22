import type { ReactNode } from "react";
import { teamHue, timeAgo } from "../data/format";
import type { Season } from "../data/types";

export function Header({ title, finding, season, aside }: { title: ReactNode; finding?: ReactNode; season?: Season | null; aside?: ReactNode }) {
  return (
    <div className="title-row">
      <div>
        <h1>{title}</h1>
        {finding && <p className="finding">{finding}</p>}
      </div>
      {aside ?? (season && <Stamp season={season} />)}
    </div>
  );
}

export function Stamp({ season }: { season: Season }) {
  if (!season.live) return <span className="stamp">{season.season} season, final</span>;
  if (season.stale)
    return <span className="stamp stale">Sleeper did not answer; some weeks are from an earlier copy</span>;
  return <span className="stamp">Sleeper data, updated {timeAgo(season.fetchedAt)}</span>;
}

export function Card({ title, meta, children, className }: { title?: ReactNode; meta?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`card ${className ?? ""}`}>
      {(title || meta) && (
        <div className="card-head">
          {title && <h2>{title}</h2>}
          {meta && <span className="meta">{meta}</span>}
        </div>
      )}
      {children}
    </section>
  );
}

export function TeamDot({ color }: { color: string | null | undefined }) {
  return <span className="team-dot" style={{ background: color ? teamHue(color) : "var(--muted)" }} aria-hidden="true" />;
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="empty">{children}</p>;
}
