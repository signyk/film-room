plotly_theme <- function(p) {
    ggplotly(plot_theme(p), tooltip = c("text")) %>%
        layout(
            paper_bgcolor = "#011224",
            plot_bgcolor  = "#011224"
        )
}

plot_theme <- function(p){
    return(
        p + 
        theme(
            plot.background = element_rect(fill = "#011224", color = "#ffffff"),
            panel.background = element_rect(fill = "#011224", color = "#ffffff"),
            panel.grid.major = element_line(color = "#013369"),
            panel.grid.minor = element_line(color = "#013369"),
            plot.margin = margin(20, 20, 20, 20, unit = "pt"),
            text = element_text(family = "Montserrat", face="bold", size=3),
            plot.title = element_text(family = "Montserrat", size = 16, face = "bold", hjust = 0.5, color = "#ffffff"),
            plot.subtitle = element_text(family = "Montserrat", size = 11, face = "bold", hjust = 0.5, color = "#ffffff"),
            plot.caption = element_text(family = "Montserrat", size = 11, face = "bold", hjust = 0.5, color = "#ffffff"),
            axis.title = element_text(family = "Montserrat", size = 14, color="#ffffff"),
            axis.text = element_text(family = "Montserrat", size = 12, color = "#ffffff"),
            legend.title = element_text(size=14, family = "Montserrat", face = "bold", color="#ffffff"),
            legend.text = element_text(size = 10, family = "Montserrat", color = "#ffffff"),
            legend.background = element_rect(fill = "#011224", color = "#011224")
            #legend.frame = element_rect(fill = "#011224", color = "#011224")
        )
    )
}

round_to_nearest <- function(num, x) {
    if (!is.numeric(num) || !is.numeric(x) || x <= 0 || floor(x) != x) {
        stop("Both num and x must be numeric, and x must be a positive integer.")
    }
    
    rounded <- round(num / x) * x
    return(rounded)
}

smart_round <- function(x) {
    if (is.na(x)) {
        return(1)
    }
    # Determine the order of magnitude of the number
    order_of_magnitude <- 10^floor(log10(abs(x)))
    
    # Scale the number to a range where we can apply sensible rounding
    scaled_x <- x / order_of_magnitude
    
    # Perform sensible rounding
    if (scaled_x < 1.5) {
        rounded_scaled_x <- 1
    } else if (scaled_x < 4) {
        rounded_scaled_x <- 2
    } else if (scaled_x < 7.5) {
        rounded_scaled_x <- 5
    } else {
        rounded_scaled_x <- 10
    }
    
    # Scale back to the original magnitude
    rounded_value <- rounded_scaled_x * order_of_magnitude
    
    return(rounded_value)
}

get_breaks <- function(step) {
    function(y) {
        # Calculate the range of the breaks
        min_break <- floor(min(y, na.rm = TRUE) / step) * step
        max_break <- ceiling(max(y, na.rm = TRUE) / step) * step
        
        if(!is.finite(min_break) || !is.finite(max_break)) {
            return(NULL)
        }
        
        # Generate the sequence of breaks
        seq(min_break, max_break, by = step)
    }
}



stat_variables <- function(position) {
    if (position == "QB"){
        return(c("Passing.ATT", "Passing.CMP", "Passing.YDS", "Passing.TD", "Passing.2.PT", "Passing.INT", "Passing.Sack",
                 "Rushing.ATT", "Rushing.YDS", "Rushing.TD", "Rushing.2.PT", 
                 "Receiving.TGT", "Receptions", "Receiving.YDS", "Receiving.TD", "Receiving.2.PT", 
                 "Fumbles", "Fumbles.Lost", "Fumble.Recovery.TD"))
    } else if (position == "RB"){
        return(c("Rushing.ATT", "Rushing.YDS", "Rushing.TD", "Rushing.2.PT", 
                 "Receiving.TGT", "Receptions", "Receiving.YDS", "Receiving.TD", "Receiving.2.PT", 
                 "Fumbles", "Fumbles.Lost", "Fumble.Recovery.TD",
                 "Passing.ATT", "Passing.CMP", "Passing.YDS", "Passing.TD", "Passing.2.PT", "Passing.INT", "Passing.Sack"))
    } else if (position %in% c("WR", "TE")) {
        return(c("Receiving.TGT", "Receptions", "Receiving.YDS", "Receiving.TD", "Receiving.2.PT", 
                 "Rushing.ATT", "Rushing.YDS", "Rushing.TD", "Rushing.2.PT", 
                 "Fumbles", "Fumbles.Lost", "Fumble.Recovery.TD",
                 "Passing.ATT", "Passing.CMP", "Passing.YDS", "Passing.TD", "Passing.2.PT", "Passing.INT", "Passing.Sack"))
    } else if (position == "K") {
        return(c("FGA", "FGM", "FGM.0.19", "FGM.20.29", "FGM.30.39", "FGM.40.49", "FGM.50.", "XPA", "XPM"))
    } else if (position == "DEF") {
        return(c("Sacks", "INT", "Forced.Fumbles", "Fumble.Recoveries", "DEF.TD", "RET.TD", "Blocked.Kicks", "YDS.Allowed", "PTS.Allowed", "Safeties"))
    } else {
        return(c())
    }
}

