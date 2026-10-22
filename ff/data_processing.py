from typing import List

from ff.models import POSITIONS, TEAMS, Player


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
