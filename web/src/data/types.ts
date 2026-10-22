import type { Position } from "../../../shared/stats";

export type { Position };

export interface Team {
  name: string;
  color: string | null;
}

export interface Meta {
  liveSeason: number;
  historySeasons: number[];
  divisions: Record<string, string[]>;
  teams: Record<string, Team>;
}

export interface PlayerInfo {
  /** Unique within a season: name, team and position */
  key: string;
  name: string;
  team: string;
  position: Position;
  /** Sleeper's short code: Q, D, OUT, IR, PUP, COV, DNR, SUS */
  injury: string | null;
}

/** One player in one week. */
export interface PlayerWeek {
  player: PlayerInfo;
  week: number;
  /** null on a bye week */
  opponent: string | null;
  home: boolean | null;
  /** null when the player did not play (or the week is not played yet) */
  points: number | null;
  projection: number | null;
  /** In the order of Season.statColumns; null when there are no stats */
  stats: number[] | null;
}

export interface Season {
  season: number;
  live: boolean;
  /** Weeks before this one are played. Finished seasons use a week after the last. */
  currentWeek: number;
  weeks: number[];
  statColumns: readonly string[];
  players: PlayerInfo[];
  rows: PlayerWeek[];
  /** When the newest Sleeper data was fetched (live season only) */
  fetchedAt: string | null;
  /** Some weeks could not be refreshed and come from an older copy */
  stale: boolean;
}

export type PointType = "Total Points" | "Average Points" | "Total Projected Points" | "Average Projected Points";
