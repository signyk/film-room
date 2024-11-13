library(tidyverse)
source("R/colors.R")

data_raw <- read.csv("data/weekly_fantasy_points.csv")

dat_s <- data_raw %>%
  mutate(Fantasy.Points = if_else(Projection==0.0 & Fantasy.Points==0.0, NA, Fantasy.Points))



CURRENT_WEEK <- 11
input_positions <- unique(dat_s$Position)
input_teams <- unique(dat_s$Team)
selected_weeks <- unique(dat_s$Week)
input_point_type <- "Mean Points"
input_player <- "Kyle Pitts"

player_dat <- dat_s %>% 
    group_by(Player, Position) %>% 
    mutate("Total Points" = sum(Fantasy.Points, na.rm = TRUE),
           "Mean Points" = mean(Fantasy.Points, na.rm = TRUE),
           "Total Projected Points" = sum(Projection, na.rm = TRUE),
           "Mean Projected Points" = mean(Projection, na.rm = TRUE),
           projected_rest_of_season = sum(ifelse(Week >= CURRENT_WEEK, Projection, 0), na.rm = TRUE),
           sd_fantasy_points = sd(Fantasy.Points, na.rm = TRUE),
           sd_projection = sd(Projection, na.rm = TRUE)) %>%
    mutate(`Mean Points` = if_else(is.nan(`Mean Points`), 0, `Mean Points`)) %>%
    group_by(Position) %>% 
    mutate(rank = rank(-!!sym(input_point_type), ties.method = "min"))

player_dat_filtered <- player_dat %>% 
    filter(Player == input_player) %>% 
    gather(key = "key", value = "value", Fantasy.Points, Projection) %>% 
    mutate(key = if_else(key == "Fantasy.Points", "Fantasy Points", "Projected Points")) %>% 
    left_join(colors_df %>% select(short_name, color), by=join_by(Team==short_name)) %>% 
    mutate(text = paste0(
      "Week: ", Week,
      "\n", key, ": ", value,
      "\nOpponent: ", Opponent
    ))
  
dat <- dat_s %>%
    filter(Position %in% input_positions) %>%
    filter(Team %in% input_teams) %>%
    filter(Week %in% selected_weeks) %>% 
    group_by(Player, Team) %>% 
    mutate("Total Points" = sum(Fantasy.Points, na.rm = TRUE),
           "Mean Points" = mean(Fantasy.Points, na.rm = TRUE),
           "Total Projected Points" = sum(Projection, na.rm = TRUE),
           "Mean Projected Points" = mean(Projection, na.rm = TRUE),
           projected_rest_of_season = sum(ifelse(Week >= CURRENT_WEEK, Projection, 0), na.rm = TRUE),
           sd_fantasy_points = sd(Fantasy.Points, na.rm = TRUE),
           sd_projection = sd(Projection, na.rm = TRUE)) %>% 
    ungroup() %>% 
    mutate(cv = sd_fantasy_points / `Mean Points`) %>% 
    mutate(cv = if_else(is.infinite(cv) | is.na(cv), 0, cv)) %>%
    mutate(`Mean Points` = if_else(is.infinite(`Mean Points`) | is.na(`Mean Points`), 0, `Mean Points`)) %>%
    mutate(dependability = if_else(cv>1, 0, 1-cv))

team_data <- dat %>% 
    filter(!is.na(Opponent) & Opponent != "") %>% 
    group_by(Opponent, Week, Position) %>% 
    mutate(
        weekly_total_points = sum(Fantasy.Points, na.rm = TRUE),
        weekly_total_projected_points = sum(Projection, na.rm = TRUE),
    ) %>% 
    mutate(weekly_total_points = if_else(Week>= CURRENT_WEEK, NA, weekly_total_points)) %>%
    ungroup() %>%
    group_by(Opponent, Position) %>% 
    summarise(
        "Total Points" = sum(weekly_total_points, na.rm = TRUE),
        "Mean Points" = mean(weekly_total_points, na.rm = TRUE),
        "Total Projected Points" = sum(weekly_total_projected_points, na.rm = TRUE),
        "Mean Projected Points" = mean(weekly_total_projected_points, na.rm = TRUE),
        .groups = "keep"
    ) %>% 
    ungroup() %>% 
    group_by(Opponent) %>%
    mutate(total_total_points = sum(!!sym(input_point_type), na.rm = TRUE)) %>%
    ungroup() %>%
    mutate(Opponent = fct_reorder(Opponent, total_total_points, .desc = TRUE)) %>%
    mutate("text" = paste0(
        "Opponent: ", Opponent,
        "\nPosition: ", Position, 
        "\n", input_point_type, ": ", round(!!sym(input_point_type),2)
    ))

x_breaks <- team_data %>% pull(!!sym(input_point_type)) %>% sd() %>% round_to_nearest(., 5) %>% max(., 1)

p <- team_data %>%
    ggplot(aes(y = Opponent, x = !!sym(input_point_type), fill=Position, text=text)) +
    geom_bar(stat = "identity") +
    scale_x_continuous(labels = scales::comma, breaks = get_breaks(x_breaks)) +
    scale_fill_manual(values = position_colors) +
    labs(x = input_point_type, y = "Opponent") +
    theme_light()

test <- dat %>% 
  filter(Opponent == "") %>% 
  filter(Fantasy.Points > 0)


