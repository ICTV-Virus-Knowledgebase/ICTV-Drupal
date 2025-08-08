
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
      copyUrlButton: HTMLButtonElement,
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
         copyUrlButton: null,
         sequencePanel: null
      }
   }


   createHitHTML(hit_: IBlastHit, hitIndex_: number): string {

      // Format the hit's lineage.
      const lineage = this.formatLineage(hit_);

      // Create a taxon details URL for this virus.
      const hitURL = CreateTaxonDetailsURL(hit_.ictv_id, hit_.sseqid_lineage.species);

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

      let ictvIdHTML = "";
      let ictvID = Utils.safeTrim(hit_.ictv_id);
      if (ictvID.length > 0) {

         let taxonName = "";
         if (hit_.sseqid_lineage && hit_.sseqid_lineage.species) { taxonName = `&taxon_name=${hit_.sseqid_lineage.species}`; }

         ictvIdHTML = `<tr class="blast-row">
            <th>ICTV ID</label>
            <td class="value"><a href="${AppSettings.taxonHistoryPage}?ictv_id=${ictvID}${taxonName}" target="_blank">${ictvID}</a></td>
         </tr>`
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
                     ${ictvIdHTML}
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

      // Use this filename for the CSV file.
      const csvName = `${sequence.qseqid.replace(" ", "_")}.csv`;

      this.elements.container.innerHTML = 
         `<div class="sequence-panel">
            <div class="label">Sequence:</div>
            <div class="name">${sequence.qseqid}</div>
            <div class="controls">
               <button class="btn btn-default ${ButtonClass.viewHTML} has-tooltip"
                  data-filename="${sequence.blast_html}"
                  data-tippy-content="Click to view the results as HTML in a new tab"
                  data-title="${sequence.qseqid}"
               >${Icon.html} View HTML results</button>
               <button class="btn btn-default ${ButtonClass.downloadCSV} has-tooltip"
                  data-filename="${sequence.blast_csv}"
                  data-tippy-content="Click to download the results as a CSV file"
                  data-title="${csvName}"
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
         return await this.parent.handleClickEvent(this.elements.container, event_.target as HTMLElement);
      });

      // Get a reference to the sequence panel element.
      this.elements.sequencePanel = this.elements.container.querySelector(".sequence-panel");
      if (!this.elements.sequencePanel) { throw new Error("Invalid sequence panel DOM element"); }

      // Handle clicks in the sequence panel.
      this.elements.sequencePanel.addEventListener("click", async (event_) => {
         return await this.parent.handleClickEvent(this.elements.container, event_.target as HTMLElement);
      });

      // Get the copy URL button
      this.elements.copyUrlButton = this.elements.container.querySelector(`.${ButtonClass.copyURL}`);
      if (!this.elements.copyUrlButton) { throw new Error("Invalid copy URL button element"); }

      // Add a click handler to the copy URL button.
      this.elements.copyUrlButton.addEventListener("click", async () => {
         return await this.parent.copyJobURL();
      });
   }

   unload() {
      this.isActive = false;
      this.elements.container.classList.remove("active");

      // TODO: should we remove event listeners?
   }


}