import json
import os

import requests

year = 2026

# Pull the regular season schedule from Sleeper instead of pasting it in by hand
url = f"https://api.sleeper.com/schedule/nfl/regular/{year}"
response = requests.get(url)
response.raise_for_status()

games = [
    {"home_team": game["home"], "away_team": game["away"], "week": game["week"]}
    for game in response.json()
    if game["status"] != "canceled"
]

os.makedirs(f"data/{year}", exist_ok=True)
with open(f"data/{year}/schedule.json", "w") as file:
    json.dump(games, file, indent=4)

print(f"Wrote {len(games)} games to data/{year}/schedule.json")
