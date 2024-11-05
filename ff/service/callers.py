import json
import os
from typing import Dict

from ff.models import Game, Player, WeeklyProjection, WeeklyStats
from ff.service.client import get_players, get_weekly_projections, get_weekly_stats


def load_players():
    file_path = "data/players.json"
    if os.path.exists(file_path):
        with open(file_path, "r") as f:
            players_dict = json.load(f)
    else:
        players_dict = get_players()

    players = []
    for player_id, player_info in players_dict.items():
        player = Player(**player_info)
        players.append(player)

    return players


def load_weekly_stats(week: int):
    file_path = f"data/stats/week{week}.json"
    if os.path.exists(file_path):
        with open(file_path, "r") as f:
            stats_dict = json.load(f)
    else:
        stats_dict = get_weekly_stats(week)

    weekly_stats: Dict[str, WeeklyStats] = {}
    for player_id, player_stats in stats_dict.items():
        player_stats["week"] = week
        player_stats["player_id"] = player_id
        stats = WeeklyStats(**player_stats)
        weekly_stats[player_id] = stats

    return weekly_stats


def load_weekly_projections(week: int):
    file_path = f"data/projections/week{week}.json"
    if os.path.exists(file_path):
        with open(file_path, "r") as f:
            projections_dict = json.load(f)
    else:
        projections_dict = get_weekly_projections(week)

    weekly_projections: Dict[str, WeeklyProjection] = {}
    for player_id, player_projections in projections_dict.items():
        player_projections["week"] = week
        player_projections["player_id"] = player_id
        projections = WeeklyProjection(**player_projections)
        weekly_projections[player_id] = projections

    return weekly_projections


def load_all_stats(current_week: int):
    all_stats: Dict[int, WeeklyStats] = {}
    for week in range(1, current_week):
        weekly_stats = load_weekly_stats(week)
        all_stats[week] = weekly_stats

    all_projections: Dict[int, WeeklyProjection] = {}
    for week in range(1, 19):
        weekly_projections = load_weekly_projections(week)
        all_projections[week] = weekly_projections

    return all_stats, all_projections


def load_schedule():
    file_path = "data/schedule.json"
    if os.path.exists(file_path):
        with open(file_path, "r") as f:
            schedule_dict = json.load(f)

    schedule = [Game(**game) for game in schedule_dict]

    return schedule
