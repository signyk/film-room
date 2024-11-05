from typing import Dict, List, Tuple

from pandas import DataFrame

from ff.models import TEAMS, Player, WeeklyProjection, WeeklyStats


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
        if player.active
        and player.team
        and player.position in ["QB", "RB", "WR", "TE", "K"]
    ]
    defenses = [create_defense_player(team_short) for team_short in TEAMS.keys()]

    return individuals + defenses


def write_table(
    relevant_players: List[Player],
    all_stats: List[WeeklyStats],
    all_projections: List[WeeklyProjection],
    schedule_dict: Dict[Tuple[int, str], str],
):
    data = DataFrame()

    for week in range(1, 18):
        for player in relevant_players:
            stats = all_stats[week].get(player.player_id) if week in all_stats else None
            projection = all_projections[week].get(player.player_id)
            data = data._append(
                {
                    "Player": player.name,
                    "Position": player.position,
                    "Team": player.team.short,
                    "Opponent": schedule_dict.get((week, player.team.short), None),
                    "Week": week,
                    "Fantasy Points": (
                        stats.fantasy_points(player.position) if stats else None
                    ),
                    "Projection": (projection.projected_points if projection else None),
                },
                ignore_index=True,
            )

    data.to_csv("data/weekly_fantasy_points.csv", index=False)
    return data
