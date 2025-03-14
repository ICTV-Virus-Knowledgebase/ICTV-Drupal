
import { AppSettings } from "../../global/AppSettings";
import * as d3 from 'd3';
import { IRelease } from "./IRelease";
import { IReleases } from "./IReleases";
import { WebServiceKey } from "../../global/Types";


export class VisualBrowser {

   // Configuration settings
   config = {
      animation: {
         delay: 1100,
         fast: 250,
         slow: 2500
      },
      node: {
         columnWidth: NaN,
         defaultColumnWidth: 200,
         defaultVerticalDistance: 20,
         verticalDistance: NaN
      },
      svg: {
         margin: {
            top: 40,
            right: 0,
            bottom: 40,
            left: 40
         },
         width: 1000
      },
      url: {
         data: null,
         taxonDetailsPage: null,
         taxonomy: null
      },
      zoom: {
         scaleFactor: 0.19, //.17,
         translateX: 0, //-(jQuery(window).width() * 2.5), //-3850,
         translateY: 0 //-(jQuery(window).height() * 0.45), //-1800
      }
   }

   containerSelector: string = null;

   // The current (most-recent) MSL release
   currentRelease: IRelease = null;

   // The taxonomy data for the selected release.
   data;

   diagonal;

   elements: {
      container: HTMLElement,
      svg: SVGElement
   }

   gLegend;
   gLink;
   gNode;

   // Metadata for the MSL Releases.
   releases: IReleases = null;

   root;

   // The selected MSL release
   selectedRelease: IRelease = null;

   // The SVG node (a d3 Selection object)
   svg;

   tree;


   // C-tor
   constructor(containerSelector_: string, dataURL_: string) {

      if (!containerSelector_) { throw new Error("Invalid container selector parameter"); }
      this.containerSelector = containerSelector_;

      //this.config.release.currentNumber = AppSettings.currentMslRelease;
      //if (!this.config.release.currentNumber) { throw new Error("Invalid current release app settings"); }

      if (!dataURL_) { throw new Error("Invalid data URL parameter"); }
      this.config.url.data = dataURL_;

      this.config.url.taxonDetailsPage = AppSettings.taxonHistoryPage;
      if (!this.config.url.taxonDetailsPage) { throw new Error("Invalid taxon details app setting"); }
      
      // Populate the taxonomy web service
      const taxonomyEndPoint = AppSettings.webServiceLookup[WebServiceKey.taxonomy];
      this.config.url.taxonomy = `${AppSettings.baseWebServiceURL}${taxonomyEndPoint}`;

      this.elements = {
         container: null,
         svg: null
      }

      // Initialize the "diagonal" method.
      this.diagonal = d3.linkHorizontal().x(d => d[1]).y(d => d[0]);

      // Populate the current values with default values.
      this.config.node.columnWidth = this.config.node.defaultColumnWidth;
      this.config.node.verticalDistance = this.config.node.defaultVerticalDistance;
   }


