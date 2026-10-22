"""Build the static data files the dashboard ships with.

Everything that changes rarely is prepared here, ahead of time, and served as a static asset:

- players.json: the fantasy relevant players with team, position and injury status. Sleeper asks
  that /players/nfl (about 16 MB) is fetched at most once a day, so CI runs this daily.
- schedule/<season>.json: who plays whom each week of the live season.
- history/<season>.json: finished seasons, exported from data/<season>/weekly_fantasy_points.csv.
- meta.json: seasons, teams, divisions and team colours.

Weekly stats and projections for the live season are not built here: the Cloudflare Worker fetches
them from Sleeper on demand and caches them.

Run from the repository root:  uv run python -m ff.build_data [--offline]
"""

import argparse
import csv
import datetime as dt
import json
import math
import os
from typing import Dict, List, Optional

import requests

from ff.data_processing import get_relevant_players
from ff.logger import logger
from ff.service.callers import load_players

OUT_DIR = "web/public/data"
# Finished seasons with a CSV in data/<season>/. 2018–2023 come from scripts/fetch-season.ts;
# Sleeper has no projections before 2018.
HISTORY_SEASONS = list(range(2018, 2026))
STATE_URL = "https://api.sleeper.app/v1/state/nfl"
SCHEDULE_URL = "https://api.sleeper.com/schedule/nfl/regular/{season}"

# Columns of the weekly CSV files that are not stats
ID_COLUMNS = [
    "Player",
    "Position",
    "Injury Status",
    "Team",
    "Opponent",
    "Week",
    "Fantasy Points",
    "Projection",
]
# Older files split long field goals in two, 2024 has one column. The dashboard shows one.
FGM_50_PARTS = ["FGM 50-59", "FGM 60+"]


def write_json(name: str, data: object) -> None:
    path = os.path.join(OUT_DIR, name)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w") as f:
        json.dump(data, f, separators=(",", ":"))
    logger.info(f"Wrote {path} ({os.path.getsize(path) / 1024:.0f} KB)")


def live_season(offline: bool) -> int:
    if offline:
        return max(int(name) for name in os.listdir("data") if name.isdigit())
    response = requests.get(STATE_URL, timeout=30)
    response.raise_for_status()
    return int(response.json()["season"])


def build_players(offline: bool) -> None:
    players = get_relevant_players(load_players(force_update=not offline))
    write_json(
        "players.json",
        {
            "updatedAt": dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds"),
            "players": [
                {
                    "id": player.player_id,
                    "name": player.name,
                    "position": player.position,
                    "team": player.team.short,  # type: ignore[union-attr]
                    "injury": player.injury_status.name if player.injury_status else None,
                }
                for player in sorted(players, key=lambda p: p.name)
            ],
        },
    )


def build_schedule(season: int, offline: bool) -> None:
    """The schedule changes once a season, so it is fetched only when it is not on disk yet."""
    path = f"data/{season}/schedule.json"
    if not os.path.exists(path):
        if offline:
            raise FileNotFoundError(f"{path} is missing and --offline was given")
        response = requests.get(SCHEDULE_URL.format(season=season), timeout=30)
        response.raise_for_status()
        games = [
            {"home_team": game["home"], "away_team": game["away"], "week": game["week"]}
            for game in response.json()
            if game["status"] != "canceled"
        ]
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, "w") as f:
            json.dump(games, f, indent=4)
        logger.info(f"Fetched {len(games)} games for {season}")

    with open(path) as f:
        games = json.load(f)
    write_json(
        f"schedule/{season}.json",
        [[game["week"], game["home_team"], game["away_team"]] for game in games],
    )


def number(value: str) -> Optional[float]:
    if value == "":
        return None
    parsed = float(value)
    if math.isnan(parsed):
        return None
    return int(parsed) if parsed.is_integer() else parsed


def build_history(season: int) -> None:
    """A finished season in a compact form: one list of players and one row per player and week."""
    with open(f"data/{season}/weekly_fantasy_points.csv", newline="") as f:
        reader = csv.DictReader(f)
        header = reader.fieldnames or []
        rows = list(reader)

    stat_columns = [c for c in header if c not in ID_COLUMNS and c not in FGM_50_PARTS]
    if "FGM 50+" not in stat_columns:
        stat_columns.insert(stat_columns.index("FGM 40-49") + 1, "FGM 50+")

    players: List[List[Optional[str]]] = []
    player_index: Dict[tuple, int] = {}
    out_rows = []
    for row in rows:
        key = (row["Player"], row["Team"], row["Position"])
        if key not in player_index:
            player_index[key] = len(players)
            players.append([row["Player"], row["Position"], row["Team"], row["Injury Status"] or None])

        stats = []
        for column in stat_columns:
            if column == "FGM 50+" and "FGM 50+" not in row:
                parts = [number(row[part]) for part in FGM_50_PARTS]
                stats.append(None if parts[0] is None else sum(p or 0 for p in parts))
            else:
                stats.append(number(row[column]))
        out_rows.append(
            [
                player_index[key],
                int(row["Week"]),
                row["Opponent"] or None,
                number(row["Fantasy Points"]),
                number(row["Projection"]),
                stats,
            ]
        )

    write_json(
        f"history/{season}.json",
        {"season": season, "statColumns": stat_columns, "players": players, "rows": out_rows},
    )


def build_meta(season: int) -> None:
    with open("data/team_names.json") as f:
        names: Dict[str, str] = json.load(f)
    with open("data/nfl_teams_by_division.json") as f:
        divisions: Dict[str, List[str]] = json.load(f)
    with open("data/colors.csv", newline="") as f:
        colors = {row["short_name"]: row["color"] for row in csv.DictReader(f)}

    write_json(
        "meta.json",
        {
            "liveSeason": season,
            "historySeasons": [s for s in HISTORY_SEASONS if s != season],
            "divisions": divisions,
            "teams": {short: {"name": name, "color": colors.get(short)} for short, name in names.items()},
        },
    )


def main() -> None:
    parser = argparse.ArgumentParser(description=(__doc__ or "").split("\n")[0])
    parser.add_argument(
        "--offline",
        action="store_true",
        help="use data/players.json and the schedule on disk instead of calling Sleeper",
    )
    args = parser.parse_args()

    season = live_season(args.offline)
    logger.info(f"Building dashboard data for the {season} season")
    build_players(args.offline)
    build_schedule(season, args.offline)
    for history_season in HISTORY_SEASONS:
        if history_season != season:
            build_history(history_season)
    build_meta(season)


if __name__ == "__main__":
    main()
