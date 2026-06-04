
// Create the ICTV namespace if it doesn't already exist.
if (!window.ICTV) { window.ICTV = {}; }

// Make sure the tippy library is available.
if (!window.tippy) {
   if (!!tippy) {
      window.tippy = tippy;
   } else {
      // Since tippy.js isn't available, add a dummy delegate function so tooltips will fail gracefully.
      console.error("Unable to find the tippy.js library");
      window.tippy = {
         delegate: function (/* Not in use: dummyOne, dummyTwo */) { }
      };
   }
}


window.ICTV.d3TaxonomyVisualization = function (
   containerSelector_,
   currentReleaseNumber_,
   dataURL_,
   releases_,
   taxonDetailsURL_,
   taxonomyURL_
) {

   // Validate input parameters
   if (!containerSelector_) { throw new Error("Invalid container selector"); }
   const containerSelector = containerSelector_;

   if (!currentReleaseNumber_) { throw new Error("Invalid current release number"); }
   const currentReleaseNumber = currentReleaseNumber_;

   if (!dataURL_) { throw new Error("Invalid data URL"); }
   const dataURL = dataURL_;

   if (!releases_) { throw new Error("Invalid MSL releases parameter"); }
   const releases = releases_;

   if (!taxonDetailsURL_) { throw new Error("Invalid taxon details URL"); }
   const taxonDetailsURL = taxonDetailsURL_;

   if (!taxonomyURL_) { throw new Error("Invalid taxonomy web service URL"); }
   const taxonomyURL = taxonomyURL_;


   // Configuration settings (to replace hard-coded values below)
   const settings = {
      pageSize: 25, // Number of nodes on the screen when paginating.
      pageStep: 25, // How many nodes are brought on from the next page when paginating.
      animationDuration: 900,
      animationDelay: 400,
      node: {
         // radius: 17.5,
         radius: 20,
         strokeWidth: 3,
         textDx: 25,
         textDy: 25,
         baseVerticalSpacing: 200, // Adjust this number to increase/decrease row height
      },
      svg: {
         height: jQuery(`${containerSelector} .taxonomy-panel`).height() || jQuery(window).height() * 0.8,
         width: jQuery(`${containerSelector} .taxonomy-panel`).width() || jQuery(window).width(),
      },
      tooltip: {
         animation: "scale",
         hideDelay: 0,
         interactiveBorder: 5,
         showDelay: 300
      },

      // This was how the SVG was positioned before.
      // The jQuery window made sense, but it was being multiplied by seemingly magic numbers for the view to show right.
      // I implemented a different approach to hopefully be a more dynamic way of doing it.
      // Search for DYNAMIC INITIAL ALIGNMENT to find implementation.
      // ===========================================================================
      // xFactor: 0.5, // TODO: this is influencing Y offset, not X
      // yFactor: 300,
      // yOffset: 0,
      // zoom: {
      //    scaleFactor: 0.19, //.17,
      //    translateX: -(jQuery(window).width()), * 2.5 //-3850,
      //    translateY: -(jQuery(window).height() * 0.45), //-1800
      // },
      // ===========================================================================
   };

   // Global variables

   const paginationData = {
      // The display order of a target child node.
      childDisplayOrder: NaN,
      // The (string) parent taxnode ID of the target child node.
      parentTaxnodeID: null
   }

   let currentTreeRoot = null;
   let currentTreeUpdate = null;
   let currentTreeExpandToFit = null;
   let currentTreeFitSearchExpansionIfClipped = null;
   let currentTreeIsExpandedToFit = false;

   // Assigned by createTree() so outside controls can clear measured spacing before a normal rerender.
   let currentTreeResetAutoSpacing = null;

   // Assigned by createTree() so search expansion can wait until measured spacing has settled.
   let currentTreeWaitForAutoSpacing = null;

   // Remember the last spacing that cleared overlap so a rebuilt tree can start with the same scale.
   let rememberedAutoSpacing = {
      horizontalScale: 1,
      verticalScale: 1
   };

   // Zoom behavior for font slider
   let currentZoom = null;
   let currentSvgZoom = null;
   let initialZoomTransform = null;
   const zoomScaleSettings = {
      minScale: 0.01,
      maxScale: 1,
      sliderMin: 0,
      sliderMax: 100,
      sliderStep: 0.1
   };

   const defaultFontSize = 4;
   var currentFontSize;
   var selectedNode;
   var clickedText;
   var clickedCircle;
   var name = "";
   const selectedNodeHighlightColor = "#006CB5";
   const defaultNodeTextColor = "#000000";
   const defaultNodeCircleFill = "#FFFFFF";

   // The DOM Element for the font size panel and slider (these are assigned in "iniitializeFontSizePanel").
   let fontSizePanelEl = null;
   let fontSliderEl = null;

   // DOM element for Zoom slider (assigned in "initialzeZoomPanel")
   let ZoomPanelEl = null;
   let ZoomSliderEl = null;

   // Not in use: these globals are shadowed by local variables in initializeButton().
   // TODO: Should these be used inside initializeButton() instead of making new local variables?
   // let buttonE1 = null;
   // let buttonClickE1 = null

   // The DOM Element for the release control (this is assigned in "initializeReleaseControl").
   let releaseControlEl = null;

   // Choose to paginate taxa (by default it is on)
   let togglePaginate = null;

   // Create an instance of the search panel object and initialize it.
   const searchPanel = new window.ICTV.SearchPanel(currentReleaseNumber, selectSearchResult, `${containerSelector} .search-results-panel`,
      `${containerSelector} .search-panel`, taxonDetailsURL, taxonomyURL);

   searchPanel.initialize();


   // Initialize the font size slider and its label.
   initializeFontSizePanel();

   // Initialize the Zoom slider and its label.
   initializeZoomPanel();

   //Initialize ss 
   initializeButton();

   // Initialize the paginate toggle.
   initializePaginateToggle();

   // Initialize the release control using MSL release data.
   initializeReleaseControl();

   // Is pagination enabled?
   function isPaginationEnabled() {
      return !togglePaginate || togglePaginate.checked;
   }

   // Return the active D3 zoom scale limits, falling back to configured defaults before the SVG exists.
   // Used by zoom slider conversion helpers and tree-fit calculations.
   function getCurrentZoomExtent() {
      return currentZoom ? currentZoom.scaleExtent() : [zoomScaleSettings.minScale, zoomScaleSettings.maxScale];
   }

   // Keep a requested zoom scale inside the current D3 zoom extent.
   // Used before applying slider, reset, and expand-to-fit zoom values.
   function clampZoomScale(scale) {
      const extent = getCurrentZoomExtent();
      return Math.max(extent[0], Math.min(extent[1], scale));
   }

   // Convert a D3 zoom scale to the linear slider range using logarithmic spacing.
   // Used when initializing and syncing the zoom slider with mouse or touch zoom events.
   function zoomScaleToSliderValue(scale) {
      const extent = getCurrentZoomExtent();
      const minLog = Math.log(extent[0]);
      const maxLog = Math.log(extent[1]);
      const clampedScale = clampZoomScale(scale);
      const t = (Math.log(clampedScale) - minLog) / (maxLog - minLog);

      return zoomScaleSettings.sliderMin + (t * (zoomScaleSettings.sliderMax - zoomScaleSettings.sliderMin));
   }

   // Convert a linear slider value back to a D3 zoom scale using the same logarithmic mapping.
   // Used by the zoom slider input handler before calling D3 zoom behavior.
   function sliderValueToZoomScale(value) {
      const extent = getCurrentZoomExtent();
      const sliderRange = zoomScaleSettings.sliderMax - zoomScaleSettings.sliderMin;
      const t = (parseFloat(value) - zoomScaleSettings.sliderMin) / sliderRange;
      const minLog = Math.log(extent[0]);
      const maxLog = Math.log(extent[1]);

      return Math.exp(minLog + (Math.max(0, Math.min(1, t)) * (maxLog - minLog)));
   }

   // Update the zoom slider UI to match the current zoom transform or scale value.
   // Called from the D3 zoom handler so wheel and pan gestures keep the control in sync.
   function syncZoomSlider(transformOrScale) {
      if (!ZoomSliderEl) { return; }

      const scale = typeof transformOrScale === "number" ? transformOrScale : transformOrScale.k;
      const sliderValue = zoomScaleToSliderValue(scale);

      ZoomSliderEl
         .property("value", sliderValue)
         .attr("aria-valuetext", `${Math.round(clampZoomScale(scale) * 100)}%`);
   }

   // Read the rendered SVG viewport size, with configured dimensions as a fallback.
   // Used by zoom focus and fit-to-bounds calculations.
   function getSvgViewportSize() {
      const svgNode = currentSvgZoom ? currentSvgZoom.node() : null;
      const rect = svgNode ? svgNode.getBoundingClientRect() : null;

      return {
         width: rect && rect.width ? rect.width : settings.svg.width,
         height: rect && rect.height ? rect.height : settings.svg.height
      };
   }

   // Restore the CSS-defined taxonomy viewport before each release is rendered.
   // Tall initial trees can grow it later, but normal trees should keep the default 83vh panel.
   function resetTaxonomyViewportHeight() {
      const container = document.querySelector(containerSelector);
      const bodyPanel = document.querySelector(`${containerSelector} .body-panel`);
      const taxonomyPanel = document.querySelector(`${containerSelector} .taxonomy-panel`);

      if (container) {
         container.classList.remove("taxonomy-panel-auto-height");
      }

      if (bodyPanel) {
         bodyPanel.style.height = "";
      }

      if (taxonomyPanel) {
         taxonomyPanel.style.height = "";
      }

      const panelRect = taxonomyPanel ? taxonomyPanel.getBoundingClientRect() : null;
      settings.svg.height = panelRect && panelRect.height ? panelRect.height : jQuery(window).height() * 0.8;
      settings.svg.width = panelRect && panelRect.width ? panelRect.width : jQuery(window).width();
   }

   // Grow the taxonomy viewport when the initial tree would otherwise have to zoom out
   // because of its height. This keeps dense first-rank releases readable without
   // changing the default height for smaller releases.
   function resizeTaxonomyViewportHeightForBounds(bounds, padding) {
      if (!bounds || bounds.width <= 0 || bounds.height <= 0) { return false; }

      const container = document.querySelector(containerSelector);
      const bodyPanel = document.querySelector(`${containerSelector} .body-panel`);
      const taxonomyPanel = document.querySelector(`${containerSelector} .taxonomy-panel`);
      const svgNode = currentSvgZoom ? currentSvgZoom.node() : null;

      if (!bodyPanel || !taxonomyPanel || !svgNode) { return false; }

      const viewport = getSvgViewportSize();
      const availableWidth = Math.max(1, viewport.width - padding.left - padding.right);
      const availableHeight = Math.max(1, viewport.height - padding.top - padding.bottom);
      const widthLimitedScale = clampZoomScale(availableWidth / bounds.width);
      const heightLimitedScale = availableHeight / bounds.height;

      if (heightLimitedScale >= widthLimitedScale - 0.001) { return false; }

      const requiredHeight = Math.ceil((bounds.height * widthLimitedScale) + padding.top + padding.bottom);

      if (requiredHeight <= viewport.height + 1) { return false; }

      if (container) {
         container.classList.add("taxonomy-panel-auto-height");
      }

      bodyPanel.style.height = `${requiredHeight}px`;
      taxonomyPanel.style.height = "100%";
      settings.svg.height = requiredHeight;

      d3.select(svgNode).attr("height", requiredHeight);

      return true;
   }

   // Find a stable viewport point to zoom around, preferring the visible tree bounds over the viewport center.
   // Used by the zoom slider so scaling stays centered on the currently visible taxonomy.
   function getZoomFocusPoint() {
      const viewport = getSvgViewportSize();
      const fallback = [viewport.width / 2, viewport.height / 2];
      const groupNode = document.querySelector(`${containerSelector} .taxonomy-panel svg g`);

      if (!groupNode || !currentSvgZoom) { return fallback; }

      let bounds;

      try {
         bounds = groupNode.getBBox();
      } catch {
         // Not in use: catch binding e.
         return fallback;
      }

      if (!bounds || bounds.width === 0 || bounds.height === 0) { return fallback; }

      const transform = d3.zoomTransform(currentSvgZoom.node());
      const left = transform.applyX(bounds.x);
      const right = transform.applyX(bounds.x + bounds.width);
      const top = transform.applyY(bounds.y);
      const bottom = transform.applyY(bounds.y + bounds.height);
      const visibleLeft = Math.max(0, Math.min(viewport.width, left));
      const visibleRight = Math.max(0, Math.min(viewport.width, right));
      const visibleTop = Math.max(0, Math.min(viewport.height, top));
      const visibleBottom = Math.max(0, Math.min(viewport.height, bottom));

      return [
         visibleRight > visibleLeft ? (visibleLeft + visibleRight) / 2 : fallback[0],
         visibleBottom > visibleTop ? (visibleTop + visibleBottom) / 2 : fallback[1]
      ];
   }

   // Use the same viewport padding for initial tree alignment and expand-to-fit.
   function getInitialTreePadding() {
      return {
         left: 5,
         // We need to prevent text from getting cut off!
         right: 150,
         top: 5,
         bottom: 0
      };
   }

   // Calculate the largest zoom scale that fits a bounds rectangle in the SVG viewport.
   // Used by initial alignment, Expand to Fit, and search-driven viewport checks.
   function fitScaleForBounds(bounds, padding) {
      if (!bounds || bounds.width === 0 || bounds.height === 0) { return null; }

      const viewport = getSvgViewportSize();
      const scalePadding = typeof padding === "number" ? padding : 1;
      const pixelPadding = typeof padding === "object" && padding !== null
         ? padding
         : { left: 0, right: 0, top: 0, bottom: 0 };
      const availableWidth = Math.max(1, viewport.width - pixelPadding.left - pixelPadding.right);
      const availableHeight = Math.max(1, viewport.height - pixelPadding.top - pixelPadding.bottom);
      const scaleWidth = availableWidth / bounds.width;
      const scaleHeight = availableHeight / bounds.height;

      return clampZoomScale(Math.min(scaleWidth, scaleHeight) * scalePadding);
   }

   // Wire the pagination toggle and rebuild the active release when the user changes it.
   // Used during startup to switch the tree between full and paginated child lists.
   function initializePaginateToggle() {
      togglePaginate = document.querySelector(`${containerSelector} .header-panel .paginate-ctrl`);
      if (!togglePaginate) { throw new Error("Invalid paginate toggle Element"); }

      togglePaginate.addEventListener("change", async function () {
         if (!currentTreeRoot || !currentTreeUpdate) return;

         // Re-display the current release to rebuild the tree with or without pagination
         const releaseYear = releaseControlEl.value;
         if (releaseYear) {
            await displayReleaseTaxonomy(releaseYear);
         }
      });
   }

   // Build the toolbar buttons and export format selector in the font-size panel.
   // Used during startup to support PNG/SVG/PDF export plus Expand to Fit and Reset View controls.
   function initializeButton() {

      // Get a reference to the panel Element.
      let buttonE1 = document.querySelector(`${containerSelector} .font-size-panel`);
      if (!buttonE1) { throw new Error("Invalid font size panel Element"); }

      const buttonGroup = d3
         .select(`${containerSelector} .font-size-panel`)
         .append("div")
         .attr("class", "button-group view-buttons");

	   // "Expand to Fit" button
      let expandToFitBtn = d3
         .select(buttonGroup.node())
         .append("button")
         .attr("class", "screenshot-button expand-to-fit-btn")
         .html(`<i class="fa fa-expand"></i> Expand to Fit`)

      // "Reset View" button
      let resetViewBtn = d3
         .select(buttonGroup.node())
         .append("button")
         .attr("class", "screenshot-button reset-view-btn")
         .html(`<i class="fa fa-home"></i> Reset View`);

      // Create a button.
      let buttonClickE1 = d3
         .select(buttonGroup.node())
         .append("button")
         .attr("class", "screenshot-button")
         .html(`<i class="fa fa-camera"></i> Export`);

      // Create a dropdown for format selection.
      let selectFormat = d3.select(buttonGroup.node())
         .append("select")
         .attr("class", "selectFormat");

      // Add options to the dropdown.
      selectFormat.selectAll("option")
         // lrm 6-7-2024
         // changed "pdf" to svg
         .data(["png", "svg", "pdf"]) // SVG supported now
         .enter()
         .append("option")
         .attr("value", function (d) { return d; })
         .text(function (d) { return d.toUpperCase(); });

      // Click on button to get screenshot.
      buttonClickE1.on("click", function (/* Not in use: e */) {

         const selectedFormat = selectFormat.node().value;

         if (selectedFormat === "png") {

            // Select the SVG element from the document
            let svg = document.querySelector('svg');

            // Get the D3 selection of the SVG
            let svgSelection = d3.select(svg);

            // Apply inline CSS to match SVG before
            svgSelection.selectAll('text.legend-node-text')
               .style('font-style', 'normal')
               .attr('transform', function (/* Not in use: d, i */) {
                  return 'rotate(-45, 50, 50)';
               })

            svgSelection.selectAll('text.node-text')
               .style('font-style', 'italic')
               .style('font-weight', 'bold')

            svgSelection.selectAll('text.unassigned-text')
               .style('font-style', 'normal')

            svgSelection.selectAll('text')
               // Restore the user's font size after export
               .style('font-size', ((currentFontSize || 4) * 16) + 'px')
               .style('fill', 'black')
               .style('text-transform', 'capitalize')

            // Save the original viewBox attribute value of the SVG
            let originalViewBox = svg.getAttribute('viewBox');

            // Get the bounding box of the SVG content
            let bbox = svg.getBBox();

            // Set the viewBox attribute to the bounding box dimensions to fit the SVG contents
            svg.setAttribute('viewBox', `${bbox.x} ${bbox.y} ${bbox.width} ${bbox.height}`);

            // Get the size of the SVG element in pixels
            let svgSize = svg.getBoundingClientRect();

            // Function to process the SVG and convert it to an image
            let processPanel = () => {
               // Not in use: reject callback is not needed.
               return new Promise((resolve) => {

                  // Serialize the SVG element to a string
                  let serializer = new XMLSerializer();
                  let svgStr = serializer.serializeToString(svg);

                  // Create a scale factor
                  let scaleFactor = 4;

                  // Create a canvas element to draw the SVG onto
                  let canvas = document.createElement("canvas");
                  canvas.width = svgSize.width * scaleFactor;
                  canvas.height = svgSize.height * scaleFactor;

                  // Get the 2D rendering context of the canvas
                  let ctx = canvas.getContext("2d");

                  // Scale the context before drawing the SVG onto it
                  ctx.scale(scaleFactor, scaleFactor);

                  let img = document.createElement("img"); // Create an image element
                  img.onload = () => {
                     ctx.fillStyle = "white";
                     ctx.fillRect(0, 0, canvas.width, canvas.height);

                     // Draw the image (SVG content) onto the canvas
                     ctx.drawImage(img, 0, 0);

                     // Convert the canvas content to a data URL (image/png or image/jpeg)
                     let imgData = canvas.toDataURL(`image/${selectedFormat}`);

                     // Reset or remove the viewBox attribute to its original value
                     if (originalViewBox) {
                        svg.setAttribute('viewBox', originalViewBox);
                     } else {
                        svg.removeAttribute('viewBox');
                     }

                     // Restore the user's font size after export
                     const currentFont = (currentFontSize || 4) + "rem";
                     d3.selectAll(`${containerSelector} .taxonomy-panel text`).style("font-size", currentFont);

                     // Resolve the promise with the image data
                     resolve(imgData);
                  };
                  // Set the image source to the serialized SVG data (base64 encoded)
                  img.setAttribute("src", "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgStr))));
               });
            };

            // Process the SVG and then save the image
            processPanel().then((imgData) => {
               // Create a link element to download the image
               let link = document.createElement('a');
               link.download = `screenshot.${selectedFormat}`; // Use the selected format in the filename
               link.href = imgData;
               link.click(); // Trigger the download
            });
         }

         // lrm 5-29-2024
         // SVG selection
         else if (selectedFormat === "svg") {

            // Select the SVG element
            let svg = document.querySelector('svg');

            // Store the original viewBox value
            let originalViewBox = svg.getAttribute('viewBox');

            // Get the bounding box of the SVG content
            let bbox = svg.getBBox();
            const fontScale = (currentFontSize || 4) / 4;

            // Set the viewBox attribute to the bounding box dimensions to fit the SVG contents
            svg.setAttribute('viewBox', `${bbox.x} ${bbox.y} ${bbox.width} ${bbox.height}`);

            // Create a D3 selection from the SVG
            let svgSelection = d3.select(svg);

            // Apply inline styles to the SVG elements
            svgSelection.selectAll('text.legend-node-text')
               // 64px = 4rem
               // adobe illustrator did not like rem
               .style('font-style', 'normal')
               // adobe illustrator does not read text-transform
               // instead, use JS to capitalize the first letter for rank columns
               .each(function () {
                  // Get current text
                  let currentText = d3.select(this).text();
                  // Capitalize the first letter of the text
                  let capitalizedText = currentText.charAt(0).toUpperCase() + currentText.slice(1);
                  // Set the new text
                  d3.select(this).text(capitalizedText);
               })
               // adobe illustrator likes this for text rotation
               .attr('transform', function (/* Not in use: d, i */) {
                  return 'rotate(-45, 50, 50)';
               });

            svgSelection.selectAll('text.node-text')
               .style('font-style', 'italic')
               .style('font-weight', 'bold')

            svgSelection.selectAll('text.unassigned-text')
               .style('font-style', 'normal')

            svgSelection.selectAll('text')
               // Restore the user's font size after export
               .style('font-size', ((currentFontSize || 4) * 16) + 'px')
               .style('fill', 'black')

            // Serialize the SVG to a string
            let serializer = new XMLSerializer();
            let svgStr = serializer.serializeToString(svg);

            // Create a Blob object from the SVG string
            let blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });

            // Create a URL for the Blob object
            let url = URL.createObjectURL(blob);

            // Create a link element and set its href to the Blob URL
            let link = document.createElement('a');
            link.href = url;

            // Set the download attribute of the link to specify the file name
            link.download = 'image.svg';

            // Append the link to the document
            document.body.appendChild(link);

            // Simulate a click on the link
            link.click();

            // Remove the link from the document
            document.body.removeChild(link);

            // Reset or remove the viewBox attribute to its original value
            if (originalViewBox) {
               svg.setAttribute('viewBox', originalViewBox);
            } else {
               svg.removeAttribute('viewBox');
            }

            // Restore the user's font size after export
            const currentFont = (currentFontSize || 4) + "rem";
            d3.selectAll(`${containerSelector} .taxonomy-panel text`).style("font-size", currentFont);

         }

         // lrm 6-20-2024
         // PDF selection
         // This export is done via server-side with InkScape's CLI
         else if (selectedFormat === "pdf") {

            // Select the SVG element
            let svg = document.querySelector('svg');

            // Store the original viewBox value
            let originalViewBox = svg.getAttribute('viewBox');

            // Get the bounding box of the SVG content
            let bbox = svg.getBBox();
            let padding = 15;
            const fontScale = (currentFontSize || 4) / 4;

            // Set the viewBox attribute to the bounding box dimensions to fit the SVG contents
            svg.setAttribute('viewBox', `${bbox.x} ${bbox.y} ${bbox.width} ${bbox.height}`);

            // Create a D3 selection from the SVG
            let svgSelection = d3.select(svg);

            // Apply inline styles to the SVG elements
            svgSelection.selectAll('text.legend-node-text')
               // 64px = 4rem
               // adobe illustrator did not like rem
               .style('font-style', 'normal')
               // .style('fill', 'black')
               // adobe illustrator does not read text-transform
               // instead, use JS to capitalize the first letter for rank columns
               .each(function () {
                  // Get current text
                  let currentText = d3.select(this).text();
                  // Capitalize the first letter of the text
                  let capitalizedText = currentText.charAt(0).toUpperCase() + currentText.slice(1);
                  // Set the new text
                  d3.select(this).text(capitalizedText);
               })
               // adobe illustrator likes this for text rotation
               .attr('transform', function (/* Not in use: d, i */) {
                  return 'rotate(-45, 50, 50)';
               });

            svgSelection.selectAll('text.node-text')
               .style('font-family', 'Liberation Serif')
               .style('font-weight', 'bold')
               .style('font-style', 'italic')

            svgSelection.selectAll('text.unassigned-text')
               .style('font-style', 'normal')

            svgSelection.selectAll('text')
               // Restore the user's font size after export
               .style('font-size', ((currentFontSize || 4) * 16) + 'px')
               .style('fill', 'black')

            // Stop the rectangle that surrounds text from filling in black
            svgSelection.selectAll('rect.text-bg')
               .style('fill', 'none')

            // Serialize the SVG to a string
            let serializer = new XMLSerializer();
            let svgStr = serializer.serializeToString(svg);

            // Send a POST request to the server with the SVG data
            fetch('/ictv_d3_taxonomy_visualization/pdf_export', {
               method: 'POST',
               headers: {
                  'Content-Type': 'application/x-www-form-urlencoded',
               },
               body: `svg=${encodeURIComponent(svgStr)}`,
            })
               .then(response => response.blob())
               .then(blob => {

                  // Create a URL for the Blob object
                  let url = URL.createObjectURL(blob);

                  // Create a link element and set its href to the Blob URL
                  let link = document.createElement('a');
                  link.href = url;

                  // Set the download attribute of the link to specify the file name
                  link.download = 'image.pdf';

                  // Append the link to the document
                  document.body.appendChild(link);

                  // Simulate a click on the link
                  link.click();

                  // Remove the link from the document
                  document.body.removeChild(link);

                  // Reset or remove the viewBox attribute to its original value
                  if (originalViewBox) {
                     svg.setAttribute('viewBox', originalViewBox);
                  } else {
                     svg.removeAttribute('viewBox');
                  }

                  // Restore the user's font size after export
                  const currentFont = (currentFontSize || 4) + "rem";
                  d3.selectAll(`${containerSelector} .taxonomy-panel text`).style("font-size", currentFont);

                  // Remove the Liberation Serif font-family so the browser reverts to its default
                  d3.selectAll(`${containerSelector} .taxonomy-panel text.node-text`).style("font-family", null);

               });
         }

      });

	  // Click handler for Expand to Fit
      expandToFitBtn.on("click", async function () {
         if (currentTreeExpandToFit) {
            await currentTreeExpandToFit();
         }
      });

      // Click handler for Reset View
      resetViewBtn.on("click", async function () {
         if (!currentZoom || !currentSvgZoom || !currentTreeRoot || !initialZoomTransform) return;

         currentTreeIsExpandedToFit = false;
         currentFontSize = defaultFontSize;

         if (fontSliderEl) {
            fontSliderEl
               .property("value", defaultFontSize)
               .attr("value", defaultFontSize);
         }

         if (currentTreeResetAutoSpacing) {
            currentTreeResetAutoSpacing();
         }

         d3.selectAll(`${containerSelector} .taxonomy-panel text`)
            .style("font-size", defaultFontSize + "rem");

         if (currentTreeUpdate) {
            currentTreeUpdate(currentTreeRoot, true, 0, true);
            await wait(0);
         }

         if (currentTreeWaitForAutoSpacing) {
            await currentTreeWaitForAutoSpacing();
         }

         // Animate back to the original placement and scale captured at the default font size.
         currentSvgZoom.transition()
            .duration(settings.animationDuration)
            .call(
               currentZoom.transform,
               initialZoomTransform
            );
      });

   }

   // Use the release year to lookup and return the corresponding release data.
   function getRelease(releaseYear) {

      if (!releaseYear) { throw new Error("Invalid release year in getRelease (empty)"); }

      // when running in local environment, use the r
      // const release = releases.data[`r${releaseYear}`];

      // when uploading to drupal, use only the year
      const release = releases.data[`${releaseYear}`];
      if (!release) { throw new Error(`No release found for release year ${releaseYear}`); }

      return release;
   }

   // Identify synthetic pager rows inserted into large child lists.
   // Used throughout pagination, click handling, rendering, and search path traversal.
   function isPagerNode(node) {
      return !!(node && node.data && node.data.isPager === true);
   }

   // Return the complete child collection for a node regardless of expanded, collapsed, or paginated state.
   // Used by collapse, search path lookup, and pagination state reset logic.
   function getNodeChildren(node) {
      if (!node) { return null; }

      return node.allChildren || node.children || node._children || null;
   }

   // Pick the initial pagination window for a node, centering search targets when possible.
   // Used by initializePagination when a selected search result has supplied display-order metadata.
   function getDefaultScrollStartIndex(node, visibleCount, totalCount) {
      let scrollStartIndex = 0;

      if (
         !!node &&
         !!node.data &&
         !!node.data.parentTaxNodeID &&
         paginationData.parentTaxnodeID == node.data.parentTaxNodeID &&
         !isNaN(paginationData.childDisplayOrder)
      ) {
         scrollStartIndex = paginationData.childDisplayOrder - 1;
      }

      const maxStartIndex = Math.max(totalCount - visibleCount, 0);
      return Math.max(0, Math.min(scrollStartIndex, maxStartIndex));
   }

   // Reserve two rows in each paginated window for the up and down pager controls.
   // Used when configuring pagination for nodes with many children.
   function getWindowItemCount(pageSize) {
      return Math.max(pageSize - 2, 1);
   }

   // Keep dense first-rank columns intact so the initial auto-height logic can
   // show those older releases without replacing rows with pager controls.
   function shouldSkipPaginationForFirstRank(node) {
      if (!node || !node.data || !node.allChildren) { return false; }

      const rankIndex = parseInt(node.data.rankIndex, 10);
      if (rankIndex !== 0 || node.data.rankName !== "tree") { return false; }

      return node.allChildren.some(function (childNode) {
         return childNode && childNode.data && parseInt(childNode.data.rankIndex, 10) === 1;
      });
   }

   // Create a synthetic up or down pager node that D3 can render like a normal tree row.
   // Used by getVisibleChildren when a child list is larger than the configured page size.
   function createPagerNode(parentNode, direction, scrollStartIndex, disabled, remainingCount, rangeStart, rangeEnd, totalCount) {
      if (!isPaginationEnabled()) { return null; }

      const parentTaxNodeID = parentNode?.data?.taxNodeID || "";
      const pagerName = direction === "up" ? "\u25B2" : "\u25BC";
      const remaining = Math.max(remainingCount || 0, 0);

      return {
         id: `pager-${parentTaxNodeID}-${direction}`,
         data: {
            name: `${pagerName} ${remaining}`,
            rankName: "Shift",
            taxNodeID: `pager-${parentTaxNodeID}-${direction}`,
            parentTaxNodeID,
            rankIndex: (parseInt(parentNode?.data?.rankIndex) || 0) + 1,
            is_assigned: true,
            has_species: 0,
            isPager: true,
            isPagerDisabled: disabled === true,
            pagerDirection: direction,
            pagerRemainingCount: remaining,
            pagerRangeStart: rangeStart,
            pagerRangeEnd: rangeEnd,
            pagerTotalCount: totalCount
         },
         parent: parentNode,
         depth: (parentNode?.depth || 0) + 1,
         height: 0,
         scrollStartIndex,
         children: null,
         _children: null,
         allChildren: null
      };
   }

   // Return the children currently visible for a node, inserting pager controls when pagination is active.
   // Used by expand, collapse, and render paths so large sibling groups display as a scrollable window.
   function getVisibleChildren(node) {
      if (!node) { return null; }

      if (!isPaginationEnabled()) {
         return node.allChildren || node.children || node._children || null;
      }

      if (!node.allChildren) {
         return node.children || node._children || null;
      }

      if (!node.pagination) {
         return node.allChildren;
      }

      const visibleCount = node.pagination.visibleCount;
      const maxStartIndex = Math.max(node.allChildren.length - visibleCount, 0);
      const startRange = Math.max(0, Math.min(node.pagination.scrollStartIndex, maxStartIndex));
      const endRange = startRange + visibleCount;
      const visibleChildren = node.allChildren.slice(startRange, endRange);

      node.pagination.scrollStartIndex = startRange;

      if (maxStartIndex < 1) {
         return visibleChildren;
      }

      const previousStart = Math.max(startRange - node.pagination.scrollStep, 0);
      const nextStart = Math.min(startRange + node.pagination.scrollStep, maxStartIndex);
      const remainingAbove = startRange;
      const remainingBelow = Math.max(node.allChildren.length - endRange, 0);
      const rangeStart = startRange + 1;
      const rangeEnd = Math.min(endRange, node.allChildren.length);

      return [
         createPagerNode(node, "up", previousStart, startRange === 0, remainingAbove, rangeStart, rangeEnd, node.allChildren.length),
         ...visibleChildren,
         createPagerNode(node, "down", nextStart, startRange === maxStartIndex, remainingBelow, rangeStart, rangeEnd, node.allChildren.length)
      ].filter(Boolean);
   }

   // Replace a node's expanded or collapsed child list with the current visible pagination window.
   // Used after page shifts so the rendered tree matches the stored pagination state.
   function syncVisibleChildren(node) {
      if (!node || !node.allChildren) { return false; }

      const visibleChildren = getVisibleChildren(node);
      if (node.children) {
         node.children = visibleChildren;
         return true;
      }

      if (node._children) {
         node._children = visibleChildren;
         return true;
      }

      return false;
   }

   // Move a paginated node to a requested child-window start index.
   // Used by pager clicks and search expansion when a target child is outside the current window.
   function setNodeScrollStart(node, scrollStartIndex) {
      if (!isPaginationEnabled() || !node || !node.pagination) { return false; }

      const maxStartIndex = Math.max(node.allChildren.length - node.pagination.visibleCount, 0);
      const normalizedScrollStartIndex = Math.max(0, Math.min(scrollStartIndex, maxStartIndex));
      const scrollChanged = node.pagination.scrollStartIndex !== normalizedScrollStartIndex;
      node.pagination.scrollStartIndex = normalizedScrollStartIndex;

      return syncVisibleChildren(node) || scrollChanged;
   }

   // Shift a parent node's pagination window until a specific child is visible.
   // Used by search-result expansion before opening each node in the lineage.
   function setNodeScrollStartForChild(parentNode, childNode) {
      if (!isPaginationEnabled() || !parentNode || !parentNode.pagination || !parentNode.allChildren || !childNode) {
         return false;
      }

      let childIndex = parentNode.allChildren.indexOf(childNode);
      if (childIndex === -1 && !!childNode.data) {
         childIndex = parentNode.allChildren.findIndex((candidate) => (
            !!candidate &&
            !!candidate.data &&
            candidate.data.taxNodeID === childNode.data.taxNodeID
         ));
      }

      if (childIndex === -1) { return false; }

      const visibleCount = parentNode.pagination.visibleCount;
      const currentStartIndex = parentNode.pagination.scrollStartIndex;

      if (childIndex >= currentStartIndex && childIndex < currentStartIndex + visibleCount) {
         return false;
      }

      const targetScrollStartIndex = childIndex - Math.floor(visibleCount / 2);
      return setNodeScrollStart(parentNode, targetScrollStartIndex);
   }

   // Expand a collapsed node while preserving any paginated visible-child window.
   // Used by normal node clicks and search path expansion.
   function expandNode(node) {
      if (!node || !node._children) { return false; }

      node.children = getVisibleChildren(node);
      node._children = null;
      return true;
   }

   // Collapse an expanded node while preserving any paginated visible-child window.
   // Used by normal node clicks and initial tree collapse logic.
   function collapseNode(node) {
      if (!node || !node.children) { return false; }

      node._children = getVisibleChildren(node);
      node.children = null;
      return true;
   }

   // Walk the hierarchy and attach pagination metadata to nodes whose child count exceeds the page size.
   // Used when a release is loaded while pagination is enabled.
   function initializePagination(node, pageSize) {
      if (!node || !node.children) { return; }

      node.allChildren = [...node.children];
      node.allChildren.forEach((childNode) => initializePagination(childNode, pageSize));

      if (node.allChildren.length > pageSize && !shouldSkipPaginationForFirstRank(node)) {
         const visibleCount = getWindowItemCount(pageSize);

         node.pagination = {
            visibleCount,
            scrollStep: settings.pageStep,
            scrollStartIndex: getDefaultScrollStartIndex(node, visibleCount, node.allChildren.length)
         };

         node.children = getVisibleChildren(node);
      } else {
         node.pagination = null;
         node.children = node.allChildren;
      }
   }

   // Remove pagination metadata and restore full child arrays throughout the hierarchy.
   // Used when a release is loaded with pagination disabled.
   function clearPaginationState(node) {
      if (!node || isPagerNode(node)) { return; }

      const children = node.allChildren || node.children || node._children || null;
      node.pagination = null;
      node.allChildren = null;
      node.children = children;
      node._children = null;

      if (!children) { return; }

      children.forEach((childNode) => clearPaginationState(childNode));
   }

   // Find the hierarchy path to a tax node, looking through expanded, collapsed, and paginated children.
   // Used by search-result expansion to open every ancestor between the root and target node.
   function findPathToTaxNode(node, targetTaxNodeID) {
      if (!node) { return null; }

      if (!!node.data && `${node.data.taxNodeID}` === `${targetTaxNodeID}`) {
         return [node];
      }

      const children = getNodeChildren(node);
      if (!children) { return null; }

      for (const childNode of children) {
         if (isPagerNode(childNode)) { continue; }

         const path = findPathToTaxNode(childNode, targetTaxNodeID);
         if (!!path) {
            return [node, ...path];
         }
      }

      return null;
   }

   // Compare hierarchy nodes by object identity first and taxNodeID second.
   // Used so highlights survive D3 enter/update cycles where element references can be replaced.
   function isSelectedNodeDatum(node) {
      // If node is null or no node been selected yet
      if (!node || !selectedNode) { return false; }
      // Is node the same object as selectedNode?
      if (node === selectedNode) { return true; }
      // Does node or selectedNode have D3 data?
      if (!node.data || !selectedNode.data) { return false; }

      return String(node.data.taxNodeID) === String(selectedNode.data.taxNodeID);
   }

   // Locate the rendered node group for a hierarchy node without relying on CSS escaping taxNodeID values.
   // Used by click and search highlighting to keep clickedText/clickedCircle in sync.
   function getRenderedNodeElement(node) {
      if (!node || !node.data) { return null; }

      const taxNodeID = String(node.data.taxNodeID);
      const nodeElements = document.querySelectorAll(containerSelector + " g.node");

      for (const nodeElement of nodeElements) {
         const datum = nodeElement.__data__;
         if (
            datum === node ||
            (!!datum && !!datum.data && String(datum.data.taxNodeID) === taxNodeID)
         ) {
            return nodeElement;
         }
      }

      return null;
   }

   // Refresh the legacy clicked element references for the currently selected node.
   // Used after search-driven updates where the highlighted node may have just entered the DOM.
   function syncSelectedNodeElements(node) {
      const selectedNodeEl = getRenderedNodeElement(node);
      clickedCircle = selectedNodeEl ? selectedNodeEl.querySelector("circle.node") : null;
      clickedText = selectedNodeEl ? selectedNodeEl.querySelector("text") : null;

      return selectedNodeEl;
   }

   // Apply the selected-node styles directly after a search update has finished rendering.
   // Used in addition to update() data-driven styles so the highlight is visible between transitions.
   function applySelectedNodeStyles(node) {
      document.querySelectorAll(containerSelector + " text.node-text, " + containerSelector + " text.unassigned-text").forEach((textElementReset) => {
         textElementReset.style.fill = defaultNodeTextColor;
      });

      document.querySelectorAll(containerSelector + " circle.node").forEach((circleElementReset) => {
         circleElementReset.style.fill = defaultNodeCircleFill;
      });

      const selectedNodeEl = syncSelectedNodeElements(node);
      const textToHighlight = selectedNodeEl ? selectedNodeEl.querySelector("text") : null;
      if (textToHighlight) {
         textToHighlight.style.fill = selectedNodeHighlightColor;
         clickedText = textToHighlight;
      }

      const circleToHighlight = selectedNodeEl ? selectedNodeEl.querySelector("circle.node") : null;
      if (circleToHighlight) {
         circleToHighlight.style.fill = selectedNodeHighlightColor;
         clickedCircle = circleToHighlight;
      }
   }

   // Build the zoom slider UI and connect it to the active D3 zoom behavior.
   // Used during startup; the input handler becomes active once createTree assigns currentZoom and currentSvgZoom.
   function initializeZoomPanel() {
      ZoomPanelEl = document.querySelector(`${containerSelector} .font-size-panel`);
      if (!ZoomPanelEl) { throw new Error("Invalid font size panel Element"); }

      if (ZoomPanelEl.classList.contains("show")) { ZoomPanelEl.classList.remove("show"); }

      const zoomControl = d3
         .select(`${containerSelector} .font-size-panel`)
         .append("div")
         .attr("class", "control-group zoom-control");

      zoomControl
         .append("div")
         .attr("class", "label")
         .text("Zoom");

      ZoomSliderEl = d3
         .select(zoomControl.node())
         .append("input")
         .attr("class", "slider")
         .attr("type", "range")
         .attr("min", zoomScaleSettings.sliderMin)
         .attr("max", zoomScaleSettings.sliderMax)
         .attr("step", zoomScaleSettings.sliderStep)
         .attr("value", zoomScaleToSliderValue(zoomScaleSettings.minScale))
         .attr("aria-label", "Zoom");

      ZoomSliderEl.on("input", function (e) {
         const zoomValue = sliderValueToZoomScale(e.target.value);

         // Make sure the tree is fully loaded
         if (currentZoom && currentSvgZoom) {
            const focusPoint = getZoomFocusPoint();
            
            // Use D3's native scaleTo logic to zoom around the visible tree content.
            currentSvgZoom.call(currentZoom.scaleTo, zoomValue, focusPoint);
         }
      });
   }

   // Initialize the font size slider and its label.
   function initializeFontSizePanel() {

      // Get a reference to the font size panel Element.
      fontSizePanelEl = document.querySelector(`${containerSelector} .font-size-panel`);
      if (!fontSizePanelEl) { throw new Error("Invalid font size panel Element"); }

      // Make sure the font size panel is hidden.
      if (fontSizePanelEl.classList.contains("show")) { fontSizePanelEl.classList.remove("show"); }
      fontSizePanelEl.classList.add("hide");

      // Create the font size label.
      const fontSizeControl = d3
         .select(`${containerSelector} .font-size-panel`)
         .append("div")
         .attr("class", "control-group font-size-control");

      fontSizeControl
         .append("div")
         .attr("class", "label")
         .text("Font size");

      // Create the slider control and a reference to it.
      fontSliderEl = d3
         .select(fontSizeControl.node())
         .append("input")
         .attr("class", "slider")
         .attr("type", "range")
         .attr("min", 4)
         .attr("max", 14)
         .attr("value", defaultFontSize);

      // changing the font on change of slider
      fontSliderEl.on("input", function (e) {
         const fontSize = e.target.value;
         currentFontSize = fontSize;

         // Start from the normal layout whenever the user changes font size,
         // unless the current fitted view should preserve measured spacing.
         // The overlap detector below will add spacing back only if the new text boxes collide.
         if (currentTreeResetAutoSpacing && !currentTreeIsExpandedToFit) {
            currentTreeResetAutoSpacing();
         }

         d3.selectAll(`${containerSelector} .taxonomy-panel text.node-text`)
            .style("font-size", fontSize + "rem");

         d3.selectAll(`${containerSelector} .taxonomy-panel text.pager-node-text`)
            .style("font-size", fontSize + "rem");


         if (currentTreeRoot && currentTreeUpdate) {
            currentTreeUpdate(currentTreeRoot, currentTreeIsExpandedToFit);
         }
      });
   }

   // Restore font-size and measured spacing before rendering a different release tree.
   function resetFontSizeSlider() {
      currentFontSize = defaultFontSize;
      rememberedAutoSpacing.horizontalScale = 1;
      rememberedAutoSpacing.verticalScale = 1;

      if (fontSliderEl) {
         fontSliderEl
            .property("value", defaultFontSize)
            .attr("value", defaultFontSize);
      }
   }

   // Initialize the release control with MSL releases.
   function initializeReleaseControl() {

      if (!releases) { throw new Error("Invalid MSL releases in initializeReleaseControl"); }

      // Get the release control DOM Element.
      releaseControlEl = document.querySelector(`${containerSelector} .header-panel .release-ctrl`);
      if (!releaseControlEl) { throw new Error("Invalid release control"); }

      // Clear any existing options
      releaseControlEl.innerHTML = null;

      // Add an option for each release year.
      releases.displayOrder.forEach((releaseKey_) => {

         // Get the release corresponding to this release key.
         const release = releases.data[releaseKey_];
         if (!release) { return; }

         // Create an option Element and set its display text and value.
         const option = document.createElement("option");
         option.text = `${release.year} (MSL ${release.releaseNum})`;
         option.value = release.year;

         releaseControlEl.appendChild(option);
      })

      // Add a "change" event handler
      releaseControlEl.addEventListener("change", async (e_) => {

         const releaseYear = e_.target.value;
         if (!releaseYear) { throw new Error("Invalid release control value"); }

         // Get the release data for this year.
         const release = getRelease(releaseYear);
         if (!release) { throw new Error(`No release data available for release year ${releaseYear}`) }

         // Update the search panel's selected release.
         searchPanel.releaseNumber.selected = release.releaseNum;

         resetFontSizeSlider();

         // Display the taxonomy of the selected release.
         await displayReleaseTaxonomy(releaseYear);

         // Make sure the font size panel is visible.
         if (!!fontSizePanelEl && fontSizePanelEl.classList.contains("hide")) {
            fontSizePanelEl.classList.remove("hide");
            fontSizePanelEl.classList.add("show");
         }

         return;
      });

      // Select the most recent release.
      releaseControlEl.options.selectedIndex = 0;
      releaseControlEl.dispatchEvent(new Event("change"));
   }

   // Display the taxonomy tree for the release selected by the user.
   async function displayReleaseTaxonomy(releaseYear_) {

      if (!releaseYear_) { throw new Error("Invalid release year in displayReleaseTaxonomy"); }

      // Get the release data for this year.
      const release = getRelease(releaseYear_);
      if (!release) { throw new Error(`No data available for release year ${releaseYear_}`); }

      const rankCount = release.rankCount;

      // Stop any pending overlap measurement before the release rebuild removes the old SVG.
      if (currentTreeResetAutoSpacing) {
         currentTreeResetAutoSpacing(false);
      }

      currentTreeRoot = null;
      currentTreeUpdate = null;
      currentTreeExpandToFit = null;
      currentTreeFitSearchExpansionIfClipped = null;
      currentTreeIsExpandedToFit = false;
      currentTreeResetAutoSpacing = null;
      currentTreeWaitForAutoSpacing = null;

      resetTaxonomyViewportHeight();

      // If there's already an SVG element in the taxonomy panel, delete it.
      const existingSVG = document.querySelector(`${containerSelector} .taxonomy-panel svg `);
      if (!!existingSVG) { existingSVG.remove(); }

      // Determine the filename for the taxonomy JSON file.
      const jsonFilename = `${dataURL}/data/taxonomy_${releaseYear_}.json`;

      // lrm 6-20-2024
      // nonSpeciesFilename was being loaded twice, I took the commented code above
      // and put it where it was being loaded a 2nd time.
      d3.json(jsonFilename).then(function (data) {

         const root = d3.hierarchy(data, function (d) {

            // Safeguard: if there are no children, return null/undefined so D3 knows it is a leaf.
            if (!d.children) { return; }

            // Each release JSON repeats the tree root as its own leaf child.
            // Keep the actual hierarchy root and skip that self-referential copy.
            return d.children.filter(function (child) {
               return !(
                  d.rankName === "tree" &&
                  child.rankName === "tree" &&
                  String(child.taxNodeID) === String(d.taxNodeID) &&
                  String(child.parentTaxNodeID) === String(d.taxNodeID)
               );
            });
         });

         // Create and populate the tree structure.
         createTree(root);


         // TODO: this needs a more informative name.
         var i = 0;

         // Create the SVG, D3 zoom behavior, layout state, and render and update closures for one release tree.
         // Called by displayReleaseTaxonomy after the release JSON has been loaded and converted to a hierarchy.
         function createTree(root) {

            const svg = d3
               .select(`${containerSelector} .taxonomy-panel`)
               .append("svg")
               .attr("width", settings.svg.width)
               .attr("height", settings.svg.height);

            const treeGroup = svg.append("g");

            let zoom = d3.zoom()
               // zoom constraints
               // .01: Zoom out to 1% of the original size
               // 1: Zoom in to the original size
               .scaleExtent([zoomScaleSettings.minScale, zoomScaleSettings.maxScale])
               .on("zoom", function (event) {
                  treeGroup.attr("transform", event.transform);
                  syncZoomSlider(event.transform);
               });

            const svgZoom = svg
               .call(zoom)
               .on("dblclick.zoom", null);

            currentZoom = zoom;
            currentSvgZoom = svgZoom;
            // Delaying initialZoomTransform until tree is dynamically aligned below.

            // Use d3 to generate the tree layout/structure.
            const treeLayout = d3.tree();

            // Update tree based on pagination option.
            if (isPaginationEnabled()) {
               initializePagination(root, settings.pageSize);
            } else {
               clearPaginationState(root);
            }

            const rootChildren = getNodeChildren(root) || [];
            rootChildren.forEach(collapse);
            currentTreeRoot = root;
            currentTreeUpdate = update;

            // Track measured spacing separately from font size so compact layouts stay compact until labels collide.
            // Seed from the last measured layout so tree rebuilds, such as search reloads, start already spaced.
            const autoSpacingState = {
               horizontalScale: rememberedAutoSpacing.horizontalScale,
               verticalScale: rememberedAutoSpacing.verticalScale,
               maxScale: 6,
               scaleTolerance: 0.03,
               horizontalPadding: 36,
               verticalPadding: 8,
               maxPasses: 3,
               passCount: 0,
               alignAfterInitialSpacing: false,
               timer: null
            };

            // Reset automatic spacing so the next normal update starts from the compact layout.
            function resetAutoSpacing(resetRememberedSpacing) {
               if (autoSpacingState.timer) {
                  clearTimeout(autoSpacingState.timer);
                  autoSpacingState.timer = null;
               }

               autoSpacingState.horizontalScale = 1;
               autoSpacingState.verticalScale = 1;
               autoSpacingState.passCount = 0;
               autoSpacingState.alignAfterInitialSpacing = false;

               if (resetRememberedSpacing !== false) {
                  rememberedAutoSpacing.horizontalScale = 1;
                  rememberedAutoSpacing.verticalScale = 1;
               }
            }

            currentTreeResetAutoSpacing = resetAutoSpacing;

            // Let search workflows wait until any pending overlap checks and auto-spacing passes are finished.
            async function waitForAutoSpacing() {
               const waitInterval = 100;
               const maxWait = (settings.animationDuration + waitInterval) * (autoSpacingState.maxPasses + 1);
               let elapsed = 0;

               while (autoSpacingState.timer && elapsed < maxWait) {
                  await wait(waitInterval);
                  elapsed += waitInterval;
               }
            }

            currentTreeWaitForAutoSpacing = waitForAutoSpacing;

            // Return the taxonomy rank index used for horizontal column placement.
            // Rank indexes are one-based for visible ranks; the hidden tree root is zero.
            function getNodeRankIndex(node) {
               if (!node || !node.data) { return null; }

               const rankIndex = parseInt(node.data.rankIndex, 10);
               return Number.isFinite(rankIndex) ? rankIndex : null;
            }

            // Lay ranks out in a wider internal coordinate space, then let the initial
            // fit-to-view zoom scale the full tree back into the SVG viewport. This keeps
            // long labels from visually compressing the rank-column spacing.
            function getRankColumnSpacing() {
               const viewport = getSvgViewportSize();
               const horizontalGutter = settings.node.radius * 2;
               const availableWidth = Math.max(
                  settings.node.radius * 4,
                  viewport.width - (horizontalGutter * 2)
               );
               const rankGaps = Math.max(rankCount - 1, 1);
               const layoutSpreadMultiplier = 5;

               return (availableWidth * layoutSpreadMultiplier) / rankGaps;
            }

            // D3 still owns node row ordering; rankIndex owns the horizontal column.
            function applyRankColumnPositions(nodes, rankColumnSpacing, leftGutter, rootToFirstRankGap) {
               nodes.forEach(function (d) {
                  const rankIndex = getNodeRankIndex(d);

                  if (rankIndex > 0) {
                     d.y = leftGutter + ((rankIndex - 1) * rankColumnSpacing);
                  } else if (d.depth === 0) {
                     const rootLeftPadding = settings.node.radius + settings.node.strokeWidth + 2;
                     d.y = Math.max(rootLeftPadding, leftGutter - rootToFirstRankGap);
                  } else {
                     d.y = leftGutter + (Math.max(d.depth - 1, 0) * rankColumnSpacing);
                  }
               });
            }

            // Build occupied node rectangles in the same coordinate space used by the tree layout.
            // This includes both the label and the visible circle so text from another rank cannot cover the circle.
            function getVisibleNodeBoxes() {
               const boxes = [];

               function getElementRotationAngle(element) {
                  // Normal node labels are not rotated, so only rank-column labels need this correction.
                  if (!element || !element.classList.contains("legend-node-text")) { return 0; }

                  // CSS exposes rotate(-45deg) as a matrix. atan2(b, a) recovers the rotation angle
                  // without hard-coding it when the stylesheet value changes later.
                  const transform = window.getComputedStyle(element).transform;
                  const matrixMatch = transform && transform.match(/^matrix\(([^)]+)\)$/);

                  if (matrixMatch) {
                     const matrixValues = matrixMatch[1].split(",").map(function (value) {
                        return parseFloat(value.trim());
                     });

                     if (matrixValues.length >= 2 && Number.isFinite(matrixValues[0]) && Number.isFinite(matrixValues[1])) {
                        return Math.atan2(matrixValues[1], matrixValues[0]);
                     }
                  }

                  // Match the stylesheet rule for rank-column labels when computed style is unavailable.
                  return -45 * Math.PI / 180;
               }

               function getElementTransformOrigin(element, bbox) {
                  // The rotation math needs to use the same origin as CSS transform-origin.
                  // If it cannot be read, 0,0 matches the rank-label stylesheet intent.
                  const fallback = { x: 0, y: 0 };
                  if (!element || !bbox) { return fallback; }

                  const transformOrigin = window.getComputedStyle(element).transformOrigin;
                  if (!transformOrigin) { return fallback; }

                  // Browsers report transform-origin as pixel values, for example "0px 0px".
                  const parts = transformOrigin.split(/\s+/);
                  const originX = parseFloat(parts[0]);
                  const originY = parseFloat(parts[1]);

                  return {
                     x: Number.isFinite(originX) ? originX : fallback.x,
                     y: Number.isFinite(originY) ? originY : fallback.y
                  };
               }

               function getRotatedTextBBox(element, bbox) {
                  // getBBox() returns the unrotated local SVG box. For rotated rank labels,
                  // rotate its corners in the same local coordinate space before fitting.
                  if (!bbox || bbox.width <= 0 || bbox.height <= 0) { return bbox; }

                  const angle = getElementRotationAngle(element);
                  if (!Number.isFinite(angle) || Math.abs(angle) < 0.001) { return bbox; }

                  const origin = getElementTransformOrigin(element, bbox);
                  const cos = Math.cos(angle);
                  const sin = Math.sin(angle);

                  function rotatePoint(x, y) {
                     // Translate the point to the rotation origin, rotate it, then translate it back.
                     const offsetX = x - origin.x;
                     const offsetY = y - origin.y;

                     return {
                        x: origin.x + (offsetX * cos) - (offsetY * sin),
                        y: origin.y + (offsetX * sin) + (offsetY * cos)
                     };
                  }

                  const corners = [
                     rotatePoint(bbox.x, bbox.y),
                     rotatePoint(bbox.x + bbox.width, bbox.y),
                     rotatePoint(bbox.x + bbox.width, bbox.y + bbox.height),
                     rotatePoint(bbox.x, bbox.y + bbox.height)
                  ];
                  // Build a new axis-aligned box around the rotated corners so downstream
                  // tree-fit and collision logic can keep using left/right/top/bottom ranges.
                  const xs = corners.map(function (corner) { return corner.x; });
                  const ys = corners.map(function (corner) { return corner.y; });
                  const left = Math.min.apply(null, xs);
                  const right = Math.max.apply(null, xs);
                  const top = Math.min.apply(null, ys);
                  const bottom = Math.max.apply(null, ys);

                  return {
                     x: left,
                     y: top,
                     width: right - left,
                     height: bottom - top
                  };
               }

               treeGroup.selectAll("g.node").each(function (d) {
                  if (!d) { return; }

                  const group = d3.select(this);
                  const textNode = group.select("text").node();
                  const circleNode = group.select("circle.node").node();
                  const nodeBoxes = [];

                  if (textNode && textNode.textContent.trim()) {
                     try {
                        const textBBox = getRotatedTextBBox(textNode, textNode.getBBox());
                        if (textBBox && textBBox.width > 0 && textBBox.height > 0) {
                           nodeBoxes.push(textBBox);
                        }
                     } catch {
                        // Not in use: catch binding e.
                        // Ignore SVG elements that cannot be measured during a transient render state.
                     }
                  }

                  if (circleNode) {
                     const circleSelection = d3.select(circleNode);
                     const radius = parseFloat(circleSelection.attr("r")) || 0;
                     const opacity = parseFloat(circleSelection.style("opacity"));

                     if (radius > 0 && opacity !== 0) {
                        try {
                           const circleBBox = circleNode.getBBox();
                           if (circleBBox && circleBBox.width > 0 && circleBBox.height > 0) {
                              nodeBoxes.push(circleBBox);
                           }
                        } catch {
                           // Not in use: catch binding e.
                           // Ignore SVG elements that cannot be measured during a transient render state.
                        }
                     }
                  }

                  if (nodeBoxes.length < 1) { return; }

                  const bbox = {
                     x: Math.min.apply(null, nodeBoxes.map(function (box) { return box.x; })),
                     y: Math.min.apply(null, nodeBoxes.map(function (box) { return box.y; })),
                     width: Math.max.apply(null, nodeBoxes.map(function (box) { return box.x + box.width; })),
                     height: Math.max.apply(null, nodeBoxes.map(function (box) { return box.y + box.height; }))
                  };

                  bbox.width -= bbox.x;
                  bbox.height -= bbox.y;

                  boxes.push({
                     depth: d.depth,
                     nodeX: d.x,
                     nodeY: d.y,
                     left: d.y + bbox.x,
                     right: d.y + bbox.x + bbox.width,
                     top: d.x + bbox.y,
                     bottom: d.x + bbox.y + bbox.height
                  });
               });

               return boxes;
            }

            // Check whether two one-dimensional ranges overlap once padding is included.
            function rangesOverlap(startA, endA, startB, endB, padding) {
               return startA <= endB + padding && startB <= endA + padding;
            }

            // Measure rendered labels and calculate the smallest extra spacing scale that clears collisions.
            function getRequiredAutoSpacing() {
               const boxes = getVisibleNodeBoxes();
               const required = {
                  horizontalScale: autoSpacingState.horizontalScale,
                  verticalScale: autoSpacingState.verticalScale
               };
               const boxesByDepth = {};

               boxes.forEach(function (box) {
                  if (!boxesByDepth[box.depth]) {
                     boxesByDepth[box.depth] = [];
                  }
                  boxesByDepth[box.depth].push(box);
               });

               // Same-rank labels stack vertically, so measure top/bottom collisions within each depth.
               Object.keys(boxesByDepth).forEach(function (depth) {
                  const depthBoxes = boxesByDepth[depth].sort(function (a, b) {
                     return a.top - b.top;
                  });

                  let previous = depthBoxes[0];
                  for (let i = 1; i < depthBoxes.length; i++) {
                     const current = depthBoxes[i];
                     const overlap = previous.bottom + autoSpacingState.verticalPadding - current.top;
                     const nodeGap = Math.abs(current.nodeX - previous.nodeX);

                     if (overlap > 0 && nodeGap > 0) {
                        required.verticalScale = Math.max(
                           required.verticalScale,
                           autoSpacingState.verticalScale * ((nodeGap + overlap) / nodeGap)
                        );
                     }

                     // Keep comparing against the lowest label bottom to catch chained overlaps.
                     if (current.bottom > previous.bottom) {
                        previous = current;
                     }
                  }
               });

               const boxesByTop = boxes.slice().sort(function (a, b) {
                  return a.top - b.top;
               });

               // Cross-rank labels collide horizontally when their vertical ranges overlap.
               for (let i = 0; i < boxesByTop.length; i++) {
                  const first = boxesByTop[i];

                  for (let j = i + 1; j < boxesByTop.length; j++) {
                     const second = boxesByTop[j];

                     if (second.top > first.bottom + autoSpacingState.verticalPadding) {
                        break;
                     }

                     if (first.depth === second.depth) { continue; }
                     if (!rangesOverlap(first.top, first.bottom, second.top, second.bottom, autoSpacingState.verticalPadding)) { continue; }

                     const leftBox = first.nodeY <= second.nodeY ? first : second;
                     const rightBox = leftBox === first ? second : first;
                     const overlap = leftBox.right + autoSpacingState.horizontalPadding - rightBox.left;
                     const nodeGap = Math.abs(rightBox.nodeY - leftBox.nodeY);

                     if (overlap > 0 && nodeGap > 0) {
                        required.horizontalScale = Math.max(
                           required.horizontalScale,
                           autoSpacingState.horizontalScale * ((nodeGap + overlap) / nodeGap)
                        );
                     }
                  }
               }

               required.horizontalScale = Math.min(required.horizontalScale, autoSpacingState.maxScale);
               required.verticalScale = Math.min(required.verticalScale, autoSpacingState.maxScale);

               return required;
            }

            // Re-run the layout after transitions only when the measured labels still overlap.
            function scheduleAutoSpacingCheck(source, animationDuration) {
               if (autoSpacingState.timer) {
                  clearTimeout(autoSpacingState.timer);
               }

               autoSpacingState.timer = setTimeout(function () {
                  autoSpacingState.timer = null;

                  if (autoSpacingState.passCount >= autoSpacingState.maxPasses) {
                     autoSpacingState.alignAfterInitialSpacing = false;
                     return;
                  }

                  const required = getRequiredAutoSpacing();
                  const needsHorizontalSpacing = required.horizontalScale > autoSpacingState.horizontalScale + autoSpacingState.scaleTolerance;
                  const needsVerticalSpacing = required.verticalScale > autoSpacingState.verticalScale + autoSpacingState.scaleTolerance;

                  if (!needsHorizontalSpacing && !needsVerticalSpacing) {
                     autoSpacingState.alignAfterInitialSpacing = false;
                     return;
                  }

                  autoSpacingState.horizontalScale = required.horizontalScale;
                  autoSpacingState.verticalScale = required.verticalScale;
                  autoSpacingState.passCount++;
                  rememberedAutoSpacing.horizontalScale = autoSpacingState.horizontalScale;
                  rememberedAutoSpacing.verticalScale = autoSpacingState.verticalScale;

                  update(source, true, animationDuration, true);

                  // If the initial render needed auto-spacing, realign using the new coordinates.
                  if (source === root && autoSpacingState.alignAfterInitialSpacing) {
                     alignInitialTreeView();
                  }
               }, animationDuration + 50);
            }

            // Build canonical data-space bounds for the visible tree before the zoom transform is applied.
            // Text and circle boxes come from rendered SVG elements, while the hidden root point is added
            // explicitly so the root group and first visible circle stay inside the parent SVG.
            // Used by initial alignment, Expand to Fit, and search-time viewport fitting.
            function getTreeBounds() {
               const boxes = getVisibleNodeBoxes();
               const rootX = Number.isFinite(root.x) ? root.x : 0;
               const rootY = Number.isFinite(root.y) ? root.y : 0;
               const bounds = {
                  left: rootY - settings.node.radius,
                  right: rootY + settings.node.radius,
                  top: rootX - settings.node.radius,
                  bottom: rootX + settings.node.radius
               };

               boxes.forEach(function (box) {
                  bounds.left = Math.min(bounds.left, box.left);
                  bounds.right = Math.max(bounds.right, box.right);
                  bounds.top = Math.min(bounds.top, box.top);
                  bounds.bottom = Math.max(bounds.bottom, box.bottom);
               });

               return {
                  x: bounds.left,
                  y: bounds.top,
                  width: Math.max(1, bounds.right - bounds.left),
                  height: Math.max(1, bounds.bottom - bounds.top)
               };

            }

            // Position the freshly rendered tree so its measured bounds start inside the viewport.
            // Called after initial render and again if initial auto-spacing changes node coordinates.
            function alignInitialTreeView() {
               // ================================================================================================
               //                                    DYNAMIC INITIAL ALIGNMENT
               // ================================================================================================
               const initialPadding = getInitialTreePadding();
               const treeBounds = getTreeBounds();
               resizeTaxonomyViewportHeightForBounds(treeBounds, initialPadding);

               const startScale = fitScaleForBounds(treeBounds, initialPadding);
               if (startScale === null) return;

               // Translate from the measured tree bounds so the whole initial tree lands inside the SVG.
               const calculatedX = initialPadding.left - (treeBounds.x * startScale);
               const calculatedY = initialPadding.top - (treeBounds.y * startScale);

               svgZoom.call(
                  zoom.transform,
                  d3.zoomIdentity.translate(calculatedX, calculatedY).scale(startScale)
               );

               // Capture this as a starting baseline for reset-view logic.
               initialZoomTransform = d3.zoomTransform(svgZoom.node());
               // ================================================================================================
            }

            // Convert data-space tree bounds into the current SVG viewport coordinate space.
            // Used to decide whether Expand to Fit actually needs to zoom or pan.
            function getViewportTreeBounds(bounds) {
               if (!bounds || !currentSvgZoom) { return null; }

               const transform = d3.zoomTransform(currentSvgZoom.node());
               const left = transform.applyX(bounds.x);
               const right = transform.applyX(bounds.x + bounds.width);
               const top = transform.applyY(bounds.y);
               const bottom = transform.applyY(bounds.y + bounds.height);

               return {
                  left: Math.min(left, right),
                  right: Math.max(left, right),
                  top: Math.min(top, bottom),
                  bottom: Math.max(top, bottom)
               };
            }

            // Check whether the canonical tree bounds are already inside the padded SVG viewport.
            // Expand to Fit should not keep zooming out when nothing is clipped.
            function isTreeInsideViewport(bounds, padding) {
               const viewportBounds = getViewportTreeBounds(bounds);
               if (!viewportBounds) { return false; }

               const viewport = getSvgViewportSize();
               const tolerance = 1;

               return (
                  viewportBounds.left >= padding.left - tolerance &&
                  viewportBounds.right <= viewport.width - padding.right + tolerance &&
                  viewportBounds.top >= padding.top - tolerance &&
                  viewportBounds.bottom <= viewport.height - padding.bottom + tolerance
               );
            }

            // Calculate a stable rank-column spread target from the compact tree fit.
            // This fills horizontal whitespace when height is the limiting dimension without
            // using the post-spread zoom scale as feedback on later clicks.
            function getFitSpreadHorizontalScale(bounds, padding) {
               if (!bounds) { return autoSpacingState.horizontalScale; }

               const viewport = getSvgViewportSize();
               const availableWidth = Math.max(1, viewport.width - padding.left - padding.right);
               const availableHeight = Math.max(1, viewport.height - padding.top - padding.bottom);
               const rankGaps = Math.max(rankCount - 1, 1);
               const baseRankSpan = getRankColumnSpacing() * rankGaps;

               if (baseRankSpan <= 0) { return autoSpacingState.horizontalScale; }

               const appliedRankGrowth = baseRankSpan * Math.max(0, autoSpacingState.horizontalScale - 1);
               const compactWidth = Math.max(1, bounds.width - appliedRankGrowth);
               const compactScale = clampZoomScale(Math.min(availableWidth / compactWidth, availableHeight / bounds.height));

               if (compactScale <= 0) { return autoSpacingState.horizontalScale; }

               const nonRankWidth = Math.max(0, compactWidth - baseRankSpan);
               const targetHorizontalScale = ((availableWidth / compactScale) - nonRankWidth) / baseRankSpan;

               return Math.min(
                  autoSpacingState.maxScale,
                  Math.max(autoSpacingState.horizontalScale, targetHorizontalScale)
               );
            }

            // Spread rank columns once when the fitted tree has horizontal room to use.
            async function spreadRankColumnsToFitWidth(bounds) {
               const targetHorizontalScale = getFitSpreadHorizontalScale(bounds, getInitialTreePadding());

               if (targetHorizontalScale <= autoSpacingState.horizontalScale + autoSpacingState.scaleTolerance) {
                  return false;
               }

               autoSpacingState.horizontalScale = targetHorizontalScale;
               autoSpacingState.passCount = 0;
               rememberedAutoSpacing.horizontalScale = autoSpacingState.horizontalScale;
               rememberedAutoSpacing.verticalScale = autoSpacingState.verticalScale;

               update(root, true, settings.animationDuration, true);
               await wait(settings.animationDuration);
               await waitForAutoSpacing();

               return true;
            }

            // Animate the current SVG zoom transform so the supplied tree bounds fit inside the viewport padding.
            // Used by the Expand to Fit button and search-result auto-fit after a target node is reached.
            function fitTreeBounds(bounds, duration) {
               const initialPadding = getInitialTreePadding();
               if (isTreeInsideViewport(bounds, initialPadding)) { return false; }

               const newScale = fitScaleForBounds(bounds, initialPadding);
               if (newScale === null) { return false; }

               const currentScale = d3.zoomTransform(svgZoom.node()).k;
               const targetScale = Math.min(currentScale, newScale);
               const calculatedX = initialPadding.left - (bounds.x * targetScale);
               const calculatedY = initialPadding.top - (bounds.y * targetScale);

               svgZoom.transition()
                  .duration(duration)
                  .call(
                     zoom.transform,
                     d3.zoomIdentity.translate(calculatedX, calculatedY).scale(targetScale)
                  );

               return true;
            }

            // Keep search-result expansion visible without applying the final expand-to-fit spread.
            // Assigned to currentTreeFitSearchExpansionIfClipped for each lineage expansion step.
            async function fitSearchExpansionIfClipped() {
               if (!currentZoom || !currentSvgZoom || !currentTreeRoot) { return false; }

               await waitForAutoSpacing();

               const bounds = getTreeBounds();
               if (!fitTreeBounds(bounds, settings.animationDuration)) { return false; }

               await wait(settings.animationDuration);
               await waitForAutoSpacing();

               return true;
            }

            // Fit the visible tree when clipped, then spread rank columns into spare width.
            // Assigned to currentTreeExpandToFit for the toolbar button and for search-result auto-fit.
            async function expandCurrentTreeToFit() {
               if (!currentZoom || !currentSvgZoom || !currentTreeRoot) { return; }

               await waitForAutoSpacing();

               let bounds = getTreeBounds();

               if (fitTreeBounds(bounds, settings.animationDuration)) {
                  await wait(settings.animationDuration);
                  await waitForAutoSpacing();
                  bounds = getTreeBounds();
               }

               if (await spreadRankColumnsToFitWidth(bounds)) {
                  bounds = getTreeBounds();
                  if (fitTreeBounds(bounds, settings.animationDuration)) {
                     await wait(settings.animationDuration);
                  }
               }

               currentTreeIsExpandedToFit = true;
            }

            currentTreeExpandToFit = expandCurrentTreeToFit;
            currentTreeFitSearchExpansionIfClipped = fitSearchExpansionIfClipped;

            update(root, true, undefined, true);
            autoSpacingState.alignAfterInitialSpacing = true;
            alignInitialTreeView();

            // Recompute the D3 tree layout and reconcile nodes, labels, links, and transitions.
            // Used by clicks, search expansion, font-size changes, pagination shifts, and auto-spacing passes.
            function update(source, preserveAutoSpacing, animationDuration, isAutoSpacingUpdate) {

               if (!source) {
                  console.error("in update and source is invalid");
                  return;
               }

               const updateDuration = Number.isFinite(animationDuration) ? animationDuration : settings.animationDuration;

               if (!preserveAutoSpacing) {
                  resetAutoSpacing();
               } else if (!isAutoSpacingUpdate) {
                  // External preserved updates, such as clicks or search expansion, should keep spacing
                  // but restart measurement passes in case the newly visible nodes need more room.
                  autoSpacingState.passCount = 0;
               }

               const rankColumnLeftGutter = settings.node.radius * 2;
               const rankColumnSpacing = getRankColumnSpacing() * autoSpacingState.horizontalScale;
               var rootToFirstRankGap = settings.node.radius * 3;
               const dx = settings.node.baseVerticalSpacing * autoSpacingState.verticalScale;
               const dy = rankColumnSpacing;

               treeLayout.nodeSize([dx, dy]);

               var info = treeLayout(root);
               var allNodes = info.descendants();
               var links = allNodes.slice(1);

               applyRankColumnPositions(allNodes, rankColumnSpacing, rankColumnLeftGutter, rootToFirstRankGap);

               var children = treeGroup.selectAll("g.node").data(allNodes, function (d) {
                  return d.id || (d.id = ++i);
               });

               var Enter = children
                  .enter()
                  .append("g")
                  .attr("class", "node")
                  .attr("parent-name", function (d) {
                     return d.data.name;
                  })
                  .attr("parent-rank", function (d) {
                     return d.data.rankName;
                  })
                  .attr("taxNodeID", function (d) {
                     return d.data.taxNodeID;
                  })
                  .attr("has_species", function (d) {
                     return d.data.has_species;
                  })
                  .attr("is_assigned", function (d) {
                     return d.data.is_assigned;
                  })
                  .attr("children", function (d) {
                     return d.data.children;
                  })
                  .attr("ghost-node", function (d) {
                     if (isGhostNode(d)) {
                        return "true";
                     }
                  })
                  .attr("parentTaxNodeID", function (d) {
                     return d.data.parentTaxNodeID;
                  })
                  .attr("rank_index", function (d) {
                     return d.data.rankIndex;
                  })
                  .attr("transform", function (d) {
                     if (isPagerNode(d)) {
                        return "translate(" + d.y + "," + d.x + ")";
                     }

                     if (!d || isNaN(source.x0) || isNaN(source.y0)) {
                        return null;
                     }

                     return "translate(" + source.y0 + "," + source.x0 + ")";
                  })
                  .on("click", click);

               // Append the bridging rect ONLY for ghost nodes
               Enter.filter(function (d) { return isGhostNode(d); })
                  .append("rect")
                  .attr("class", "ghost-bridge")
                  .style("stroke", "black")
                  .style("stroke-width", "3px")
                  .style("fill", function (d) {
                     return findParent(d);
                  })
                  .attr("cursor", "pointer");

               // lrm 5-22-2024
               Enter.filter(function (d) {
                  // Only append circles to nodes that are NOT legend columns
                  return d.data.taxNodeID !== "legend";
               })
                  .append("circle")
                  .attr("class", "node")
                  .style("stroke", "black")
                  .style("stroke-width", `${settings.node.strokeWidth}px`)

                  // Make tree/root node invisible?
                  .style("opacity", function (d) {
                     return !d.data.parentDistance ? 0 : 1;
                  })
                  .style("pointer-events", function (d /* Not in use: i */) {
                     return !d.data.parentDistance ? "none" : "all";
                  });

               // lrm 5-22-2024
               // Enter.append("circle")
               //    .attr("class", "node")
               //    .style("stroke", "black")
               //    .style("stroke-width", `${settings.node.strokeWidth}px`)

               //    // Make tree/root node invisible?
               //    .style("opacity", function (d) {
               //       return !d.data.parentDistance ? 0 : 1;
               //    })
               //    .style("pointer-events", function (d, i) {
               //       return !d.data.parentDistance ? "none" : "all";
               //    });

               // Store each entered text element bounding box on its datum for background-rect sizing.
               // Used as a D3 call immediately after node labels are appended.
               function getBB(ds) {
                  ds.each(function (d) {
                     d.bbox = this.getBBox();
                  });
               }

               // Helper function for rectangle around node.text
               // This rectangle needs to grow when the font size is increased
               // Created with Enter.insert("rect", "circle") later in the code
               function updateTextRect(nodeSelection) {
                  const rectPaddingX = 6;
                  const rectPaddingY = 3;

                  nodeSelection.each(function (d) {
                     const group = d3.select(this);
                     const textNode = group.select("text").node();
                     const rectSelection = group.select("rect.text-bg");

                     if (!textNode || rectSelection.empty()) { return; }

                     d.bbox = textNode.getBBox();

                     rectSelection
                        .attr("x", d.bbox.x - rectPaddingX)
                        .attr("y", d.bbox.y - rectPaddingY)
                        .attr("width", d.bbox.width + (rectPaddingX * 2))
                        .attr("height", d.bbox.height + (rectPaddingY * 2));
                  });
               }

               Enter.append("text")
                  .attr("x", function (d) {
                     return d.children ? -13 : 13;
                  })
                  .attr("class", function (d) {

                     let className = "node-text";

                     if (isPagerNode(d)) {
                        className = "pager-node-text";
                     } else if (d.data.taxNodeID === "legend") {
                        className = "legend-node-text";
                     } else if (d.data.name === "Unassigned" && !isGhostNode(d)) {
                        className = "unassigned-text";
                     } else if (isGhostNode(d)) {
                        className = "ghost-node-text";
                     }

                     return className;
                  })
                  .attr("x", function (d /* Not in use: i */) {
                     if (d.data.rankIndex === 0) {
                        return d.children || d._children ? 10 : -10;
                     } else if (d.data.taxNodeID !== "legend") {
                        return d.children || d._children ? 0 : 10;
                     }
                  })
                  .attr("text-anchor", function (d) {
                     if (d.data.rankIndex === 0) {
                        return d.children || d._children ? "start" : "end";
                     } else if (
                        d.data.has_species !== 0 &&
                        d.data.taxNodeID !== "legend" &&
                        d.data.rankIndex === rankCount
                     ) {
                        return d.children || d._children ? "end" : "start";
                     }
                  })
                  .style("font-size", "4rem")
                  .attr("dx", settings.node.textDx)
                  .attr("dy", settings.node.textDy)
                  .text(function (d) {
                     // Do not display species in legend
                     if (d.data.name === "Unassigned" || d.data.rankName === "tree") {
                        if (d.data.taxNodeID === "legend") {
                           return d.data.rankName;
                        }
                        else if (
                           d.data.rankName === "realm" ||
                           d.data.has_assigned_siblings === true
                        ) {
                           return "Unassigned";
                        } else {
                           return "";
                        }
                     } else {
                        return d.data.name;
                     }
                  })
                  .attr("fill", function (/* Not in use: d */) {
                     return defaultNodeTextColor;
                  })

                  .attr("dx", settings.node.textDx)
                  .attr("dy", settings.node.textDy)
                  .call(getBB);

               Enter.filter(function (d) {
                  // Do not append rect with class of "text-bg" to rank columns
                  return d.data.taxNodeID !== "legend";
               })
                  .insert("rect", "circle")
                  .attr("class", "text-bg")
                  .attr("x", function (d) {
                     return d.bbox.x - 6;
                     // return d.bbox.x;
                  })
                  .attr("y", function (d) {
                     return d.bbox.y - 3;
                     // return d.bbox.y;
                  })
                  .attr("width", function (d) {
                     return d.bbox.width + 12;
                     // return d.bbox.width;
                  })
                  .attr("height", function (d) {
                     return d.bbox.height + 6;
                     // return d.bbox.height;
                  })
                  // .style("fill", "white")
                  .style("fill", function (d) {
                     // return isGhostNode(d) ? "transparent" : "white";
                     return isGhostNode(d) ? "transparent" : "rgba(255, 255, 255, 0.8)";
                  })
                  .attr("dx", settings.node.textDx)
                  .attr("dy", settings.node.textDy);

               var Update = Enter.merge(children);

               Update.transition()
                  .duration(updateDuration)
                  .attr("transform", function (d) {
                     return "translate(" + d.y + "," + d.x + ")";
                  });

               // Target specifically the ghost bridge rect
               Update.select("rect.ghost-bridge")
                  .style("stroke", "black")
                  .style("stroke-width", "2px")
                  .style("fill", function (d) {
                     // Need to return findParent(d) so it actually applies the color!
                     return findParent(d);
                  })
                  .attr("cursor", "pointer");

               Update.select("circle.node")

                  // append circle to all nodes but the invisible ghost nodes
                  .attr("r", function (d) {

                     if (isGhostNode(d) || isPagerNode(d)) {
                        return 0;
                     } else if (d.data.taxNodeID === "legend") {
                        return 0;
                     } else {
                        return settings.node.radius;
                     }
                  })

                  .style("fill", function (d) {

                     // lrm 5-20-2024
                     // update DOM element's appended circle when clicked
                     if (isSelectedNodeDatum(d)) {
                        return selectedNodeHighlightColor;
                     } else {
                        return defaultNodeCircleFill;
                     }

                     findParent(d);
                  })
                  .attr("cursor", "pointer")

               Update.select("text.node-text")
                  .attr("cursor", "pointer")
                  .style("fill", function (d) {

                     // lrm 5-30-2024
                     // clicked text is the highlighted text
                     // clickedText is global varible assigned in the click function
                     if (isSelectedNodeDatum(d)) {
                        return selectedNodeHighlightColor;
                     } else {
                        return defaultNodeTextColor;
                     }
                  })
                  .style("font-size", fontSliderEl.property("value") + "rem");
               // Transform
               Update.select("text.legend-node-text")
                  .attr("transform", function (/* Not in use: d, i */) {
                     /*if (d.data.taxNodeID === "legend") {
                       return "rotate(-45 0,-110)";
                     }*/
                  })
                  .style("fill", function (d) {
                     findParent(d);
                  })
                  .style("font-size", fontSliderEl.property("value") + "rem");

               Update.select("text.unassigned-text")
                  .style("font-size", fontSliderEl.property("value") + "rem")
                  .style("fill", function (d) {

                     // lrm 6-10-2024
                     // clicked text is the highlighted text
                     // clickedText is global varible assigned in the click function
                     if (isSelectedNodeDatum(d)) {
                        return selectedNodeHighlightColor;
                     } else {
                        return defaultNodeTextColor;
                     }
                  })

               Update.select("text.pager-node-text")
                  .attr("cursor", function (d) {
                     return d.data.isPagerDisabled ? "default" : "pointer";
                  })
                  .style("fill", function (d) {
                     return d.data.isPagerDisabled ? "#999999" : "#0062cc";
                  })
                  .style("font-size", fontSliderEl.property("value") + "rem")
                  .style("font-style", "normal")
                  .style("font-weight", "bold");

               updateTextRect(Update);

               var Exit = children.exit();

               Exit.filter(function (d) { return isPagerNode(d); })
                  .remove();

               var ExitTransition = Exit.filter(function (d) { return !isPagerNode(d); })
                  .transition()
                  .duration(updateDuration)
                  .attr("transform", function (/* Not in use: d */) {
                     return "translate(" + source.y + "," + source.x + ")";
                  })
                  .remove();

               ExitTransition.select("circle").attr("r", 1);

               ExitTransition.select("text").style("fill-opacity", 1);

               var link = treeGroup.selectAll("path.link").data(links, function (d) {
                  return d.id;
               });

               var linkEnter = link
                  .enter()
                  .insert("path", "g")
                  .attr("class", "link")
                  .attr("d", function (d) {

                     if (
                        ((d.data.rankName === "subgenus" &&
                           d.data.name == "Unassigned") ||
                           d.data.taxNodeID === "legend") &&
                        d.data.name === "Unassigned"
                     ) {
                        return diagonal(0, 0);

                     }

                     var pos = { x: source.x0, y: source.y0 };

                     return diagonal(pos, pos);

                  })
                  .style("stroke-width", "5px")
                  .style("fill", "none")
                  .style("stroke", "#ccc")
                  .style("display", function (d) {
                     if (
                        d.depth === 1 ||
                        (d.data.has_species === 0 &&
                           d.data.name == "Unassigned" &&
                           d.data.children === null) ||
                        d.data.taxNodeID === "legend"
                     ) {
                        //Is top link
                        return "none";
                     }
                  });

               var linkUpdate = linkEnter.merge(link);


               linkUpdate
                  .transition("path.link")
                  .duration(updateDuration)
                  .attr("d", function (d) {

                     // lrm 6-12-2024
                     // Do not draw links to ghost nodes
                     // This helps the link line colors stay consistent
                     if (!isGhostNode(d)) {
                        if (isPagerNode(d)) {
                           return null;
                        }
                        if (isGhostNode(d.parent)) {
                           return diagonal(findNonGhostParent(d.parent), d);
                        }
                        return diagonal(d.parent, d);
                     }
                  })

                  // Code to color the links
                  .style("stroke", function (d) {
                     // lrm 6-17-2024
                     // Check if the node is a leaf node and if it's the currently selected node
                     if ((!d.children && !d._children) && isSelectedNodeDatum(d)) {
                        return selectedNodeHighlightColor;
                     } else if (d._children) {
                        return "#808080";
                     } else if (d.children) {
                        return selectedNodeHighlightColor;
                     } else {
                        return "#808080";
                     }
                  });

               link
                  .exit()
                  .transition()
                  .duration(updateDuration)
                  .attr("d", function (/* Not in use: d */) {
                     var pos = { x: source.x, y: source.y };
                     return diagonal(pos, pos);
                  })
                  .remove();

               allNodes.forEach(function (d) {
                  d.x0 = d.x;
                  d.y0 = d.y;
               });

               scheduleAutoSpacingCheck(source, updateDuration);

               // Generate the curved SVG path between a parent and child node.
               // Used when links enter, update, or exit during tree transitions.
               function diagonal(s, t) {
                  // Validate s and t
                  if (
                     !s ||
                     !t ||
                     isNaN(s.x) ||
                     isNaN(s.y) ||
                     isNaN(t.x) ||
                     isNaN(t.y)
                  )
                     return null;

                  path = `M ${s.y} ${s.x}
                                C ${(s.y + t.y) / 2} ${s.x},
                                ${(s.y + t.y) / 2} ${t.x},
                                ${t.y} ${t.x}`;

                  return path;
               }

               // var simulation = d3
               //    .forceSimulation()
               //    .force("link", d3.forceLink().distance(500).strength(0.1));

               // Walk up to the first high-level ancestor and return its name for color assignment.
               // Used when filling ghost bridge rectangles and legend-related elements.
               function findParent(par) {
                  if (par.depth < 2) {
                     return par.data.name;
                  } else {
                     return findParent(par.parent);
                  }
               }

               // Handle node clicks for pagination shifts, expand-collapse toggles, and selection highlighting.
               // Registered on each rendered node group in the update enter selection.
               function click(event, d) {
                  if (d.data.taxNodeID !== "legend") {
                     if (isPagerNode(d)) {
                        if (d.data.isPagerDisabled) { return; }

                        setNodeScrollStart(d.parent, d.scrollStartIndex || 0);

                        // Restart overlap checks without clearing the spacing that is already applied.
                        autoSpacingState.passCount = 0;

                        // Keep small pager shifts steady; normal expand/collapse transitions are too noisy here.
                        update(d.parent, true, 0);
                        return;
                     }

                     selectedNode = d;

                     if (d.children) {
                        collapseNode(d);
                     } else if (d._children) {
                        expandNode(d);
                     }

                     // lrm 5-20-2024
                     // clickedCircle is a  global variable declared at the top of the script
                     // here it is assigned for the purpose of updating the circle color when clicked
                     clickedCircle = event.currentTarget.querySelector("circle");
                     clickedText = event.currentTarget.querySelector("text");

                     // Restart overlap checks without clearing the spacing that is already applied.
                     autoSpacingState.passCount = 0;

                     // Preserve measured spacing on node clicks so overlap spacing does not visibly disappear.
                     update(d, true);
                  }
               }

               // lrm 5-20-2024
               // function to determine what is a ghost node
               function isGhostNode(d) {
                  if (!d || !d.data) {
                     return false;
                  }

                  if (d.data.rank_index === 0) {
                     // “Tree” has a rank index of zero and a numeric comparison is faster than a string comparison.
                     return false;
                  } else if ((d.data.is_assigned) || d.data.has_assigned_siblings) {
                     return false;
                  } else if (d.data.taxNodeID === "legend") {
                     return false;
                  } else {
                     return true;
                  }
               }

               // Function used in the linkUpdate code to help draw links from non-ghost node parents
               // Traverses the tree to check node's parents for ghost nodes
               // It will traverse until it finds a parent that is not a ghost node
               function findNonGhostParent(node) {
                  if (node.parent) {
                     if (isGhostNode(node.parent)) {
                        return findNonGhostParent(node.parent);
                     } else {
                        return node.parent;
                     }
                  } else {
                     return null;
                  }
               }

               // The first parameter is the element that acts as a delegate for child elements with
               // tippy instances. The second parameter defines the tippy instances that will be assigned
               // to the child elements (qualified by the "target" attribute). 
               //
               // https://atomiks.github.io/tippyjs/
               window.tippy.delegate(`${containerSelector} svg`, {
                  allowHTML: true,
                  animation: settings.tooltip.animation,
                  appendTo: () => document.body,
                  delay: [settings.tooltip.showDelay, settings.tooltip.hideDelay],
                  interactive: true,
                  interactiveBorder: settings.tooltip.interactiveBorder,
                  // Build the taxon tooltip just before it appears so it reflects the node under the cursor.
                  onShow(instance) {

                     // Validate the instance
                     if (!instance || !instance.reference || !instance.reference.__data__ || !instance.reference.__data__.data) {

                        console.error("Invalid instance parameter in onShow()");

                        // Disable the instance so the tooltip won't display.
                        return instance.disable();
                     }

                     // Populate the child HTML with the child counts value (if it isn't empty).
                     const childCounts = instance.reference.__data__.data.child_counts;
                     const childHTML = !childCounts ? "" : childCounts;

                     // Get the name, rank, and taxnode ID attributes from the node data.
                     const name = instance.reference.__data__.data.name;
                     const rankName = instance.reference.__data__.data.rankName;
                     const taxNodeID = instance.reference.__data__.data.taxNodeID;

                     // Validate the attributes
                     if (!name || !rankName || !taxNodeID) { return instance.disable(); }

                     // The HTML content to display in the tooltip.
                     const html =
                        `<div class="ictv-tax-viz-tooltip">
                           <div class="rank-and-name">${rankName}&nbsp;<i>${name}</i></div>
                           <div class="child-count">${childHTML}</div>
                           <div class="history">
                                 <a href="${taxonDetailsURL}?taxnode_id=${taxNodeID}&taxon_name=${name}" target="_blank">View taxon history</a>
                           </div>
                        </div>`;

                     instance.setContent(html);
                  },
                  placement: "left-start",
                  target: "g.node text.node-text",
                  theme: "ICTV-Tooltip"
               })

               // Attach a separate tooltip for synthetic pager nodes that explains the hidden range.
               // Used by the up and down pager labels inserted for large child lists.
               window.tippy.delegate(`${containerSelector} svg`, {
                  allowHTML: true,
                  animation: settings.tooltip.animation,
                  appendTo: () => document.body,
                  delay: [settings.tooltip.showDelay, settings.tooltip.hideDelay],
                  // Build the pager tooltip just before it appears so range counts stay in sync with pagination state.
                  onShow(instance) {
                     const d = instance.reference.__data__;
                     if (!d || !isPagerNode(d) || !d.data) {
                        return false;
                     }

                     const directionText = d.data.pagerDirection === "up" ? "above" : "below";
                     const remaining = d.data.pagerRemainingCount || 0;
                     const rangeStart = d.data.pagerRangeStart || 0;
                     const rangeEnd = d.data.pagerRangeEnd || 0;
                     const total = d.data.pagerTotalCount || 0;

                     instance.setContent(
                        `<div class="ictv-tax-viz-tooltip">
                           <div>${remaining} taxa ${directionText}</div>
                           <div>Showing ${rangeStart}-${rangeEnd} of ${total}</div>
                        </div>`
                     );
                  },
                  placement: "right",
                  target: "g.node text.pager-node-text",
                  theme: "ICTV-Tooltip"
               });

	            }
         }

      });

      return;
   }

   // Recursively collapse the release tree into its initial display state while preserving special Unassigned branches.
   // Called on each root child when createTree first builds the hierarchy.
   function collapse(d) {
      const children = getNodeChildren(d);
      if (!children) { return; }

      children.forEach(collapse);

      if (
         d.data.name === "Unassigned" &&
         d.data.rankName === "realm" &&
         d.data.taxNodeID !== "legend"
      ) {
         // No name, a rank of "realm", and not part of the legend.
         d._children = getVisibleChildren(d);
         d.children = null;
      } else if (
         d.data.name === "Unassigned" &&
         d.data.has_assigned_siblings !== true &&
         d.data.has_unassigned_siblings !== true
      ) {
         // No name and it doesn't have assigned or unassigned siblings (so no siblings?).
         d.children = getVisibleChildren(d);
         d._children = null;
      } else {
         d._children = getVisibleChildren(d);
         d.children = null;
      }

   }



   // This function is called when a search result is selected in the searchPanel. A reference to it is 
   // passed as a parameter to the search panel object's "constructor".
   // lrm 6-21-24
   // Instead of passing JSON IDs and JSON Lineage, pass taxNodeIDLineage and taxNodeId from callback function in searchPanel.js
   // JSON IDs were changing when updating DB, this caused the search to break here
   function selectSearchResult(event_, displayOrder_, parentTaxNodeID_, taxNodeId_, releaseNumber_, taxNodeIdLineage_) {

      // Not in use: event_ and taxNodeId_ are callback placeholders kept to preserve argument order.
      void event_;
      void taxNodeId_;

      // Update the global pagination data.
      paginationData.childDisplayOrder = parseInt(displayOrder_);
      paginationData.parentTaxnodeID = parseInt(parentTaxNodeID_);

      // console.log(`in selectSearchResult: taxNodeId_ = ${taxNodeId_}, taxNodeIdLineage_ = ${taxNodeIdLineage_}, displayOrder_ = ${displayOrder_}`);

      // Start each search from the normal fitted tree spacing, not a previous Expand to Fit spread.
      rememberedAutoSpacing.horizontalScale = 1;
      rememberedAutoSpacing.verticalScale = 1;
      currentTreeIsExpandedToFit = false;

      // Select the specified release.
      releaseControlEl.value = releaseNumber_;
      releaseControlEl.dispatchEvent(new Event("change"));

      // Trigger a click on the clear button.
      const clearButtonEl = document.querySelector(".search-panel .clear-button");
      if (!clearButtonEl) { throw new Error("Invalid clear button element"); }

      clearButtonEl.dispatchEvent(new Event("click"));


      // Poll until the newly selected release has finished creating its root and update closure.
      // Used before search expansion starts opening the requested lineage.
      async function waitForTreeReady() {
         const maxAttempts = 30;

         for (let attempt = 0; attempt < maxAttempts; attempt++) {
            if (!!currentTreeRoot && !!currentTreeUpdate) {
               return true;
            }

            await wait(200);
         }

         return false;
      }

      // Expand the viewport if search expansion has pushed the tree outside the visible SVG area.
      // Used after the selected target node has been reached and highlighted.
      async function triggerExpandToFitIfNeeded() {
         if (!currentZoom || !currentSvgZoom || !currentTreeRoot || !currentTreeExpandToFit) return;

         await currentTreeExpandToFit();
      }

      // Open each ancestor in a path and shift pagination windows so the next lineage node is visible.
      // Used by openNodes for every taxNodeID in the selected search-result lineage.
      async function expandPath(path) {
         if (!path || path.length < 2) { return; }

         for (let i = 1; i < path.length; i++) {
            const parentNode = path[i - 1];
            const currentNode = path[i];
            const scrollChanged = setNodeScrollStartForChild(parentNode, currentNode);
            const expanded = expandNode(parentNode);

            if (scrollChanged || expanded) {
               const nodeToHighlight = parentNode.data && parentNode.data.parentDistance ? parentNode : currentNode;
               selectedNode = nodeToHighlight;
               syncSelectedNodeElements(nodeToHighlight);

               // Preserve measured spacing during search expansion so opened nodes do not briefly overlap.
               currentTreeUpdate(parentNode, true);

               // Wait for any new spacing needed by the expanded branch before continuing the search path.
               if (currentTreeWaitForAutoSpacing) {
                  await currentTreeWaitForAutoSpacing();
               }

               // Keep the expanding search path visible when the newly opened tree is clipped.
               if (currentTreeFitSearchExpansionIfClipped) {
                  await currentTreeFitSearchExpansionIfClipped();
               }

               // Wait for the node expansion animation first, then lock the current lineage highlight in place.
               await wait(settings.animationDelay);
               applySelectedNodeStyles(nodeToHighlight);
               // panToNode(currentNode, settings.animationDuration);
               // await wait(settings.animationDelay);
            }
         }
      }

      // Mark the final searched node as selected and update its text and circle highlight styles.
      // Called after all lineage nodes have been opened.
      async function highlightNode(node) {
         if (!node || !node.data || !node.data.taxNodeID || !currentTreeUpdate) { return; }

         selectedNode = node;
         syncSelectedNodeElements(node);

         // Preserve measured spacing when the searched node is highlighted.
         currentTreeUpdate(node, true);
         await wait(settings.animationDelay);
         applySelectedNodeStyles(node);
      }

      // Drive the full search-result workflow: wait for the tree, expand lineage nodes, and highlight the target.
      // Scheduled after the release selector change so the new taxonomy has time to render.
      async function openNodes() {
         const treeReady = await waitForTreeReady();
         if (!treeReady) { return; }

         // Split the delimited string into an array.
         const lineage_array = taxNodeIdLineage_.split(",").filter((nodeId) => !!nodeId);
         let currentNode = currentTreeRoot;
         let finalNode = null;

         for (const nodeId of lineage_array) {
            let path = findPathToTaxNode(currentNode, nodeId);

            if (!path) {
               path = findPathToTaxNode(currentTreeRoot, nodeId);
            }

            if (!path) { continue; }

            await expandPath(path);
            currentNode = path[path.length - 1];
            finalNode = currentNode;
         }

         if (finalNode) {
            await highlightNode(finalNode);
            await triggerExpandToFitIfNeeded();
         }

         // --- Trigger the final expand-to-fit centered view ---
         // panToNode(finalNode, settings.animationDuration, true);

         paginationData.childDisplayOrder = NaN;
         paginationData.parentTaxnodeID = null;
      }

      setTimeout(openNodes, settings.animationDelay);
   }

};
// Resolve after the requested number of milliseconds.
// Used to sequence D3 transitions during search expansion and tree readiness polling.
async function wait(t) {
   return new Promise((resolve) => {
      setTimeout(resolve, t);
   })
}