   // Display the taxonomy tree for the release selected by the user.
   async displayTaxonomy(releaseYear_) {

      if (!releaseYear_) { throw new Error("Invalid release year in displayTaxonomy"); }

      // Get the release metadata for the selected year.
      this.selectedRelease = this.getRelease(releaseYear_);
      if (!this.selectedRelease) { throw new Error(`No data available for release year ${releaseYear_}`); }

      // If there's already an SVG element in the taxonomy panel, delete it.
      if (!!this.svg && !!this.svg.node()) { this.svg.node().remove(); }

      // Determine the filename for the taxonomy JSON file.
      const taxonomyFilename = `${this.config.url.data}/taxonomy_${releaseYear_}.json`;

      this.data = await d3.json(taxonomyFilename);
      if (!this.data) { throw new Error(`Invalid data for release year ${releaseYear_}`)}

      // Construct the tree root.
      this.root = d3.hierarchy(this.data);

      // The vertical distance between sibling nodes (yes, it's very weird to call it "dx").
      const dx = this.config.node.verticalDistance;

      // Compute the tree height: This approach will allow the height of the
      // SVG to scale according to the breadth (width) of the tree layout.
      const dy = this.config.svg.width / (this.root.height + 1);

      // Create a tree layout.
      this.tree = d3.cluster().nodeSize([dx, dy]);

      // Sort the tree and apply the layout.
      this.root.sort((a, b) => d3.ascending(a.data.name, b.data.name));
      this.tree(this.root);

      // Compute the extent of the tree. Note that x and y are swapped here
      // because in the tree layout, x is the breadth, but when displayed, the
      // tree extends right rather than down.
      let x0 = Infinity;
      let x1 = -x0;
      this.root.each(d => {
         if (d.x > x1) x1 = d.x;
         if (d.x < x0) x0 = d.x;
      });

      // Compute the adjusted height of the tree.
      const height = x1 - x0 + dx * 2;

      this.svg = d3.create("svg")
         .attr("width", this.config.svg.width)
         .attr("height", height)
         .attr("viewBox", [-dy / 3, x0 - dx, this.config.svg.width, height]);

      this.gLink = this.svg.append("g")
         .attr("class", "link-parent");

      this.gNode = this.svg.append("g")
         .attr("class", "node-parent");

      // Create a group element for the legend.
      this.gLegend = this.svg.append("g")
         .attr("class", "legend-parent");

      // Add rank names to the legend.
      this.selectedRelease.ranks.forEach((rank_: string, index_: number) => {
         this.gLegend.append("text")
            .attr("class", "legend-text")
            .attr("x", `${this.config.node.columnWidth * index_}px`)
            .text(rank_);
      })


      this.root.x0 = dy / 2;
      this.root.y0 = 0;
      this.root.descendants().forEach((d, i) => {
         d.id = i;
         d._children = d.children;

         // Initially, we will only display the root node and its immediate child nodes.
         if (d.depth > 0) { d.children = null; }
      });

      // Update the tree
      this.update(null, this.root);

      // Add the SVG to the container.
      this.elements.container.appendChild(this.svg.node());

/*
      // TODO: verify this code!!!
      let zoom = d3.zoom()
         // zoom constraints
         // .05: Zoom out to 5% of the original size
         // .5: Zoom in to .5 times the original size
         //.scaleExtent([0.05, .5])
         .on("zoom", event => {
            this.elements.svg.setAttribute("transform", event.transform);
         });

      const svgSelection = d3.select<HTMLElement, unknown>(`${this.containerSelector} .taxonomy-panel svg`)
      //svgSelection
         //.call(zoom)
         //.call((d) => zoom.transform(svgSelection, d3.zoomIdentity.translate(this.config.zoom.translateX, this.config.zoom.translateY).scale(this.config.zoom.scaleFactor)))
         //.call(zoom.translateBy, this.config.zoom.translateX, this.config.zoom.translateY)
         //.call(zoom.scaleBy, this.config.zoom.scaleFactor)
         //.on("dblclick.zoom", null);

      zoom.transform(svgSelection, d3.zoomIdentity.translate(this.config.zoom.translateX, this.config.zoom.translateY).scale(this.config.zoom.scaleFactor)); */
   }


   // Use the release year to lookup and return the corresponding release metadata.
   getRelease(releaseYear): IRelease {

      if (!releaseYear) { throw new Error("Invalid release year in getRelease (empty)"); }

      const release: IRelease = this.releases.data[`${releaseYear}`];
      if (!release) { throw new Error(`No release found for release year ${releaseYear}`); }

      return release;
   }


   // Initialize the visual browser.
   async initialize() {

      this.elements.container = document.querySelector(this.containerSelector);
      if (!this.elements.container) { throw new Error("Invalid container element"); }

      // Load the releases metadata from the releases JSON file.
      this.releases = await d3.json(`${this.config.url.data}/releases.json`)
      if (!this.releases) { throw new Error("Invalid releases JSON"); }

      // Get the current release year.
      const currentYear = this.releases.displayOrder[0];
      if (!currentYear) { throw new Error("Invalid current year in releases.json"); }

      // Get the current release.
      this.currentRelease = this.getRelease(currentYear);
      if (!this.currentRelease) { throw new Error('Invalid current release metadata'); }

      // Create the SVG and tree.
      await this.displayTaxonomy(currentYear);
   }


