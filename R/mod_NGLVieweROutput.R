# ---- mod_NGLVieweROutput ---------------------------------------------------
# Main 3D viewer pane. Wraps NGLVieweR's WebGL widget and a loading spinner.
# Default-loads www/7cid.ngl on first session if no fileInput is set.
#
# Reactive contract:
#   reads  : r$fileInput$PDB / fileExt / stage / labels / selections / ligand /
#            contacts / structure / surface, r$rendering
#   writes : r$fileInput (default 7cid load only),
#            r${selection,label,contact,structure,surface,ligand,stage}$loaded,
#            r${structure,surface,ligand,stage}${same name}, r$contact$contacts
#   needs  : —

mod_NGLVieweROutput_ui <- function(id) {
  ns <- NS(id)
  tagList(
    div(
      class = "ngl-viewer-wrap",
      style = "height: 91dvh;",
      NGLVieweROutput(ns("structure"), height = "100%")
    ),
    div(
      id = ns("render-loader"),
      style = "position: absolute; z-index: 999; top: 91dvh; padding: 25px; color: grey;",
      HTML('<div class="fa-1x"><i class="fas fa-spinner fa-spin"></i> loading...</div>')
    )
  )
}
    
mod_NGLVieweROutput_server <- function(id, r) {
  moduleServer(id, function(input, output, session) {
    ns <- session$ns

    # Load default example once on session start so the render does not
    # mutate a reactive value it also reads from.
    observe({
      if (is.null(r$fileInput$PDB)) {
        default <- readFile("www/7cid.ngl")
        default$name <- "7cid"
        r$fileInput <- default
      }
    }, priority = 100)

    output$structure <- renderNGLVieweR({
      req(r$fileInput$PDB)

      viewerOutput <- NGLVieweR(r$fileInput$PDB, format = r$fileInput$fileExt) %>%
        loadStage(r$fileInput$stage) %>%
        setQuality("high") %>%
        setFocus(0) %>%
        setSpin(FALSE) %>%
        addRepresentation("ball+stick", param = list(
          name = "aa_clicked", visible = TRUE,
          sele = "none", color = "element", colorValue = "#33FF19"
        )) %>%

        # Load from .ngl file
        loadLabels(r$fileInput$labels) %>%
        loadSelections(r$fileInput$selections) %>%
        loadLigand(r$fileInput$ligand) %>%
        loadContacts(r$fileInput$contacts) %>%
        loadStructure(r$fileInput$structure, format = r$fileInput$fileExt) %>%
        loadSurface(r$fileInput$surface)

      isolate({
        r$selection$loaded <- FALSE
        r$label$loaded <- FALSE
        r$contact$loaded <- FALSE
        r$structure$loaded <- FALSE
        r$surface$loaded <- FALSE
        r$ligand$loaded <- FALSE
        r$stage$loaded <- FALSE
        r$structure$structure <- NULL
        r$surface$surface <- NULL
        r$ligand$ligand <- NULL
        r$stage$stage <- NULL
        r$contact$contacts <- NULL
      })

      return(viewerOutput)
    })

    #Loader
    observeEvent(r$rendering, {
      if (isTRUE(r$rendering) || is.null(r$rendering)) {
        shinyjs::show("render-loader")
      } else {
        shinyjs::hide("render-loader")
      }
    })
  })
} 
## To be copied in the UI
# 
    
## To be copied in the server
# 
 
