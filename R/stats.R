library(tidyverse)
source("R/colors.R")

data_raw <- read.csv("~/Projects/FantasyNFL/data/weekly_fantasy_points.csv")

data <- data_raw %>%
  mutate(Fantasy.Points = if_else(Projection==0.0 & Fantasy.Points==0.0, NA, Fantasy.Points))

data %>%
  group_by(Player, Team, Position) %>%
  summarise("Total Points" = sum(Fantasy.Points, na.rm = TRUE), .groups = "keep") %>%
  ungroup() %>% 
  arrange(desc(`Total Points`)) %>%
  slice(1:20)

data %>%
  group_by(Player, Team, Position) %>%
  summarise(total_points = sum(Fantasy.Points, na.rm = TRUE)) %>%
    group_by(Position) %>%
  arrange(desc(total_points)) %>%
  slice(1:10) %>%
  ggplot(aes(x = reorder(Player, total_points), y = total_points, fill=Team)) +
  geom_bar(stat = "identity") +
    scale_fill_manual(values = colors) +
  coord_flip() +
    facet_wrap(~Position, scales = "free_y") +
  labs(title = "Top 10 Fantasy Football Players by Total Points in Each Position",
       x = "Player",
       y = "Total Points") +
  theme_light() +
  theme(axis.text.x = element_text(angle = 45, hjust = 1)) +
  scale_y_continuous(labels = scales::comma)

CURRENT_WEEK <- 11

data_dependable <- data %>% 
    group_by(Player) %>%
    mutate(total_fantasy_points = sum(Fantasy.Points, na.rm = TRUE),
           projected_rest_of_season = sum(ifelse(Week >= CURRENT_WEEK, Projection, 0), na.rm = TRUE),
           sd_fantasy_points = sd(Fantasy.Points, na.rm = TRUE),
           sd_projection = sd(Projection, na.rm = TRUE),
           mean_fantasy_points = mean(Fantasy.Points, na.rm = TRUE),
           mean_projection = mean(Projection, na.rm = TRUE)) %>% 
  mutate(cv = sd_fantasy_points / mean_fantasy_points) %>%
    select(Player, Team, Position, total_fantasy_points, projected_rest_of_season, cv, mean_fantasy_points, sd_fantasy_points) %>% 
  unique() %>% 
  group_by(Position) %>%
  arrange(desc(total_fantasy_points)) %>%
  slice(1:20)

dashed_line <- data_dependable %>% 
  group_by(Position) %>% 
  summarise(cv = 1,
            total_points = min(total_fantasy_points)) %>% 
  ungroup() %>% 
  rbind(data_dependable %>% 
         group_by(Position) %>% 
         summarise(cv = 0,
                   total_points = max(total_fantasy_points)) %>%
         ungroup())

ggplot() +
  geom_point(data = data_dependable, aes(x=cv, y=total_fantasy_points, color=Team)) +
  geom_text(data = data_dependable, aes(x=cv, y=total_fantasy_points, label=Player), hjust=1, vjust=1, size=3) +
  geom_line(data=dashed_line, linetype="dashed", aes(x=cv, y=total_points)) +
  labs(title = "Fantasy Football Players by Dependability",
       x = "Dependability",
       y = "Total Fantasy Points") +
  facet_wrap(~Position, scales = "free_y") +
  theme_light() +
  scale_color_manual(values = colors) +
  scale_x_continuous(breaks = seq(0, 1, 0.1), transform = "reverse") +
  theme(legend.position = "none")





