// League scoring, ported from get_fantasy_points in ff/utils.py.
import type { Position, SleeperStats } from "./stats";

function pointsAllowedPoints(allowed: number): number {
  if (allowed === 0) return 10;
  if (allowed <= 6) return 7;
  if (allowed <= 13) return 4;
  if (allowed <= 20) return 1;
  if (allowed <= 27) return 0;
  if (allowed <= 34) return -1;
  return -4;
}

/** Rounds to one decimal the way Python's round() does: exact halves go to the even digit. */
export function roundOneDecimal(x: number): number {
  const scaled = x * 10;
  const floor = Math.floor(scaled);
  const diff = scaled - floor;
  let n: number;
  if (Math.abs(diff - 0.5) < 1e-9) n = floor % 2 === 0 ? floor : floor + 1;
  else n = Math.round(scaled);
  return n / 10 + 0; // + 0 turns -0 into 0
}

export function fantasyPoints(s: SleeperStats, position: Position): number {
  const v = (field: string) => s[field] ?? 0;
  let points: number;
  if (position === "QB" || position === "RB" || position === "WR" || position === "TE") {
    points =
      v("pass_yd") / 25 +
      v("pass_td") * 4 +
      (v("rush_yd") + v("rec_yd")) / 10 +
      (v("rush_td") + v("rec_td") + v("ret_td") + v("fum_rec_td")) * 6 +
      v("rec") +
      v("pass_int") * -1 +
      v("fum_lost") * -2 +
      (v("pass_2pt") + v("rush_2pt") + v("rec_2pt")) * 2;
  } else if (position === "K") {
    points =
      (v("fgm_0_19") + v("fgm_20_29") + v("fgm_30_39")) * 3 +
      v("fgm_40_49") * 4 +
      v("fgm_50_59") * 5 +
      v("fgm_60p") * 6 +
      v("xpm") -
      (v("xpa") - v("xpm")) -
      (v("fga") - v("fgm"));
  } else {
    points =
      v("sack") +
      v("int") * 2 +
      v("fum_rec") * 2 +
      v("ff") +
      v("safe") * 2 +
      v("def_td") * 6 +
      v("ret_td") * 6 +
      v("blk_kick") * 2 +
      pointsAllowedPoints(v("pts_allow"));
  }
  return roundOneDecimal(points);
}
