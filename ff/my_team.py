from ff.data_processing import get_players, get_relevant_players, write_table
from ff.service.callers import load_all_stats, load_players

all_players = load_players()
relevant_players = get_relevant_players(all_players)
current_week = 10
all_stats, all_projections = load_all_stats(current_week)
write_table(relevant_players, all_stats, all_projections)


my_players = [
    "Lamar Jackson",
    "Derrick Henry",
    "Saquon Barkley",
    "CeeDee Lamb",
    "Amon-Ra St. Brown",
    "Kyle Pitts",
    "Joe Mixon",
    "Brandon Aubrey",
    "Aaron Jones",
    "Kenneth Walker",
    "Puka Nacua",
    "DeVonta Smith",
    "Garrett Wilson",
    "Pittsburgh Steelers",
    "Los Angeles Chargers",
]

players = get_players(my_players, relevant_players)

for player in players:
    print(player)

week = 9
for player in players:
    if player.team.bye_week == week:
        fantasy_points = "BYE"
    else:
        stats = all_stats[week][player.player_id]
        fantasy_points = stats.fantasy_points(player.position)
    print(
        f"Player: {player.name}\tPosition: {player.position}\tFantasy Points: {fantasy_points}"
    )
