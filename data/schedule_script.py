import json

year = 2025


# Define the Game class for structure
class Game:
    def __init__(self, home_team, away_team, week):
        self.home_team = home_team
        self.away_team = away_team
        self.week = week

    def to_dict(self):
        return {
            "home_team": self.home_team,
            "away_team": self.away_team,
            "week": self.week,
        }


# The input data (as a large string or from a file)
with open(f"data/{year}/schedule_raw.txt") as file:
    data = file.read()

# Splitting the data into lines and skipping the first line (header)
lines = data.strip().split("\n")[1:]

# Parse games and construct game objects
games = []
for line in lines:
    parts = line.split("\t")
    team = parts[0]
    schedule = parts[1:]

    for week, opponent in enumerate(schedule, 1):
        if opponent != "BYE":
            if opponent.startswith("@"):
                home_team = opponent[1:]
                away_team = team
            else:
                home_team = team
                away_team = opponent

            # Create a Game object and add it to the list
            game = Game(home_team, away_team, week)
            games.append(game.to_dict())

# Convert the list of game objects to JSON
json_data = json.dumps(games, indent=4)

# Write the JSON data to a file
with open(f"data/{year}/schedule.json", "w") as file:
    file.write(json_data)

print("JSON file has been created successfully.")
