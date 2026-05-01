# ---- mod_sidebarcontrols ---------------------------------------------------
# Controls below the sidebar menu: animation mode (None/Spin/Rock), sequence
# strip toggle, and fullscreen trigger. Talks to the viewer via proxy.
#
# Reactive contract:
#   reads  : input$animate, input$showSequence, input$fullscreen
#   writes : r$sidebarcontrols$showSequence
#   needs  : globalSession (NGLVieweR_proxy on the renderer's output id)

mod_sidebarcontrols_ui <- function(id) {
  ns <- NS(id)
  tagList(
    div(
      id = "sidebarControls",
        radioGroupButtons(inputId = ns("animate"), label = "Animation", choices = c("None", "Spin", "Rock"), status = "primary"),
        materialSwitch(ns("showSequence"), label = "Sequence", value = TRUE, status = "primary"),
        actionButton(ns("fullscreen"), "Fullscreen", icon = icon("expand-alt")
      )
    )
  )
}
    
mod_sidebarcontrols_server <- function(id, globalSession, r) {
  moduleServer(id, function(input, output, session) {
    ns <- session$ns

    Viewer_proxy <- NGLVieweR_proxy("NGLVieweROutput_ui_1-structure", session = globalSession)

    observeEvent(input$animate, {
      if (input$animate == "Rock") {
        Viewer_proxy %>% updateRock(TRUE)
      } else if (input$animate == "Spin") {
        Viewer_proxy %>% updateSpin(TRUE)
      } else {
        Viewer_proxy %>% updateRock(FALSE) %>% updateSpin(FALSE)
      }
    })

    observeEvent(input$showSequence, {
      r$sidebarcontrols$showSequence <- input$showSequence
    })

    observeEvent(input$fullscreen, {
      Viewer_proxy %>% updateFullscreen()
    })
  })
}
    
## To be copied in the UI
# 
    
## To be copied in the server
# 
 
