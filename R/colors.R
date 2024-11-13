# Read in the JSON file
colors_df <- read.csv("data/colors.csv")

colors <- as.character(colors_df$color)
names(colors) <- as.character(colors_df$short_name)

position_colors <- c(
    QB = "#FFC857",
    WR = "#4C78A8",
    RB = "#E45756",
    TE = "#76B041",
    K = "#E295A5",
    DEF = "#9C6ADE"
)

