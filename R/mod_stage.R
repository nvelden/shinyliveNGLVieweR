# ---- mod_stage -------------------------------------------------------------
# Sidebar panel: scene-level stage controls (background, camera type, light
# intensity, near/far clip). The light/dark theme is driven by the chosen
# background — switching to white injects an inline <style> override.
#
# Reactive contract:
#   reads  : r$sidebarItemExpanded, r$fileInput$stage, r$stage$loaded /
#            fileColor
#   writes : r$stage$stage / fileColor / loaded
#   needs  : globalSession (NGLVieweR_proxy on the renderer's output id)

mod_stage_ui <- function(id) {
  ns <- NS(id)
  tagList(
    uiOutput(ns("backGroundColor_theme")),
    menuItem("stage",
      icon = icon("eye"),
      selectInput(ns("background"), "Background", c("black", "white")),
      selectInput(ns("camera"), "Camera", c("perspective", "orthographic", "stereo")),
      sliderInput(ns("lightintensity"), "Light intensity", ticks = FALSE, step = 0.1, min = 0, max = 2, value = 1),
      sliderInput(ns("clipNear"), "clip Near", ticks = FALSE, step = 1, min = 0, max = 100, value = 0),
      sliderInput(ns("clipFar"), "clip Far", ticks = FALSE, step = 1, min = 0, max = 100, value = 100)
    )
  )
}
mod_stage_server <- function(id, globalSession, r) {
  moduleServer(id, function(input, output, session) {
    ns <- session$ns

    Viewer_proxy <- NGLVieweR_proxy("NGLVieweROutput_ui_1-structure", session = globalSession)

    observeEvent(r$sidebarItemExpanded, {
    if (r$stage$loaded == FALSE && r$sidebarItemExpanded == "stage") { # reset in mod_NGLVieweROutput
      if (!is.null(r$fileInput$stage)) {
        data <- r$fileInput$stage
        updateSelectInput(session, "background", selected = data$backgroundColor)
        updateSelectInput(session, "camera", selected = data$camera)
        updateSelectInput(session, "lightintensity", selected = data$lightIntensity)
        updateSliderInput(session, "clipNear", value = data$clipNear)
        updateSliderInput(session, "clipFar", value = data$clipFar)
      }
    } else {
      updateSelectInput(session, "background", selected = "black")
      updateSelectInput(session, "camera", selected = "perspective")
      updateSelectInput(session, "lightintensity", selected = 1)
      updateSliderInput(session, "clipNear", value = 0)
      updateSliderInput(session, "clipFar", value = 100)
    }
    r$stage$loaded <- TRUE
  })

  observe({
    
    #Start observer when stage has loaded
    req(r$stage$loaded)
    
    if (!is.null(r$sidebarItemExpanded)) {
      if (r$sidebarItemExpanded == "stage") {
        Viewer_proxy %>% updateStage(
          param =
            list(
              cameraType = input$camera,
              backgroundColor = input$background,
              lightIntensity = input$lightintensity,
              clipNear = input$clipNear,
              clipFar = input$clipFar
            )
        )
        # Write data.frame
        r$stage$stage <- data.frame(
          cameraType = input$camera,
          backgroundColor = input$background,
          lightIntensity = input$lightintensity,
          clipNear = input$clipNear,
          clipFar = input$clipFar
        )
      }
    }
  })
  
observeEvent(input$background, {
  r$stage$fileColor <- input$background #Set back to black in load and examples modules.
})  
  
    output$backGroundColor_theme <- renderUI({
      if (is.null(r$stage$fileColor)) {
        fileColor <- "black"
      } else {
        fileColor <- r$stage$fileColor
      }

      if (fileColor == "white") {
        div(
          tags$style(HTML(".content-wrapper{background-color: white !important;}")),
          tags$style(HTML(".box.box-solid.box-primary >.box-header {background-color: black;}")),
          tags$style(HTML("#structure {background-color: white;}")),
          tags$style(HTML(".box.box-solid.box-primary{border-color: black;}")),
          tags$style(HTML(".box-title {color: black;}")),
          tags$style(HTML(".btn-box-tool {color: white !important;}")),
        )
      }
    })
  })
}
## To be copied in the UI
# 
    
## To be copied in the server
# 
 
