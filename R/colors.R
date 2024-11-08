library(jsonlite)

# Read in the JSON file
colors_df <- read.csv("~/Projects/FantasyNFL/data/colors.csv")

colors <- as.character(colors_df$color)
names(colors) <- as.character(colors_df$short_name)
