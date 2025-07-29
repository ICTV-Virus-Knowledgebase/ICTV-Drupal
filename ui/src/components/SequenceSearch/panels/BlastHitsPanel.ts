
import { AlertBuilder } from "../../../helpers/AlertBuilder";
import { AppSettings } from "../../../global/AppSettings";
import { ButtonClass, CreateTaxonDetailsURL, Icon, ToggleAccordion } from "../Common";
import { IBlastHit } from "../IBlastHit";
import { ISeqSearchPanel } from "./ISeqSearchPanel";
import { SequenceSearch } from "../SequenceSearch";
import tippy from "tippy.js";
import { Utils } from "../../../helpers/Utils";


export class BlastHitsPanel implements ISeqSearchPanel {

   // DOM elements
   elements: {
      blastHits: HTMLElement,
      container: HTMLElement,
      sequencePanel: HTMLElement
   }

   // Is the panel currently active/displayed?
   isActive: boolean;

   // The parent page
   parent: SequenceSearch = null;


   // C-tor
   constructor(containerEl_: HTMLElement, parent_: SequenceSearch) {

      if (!containerEl_) { throw new Error("Invalid container element"); }

      if (!parent_) { throw new Error("Invalid parent parameter"); }
      this.parent = parent_;

      this.elements = {
         blastHits: null,
         container: containerEl_,
         sequencePanel: null
      }
   }


   createHitHTML(hit_: IBlastHit, hitIndex_: number): string {

      // Format the hit's lineage.
      const lineage = this.formatLineage(hit_);

      // Create a taxon details URL for this virus.
      const hitURL = CreateTaxonDetailsURL(hit_.ICTV_ID, hit_.sseqid_lineage.species);

      // Create the link using the taxon details URL.
      const linkedHitName = `<a href="${hitURL}" target="_blank">${hit_.sseqid_lineage.species}</a>`;

      // Create a GenBank link using the accession.
      let sseqAccessionLink = Utils.createGenBankAccessionLink(hit_.sseqid_accession);
      
      // Is this an exemplar or an additional isolate?
      let exemplarOrAdditional = hit_.exemplar_additional === "E" ? "Exemplar" : "Additional";

      let virusNames = Utils.safeTrim(hit_.virus_names);
      if (virusNames.length < 1) { virusNames = "unknown"; }

      let segment = Utils.safeTrim(hit_.segmentname);
      if (segment.length > 0) { segment = `<span class="segment-name"> segment ${segment}</span>`; }

      let startAndEnd = "";
      if (hit_.start_loc !== null && !isNaN(hit_.start_loc) && hit_.end_loc !== null && !isNaN(hit_.end_loc)) { 
         startAndEnd = `<tr class="blast-row">
            <th>Start location</th>
            <td class="value">${hit_.start_loc}</td>
         </tr>
         <tr class="blast-row">
            <th>End location</th>
            <td class="value">${hit_.end_loc}</td>
         </tr>`;
      }

      let isolateHTML = "";
      let isolateID = Utils.safeTrim(hit_.isolate_id);
      if (isolateID.length > 0) {
         isolateHTML = `<tr class="blast-row">
            <th>Isolate ID</th>
            <td class="value"><a href="${AppSettings.taxonHistoryPage}?vmr_id=${hit_.isolate_id}" target="_blank">${hit_.isolate_id}</a></td>
         </tr>`;
      }

      let eValue = "0";

      if (hit_.evalue > 0) {

         // Format to exponential with 3 decimals
         const exponential = hit_.evalue.toExponential(3); // "7.050e-140"

         // Split into parts
         const [coefficient, exponent] = exponential.split('e');

         // Format the final HTML string
         eValue = `${coefficient}×10<sup>${exponent}</sup>`;
      }
      
      // fa fa-chevron-down ictv-accordion-control-icon
      let html =
         `<div class="ictv-accordion-item" data-id="${hitIndex_}">
            <div class="ictv-accordion-header">
               <div class="ictv-accordion-control" data-id="${hitIndex_}">${Icon.chevronDown}</div>
               <div class="ictv-accordion-label">
                  <div class="result-index">#${hitIndex_ + 1}</div>
                  <div class="lineage-and-result">
                     <div class="lineage">${lineage}</div>
                     <div class="result">
                        <div class="result-name"><b>Species</b>: <i>${linkedHitName}</i>${segment}</div>
                        <div class="result-note">${exemplarOrAdditional} virus: ${virusNames} (${sseqAccessionLink})</div>
                     </div>
                  </div>
               </div>
            </div>
            <div class="ictv-accordion-body" data-id="${hitIndex_}">
               <div class="ictv-accordion-content">
                  <table class="blast-hit">
                     <tr class="blast-row">
                        <th>Query ID</th>
                        <td class="value">${hit_.qseqid}</td>
                     </tr>
                     <tr class="blast-row">
                        <th>Subject ID</th>
                        <td class="value">${hit_.sseqid}</td>
                     </tr>
                     <tr class="blast-row">
                        <th>Subject accession</th>
                        <td class="value">${sseqAccessionLink}</td>
                     </tr>
                     <tr class="blast-row">
                        <th>E-value</th>
                        <td class="value">${eValue}</td>
                     </tr>
                     <tr class="blast-row">
                        <th>Bitscore</th>
                        <td class="value">${hit_.bitscore}</td>
                     </tr>
                     ${startAndEnd}
                     <tr class="blast-row">
                        <th>ICTV ID</label>
                        <td class="value"><a href="${AppSettings.taxonHistoryPage}?ictv_id=${hit_.ICTV_ID}" target="_blank">${hit_.ICTV_ID}</a></td>
                     </tr>
                     ${isolateHTML}
                  </table>
               </div>
            </div>
         </div>`;

      return html;
   }

