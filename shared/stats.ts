export const STAT_COLUMNS = [
  { label: "FGA", fields: ["fga"] },
  { label: "FGM", fields: ["fgm"] },
  { label: "FGM 0-19", fields: ["fgm_0_19"] },
  { label: "FGM 20-29", fields: ["fgm_20_29"] },
  { label: "FGM 30-39", fields: ["fgm_30_39"] },
  { label: "FGM 40-49", fields: ["fgm_40_49"] },
  { label: "FGM 50+", fields: ["fgm_50_59", "fgm_60p"] },
  { label: "XPA", fields: ["xpa"] },
  { label: "XPM", fields: ["xpm"] },
  { label: "Passing ATT", fields: ["pass_att"] },
  { label: "Passing CMP", fields: ["pass_cmp"] },
  { label: "Passing YDS", fields: ["pass_yd"] },
  { label: "Passing TD", fields: ["pass_td"] },
  { label: "Passing 2-PT", fields: ["pass_2pt"] },
  { label: "Passing INT", fields: ["pass_int"] },
  { label: "Passing Sack", fields: ["pass_sack"] },
  { label: "Rushing ATT", fields: ["rush_att"] },
  { label: "Rushing YDS", fields: ["rush_yd"] },
  { label: "Rushing TD", fields: ["rush_td"] },
  { label: "Rushing 2-PT", fields: ["rush_2pt"] },
  { label: "Receiving TGT", fields: ["rec_tgt"] },
  { label: "Receptions", fields: ["rec"] },
  { label: "Receiving YDS", fields: ["rec_yd"] },
  { label: "Receiving TD", fields: ["rec_td"] },
  { label: "Receiving 2-PT", fields: ["rec_2pt"] },
  { label: "Fumbles", fields: ["fum"] },
  { label: "Fumbles Lost", fields: ["fum_lost"] },
  { label: "Fumble Recovery TD", fields: ["fum_rec_td"] },
  { label: "Sacks", fields: ["sack"] },
  { label: "INT", fields: ["int"] },
  { label: "Forced Fumbles", fields: ["ff"] },
  { label: "Fumble Recoveries", fields: ["fum_rec"] },
  { label: "DEF TD", fields: ["def_td"] },
  { label: "RET TD", fields: ["ret_td"] },
  { label: "Blocked Kicks", fields: ["blk_kick"] },
  { label: "YDS Allowed", fields: ["yds_allow"] },
  { label: "PTS Allowed", fields: ["pts_allow"] },
  { label: "Safeties", fields: ["safe"] },
] as const;

export type StatLabel = (typeof STAT_COLUMNS)[number]["label"];
export const STAT_LABELS: readonly StatLabel[] = STAT_COLUMNS.map((c) => c.label);

export const POSITIONS = ["QB", "RB", "WR", "TE", "K", "DEF"] as const;
export type Position = (typeof POSITIONS)[number];

export type SleeperStats = Record<string, number | undefined>;

export interface StatsResponse {
  season: number;
  week: number;
  fetchedAt: string;
  statColumns: readonly string[];
  players: Record<string, [points: number, stats: number[]]>;
}

export interface ProjectionsResponse {
  season: number;
  week: number;
  fetchedAt: string;
  players: Record<string, number>;
}

export interface StateResponse {
  season: number;
  week: number;
  seasonType: string;
  fetchedAt: string;
}

export const REGULAR_SEASON_WEEKS = 18;
