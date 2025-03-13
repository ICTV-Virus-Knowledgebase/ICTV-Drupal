
import * as d3 from 'd3';



export class VisualBrowser {


   config = {
      marginBottom: 10,
      marginLeft: 40,
      marginRight: 10,
      marginTop: 10,
      nodeColumnWidth: 200,
      transition: {
         fast: 250,
         slow: 2500
      },
      width: 928
   }

   containerSelector: string = null;

   data;
   diagonal;
   gLink;
   gNode;
   root;
   svg;
   tree;


   // C-tor
   constructor(containerSelector_: string) {

      this.containerSelector = containerSelector_;

      this.diagonal = d3.linkHorizontal().x(d => d[1]).y(d => d[0]);
   }


   async buildTree() {

      // Compute the tree height; this approach will allow the height of the
      // SVG to scale according to the breadth (width) of the tree layout.
      this.root = d3.hierarchy(this.data);
      const dx = 10;
      const dy = this.config.width / (this.root.height + 1);

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
         .attr("width", this.config.width)
         .attr("height", height)
         .attr("viewBox", [-dy / 3, x0 - dx, this.config.width, height])
         .attr("style", "max-width: 100%; height: auto; font: 10px sans-serif;");

      this.gLink = this.svg.append("g")
         .attr("fill", "none")
         .attr("stroke", "#555")
         .attr("stroke-opacity", 0.4)
         .attr("stroke-width", 1.5);

      this.gNode = this.svg.append("g")
         .attr("cursor", "pointer")
         .attr("pointer-events", "all");


      // Do the first update to the initial configuration of the tree — where a number of nodes
      // are open (arbitrarily selected as the root, plus nodes with 7 letters).
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

      return this.svg.node();
   }


   async initialize() {

      let containerEl = document.querySelector(this.containerSelector);

      this.data = await d3.json("../data/d3Cluster_mini.json");

      const svgNode = await this.buildTree();

      containerEl.appendChild(svgNode);
   }


   // Update the tree
   update(event, source) {
         
      // Hold the alt key to slow down the transition.
      const duration = event?.altKey ? this.config.transition.slow : this.config.transition.fast; 

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

      const height = right.x - left.x + this.config.marginTop + this.config.marginBottom;

      const transition = this.svg.transition()
         .duration(duration)
         .attr("height", height)
         .attr("viewBox", [- this.config.marginLeft, left.x - this.config.marginTop, this.config.width, height])
         .tween("resize", window.ResizeObserver ? null : () => () => this.svg.dispatch("toggle"));

      // Update the nodes…
      const node = this.gNode.selectAll("g")
         .data(nodes, d => d.id);


      // Enter any new nodes at the parent's previous position.
      const nodeEnter = node.enter().append("g")
         .attr("transform", `translate(${source.y0},${source.x0})`)
         .attr("fill-opacity", 0)
         .attr("stroke-opacity", 0)
         .on("click", (event, d) => {
            d.children = d.children ? null : d._children;
            this.update(event, d);
         });

      nodeEnter.append("circle")
         .attr("r", 2.5)
         .attr("fill", "#555")
         //.attr("fill", d => d._children ? "#555" : "#999")
         .attr("stroke-width", 10);

      nodeEnter.append("text")
         .attr("dy", "0.31em")
         .attr("x", -6)
         //.attr("x", d => d._children ? -6 : 6)
         .attr("text-anchor", "end")
         //.attr("text-anchor", d => d._children ? "end" : "start")
         .text(d => d.data.name)
         .attr("stroke-linejoin", "round")
         .attr("stroke-width", 3)
         .attr("stroke", "white")
         .attr("paint-order", "stroke");

      // Transition nodes to their new position.
      const nodeUpdate = node.merge(nodeEnter).transition(transition)
         .attr("transform", d => {
            const dy = this.config.nodeColumnWidth * d.data.level;
            return `translate(${dy},${d.x})`;
         })
         .attr("fill-opacity", 1)
         .attr("stroke-opacity", 1);

      // Transition exiting nodes to the parent's new position.
      const nodeExit = node.exit().transition(transition).remove()
         .attr("transform", d => `translate(${source.y},${source.x})`)
         .attr("fill-opacity", 0)
         .attr("stroke-opacity", 0);

      // Update the links…
      const link = this.gLink.selectAll("path")
         .data(links, d => d.target.id);

      
      // Enter any new links at the parent's previous position.
      const linkEnter = link.enter().append("path")
         .attr("d", d => {

            // Use the node's level attribute to calculate the Y coordinate (which is actually the X coordinate...).
            const sourceY = this.config.nodeColumnWidth * d.source.data.level;
            const targetY = this.config.nodeColumnWidth * d.target.data.level;

            return this.diagonal({ source: [d.source.x, sourceY], target: [d.target.x, targetY]});
         });

      // Transition links to their new position.
      link.merge(linkEnter).transition(transition)
         .attr("d", d => {

            // Use the node's level attribute to calculate the Y coordinate (which is actually the X coordinate...).
            const sourceY = this.config.nodeColumnWidth * d.source.data.level;
            const targetY = this.config.nodeColumnWidth * d.target.data.level;

            return this.diagonal({ source: [d.source.x, sourceY], target: [d.target.x, targetY]});
         });

      // Transition exiting nodes to the parent's new position.
      link.exit().transition(transition).remove()
         .attr("d", this.diagonal({source: [source.y, source.x], target: [source.y, source.x]}));
      
      // Stash the old positions for transition.
      this.root.eachBefore(d => {
         d.x0 = d.x;
         d.y0 = d.y;
      });
   }



}