   // Update the tree
   update(event, source) {
         
      // Hold the alt key to slow down the transition.
      const duration = event?.altKey ? this.config.animation.slow : this.config.animation.fast; 

      const nodes = this.root.descendants().reverse();
      const links = this.root.links();

      // Compute the new tree layout.
      this.tree(this.root);

      let left = this.root;
      let right = this.root;

      this.root.eachBefore(node => {
         if (node.x < left.x) left = node;
         if (node.x > right.x) right = node;
      });

      const height = right.x - left.x + this.config.svg.margin.top + this.config.svg.margin.bottom;

      const transition = this.svg.transition()
         .duration(duration)
         .attr("height", height)
         .attr("viewBox", [- this.config.svg.margin.left, left.x - this.config.svg.margin.top, this.config.svg.width, height]) // Note: viewbox is [min-x, min-y, width, height]
         .tween("resize", window.ResizeObserver ? null : () => () => this.svg.dispatch("toggle"));

      // Update the node IDs.
      const node = this.gNode.selectAll("g")
         .data(nodes, d => d.id);

      // Enter any new nodes at the parent's previous position.
      const nodeEnter = node.enter().append("g")
         .attr("transform", `translate(${source.y0},${source.x0})`)
         .attr("class", "node")
         .attr("taxNodeID", d => d.data.taxNodeID)
         .on("click", (event, d) => {
            d.children = d.children ? null : d._children;
            this.update(event, d);
         });

      nodeEnter.append("circle")
         .attr("class", "node-circle")
         .attr("r", 5);
         
      nodeEnter.insert("text")
         .attr("class", "node-text-bg")
         .attr("dy", "0.31em")
         .attr("text-anchor", "start")
         .attr("x", "0.5rem")
         .text(d => d.data.name);

      nodeEnter.append("text")
         .attr("class", "node-text")
         .attr("dy", "0.31em")
         .attr("stroke-linejoin", "round")
         .attr("text-anchor", "start")
         .attr("x", "0.5rem")
         .text(d => d.data.name);

      
      // Transition nodes to their new position.
      const nodeUpdate = node.merge(nodeEnter).transition(transition)
         .attr("transform", d => {
            const dy = this.config.node.columnWidth * d.data.level;
            return `translate(${dy},${d.x})`;
         })
         .attr("fill-opacity", 1)
         .attr("stroke-opacity", 1);

      // Transition exiting nodes to the parent's new position.
      const nodeExit = node.exit().transition(transition).remove()
         .attr("transform", `translate(${source.y0},${source.x0})`)
         .attr("fill-opacity", 0)
         .attr("stroke-opacity", 0);

      // Update the links…
      const link = this.gLink.selectAll("path")
         .data(links, d => d.target.id);

      // Enter any new links at the parent's previous position.
      const linkEnter = link.enter().append("path")
         .attr("d", d => {

            // Use the node's level attribute to calculate the Y coordinate (which is actually the X coordinate...).
            const sourceY = this.config.node.columnWidth * d.source.data.level;
            const targetY = this.config.node.columnWidth * d.target.data.level;

            return this.diagonal({ source: [d.source.x, sourceY], target: [d.target.x, targetY]});
         });

      // Transition links to their new position.
      link.merge(linkEnter).transition(transition)
         .attr("d", d => {

            // Use the node's level attribute to calculate the Y coordinate (which is actually the X coordinate...).
            const sourceY = this.config.node.columnWidth * d.source.data.level;
            const targetY = this.config.node.columnWidth * d.target.data.level;

            return this.diagonal({ source: [d.source.x, sourceY], target: [d.target.x, targetY]});
         });

      // Transition exiting nodes to the parent's new position.
      link.exit().transition(transition).remove()
         .attr("d", this.diagonal({source: [source.x, source.y], target: [source.x, source.y]}));
      
      // Stash the old positions for transition.
      this.root.eachBefore(d => {
         d.x0 = d.x;
         d.y0 = d.y;
      });

      this.gLegend.selectAll(".legend-text")
         .attr("transform", (d, i) => {
            console.log("d = ", d, ", i = ", i);
            return `matrix(1,0,0,1, 0, 0)`;
         });


      /*
      // Testing: tranform the legend to the top of the SVG.
      const legendTextEls: NodeListOf<SVGGElement> = this.svg.node().querySelectorAll(".legend-text");
      if (!legendTextEls) { throw new Error("Invalid legend text elements"); }

      legendTextEls.forEach((el: SVGGElement, index: number) => {

         //const m = el.getCTM();
         //const ctm = el.getScreenCTM();
         const bbox = el.getBoundingClientRect();

         console.log(`Text #${index}:`)
         //console.log(`Absolute SVG Position: (${ctm.e}, ${ctm.f})`);
         //console.log(`Local SVG Position: (${m.e}, ${m.f})`);
         console.log(`Screen Coordinates: (${bbox.x}, ${bbox.y})`);
         console.log("----")

         //el.setAttribute("transform-origin", `0 0`);
         el.setAttribute("transform", `translate(0, ${-bbox.y})`);
      })*/

   }



}