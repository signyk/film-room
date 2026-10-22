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
  key: string;
  name: string;
  team: string;
  position: Position;
  injury: string | null;
}

export interface PlayerWeek {
  player: PlayerInfo;
  week: number;
  opponent: string | null;
  home: boolean | null;
  points: number | null;
  projection: number | null;
  stats: number[] | null;
}

export interface Season {
  season: number;
  live: boolean;
  currentWeek: number;
  weeks: number[];
  statColumns: readonly string[];
  players: PlayerInfo[];
  rows: PlayerWeek[];
  fetchedAt: string | null;
  stale: boolean;
}

export type PointType = "Total Points" | "Average Points" | "Total Projected Points" | "Average Projected Points";