   displayErrorMessage(message_: string) {
      this.elements.container.innerHTML = `<div class="error-message">${message_}</div>`;
      return;
   }

   // Format the lineage of the BLAST hit.
   formatLineage(blastHit_: IBlastHit) {

      let html = "";
      
      let family = Utils.safeTrim(blastHit_.sseqid_lineage.family);
      let subfamily = Utils.safeTrim(blastHit_.sseqid_lineage.subfamily);
      let genus = Utils.safeTrim(blastHit_.sseqid_lineage.genus);
      let subgenus = Utils.safeTrim(blastHit_.sseqid_lineage.subgenus);

      if (family.length > 0) {
         html += `<span class="result-lineage">Family: <i>${family}</i></span>`;
      }
      if (subfamily.length > 0) {
         if (html.length > 0) { html += Icon.lineageDelimiter; }
         html += `<span class="result-lineage">Subfamily: <i>${subfamily}</i></span>`;
      }
      if (genus.length > 0) {
         if (html.length > 0) { html += Icon.lineageDelimiter; }
         html += `<span class="result-lineage">Genus: <i>${genus}</i></span>`;
      }
      if (subgenus.length > 0) {
         if (html.length > 0) { html += Icon.lineageDelimiter; }
         html += `<span class="result-lineage">Subgenus: <i>${subgenus}</i></span>`;
      }

      return html;
   }

