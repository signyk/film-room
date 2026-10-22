import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import { POSITIONS } from "../../../shared/stats";
import { teamFill, weeksLabel } from "../data/format";
import type { Meta, PlayerInfo, PointType, Position } from "../data/types";
import { Icon } from "./Icons";

/** A button that opens a floating panel; closes on outside click or Escape */
export function Dropdown(props: {
  label: ReactNode;
  children: (close: () => void) => ReactNode;
  panelClass?: string;
  triggerClass?: string;
  align?: "left" | "right";
  ariaLabel?: string;
}) {
  const { label, children, panelClass, triggerClass = "select-trigger", align = "left", ariaLabel } = props;
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const id = useId();
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);
  return (
    <div className="dropdown" ref={ref}>
      <button type="button" className={triggerClass} aria-expanded={open} aria-controls={id} aria-label={ariaLabel} onClick={() => setOpen(!open)}>
        {label}
      </button>
      {open && (
        <div className={`menu ${align === "right" ? "align-right" : ""} ${panelClass ?? ""}`} id={id}>
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}

const Trigger = ({ children }: { children: ReactNode }) => (
  <>
    <span className="trigger-value">{children}</span>
    <Icon name="chevron" />
  </>
);

const toggle = <T,>(list: T[], item: T) => (list.includes(item) ? list.filter((x) => x !== item) : [...list, item]);
const sameSet = <T,>(a: T[], b: T[]) => a.length === b.length && a.every((x) => b.includes(x));

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="field">
      <span className="label">{label}</span>
      {children}
    </div>
  );
}

export function SeasonSelect({ seasons, value, onChange }: { seasons: number[]; value: number; onChange: (s: number) => void }) {
  return (
    <Field label="Season">
      <Dropdown label={<Trigger>{value}</Trigger>} ariaLabel={`Season ${value}`}>
        {(close) => (
          <div role="listbox" aria-label="Season">
            {seasons.map((s) => (
              <button
                type="button"
                role="option"
                aria-selected={s === value}
                key={s}
                className="menu-option"
                onClick={() => {
                  onChange(s);
                  close();
                }}
              >
                {s}
                {s === value && <Icon name="check" />}
              </button>
            ))}
          </div>
        )}
      </Dropdown>
    </Field>
  );
}