create_dt <- function(data){
    DT::datatable(
        data,
        #extensions = 'Buttons',
        rownames = FALSE,
        options = list(
            dom = 'Blfrtip',
            #buttons = c('csv', 'excel'),
            lengthMenu = list(c(-1,10,25,50),
            c("All",10,25,50)
        )
    ))
}

get_current_nfl_week <- function(start_date = as.Date("2026-09-08"), today_date = Sys.Date()) {
    #' Determine the current NFL week based on the start date and today's date.
    #'
    #' @param start_date The start date of the NFL season (default: "2026-09-08").
    #' @param today_date The current date (default: today).
    #' @return The current NFL week as an integer.
    
    # Calculate the difference in days between today and the start date
    days_difference <- as.numeric(today_date - start_date)
    
    # Calculate the current week (1-based index, each week is 7 days)
    current_week <- floor(days_difference / 7) + 1
    
    # Ensure week is at least 1
    return(max(current_week, 1))
}


# ---- Player comparison ----

WIN_COLOR <- "#54A24B"
LOSE_COLOR <- "#E45756"

STAT_HELP <- c(
    "Projected points" = "Sleeper's projection for this week.",
    "Opponent" = "Who they play this week.",
    "Matchup: points allowed" = "Average fantasy points this opponent gives up to the position per game. 1st easiest is the best matchup.",
    "Average points" = "Points per game played.",
    "Total points" = "All points scored this season.",
    "Last 3 games average" = "Average over the last 3 games played.",
    "Points vs projection" = "Average points above (+) or below (-) the projection per game.",
    "Beat projection" = "Share of games where they scored more than projected.",
    "Dependability" = "How steady the scoring is. 100% means the same score every week.",
    "Worst game" = "Lowest score this season.",
    "Best game" = "Highest score this season.",
    "Opportunities per game" = "QB: pass + rush attempts. RB/WR/TE: carries + targets. K: field goal + extra point attempts.",
    "Games played" = "Games played this season.",
    "Injury status" = "Latest injury status from Sleeper."
)

