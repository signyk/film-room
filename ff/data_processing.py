from typing import Dict, List, Tuple

from pandas import DataFrame

from ff.models import POSITIONS, TEAMS, Player, WeeklyProjection, WeeklyStats


def create_defense_player(team_short: str) -> Player:
    team = TEAMS[team_short]
    return Player(
        player_id=team.short,
        full_name=team.name,
        position="DEF",
        team=team,
        active=True,
        number=None,
    )


def get_players(
    player_names: List[str], relevant_players: List[Player]
) -> List[Player]:
    players = []
    for player in relevant_players:
        if player.name in player_names:
            players.append(player)

    # Check if all players were found
    not_found = []
    for player_name in player_names:
        found = False
        for player in players:
            if player.name == player_name:
                found = True
                break
        if not found:
            not_found.append(player_name)

    if not_found:
        print(f"Players not found: {not_found}")
    return players


def get_relevant_players(all_players: List[Player]) -> List[Player]:
    individuals = [
        player
        for player in all_players
        if player.active and player.team and player.position in POSITIONS
    ]
    defenses = [create_defense_player(team_short) for team_short in TEAMS.keys()]

    return individuals + defenses


def write_table(
    relevant_players: List[Player],
    all_stats: Dict[int, Dict[str, WeeklyStats]],
    all_projections: Dict[int, Dict[str, WeeklyProjection]],
    schedule_dict: Dict[Tuple[int, str], str],
    path: str = "data/weekly_fantasy_points.csv",
):

    assert all(
        player.is_relevant() for player in relevant_players
    ), "All players must be relevant"

    data = DataFrame(
        {
            "Player": player.name,
            "Position": player.position,
            "Team": player.team.short,  # type: ignore
            "Opponent": schedule_dict.get((week, player.team.short), None),  # type: ignore
            "Week": week,
            "Fantasy Points": (
                all_stats[week][player.player_id].fantasy_points(player.position)  # type: ignore
                if week in all_stats and player.player_id in all_stats[week]
                else None
            ),
            "Projection": (
                all_projections[week][player.player_id].projected_points
                if week in all_projections and player.player_id in all_projections[week]
                else None
            ),
        }
        for week in range(1, 18)
        for player in relevant_players
        if player.is_relevant()
    )

    data.to_csv(path, index=False)
    return data
