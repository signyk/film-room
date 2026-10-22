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