   load() {

      console.log("in blastPanel.load")
            
      this.isActive = true;

      // Make the container visible.
      this.elements.container.classList.add("active");

      // Validate the state
      if (isNaN(this.parent.state.fileIndex) || isNaN(this.parent.state.sequenceIndex)) { return this.displayErrorMessage("The panel state is invalid"); }
      
      // Validate the job and ensure that it has files.
      if (!this.parent.job || !this.parent.job.data || 
         !Array.isArray(this.parent.job.data.files) || this.parent.job.data.files.length < 1 ||
         this.parent.job.data.files.length < this.parent.state.fileIndex + 1) {

         return this.displayErrorMessage("The specified job is invalid");
      }

      // Get the specified file.
      const file = this.parent.job.data.files[this.parent.state.fileIndex];
      if (!file) { return this.displayErrorMessage("The specified input file is invalid"); }

      // Validate the specified sequence.
      if (!Array.isArray(file.sequences) || file.sequences.length < 1 || file.sequences.length < this.parent.state.sequenceIndex + 1) { 
         return this.displayErrorMessage("The specified sequence is invalid"); 
      }

      // Get the sequence.
      const sequence = file.sequences[this.parent.state.sequenceIndex];
      if (!sequence) { return this.displayErrorMessage("The specified sequence is invalid"); }

      let hitsHTML = "";

      // Generate HTML for the hits.
      sequence.hits.forEach((hit_: IBlastHit, hitIndex_: number) => {
         hitsHTML += this.createHitHTML(hit_, hitIndex_);
      })

      const sequenceURL = this.parent.createUrlUsingState();

      this.elements.container.innerHTML = 
         `<div class="sequence-panel">
            <div class="label">Sequence:</div>
            <div class="name">${sequence.qseqid}</div>
            <div class="controls">
               <button class="btn btn-default ${ButtonClass.viewHTML} has-tooltip" 
                  data-file-index="${this.parent.state.fileIndex}"
                  data-filename="${file.name}"
                  data-seq-index="${this.parent.state.sequenceIndex}" 
                  data-tippy-content="Click to view the results as HTML"
               >${Icon.html} View HTML results</button>
               <button class="btn btn-default ${ButtonClass.downloadCSV} has-tooltip" 
                  data-file-index="${this.parent.state.fileIndex}"
                  data-filename="${file.name}"
                  data-seq-index="${this.parent.state.sequenceIndex}" 
                  data-tippy-content="Click to download the results as a CSV file"
               >${Icon.csv} Download CSV results</button>
            </div>
         </div>
         <div class="link-panel">
            <div class="instructions">You can view this sequence's BLAST hits again using the following URL:</div>
            <div class="controls">
               <a href="${sequenceURL}" target="_blank">${sequenceURL}</a> 
               <button class="btn ${ButtonClass.copyURL}">${Icon.copy} Copy to clipboard</button>
            </div>
         </div>
         <div class="blast-hits-title">BLAST Hits</div>
         <div class="blast-hits">${hitsHTML}</div>`;

      // Initialize tippy tooltips for buttons.
      tippy(".has-tooltip");

      // Get a reference to the BLAST hits element.
      this.elements.blastHits = this.elements.container.querySelector(".blast-hits");
      if (!this.elements.blastHits) { throw new Error("Invalid blast hits DOM element"); }

      // Add a click event handler.
      this.elements.blastHits.addEventListener("click", async (event_) => {
         await this.handleClickEvent(event_.target as HTMLElement);
      });

      // Get a reference to the sequence panel element.
      this.elements.sequencePanel = this.elements.container.querySelector(".sequence-panel");
      if (!this.elements.sequencePanel) { throw new Error("Invalid sequence panel DOM element"); }

      // Add a click event handler.
      this.elements.sequencePanel.addEventListener("click", async (event_) => {
         return await this.handleClickEvent(event_.target as HTMLElement);
      });
   }

   // Handle a click event on a page element.
   async handleClickEvent(targetEl_: HTMLElement) {

      // If an icon was clicked, use its parent Element.
      if (targetEl_.tagName === "I") { targetEl_ = targetEl_.parentElement; }

      // Was a button on a sequence row clicked?
      if (targetEl_.tagName === "BUTTON") {

         const button = targetEl_ as HTMLButtonElement;
         
         // Get and validate the file index attribute.
         let strFileIndex = Utils.safeTrim(button.getAttribute("data-file-index"));
         const fileIndex = parseInt(strFileIndex);
         if (isNaN(fileIndex)) { return await AlertBuilder.displayError("The file index attribute is invalid"); }
   
         // Get and validate the filename attribute.
         const filename = Utils.safeTrim(button.getAttribute("data-filename"));
         if (filename.length < 1) { return await AlertBuilder.displayError("The filename attribute is invalid"); }

         // Get and validate the sequence index attribute.
         let strSeqIndex = button.getAttribute("data-seq-index");
         const seqIndex = parseInt(strSeqIndex);
         if (isNaN(seqIndex)) { return await AlertBuilder.displayError(`Invalid sequence index: ${seqIndex}`); }

         // The button's class determines which action to take.
         if (button.classList.contains(ButtonClass.viewHits)) {

            this.parent.state.fileIndex = fileIndex;
            this.parent.state.sequenceIndex = seqIndex;
            
            window.open(this.parent.createUrlUsingState(), "_blank");

         } else if (button.classList.contains(ButtonClass.downloadCSV)) {
            
            // Download the CSV file.
            await this.parent.downloadCSV(filename, seqIndex);

         } else if (button.classList.contains(ButtonClass.viewHTML)) {
            
            // Display the HTML file in a new browser tab.
            await this.parent.viewHTML(fileIndex, filename, seqIndex);
         }

         return;
      }

      // Was an accordion control clicked?
      if (targetEl_.classList.contains("ictv-accordion-control")) {

         const itemID = targetEl_.getAttribute("data-id");
         if (!itemID) { return; }

         ToggleAccordion(this.elements.container, itemID);
      }
      
      return;
   }

   unload() {

      console.log("unloading BLAST hits panel")

      this.isActive = false;
      this.elements.container.classList.remove("active");
   }


}