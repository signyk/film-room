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
    for player in individuals:
        if player.position == "DEF":
            assert player.team is not None
            player.name = TEAMS[player.team.short].name

    return individuals


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

    data = []
    for week in range(1, 18):
        for player in relevant_players:
            stats = all_stats.get(week, {}).get(player.player_id, None)
            projection = all_projections.get(week, {}).get(player.player_id, None)
            data.append(
                {
                    "Player": player.name,
                    "Position": player.position,
                    "Team": player.team.short,  # type: ignore
                    "Opponent": schedule_dict.get((week, player.team.short), None),  # type: ignore
                    "Week": week,
                    "Fantasy Points": (
                        stats.fantasy_points(player.position)  # type: ignore
                        if stats is not None
                        else None
                    ),
                    "Projection": (
                        projection.projected_points if projection is not None else None
                    ),
                    "FGA": (stats.fg_attempts if stats is not None else None),
                    "FGM": (stats.fg_made if stats is not None else None),
                    "FGM 0-19": (stats.fgm_0_19 if stats is not None else None),
                    "FGM 20-29": (stats.fgm_20_29 if stats is not None else None),
                    "FGM 30-39": (stats.fgm_30_39 if stats is not None else None),
                    "FGM 40-49": (stats.fgm_40_49 if stats is not None else None),
                    "FGM 50+": (stats.fgm_50_plus if stats is not None else None),
                    "XPA": (stats.xp_attempts if stats is not None else None),
                    "XPM": (stats.xp_made if stats is not None else None),
                    "Passing ATT": (stats.pass_att if stats is not None else None),
                    "Passing CMP": (stats.pass_cmp if stats is not None else None),
                    "Passing YDS": (stats.pass_yds if stats is not None else None),
                    "Passing TD": (stats.pass_tds if stats is not None else None),
                    "Passing 2-PT": (stats.pass_2pt if stats is not None else None),
                    "Passing INT": (
                        stats.interceptions_thrown if stats is not None else None
                    ),
                    "Passing Sack": (stats.sacks if stats is not None else None),
                    "Rushing ATT": (stats.rush_att if stats is not None else None),
                    "Rushing YDS": (stats.rush_yds if stats is not None else None),
                    "Rushing TD": (stats.rush_tds if stats is not None else None),
                    "Rushing 2-PT": (stats.rush_2pt if stats is not None else None),
                    "Receiving TGT": (stats.rec_tgt if stats is not None else None),
                    "Receptions": (stats.rec if stats is not None else None),
                    "Receiving YDS": (stats.rec_yds if stats is not None else None),
                    "Receiving TD": (stats.rec_tds if stats is not None else None),
                    "Receiving 2-PT": (stats.rec_2pt if stats is not None else None),
                    "Fumbles": (stats.fumbles if stats is not None else None),
                    "Fumbles Lost": (stats.fumbles_lost if stats is not None else None),
                    "Fumble Recovery TD": (
                        stats.fumble_recovery_tds if stats is not None else None
                    ),
                    "Sacks": (stats.def_sacks if stats is not None else None),
                    "INT": (stats.def_interceptions if stats is not None else None),
                    "Forced Fumbles": (
                        stats.def_force_fumbles if stats is not None else None
                    ),
                    "Fumble Recoveries": (
                        stats.def_fumble_recoveries if stats is not None else None
                    ),
                    "DEF TD": (stats.def_tds if stats is not None else None),
                    "RET TD": (stats.return_tds if stats is not None else None),
                    "Blocked Kicks": (
                        stats.blocked_kicks if stats is not None else None
                    ),
                    "YDS Allowed": (stats.yds_allowed if stats is not None else None),
                    "PTS Allowed": (stats.pts_allowed if stats is not None else None),
                    "Safeties": (stats.safeties if stats is not None else None),
                }
            )
    dataframe = DataFrame(data)

    dataframe.to_csv(path, index=False)
    return data
