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
            axis.title = element_text(family = "Montserrat", size = 14, color="#ffffff"),
            axis.text = element_text(family = "Montserrat", size = 12, color = "#ffffff"),
            legend.title = element_text(family = "Montserrat", face = "bold"),
            legend.text = element_text(size = 10)
        )
    )
}