export function WeeksPicker(props: { past: number[]; future: number[]; value: number[]; onChange: (w: number[]) => void }) {
  const { past, future, value, onChange } = props;
  const all = [...past, ...future];
  const quick: [string, number[]][] = [["All", all]];
  if (past.length && future.length) quick.push(["Played", past], ["Upcoming", future]);
  const groups = [
    { title: "Played", weeks: past },
    { title: "Upcoming", weeks: future },
  ].filter((g) => g.weeks.length);
  return (
    <Dropdown label={<Trigger>{weeksLabel(value)}</Trigger>} panelClass="weeks-menu">
      {() => (
        <>
          <div className="quick">
            {quick.map(([text, weeks]) => (
              <button type="button" key={text} aria-pressed={sameSet(value, weeks)} onClick={() => onChange(weeks)}>
                {text}
              </button>
            ))}
            <button type="button" onClick={() => onChange([])} disabled={!value.length}>
              Clear
            </button>
          </div>
          {groups.map((g) => (
            <div className="menu-group" key={g.title}>
              <div className="menu-group-title">{g.title}</div>
              <div className="tiles weeks">
                {g.weeks.map((w) => (
                  <button type="button" key={w} className="tile" aria-pressed={value.includes(w)} aria-label={`Week ${w}`} onClick={() => onChange(toggle(value, w))}>
                    {w}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </>
      )}
    </Dropdown>
  );
}

export function PositionToggles({ value, onChange }: { value: Position[]; onChange: (p: Position[]) => void }) {
  return (
    <Field label="Positions">
      <div className="chips" role="group" aria-label="Positions">
        {POSITIONS.map((p) => (
          <button
            type="button"
            key={p}
            className="chip"
            aria-pressed={value.includes(p)}
            onClick={(e) => onChange(e.shiftKey || e.metaKey || e.ctrlKey ? [p] : toggle(value, p))}
            title="Shift-click to show only this position"
          >
            <i style={{ background: `var(--pos-${p})` }} />
            {p}
          </button>
        ))}
      </div>
    </Field>
  );
}

export function TeamsPicker({ meta, value, onChange }: { meta: Meta; value: string[]; onChange: (t: string[]) => void }) {
  const all = Object.values(meta.divisions).flat();
  const conferences = ["AFC", "NFC"].map((c) => ({
    name: c,
    divisions: Object.entries(meta.divisions).filter(([d]) => d.startsWith(c)),
  }));
  const conferenceTeams = (c: string) => Object.entries(meta.divisions).filter(([d]) => d.startsWith(c)).flatMap(([, t]) => t);
  const label = value.length === all.length ? "All teams" : value.length === 0 ? "No teams" : value.length === 1 ? meta.teams[value[0]]?.name : `${value.length} teams`;
  return (
    <Dropdown label={<Trigger>{label}</Trigger>} panelClass="teams-menu">
      {() => (
        <>
          <div className="quick">
            <button type="button" aria-pressed={value.length === all.length} onClick={() => onChange(all)}>
              All
            </button>
            {["AFC", "NFC"].map((c) => (
              <button type="button" key={c} aria-pressed={sameSet(value, conferenceTeams(c))} onClick={() => onChange(conferenceTeams(c))}>
                {c}
              </button>
            ))}
            <button type="button" onClick={() => onChange([])} disabled={!value.length}>
              Clear
            </button>
          </div>
          <div className="conferences">
            {conferences.map((c) => (
              <div key={c.name}>
                {c.divisions.map(([division, teams]) => {
                  const allIn = teams.every((t) => value.includes(t));
                  return (
                    <div className="menu-group" key={division}>
                      <button
                        type="button"
                        className="menu-group-title as-button"
                        title={allIn ? `Remove the ${division}` : `Add the ${division}`}
                        onClick={() => onChange(allIn ? value.filter((t) => !teams.includes(t)) : [...new Set([...value, ...teams])])}
                      >
                        {division}
                      </button>
                      <div className="tiles teams">
                        {teams.map((t) => {
                          const on = value.includes(t);
                          return (
                            <button
                              type="button"
                              key={t}
                              className="tile team"
                              aria-pressed={on}
                              title={meta.teams[t]?.name}
                              style={on ? { background: teamFill(meta.teams[t]?.color), borderColor: "transparent" } : undefined}
                              onClick={() => onChange(toggle(value, t))}
                            >
                              {t}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </>
      )}
    </Dropdown>
  );
}

function Segmented<T extends string>({ label, options, value, onChange }: { label: string; options: [T, string][]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="segmented" role="radiogroup" aria-label={label}>
      {options.map(([v, text]) => (
        <button type="button" role="radio" key={v} aria-checked={value === v} onClick={() => onChange(v)}>
          {text}
        </button>
      ))}
    </div>
  );
}

export function PointTypePicker({ value, onChange }: { value: PointType; onChange: (t: PointType) => void }) {
  const projected = value.includes("Projected");
  const average = value.startsWith("Average");
  const make = (avg: boolean, proj: boolean) => `${avg ? "Average" : "Total"} ${proj ? "Projected Points" : "Points"}` as PointType;
  return (
    <Field label="Points">
      <Segmented
        label="Scored or projected"
        options={[
          ["scored", "Scored"],
          ["projected", "Projected"],
        ]}
        value={projected ? "projected" : "scored"}
        onChange={(v) => onChange(make(average, v === "projected"))}
      />
      <Segmented
        label="Per game or total"
        options={[
          ["avg", "Per game"],
          ["total", "Season total"],
        ]}
        value={average ? "avg" : "total"}
        onChange={(v) => onChange(make(v === "avg", projected))}
      />
    </Field>
  );
}

export function Stepper({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (n: number) => void }) {
  const [draft, setDraft] = useState(String(value));
  useEffect(() => setDraft(String(value)), [value]);
  const commit = (n: number) => onChange(Math.min(max, Math.max(min, Number.isFinite(n) ? Math.round(n) : value)));
  return (
    <Field label={label}>
      <div className="stepper">
        <button type="button" aria-label={`Fewer`} disabled={value <= min} onClick={() => commit(value - 5)}>
          −
        </button>
        <input
          type="number"
          aria-label={label}
          min={min}
          max={max}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => commit(Number(draft))}
          onKeyDown={(e) => e.key === "Enter" && commit(Number(draft))}
        />
        <button type="button" aria-label={`More`} disabled={value >= max} onClick={() => commit(value + 5)}>
          +
        </button>
      </div>
    </Field>
  );
}

/** Searchable player picker */
export function PlayerSearch(props: { players: PlayerInfo[]; value: PlayerInfo | null; onChange: (p: PlayerInfo) => void; label: string }) {
  const { players, value, onChange, label } = props;
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const listId = useId();
  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q ? players.filter((p) => p.name.toLowerCase().includes(q) || p.team.toLowerCase() === q) : players;
    return list.slice(0, 50);
  }, [players, query]);

  const choose = (p: PlayerInfo) => {
    onChange(p);
    setQuery("");
    setOpen(false);
  };

  return (
    <div className="combobox">
      <input
        className="search"
        role="combobox"
        aria-label={label}
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={open && matches[active] ? `${listId}-${active}` : undefined}
        placeholder={value ? `${value.name} · search another player` : "Search players"}
        value={query}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        onChange={(e) => {
          setQuery(e.target.value);
          setActive(0);
          setOpen(true);
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") setActive((a) => Math.min(a + 1, matches.length - 1));
          else if (e.key === "ArrowUp") setActive((a) => Math.max(a - 1, 0));
          else if (e.key === "Enter" && matches[active]) choose(matches[active]);
          else if (e.key === "Escape") setOpen(false);
          else return;
          e.preventDefault();
        }}
      />
      {open && matches.length > 0 && (
        <ul id={listId} role="listbox">
          {matches.map((p, i) => (
            <li
              key={p.key}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              onMouseEnter={() => setActive(i)}
              onMouseDown={(e) => {
                e.preventDefault();
                choose(p);
              }}
            >
              {p.name}
              <span className="tag">
                {p.position} · {p.team}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
