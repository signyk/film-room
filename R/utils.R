plot_theme <- function(p){
    return(
        p + 
        theme(
            plot.background = element_rect(fill = "#011224", color = "#ffffff"),
            panel.background = element_rect(fill = "#011224", color = "#ffffff"),
            panel.grid.major = element_line(color = "#013369"),
            panel.grid.minor = element_line(color = "#013369"),
            legend.background = element_rect(fill = "#011224", color = "#ffffff"),
            plot.margin = margin(20, 20, 20, 20, unit = "pt"),
            text = element_text(family = "Montserrat", face="bold", size=3),
            plot.title = element_text(family = "Montserrat", size = 16, face = "bold", hjust = 0.5, color = "#ffffff"),
            plot.subtitle = element_text(family = "Montserrat", size = 11, face = "bold", hjust = 0.5, color = "#ffffff"),
            plot.caption = element_text(family = "Montserrat", size = 11, face = "bold", hjust = 0.5, color = "#ffffff"),
            axis.title = element_text(family = "Montserrat", size = 14, color="#ffffff"),
            axis.text = element_text(family = "Montserrat", size = 12, color = "#ffffff"),
            legend.title = element_text(family = "Montserrat", face = "bold", color="#ffffff"),
            legend.text = element_text(size = 10, family = "Montserrat", color = "#ffffff")
        )
    )
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