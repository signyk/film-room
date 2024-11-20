import datetime as dt
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from ff.models import Position, WeeklyStats


def get_current_nfl_week(
    start_date: dt.date = dt.date(2024, 9, 2), today_date: dt.date = dt.date.today()
) -> int:
    """Determine the current NFL week based on the start date and today's date.

    Parameters
    ----------
    start_date : dt.date, optional
        The start date of the NFL season, by default dt.date(2024, 9, 2)
    today_date : dt.date, optional
        The current date, by default dt.date.today()

    Returns
    -------
    int
        The current NFL week
    """
    # Calculate the difference in days between today and the start date
    days_difference = (today_date - start_date).days

    # Calculate the current week (1-based index, each week is 7 days)
    current_week = days_difference // 7 + 1

    return max(current_week, 1)  # Ensure week is at least 1


def get_allowed_points_points(allowed_points: int) -> int:
    if allowed_points == 0:
        return 10
    if allowed_points <= 6:
        return 7
    if allowed_points <= 13:
        return 4
    if allowed_points <= 20:
        return 1
    if allowed_points <= 27:
        return 0
    if allowed_points <= 34:
        return -1
    return -4


def get_fantasy_points(stats: "WeeklyStats", position: "Position") -> float:
    if position in ["QB", "RB", "WR", "TE"]:
        points = (
            stats.pass_yds / 25
            + stats.pass_tds * 4
            + (stats.rush_yds + stats.rec_yds) / 10
            + (
                stats.rush_tds
                + stats.rec_tds
                + stats.return_tds
                + stats.fumble_recovery_tds
            )
            * 6
            + stats.rec * 1
            + stats.interceptions_thrown * -2
            + stats.fumbles_lost * -2
            + (stats.pass_2pt + stats.rush_2pt + stats.rec_2pt) * 2
        )

    elif position == "K":
        points = (
            (stats.fgm_0_19 + stats.fgm_20_29 + stats.fgm_30_39 + stats.fgm_40_49) * 3
            + stats.fgm_50_plus * 5
            + stats.xp_made
        )

    elif position == "DEF":
        points = (
            stats.def_sacks * 1
            + stats.def_interceptions * 2
            + stats.def_fumble_recoveries * 2
            + stats.safeties * 2
            + stats.def_tds * 6
            + stats.return_tds * 6
            + get_allowed_points_points(stats.pts_allowed)
        )
    else:
        points = 0

    return round(points, 1)
