import json
import os
from typing import List

from ff.models import Player
from ff.service.client import get_players


def load_players(force_update: bool = False) -> List[Player]:
    file_path = "data/players.json"
    if os.path.exists(file_path) and not force_update:
        with open(file_path, "r") as f:
            players_dict = json.load(f)
    else:
        players_dict = get_players()

    players: List[Player] = []
    for player_id, player_info in players_dict.items():
        player = Player(**player_info)
        players.append(player)

    return players