# Clicking a stat name opens its explanation, and closes any other open one
COMPARE_CSS <- "
a.compare-player { color: inherit; text-decoration: none; }
a.compare-player:hover { text-decoration: underline; }
details.stat-help summary { list-style: none; cursor: pointer; border-bottom: 1px dotted rgba(255,255,255,0.5); display: inline; }
details.stat-help summary::-webkit-details-marker { display: none; }
details.stat-help div { margin-top: 6px; padding: 6px 10px; background: #013369; border-radius: 4px; font-size: 13px; max-width: 280px; }
"
STAT_HELP_TOGGLE <- "if (this.open) document.querySelectorAll('details.stat-help[open]').forEach(d => { if (d !== this) d.open = false; })"

# Clicking a player's name selects them on the Players page and switches to it
OPEN_PLAYER_JS <- "
Shiny.setInputValue('compare_open_player', this.dataset.player, {priority: 'event'});
var page = $('ul.navbar-nav li a[data-toggle=tab]').filter(function() { return $(this).text().trim() === 'Players'; });
window.FlexDashboardUtils.showPage(page.attr('href'));
return false;
"

INJURY_LABELS <- c(
    Q = "Questionable", D = "Doubtful", OUT = "Out", IR = "IR",
    PUP = "PUP", COV = "COV", DNR = "DNR", SUS = "Suspended"
)

position_matchups <- function(data, year, current_week) {
    #' Average fantasy points each team has allowed per game to each position this season,
    #' with a rank per position where 1 is the easiest matchup.
    data %>%
        filter(Year == year, Week < current_week, !is.na(Opponent), Opponent != "") %>%
        group_by(Opponent, Week, Position) %>%
        summarise(points = sum(Fantasy.Points, na.rm = TRUE), .groups = "drop") %>%
        group_by(Opponent, Position) %>%
        summarise(allowed = mean(points), .groups = "drop") %>%
        group_by(Position) %>%
        mutate(allowed_rank = rank(-allowed, ties.method = "min")) %>%
        ungroup()
}

opportunities <- function(games, position) {
    #' Chances to score per game: pass + rush attempts for QBs, carries + targets for
    #' RB/WR/TE and FG + XP attempts for kickers. Not defined for defenses.
    if (position == "QB") {
        games$Passing.ATT + games$Rushing.ATT
    } else if (position %in% c("RB", "WR", "TE")) {
        games$Rushing.ATT + games$Receiving.TGT
    } else if (position == "K") {
        games$FGA + games$XPA
    } else {
        rep(NA_real_, nrow(games))
    }
}

ordinal <- function(n) {
    suffix <- if (n %% 100 %in% 11:13) "th" else c("th", "st", "nd", "rd", rep("th", 6))[n %% 10 + 1]
    paste0(n, suffix)
}

format_stat <- function(x, digits = 1, prefix = "", suffix = "") {
    if (length(x) == 0 || is.na(x)) {
        return("–")
    }
    paste0(prefix, formatC(x, format = "f", digits = digits), suffix)
}

player_compare_stats <- function(data, player, year, current_week, matchups) {
    #' Stats used to decide between two players for the current week, based on the games
    #' played so far this season.
    rows <- data %>% filter(Year == year, Player == player) %>% arrange(Week)
    position <- rows$Position[1]
    team <- rows$Team[1]
    injury <- rows$Injury.Status[1]

    games <- rows %>% filter(Week < current_week, !is.na(Fantasy.Points))
    points <- games$Fantasy.Points
    has_games <- length(points) > 0
    avg <- if (has_games) mean(points) else NA
    vs_projection <- points - games$Projection

    this_week <- rows %>% filter(Week == current_week)
    opponent <- if (nrow(this_week) == 1) this_week$Opponent else NA
    on_bye <- is.na(opponent) || opponent == ""
    projection <- if (on_bye) 0 else coalesce(this_week$Projection, 0)

    matchup <- matchups %>% filter(Opponent == opponent, Position == position)
    allowed <- if (nrow(matchup) == 1) matchup$allowed else NA
    # Compare on rank so players at different positions (e.g. RB vs WR) are comparable
    matchup_rank <- if (nrow(matchup) == 1) matchup$allowed_rank else NA
    matchup_display <- if (is.na(allowed)) "–" else paste0(
        format_stat(allowed), " to ", position, "s / game (", ordinal(matchup$allowed_rank), " easiest)"
    )

    dependability <- if (length(points) > 1 && avg > 0) max(0, 1 - sd(points) / avg) else NA
    opportunities_per_game <- if (has_games) mean(opportunities(games, position), na.rm = TRUE) else NA
    injury_level <- case_when(is.na(injury) | injury == "" ~ 0, injury == "Q" ~ 1, injury == "D" ~ 2, TRUE ~ 3)
    injury_display <- if (injury_level == 0) "Healthy" else coalesce(unname(INJURY_LABELS[injury]), injury)

    stats <- tribble(
        ~stat, ~value, ~display, ~better,
        "Projected points", projection, format_stat(projection), "higher",
        "Opponent", NA, if (on_bye) "BYE" else paste("vs", opponent), "none",
        "Matchup: points allowed", matchup_rank, matchup_display, "lower",
        "Average points", avg, format_stat(avg), "higher",
        "Total points", sum(points), format_stat(sum(points)), "higher",
        "Last 3 games average", if (has_games) mean(tail(points, 3)) else NA,
            format_stat(if (has_games) mean(tail(points, 3)) else NA), "higher",
        "Points vs projection", if (has_games) mean(vs_projection, na.rm = TRUE) else NA,
            format_stat(if (has_games) mean(vs_projection, na.rm = TRUE) else NA,
                        prefix = if (has_games && mean(vs_projection, na.rm = TRUE) > 0) "+" else ""), "higher",
        "Beat projection", if (has_games) mean(vs_projection > 0, na.rm = TRUE) else NA,
            format_stat(if (has_games) 100 * mean(vs_projection > 0, na.rm = TRUE) else NA, digits = 0, suffix = "%"), "higher",
        "Dependability", dependability, format_stat(100 * dependability, digits = 0, suffix = "%"), "higher",
        "Worst game", if (has_games) min(points) else NA, format_stat(if (has_games) min(points) else NA), "higher",
        "Best game", if (has_games) max(points) else NA, format_stat(if (has_games) max(points) else NA), "higher",
        "Opportunities per game", opportunities_per_game, format_stat(opportunities_per_game), "higher",
        "Games played", length(points), as.character(length(points)), "higher",
        "Injury status", injury_level, injury_display, "lower"
    )

    list(name = player, position = position, team = team, stats = stats)
}

compare_players <- function(a, b) {
    #' One row per stat with the winner ("a", "b" or "tie")
    a$stats %>%
        select(stat, better, value_a = value, display_a = display) %>%
        mutate(value_b = b$stats$value, display_b = b$stats$display) %>%
        mutate(winner = case_when(
            better == "none" | is.na(value_a) | is.na(value_b) ~ "tie",
            round(value_a, 2) == round(value_b, 2) ~ "tie",
            better == "higher" & value_a > value_b ~ "a",
            better == "lower" & value_a < value_b ~ "a",
            TRUE ~ "b"
        ))
}

compare_verdict <- function(comparison) {
    #' The player who wins the most stats, with the projection breaking ties.
    #' A player on bye or ruled out (Out, IR, ...) never gets the start over one who can play.
    opponent <- comparison %>% filter(stat == "Opponent")
    injury <- comparison %>% filter(stat == "Injury status")
    out_a <- opponent$display_a == "BYE" || injury$value_a >= 3
    out_b <- opponent$display_b == "BYE" || injury$value_b >= 3
    if (out_a != out_b) {
        return(if (out_a) "b" else "a")
    }

    wins_a <- sum(comparison$winner == "a")
    wins_b <- sum(comparison$winner == "b")
    if (wins_a != wins_b) {
        return(if (wins_a > wins_b) "a" else "b")
    }
    projection <- comparison %>% filter(stat == "Projected points")
    if (projection$value_a == projection$value_b) "tie" else if (projection$value_a > projection$value_b) "a" else "b"
}

compare_card <- function(player, comparison, side) {
    team_color <- colors_df$color[colors_df$short_name == player$team]
    team_color <- if (length(team_color) == 0) "#013369" else team_color[1]
    displays <- comparison[[paste0("display_", side)]]
    value_colors <- case_when(
        comparison$winner == "tie" ~ "#ffffff",
        comparison$winner == side ~ WIN_COLOR,
        TRUE ~ LOSE_COLOR
    )
    wins <- sum(comparison$winner == side)
    contested <- sum(comparison$winner != "tie")
    verdict <- compare_verdict(comparison)
    badge <- if (verdict == side) {
        span("START", style = paste0("background:", WIN_COLOR, ";border-radius:4px;padding:2px 10px;font-size:16px;margin-left:12px;vertical-align:middle;"))
    } else if (verdict == "tie") {
        span("TOSS-UP", style = "background:#013369;border-radius:4px;padding:2px 10px;font-size:16px;margin-left:12px;vertical-align:middle;")
    }

    lines <- lapply(seq_len(nrow(comparison)), function(i) {
        div(
            style = "display:flex;justify-content:space-between;align-items:flex-start;gap:12px;padding:8px 0;border-bottom:1px solid #013369;font-size:16px;",
            tags$details(
                class = "stat-help",
                ontoggle = STAT_HELP_TOGGLE,
                tags$summary(comparison$stat[i]),
                div(STAT_HELP[[comparison$stat[i]]])
            ),
            span(displays[i], style = paste0("color:", value_colors[i], ";font-weight:bold;text-align:right;"))
        )
    })

    div(
        tags$style(COMPARE_CSS),
        style = paste0("border-top:6px solid ", team_color, ";padding:12px 16px;margin-top:8px;"),
        h2(
            a(player$name, href = "#", class = "compare-player", `data-player` = player$name,
              title = "Open in Players", onclick = OPEN_PLAYER_JS),
            badge,
            style = "margin-top:0;"
        ),
        p(paste0(player$position, " at ", player$team, " · wins ", wins, " of ", contested, " stats"),
          style = "font-size:16px;opacity:0.8;"),
        lines
    )
}
