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
