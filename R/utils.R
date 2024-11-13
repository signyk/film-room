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
            legend.background = element_rect(fill = "#011224", color = "#011224"),
            legend.frame = element_rect(fill = "#011224", color = "#011224")
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

create_dt <- function(data){
    DT::datatable(
        data,
        #extensions = 'Buttons',
        options = list(
            dom = 'Blfrtip',
            #buttons = c('csv', 'excel'),
            lengthMenu = list(c(-1,10,25,50),
            c("All",10,25,50)
        )
    ))
}