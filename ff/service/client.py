import json
from typing import Dict

import requests

from ff.config import config


def get(url: str) -> Dict:
    response = requests.get(url)
    print(f"GET {url}")
    print(f"STATUS {response.status_code}")
    if response.status_code != 200:
        raise Exception(f"Failed to retrieve {url}")

    print(f"Retrieved {len(response.content)} lines")
    return response.json()


def get_players():
    url = config.api_base_url + "players/nfl"
    response = get(url)
    with open("data/players.json", "w") as f:
        json.dump(response, f)

    return response


def get_weekly_stats(week: int):
    url = f"{config.stats_base_url}regular/2024/{week}"
    response = get(url)
    with open(f"data/stats/week{week}.json", "w") as f:
        json.dump(response, f)

    return response


def get_weekly_projections(week: int):
    url = f"{config.projections_base_url}regular/2024/{week}"
    response = get(url)
    with open(f"data/projections/week{week}.json", "w") as f:
        json.dump(response, f)

    return response
