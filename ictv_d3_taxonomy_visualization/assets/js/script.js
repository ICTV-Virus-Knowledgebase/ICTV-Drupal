
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
         delegate: function (dummyOne, dummyTwo) { }
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
      pageSize: 50,
      animationDuration: 900,
      animationDelay: 1100,
      node: {
         radius: 17.5,
         strokeWidth: 3,
         textDx: 25,
         textDy: 25,
      },
      svg: {
         height: jQuery(window).height() * 0.8,
         margin: {
            top: 0,
            right: 0,
            bottom: 0,
            left: 0
         },
         width: jQuery(window).width(),
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
      //    translateX: -(jQuery(window).width()), //-3850,
      //    translateY: -(jQuery(window).height() * 0.45), //-1800
      // },
      // ===========================================================================
   };

   // Global variables

   // This is used by openNode() to maintain details of the previously selected node.
   let previousNode = {
      parentTaxNodeID: null,
      parentRankIndex: NaN
   }

   const paginationData = {
      // The display order of a target child node.
      childDisplayOrder: NaN,
      // The (string) parent taxnode ID of the target child node.
      parentTaxnodeID: null
   }

   let currentTreeRoot = null;
   let currentTreeUpdate = null;

   // Zoom behavior for font slider
   let currentZoom = null;
   let currentSvgZoom = null;
   let initialZoomTransform = null;

   // nodeHeight is used in pageNodes() to determine which page to display when searching
   var nodeHeight = null;
   var globalTaxNodeId = null;
   var currentFontSize;
   var selectedNode;
   var clickedText;
   var clickedCircle;
   var selected;
   var num_flag = false;
   var num;
   var name = "";
   var arr = [];
   var temp = 0;
   var Flag = true;
   var max = 0;
   var fs = 0;
   var Sflag = false
   var counter = 0;
   var len = 0;
   var res = [];

   // The DOM Element for the font size panel and slider (these are assigned in "iniitializeFontSizePanel").
   let fontSizePanelEl = null;
   let fontSliderEl = null;

   // DOM element for Zoom slider (assigned in "initialzeZoomPanel")
   let ZoomPanelEl = null;
   let ZoomSliderEl = null;

   //DOM element for ss button
   let buttonE1 = null;
   let buttonClickE1 = null

   // The DOM Element for the release control (this is assigned in "initializeReleaseControl").
   let releaseControlEl = null;

   // This will be populated with a release's species data.
   let speciesData = null;

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

   // Pagination toggle
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

   // Follow target node as they're opened after clicking on search result
   // Called inside expandPath function
   // TODO: It jumps over when it starts to pan, I need to leverage logic inside the Font Size slider to fix it.
   // 20260505: It still jumps, but it is not as aggressive
   function panToNode(node, duration, expandToFit = false) {
      if (!node || !currentZoom || !currentSvgZoom || isNaN(node.x) || isNaN(node.y)) return;

      if (expandToFit) {
         // Grab bounding box of the whole tree to scale out
         const group = d3.select(`${containerSelector} .taxonomy-panel svg g`);
         if (group.empty()) return;

         const bounds = group.node().getBBox();
         const fullWidth = settings.svg.width;
         const fullHeight = settings.svg.height;

         if (bounds.width === 0 || bounds.height === 0) return;

         const padding = 0.85;
         const scaleWidth = fullWidth / bounds.width;
         const scaleHeight = fullHeight / bounds.height;
         let newScale = Math.min(scaleWidth, scaleHeight) * padding;

         // Center the bounding box perfectly in the SVG viewport
         let finalX = (fullWidth / 2) - newScale * (bounds.x + bounds.width / 2);
         let finalY = (fullHeight / 2) - newScale * (bounds.y + bounds.height / 2);

         currentSvgZoom.transition()
            .duration(duration || settings.animationDuration)
            .call(
               currentZoom.transform,
               d3.zoomIdentity.translate(finalX, finalY).scale(newScale)
            );
            
         // Sync zoom slider
         if (ZoomSliderEl) ZoomSliderEl.property("value", newScale);
         
         return; // Exit early, skipping the normal node-panning logic
      }

      const currentTransform = d3.zoomTransform(currentSvgZoom.node());
      const scale = currentTransform.k;
      
      // node.y = horizontal position, node.x = vertical position (tree is rotated)
      const tx = (settings.svg.width / 6) - scale * node.y;
      const ty = (settings.svg.height / 2) - scale * node.x;

         currentSvgZoom.transition()
            .duration(duration || settings.animationDuration)
            .call(
               currentZoom.transform,
               d3.zoomIdentity.translate(tx, ty).scale(scale)
            );
      }

   // TODO: What button? Give this a better name!
   function initializeButton() {

      // Get a reference to the panel Element.
      let buttonE1 = document.querySelector(`${containerSelector} .font-size-panel`);
      if (!buttonE1) { throw new Error("Invalid font size panel Element"); }

	  // "Expand to Fit" button
      let expandToFitBtn = d3
         .select(`${containerSelector} .font-size-panel`)
         .append("button")
         .attr("class", "screenshot-button expand-to-fit-btn")
         .html(`<i class="fa fa-expand"></i> Expand to Fit`)

      // Create a button.
      let buttonClickE1 = d3
         .select(`${containerSelector} .font-size-panel`)
         .append("button")
         .attr("class", "screenshot-button")
         .html(`<i class="fa fa-camera"></i> Export`);

      // Create a dropdown for format selection.
      let selectFormat = d3.select(`${containerSelector} .font-size-panel`)
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
      buttonClickE1.on("click", function (e) {

         const selectedFormat = selectFormat.node().value;

         if (selectedFormat === "png") {

            // Select the SVG element from the document
            let svg = document.querySelector('svg');

            // Get the D3 selection of the SVG
            let svgSelection = d3.select(svg);

            // Apply inline CSS to match SVG before
            svgSelection.selectAll('text.legend-node-text')
               .style('font-style', 'normal')
               .attr('transform', function (d, i) {
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
               return new Promise((resolve, reject) => {

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
            const leftTrim = (1 - 1 / Math.sqrt(fontScale)) * bbox.width * 0.25;

            // Set the viewBox attribute to the bounding box dimensions to fit the SVG contents
            svg.setAttribute('viewBox', `${bbox.x + leftTrim} ${bbox.y} ${bbox.width - leftTrim} ${bbox.height}`);

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
               .attr('transform', function (d, i) {
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
            const leftTrim = (1 - 1 / Math.sqrt(fontScale)) * bbox.width * 0.25;

            // Set the viewBox attribute to the bounding box dimensions to fit the SVG contents
            svg.setAttribute('viewBox', `${bbox.x + leftTrim - padding} ${bbox.y - padding} ${bbox.width - leftTrim + 2 * padding} ${bbox.height + 2 * padding}`);

            // Create a D3 selection from the SVG
            let svgSelection = d3.select(svg);

            // Apply inline styles to the SVG elements
            svgSelection.selectAll('text.legend-node-text')
               // 64px = 4rem
               // adobe illustrator did not like rem
               .style('font-style', 'normal')
               .style('fill', 'black')
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
               .attr('transform', function (d, i) {
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
      expandToFitBtn.on("click", function () {
         if (!currentZoom || !currentSvgZoom || !currentTreeRoot) return;

         // Get the bounds of the tree group to calculate the required scale
         const group = d3.select(`${containerSelector} .taxonomy-panel svg g`);
         if (group.empty()) return;

         const bounds = group.node().getBBox();
         const fullWidth = settings.svg.width;
         const fullHeight = settings.svg.height;

         if (bounds.width === 0 || bounds.height === 0) return;

         // Calculate the scale needed to fit the tree within the viewable SVG area.
         // Add a padding factor (e.g., 0.85) so it doesn't touch the very edges.
         const padding = 0.85;
         const scaleWidth = fullWidth / bounds.width;
         const scaleHeight = fullHeight / bounds.height;
         
         // Use the smaller scale so the entire tree fits, but clamp it to reasonable min/max
         let newScale = Math.min(scaleWidth, scaleHeight) * padding;
         
         // Fetch the horizontal (y) and vertical (x) coordinates of the topmost left node (Realm)
         let realmDataY = currentTreeRoot.children ? currentTreeRoot.children[0].y : (currentTreeRoot._children ? currentTreeRoot._children[0].y : 0);
         let realmDataX = currentTreeRoot.children ? currentTreeRoot.children[0].x : (currentTreeRoot._children ? currentTreeRoot._children[0].x : 0);
         
         // Define exactly how many pixels away from the edges to pin the Realm node
         let desiredLeftPadding = 20; 
         // You might want to adjust desiredTopPadding based on the scale or keep it fixed
         let desiredTopPadding = 70; 
         
         // Calculate target translations using the pinning logic from your font slider
         let calculatedX = desiredLeftPadding - (realmDataY * newScale);
         
         // To center vertically instead of pinning to top, use bounds:
         // let calculatedY = (fullHeight / 2) - newScale * (bounds.y + bounds.height / 2);
         // Pins nodes to the top left:
         let calculatedY = desiredTopPadding - (realmDataX * newScale);

         // Animate the zoom and translation so the tree fits bounds and aligns top-left
         currentSvgZoom.transition()
            .duration(settings.animationDuration)
            .call(
               currentZoom.transform,
               d3.zoomIdentity.translate(calculatedX, calculatedY).scale(newScale)
            );
            
         // Sync sliders
         if (ZoomSliderEl) {
            ZoomSliderEl.property("value", newScale);
         }
      });

   }

   let zoom = d3.zoom()
      .on("zoom", function (event) {
         d3.select(`${containerSelector} .taxonomy-panel svg g`)
            .attr("transform", event.transform);
      });

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

   function isPagerNode(node) {
      return !!(node && node.data && node.data.isPager === true);
   }

   function getNodeChildren(node) {
      if (!node) { return null; }

      return node.allChildren || node.children || node._children || null;
   }

   function getPageItemCount(pageSize) {
      return Math.max(pageSize - 2, 1);
   }

   function getDefaultPageIndex(node, itemCount, pageCount) {
      let pageIndex = 0;

      if (
         !!node &&
         !!node.data &&
         !!node.data.parentTaxNodeID &&
         paginationData.parentTaxnodeID == node.data.parentTaxNodeID &&
         !isNaN(paginationData.childDisplayOrder)
      ) {
         pageIndex = Math.floor((paginationData.childDisplayOrder - 1) / itemCount);
      }

      return Math.max(0, Math.min(pageIndex, pageCount - 1));
   }

   function createPagerNode(parentNode, pageIndex) {
      if (!isPaginationEnabled()) { return null; }

      return {
         data: {
            name: "More...",
            rankName: "Shift",
            taxNodeID: "",
            parentTaxNodeID: parentNode?.data?.taxNodeID || "",
            rankIndex: (parseInt(parentNode?.data?.rankIndex) || 0) + 1,
            is_assigned: true,
            has_species: 0,
            isPager: true
         },
         parent: parentNode,
         depth: (parentNode?.depth || 0) + 1,
         height: 0,
         page: pageIndex,
         children: null,
         _children: null,
         allChildren: null
      };
   }

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

      const pageIndex = Math.max(0, Math.min(node.pagination.currentPage, node.pagination.pageCount - 1));
      const startRange = pageIndex * node.pagination.itemCount;
      const endRange = startRange + node.pagination.itemCount;
      const visibleChildren = node.allChildren.slice(startRange, endRange);

      if (node.pagination.pageCount < 2) {
         return visibleChildren;
      }

      const previousPage = pageIndex === 0 ? node.pagination.pageCount - 1 : pageIndex - 1;
      const nextPage = pageIndex === node.pagination.pageCount - 1 ? 0 : pageIndex + 1;

      return [
         createPagerNode(node, previousPage),
         ...visibleChildren,
         createPagerNode(node, nextPage)
      ].filter(Boolean);
   }

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

   function setNodePage(node, pageIndex) {
      if (!isPaginationEnabled() || !node || !node.pagination) { return false; }

      const normalizedPageIndex = ((pageIndex % node.pagination.pageCount) + node.pagination.pageCount) % node.pagination.pageCount;
      const pageChanged = node.pagination.currentPage !== normalizedPageIndex;
      node.pagination.currentPage = normalizedPageIndex;

      return syncVisibleChildren(node) || pageChanged;
   }

   function setNodePageForChild(parentNode, childNode) {
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

      const targetPageIndex = Math.floor(childIndex / parentNode.pagination.itemCount);
      return setNodePage(parentNode, targetPageIndex);
   }

   function expandNode(node) {
      if (!node || !node._children) { return false; }

      node.children = getVisibleChildren(node);
      node._children = null;
      return true;
   }

   function collapseNode(node) {
      if (!node || !node.children) { return false; }

      node._children = getVisibleChildren(node);
      node.children = null;
      return true;
   }

   function initializePagination(node, pageSize) {
      if (!node || !node.children) { return; }

      node.allChildren = [...node.children];
      node.allChildren.forEach((childNode) => initializePagination(childNode, pageSize));

      if (node.allChildren.length > pageSize) {
         const itemCount = getPageItemCount(pageSize);
         const pageCount = Math.ceil(node.allChildren.length / itemCount);

         node.pagination = {
            itemCount,
            pageCount,
            currentPage: getDefaultPageIndex(node, itemCount, pageCount)
         };

         node.children = getVisibleChildren(node);
      } else {
         node.pagination = null;
         node.children = node.allChildren;
      }
   }

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

   // Force target node onto screen when paginated?
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

   function initializeZoomPanel() {
      ZoomPanelEl = document.querySelector(`${containerSelector} .font-size-panel`);
      if (!ZoomPanelEl) { throw new Error("Invalid font size panel Element"); }

      if (ZoomPanelEl.classList.contains("show")) { ZoomPanelEl.classList.remove("show"); }

      d3
         .select(".font-size-panel")
         .append("div")
         .attr("class", "label")
         .text("Zoom");

      ZoomSliderEl = d3
         .select(".font-size-panel")
         .append("input")
         .attr("class", "slider")
         .attr("type", "range")
         .attr("min", 0.19)
         .attr("max", 1)
         .attr("step", 0.001)
         .attr("value", 0.19);

      ZoomSliderEl.on("input", function (e) {
         const zoomValue = parseFloat(e.target.value);
         // const svg = d3.select(`${containerSelector} .taxonomy-panel svg`);

         // let currentTransform = d3.zoomTransform(svg.node());
         // svg.call(zoom.transform, d3.zoomIdentity.translate(currentTransform.x, currentTransform.y).scale(zoomValue));

         // Make sure the tree is fully loaded
         if (currentZoom && currentSvgZoom) {
            // Find the exact center of the SVG viewport
            const centerX = settings.svg.width / 2;
            const centerY = settings.svg.height / 2;
            
            // Use D3's native scaleTo logic to zoom in around that specific center point
            currentSvgZoom.call(currentZoom.scaleTo, zoomValue, [centerX, centerY]);
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
      d3
         .select(".font-size-panel")
         .append("div")
         .attr("class", "label")
         .text("Font size");

      // Create the slider control and a reference to it.
      fontSliderEl = d3
         .select(".font-size-panel")
         .append("input")
         .attr("class", "slider")
         .attr("type", "range")
         .attr("min", 4)
         .attr("max", 8)
         .attr("value", 4);

      // changing the font on change of slider
      fontSliderEl.on("input", function (e) {
         const fontSize = e.target.value;
         currentFontSize = fontSize;
         d3.selectAll(`${containerSelector} .taxonomy-panel text.node-text`)
            .style("font-size", fontSize + "rem");

         d3.selectAll(`${containerSelector} .taxonomy-panel text.pager-node-text`)
            .style("font-size", fontSize + "rem");


         if (currentTreeRoot && currentTreeUpdate) {
            currentTreeUpdate(currentTreeRoot);

            setTimeout(function () {
               if (!currentZoom || !currentSvgZoom || !initialZoomTransform) return;

               // Determine the new scale to accommodate the larger bounding box 
               const fontScale = (parseFloat(currentFontSize) || 4) / 4;
               const newScale = initialZoomTransform.k / Math.sqrt(fontScale);

               // Fetch the horizontal (y) and vertical (x) coordinates of the first column
               let realmDataY = currentTreeRoot.children ? currentTreeRoot.children[0].y : (currentTreeRoot._children ? currentTreeRoot._children[0].y : 0);
               let realmDataX = currentTreeRoot.children ? currentTreeRoot.children[0].x : (currentTreeRoot._children ? currentTreeRoot._children[0].x : 0);
               
               // Define exactly how many pixels away from the edges to pin the Realm node
               let desiredLeftPadding = 20; 
               let desiredTopPadding = 70; 
               
               // Calculate target translations
               let calculatedX = desiredLeftPadding - (realmDataY * newScale);
               let calculatedY = desiredTopPadding - (realmDataX * newScale);

               // Anchor the SVG using the calculations
               currentSvgZoom.transition()
                  .duration(100) // fast transition since the slider is being dragged
                  .call(
                     currentZoom.transform,
                     d3.zoomIdentity.translate(calculatedX, calculatedY).scale(newScale)
                  );

               // Optionally sync the zoom slider with the newly applied scale
               if (ZoomSliderEl) {
                  ZoomSliderEl.property("value", newScale);
               }
            }, settings.animationDuration + 50);
         }
      });
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

      // TODO: Figure out the purpose of these variables and give them better names!
      num = 0;
      temp = 0;
      arr = [];
      Flag = false;
      Sflag = false;
      num_flag = false;
      max = 0;
      len = 0;
      counter = 0;
      res = [];
      currentTreeRoot = null;
      currentTreeUpdate = null;

      // If there's already an SVG element in the taxonomy panel, delete it.
      const existingSVG = document.querySelector(`${containerSelector} .taxonomy-panel svg `);
      if (!!existingSVG) { existingSVG.remove(); }

      // Determine the filename for the taxonomy JSON file.
      const jsonFilename = `${dataURL}/data/taxonomy_${releaseYear_}.json`;

      // lrm 6-20-2024
      // nonSpeciesFilename was being loaded twice, I took the commented code above
      // and put it where it was being loaded a 2nd time.
      d3.json(jsonFilename).then(function (data) {

         var genus = false;

         // Set the width and height available within the SVG.
         const availableHeight =
            settings.svg.height -
            settings.svg.margin.left -
            settings.svg.margin.right;
         const availableWidth =
            settings.svg.width -
            settings.svg.margin.top -
            settings.svg.margin.bottom;
         var zoom = d3.zoom().on("zoom", handleZoom);

         function handleZoom(e) {
            d3.select(`${containerSelector} svg g`).attr("transform", e.transform);
         }


         let drag = d3
            .drag()
            .on("start", start)
            .on("drag", dragged)
            .on("end", dragend);

         function start(d) {
            d.fixed = true;
         }

         function dragged() {
            var x = event.x;
            var y = event.y;
            var current = d3.select(`${containerSelector} svg g`);
            current.attr("transform", `translate(${x},${y})`);
         }

         function dragend(d) {
            d.fixed = false;
         }

         // TODO: Consider renaming "ds" to "root"
         const ds = d3.hierarchy(data, function (d) {

            if (d.children === null) { return; }

            do {
               let str = d.child_counts;
               var result;
               const regex = /(\d+)/;
               if (typeof str === "string" && str.length > 0) {
                  if (str.includes("species")) {
                     result = str.replace(/, .*species|,.*$/, "");
                  } else {
                     result = str?.match(regex);
                  }
               }
               if (typeof result === "string" && result.length > 0) {
                  num = parseInt(result.match(/\d+/)[0]);
                  if (num > 500) {
                     num = temp;
                  } else {
                     if (num > temp) {
                        arr.push(temp);
                        temp = num;
                     }
                  }
               }
            }
            while (num > 1000);
            const max = Math.max(...arr);
            num_flag = true;
            return d.children;
         });

         // Create and populate the tree structure.
         createTree(ds);


         // TODO: this needs a more informative name.
         var i = 0;

         function createTree(ds) {

            var svg = d3
               .select(`${containerSelector} .taxonomy-panel`)
               .append("svg")
               .attr("width", settings.svg.width)
               .attr("height", settings.svg.height)
               .append("g")
               .attr(
                  "transform",
                  `translate(${settings.svg.margin.left},${settings.svg.margin.top})`
               );

            let zoom = d3.zoom()
               // zoom constraints
               // .05: Zoom out to 5% of the original size
               // .5: Zoom in to .5 times the original size
               .scaleExtent([0.05, .5])
               .on("zoom", function (event) {
                  svg.attr("transform", event.transform);
               });

            var svg_zoom = d3
               .select(`${containerSelector} .taxonomy-panel svg`)
               .call(zoom)
               .on("dblclick.zoom", null);

            currentZoom = zoom;
            currentSvgZoom = svg_zoom;
            // Delaying initialZoomTransform until tree is dynamically aligned below.

            // Use d3 to generate the tree layout/structure.
            const treeLayout = d3.tree().size([availableHeight, availableWidth]);

            treeLayout(ds);

            // Update tree based on pagination option.
            if (isPaginationEnabled()) {
               initializePagination(ds, settings.pageSize);
            } else {
               clearPaginationState(ds);
            }

            const rootChildren = getNodeChildren(ds) || [];
            rootChildren.forEach(collapse);
            currentTreeRoot = ds;
            currentTreeUpdate = update;

            update(ds);

            // ================================================================================================
            //                                    DYNAMIC INITIAL ALIGNMENT
            // ================================================================================================
            // Get horizontal (y) and vertical (x) coordinates of the first column
            // Check both children and _children in case the node is collapsed.
            let realmDataY = ds.children ? ds.children[0].y : (ds._children ? ds._children[0].y : 0);
            let realmDataX = ds.children ? ds.children[0].x : (ds._children ? ds._children[0].x : 0);
            
            // Set initial scale factor (e.g. 0.19)
            let startScale = 0.19; 
            
            // Define how many pixels away from the left edge of the screen the Realm should sit
            let desiredLeftPadding = 20; 

            // Define exactly how many pixels from the top edge the first row to sit
            let desiredTopPadding = 50; 
            
            // Calculate translations
            let calculatedX = desiredLeftPadding - (realmDataY * startScale);
            let calculatedY = desiredTopPadding - (realmDataX * startScale);
            
            // Apply the exact calculation
            svg_zoom.call(
               zoom.transform,
               d3.zoomIdentity.translate(calculatedX, calculatedY).scale(startScale)
            );
            
            // Capture this as a starting baseline for font-resizing logic
            initialZoomTransform = d3.zoomTransform(svg_zoom.node());
            // ================================================================================================

            function update(source) {

               if (!source) {
                  console.error("in update and source is invalid");
                  return;
               }

               var info = treeLayout(ds);
               var parent = info.descendants();
               var currentNodeCount = parent.length;
               const fontScale = (currentFontSize || 4) / 4; // 4 is the default/min font size
               const scaleFactor = Math.min(1, settings.svg.height / 90);
               // const dx = 21 * scaleFactor;
               const dx = 21 * scaleFactor * fontScale;  // vertical spacing scales with font
               const dy = settings.svg.height / (currentNodeCount + 1);
               treeLayout.nodeSize([dx, dy]);
               var links = info.descendants().slice(1);
               const treeNodes = treeLayout(ds);
               treeNodes.each((d) => {
                  const x = d.x; // the x-coordinate of the node in the layout
                  const y = d.y; // the y-coordinate of the node in the layout
                  // use x and y to position the node in the visualization
               });

               // This overrides the positioning of the x and y coordinate from treeNodes.each((d).
               // The original developers did this to fit the ranks into the viewport (I think).
               // TODO: I do not like how it is using magic numbers, I may need to find a way to do this more dynamically based on users viewport. 
               // But for now, it works fine.
               parent.forEach(function (d) {
                  var h = settings.svg.height / 125;
                  var w = (settings.svg.width * 5) / rankCount;

                  let str = d.data.child_counts;

                  var result;
                  const regex = /(\d+)/;
                  if (typeof str === "string" && str.length > 0) {
                     if (str.includes("species")) {
                        result = str.replace(/, .*species|,.*$/, "");
                     } else {
                        result = str?.match(regex);
                     }
                  }
                  if (typeof result === "string" && result.length > 0) {
                     num = parseInt(result.match(/\d+/)[0]);
                  }
                  
                  // You can use Math.sqrt to minimize the space, if needed.
                  // d.x = d.x * h * Math.sqrt(fontScale);
                  // d.y = d.depth * w * Math.sqrt(fontScale);

                  d.x = d.x * h;                 // vertical position of nodes
                  d.y = d.depth * w * fontScale; // horizontal position of nodes
               });

               var children = svg.selectAll("g.node").data(parent, function (d) {
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
               Enter.append("circle")
                  .attr("class", "node")
                  .style("stroke", "black")
                  .style("stroke-width", `${settings.node.strokeWidth}px`)

                  // Make tree/root node invisible?
                  .style("opacity", function (d) {
                     return !d.data.parentDistance ? 0 : 1;
                  })
                  .style("pointer-events", function (d, i) {
                     return !d.data.parentDistance ? "none" : "all";
                  });

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
                  .attr("x", function (d, i) {
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
                  .attr("fill", function (d) {
                     return "#000000";
                  })

                  .attr("dx", settings.node.textDx)
                  .attr("dy", settings.node.textDy)
                  .call(getBB);

               Enter.insert("rect", "circle")
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
                     return isGhostNode(d) ? "transparent" : "white";
                  })
                  .attr("dx", settings.node.textDx)
                  .attr("dy", settings.node.textDy);

               var Update = Enter.merge(children);
               Update.transition()
                  .duration(settings.animationDuration)
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
                     if (this === clickedCircle) {
                        return "#006CB5";
                     } else if (this !== clickedCircle) {
                        return "white";
                     }

                     findParent(d);
                  })
                  .attr("cursor", "pointer")

               var font;

               Update.select("text.node-text")
                  .attr("cursor", "pointer")
                  .style("fill", function (d) {

                     // lrm 5-30-2024
                     // clicked text is the highlighted text
                     // clickedText is global varible assigned in the click function
                     if (this == clickedText) {
                        return "#006CB5";
                     } else {
                        return "#000000";
                     }
                  })
                  .style("font-size", fontSliderEl.property("value") + "rem");
               // Transform
               Update.select("text.legend-node-text")
                  .attr("transform", function (d, i) {
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
                     if (this == clickedText) {
                        return "#006CB5";
                     } else {
                        return "#000000";
                     }
                  })

               Update.select("text.pager-node-text")
                  .style("font-size", fontSliderEl.property("value") + "rem");

               updateTextRect(Update);

               var Exit = children
                  .exit()
                  .transition()
                  .duration(settings.animationDuration)
                  .attr("transform", function (d) {
                     return "translate(" + source.y + "," + source.x + ")";
                  })
                  .remove();

               Exit.select("circle").attr("r", 1);

               Exit.select("text").style("fill-opacity", 1);

               var link = svg.selectAll("path.link").data(links, function (d) {
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
                  .duration(settings.animationDuration)
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
                     if ((!d.children && !d._children) && d === selectedNode) {
                        return "#006CB5";
                     } else if (d._children) {
                        return "#808080";
                     } else if (d.children) {
                        return "#006CB5";
                     } else {
                        return "#808080";
                     }
                  });

               var linkExit = link
                  .exit()
                  .transition()
                  .duration(settings.animationDuration)
                  .attr("d", function (d) {
                     var pos = { x: source.x, y: source.y };
                     return diagonal(pos, pos);
                  })
                  .remove();

               parent.forEach(function (d) {
                  d.x0 = d.x;
                  d.y0 = d.y;
               });

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

               function findParent(par) {
                  if (par.depth < 2) {
                     return par.data.name;
                  } else {
                     return findParent(par.parent);
                  }
               }

               function findParentLinks(par) {
                  if (par.target.depth < 2) {
                     return par.target.name;
                  } else {
                     return findParent(par.target.parent);
                  }
               }

               function click(event, d) {
                  if (d.data.taxNodeID !== "legend") {
                     if (isPagerNode(d)) {
                        setNodePage(d.parent, d.page);
                        update(d.parent);
                        return;
                     }

                     selected = d.data.name;
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

                     update(d);
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

               // Tippy pop-up that shows the number of children under the "More..." pagination button
               window.tippy.delegate(`${containerSelector} svg`, {
                  allowHTML: true,
                  animation: settings.tooltip.animation,
                  appendTo: () => document.body,
                  delay: [0, 0],
                  onShow(instance) {
                     const d = instance.reference.__data__;
                     if (!d || !isPagerNode(d) || !d.parent || !d.parent.pagination || !d.parent.allChildren) {
                        return false;
                     }

                     const pagination = d.parent.pagination;
                     const total = d.parent.allChildren.length;
                     const pageStart = pagination.currentPage * pagination.itemCount;
                     const pageEnd = Math.min(pageStart + pagination.itemCount, total);
                     const onPage = pageEnd - pageStart;
                     const remaining = total - onPage;

                     instance.setContent(
                        `<div class="ictv-tax-viz-tooltip">${remaining} more taxa (${total} total)</div>`
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

   function collapse(d) {
      const children = getNodeChildren(d);
      if (!children) { return; }

      if (d.data.name === name && counter < len - 1) {
         counter++;
         name = res[counter];
         children.forEach(collapse);
         d.children = getVisibleChildren(d);
         d._children = null;
         return;
      }

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

      // Update the global pagination data.
      paginationData.childDisplayOrder = parseInt(displayOrder_);
      paginationData.parentTaxnodeID = parseInt(parentTaxNodeID_);

      // console.log(`in selectSearchResult: taxNodeId_ = ${taxNodeId_}, taxNodeIdLineage_ = ${taxNodeIdLineage_}, displayOrder_ = ${displayOrder_}`);

      // Select the specified release.
      releaseControlEl.value = releaseNumber_;
      releaseControlEl.dispatchEvent(new Event("change"));

      // Trigger a click on the clear button.
      const clearButtonEl = document.querySelector(".search-panel .clear-button");
      if (!clearButtonEl) { throw new Error("Invalid clear button element"); }

      clearButtonEl.dispatchEvent(new Event("click"));


      // dmd testing 070224
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

      async function expandPath(path) {
         if (!path || path.length < 2) { return; }

         for (let i = 1; i < path.length; i++) {
            const parentNode = path[i - 1];
            const currentNode = path[i];
            const pageChanged = setNodePageForChild(parentNode, currentNode);
            const expanded = expandNode(parentNode);

            if (pageChanged || expanded) {
               currentTreeUpdate(parentNode);

               panToNode(currentNode, settings.animationDuration);
               await wait(settings.animationDelay);
            }
         }
      }

      async function highlightNode(node) {
         if (!node || !node.data || !node.data.taxNodeID || !currentTreeUpdate) { return; }

         selectedNode = node;

         let selectedNodeEl = document.querySelector(`g[taxNodeID="${node.data.taxNodeID}"]`);
         clickedCircle = selectedNodeEl ? selectedNodeEl.querySelector("circle") : null;
         clickedText = selectedNodeEl ? selectedNodeEl.querySelector("text") : null;

         currentTreeUpdate(node);
         await wait(settings.animationDelay);

         document.querySelectorAll("text.node-text, text.unassigned-text").forEach((textElementReset) => {
            textElementReset.style.fill = "#000000";
         });

         document.querySelectorAll("circle").forEach((circleElementReset) => {
            circleElementReset.style.fill = "#FFFFFF";
         });

         selectedNodeEl = document.querySelector(`g[taxNodeID="${node.data.taxNodeID}"]`);
         const textToHighlight = selectedNodeEl ? selectedNodeEl.querySelector("text") : null;
         if (textToHighlight) {
            textToHighlight.style.fill = "#006CB5";
            clickedText = textToHighlight;
         }

         const circleToHighlight = selectedNodeEl ? selectedNodeEl.querySelector("circle") : null;
         if (circleToHighlight) {
            circleToHighlight.style.fill = "#006CB5";
            clickedCircle = circleToHighlight;
         }
      }

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

         await highlightNode(finalNode);

         // --- Trigger the final expand-to-fit centered view ---
         panToNode(finalNode, settings.animationDuration, true);

         paginationData.childDisplayOrder = NaN;
         paginationData.parentTaxnodeID = null;
      }

      setTimeout(openNodes, settings.animationDelay);
   }

};


function expandTreeToNode(data) {
   let node = traverseTreeToFindNode(ds, data);
   expandTree(node);
}


function traverseTreeToFindNode(currentNode, node) {
   if (currentNode.name === node) {
      return currentNode;
   }
   for (let i = 0; i < currentNode.children.length; i++) {
      let result = traverseTreeToFindNode(currentNode.children[i], node);
      if (result != null) {
         return result;
      }
   }
   return null;
}

async function wait(t) {
   return new Promise((resolve) => {
      setTimeout(resolve, t);
   })
}


