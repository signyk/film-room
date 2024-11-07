from typing import Dict, Tuple

from ff.data_processing import get_relevant_players, write_table
from ff.service.callers import load_all_stats, load_players, load_schedule

all_players = load_players(force_update=False)
relevant_players = get_relevant_players(all_players)
current_week = 10
all_stats, all_projections = load_all_stats(current_week, force_update=True)
schedule = load_schedule()
home_week_to_away: Dict[Tuple[int, str], str] = {
    (game.week, game.home_team.short): game.away_team.short for game in schedule
}
write_table(relevant_players, all_stats, all_projections, home_week_to_away)
