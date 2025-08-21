from typing import Dict, Tuple

from ff.data_processing import get_relevant_players, write_table
from ff.logger import logger
from ff.service.callers import load_all_stats, load_players, load_schedule
from ff.utils import get_current_nfl_week

current_week = get_current_nfl_week()
year = 2025
logger.info(f"Current NFL week: {current_week}")

try:
    all_players = load_players(force_update=False)
    logger.info("Loaded all players successfully.")
except Exception as e:
    logger.error(f"Error loading players: {e}")
    raise

relevant_players = get_relevant_players(all_players)
all_stats, all_projections = load_all_stats(
    current_week, year, force_update=True, logger=logger
)
schedule = load_schedule(year)

home_week_to_away: Dict[Tuple[int, str], str] = {
    (game.week, game.home_team.short): game.away_team.short for game in schedule
}
away_week_to_home: Dict[Tuple[int, str], str] = {
    (game.week, game.away_team.short): game.home_team.short for game in schedule
}
team_week_to_opponent: Dict[Tuple[int, str], str] = {
    **home_week_to_away,
    **away_week_to_home,
}
logger.info("Loaded all stats, projections, and schedule successfully.")

try:
    df = write_table(
        relevant_players,
        all_stats,
        all_projections,
        team_week_to_opponent,
        f"data/{year}/weekly_fantasy_points.csv",
    )
    logger.info("Data written to table successfully.")
except Exception as e:
    logger.error(f"Error writing data to table: {e}")
    raise
