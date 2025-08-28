
import { AlertBuilder } from "../../../helpers/AlertBuilder";
import { AppSettings } from "../../../global/AppSettings";
import { ButtonClass, Constants, CreateTaxonDetailsURL, Icon, PanelKey } from "../Common";
import { IBlastHit } from "../IBlastHit";
import { ISeqSearchPanel } from "./ISeqSearchPanel";
import { SequenceSearch } from "../SequenceSearch";
import tippy from "tippy.js";
import { Utils } from "../../../helpers/Utils";
import { link } from "d3";


export class BlastHitsPanel implements ISeqSearchPanel {

   // DOM elements
   elements: {
      blastHits: HTMLElement,
      container: HTMLElement,
      panelControls: HTMLElement,
      panelTitle: HTMLElement
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
         panelControls: null,
         panelTitle: null
      }
   }


   // Create HTML for a BLAST hit.
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



      let ictvIdHTML = "";
      let ictvID = Utils.safeTrim(hit_.ictv_id);
      if (ictvID.length > 0) {

         let taxonName = "";
         if (hit_.sseqid_lineage && hit_.sseqid_lineage.species) { taxonName = `&taxon_name=${hit_.sseqid_lineage.species}`; }

         ictvIdHTML = `<div class="identifier">
            <label>ICTV ID:</label>
            <span class="value"><a href="${AppSettings.taxonHistoryPage}?ictv_id=${ictvID}${taxonName}" target="_blank">${ictvID}</a></span>
         </div>`
      }

      let isolateHTML = "";
      let isolateID = Utils.safeTrim(hit_.isolate_id);
      if (isolateID.length > 0) {
         isolateHTML = `<div class="identifier">
            <label>Isolate ID:</label>
            <span class="value"><a href="${AppSettings.taxonHistoryPage}?vmr_id=${hit_.isolate_id}" target="_blank">${hit_.isolate_id}</a></span>
         </div>`;
      }

      let identifierRow = "";
      if (ictvIdHTML.length > 0 || isolateHTML.length > 0) {
         identifierRow = `<div class="identifier-row">${ictvIdHTML}${isolateHTML}</div>`;
      }

      /*
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
      */

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
      `<div class="blast-hit-tile">
         <div class="result-index">#${hitIndex_ + 1}</div>
         <div class="lineage-and-result">
            <div class="lineage">${lineage}</div>
            <div class="result">
               <div class="result-name"><b>Species</b>: <i>${linkedHitName}</i>${segment}</div>
               <div class="result-note">${exemplarOrAdditional} virus: ${virusNames} (${sseqAccessionLink})</div>
            </div>
            ${identifierRow}
         </div>
         <table class="blast-data">
            <tr>
               <th>Bitscore</th>
               <th>E-value</th>
               <th>Query ID</th>
               <th>Subject ID</th>
            </tr>
            <tr>
               <td>${hit_.bitscore}</td>
               <td>${eValue}</td>
               <td>${hit_.qseqid}</td>
               <td>${hit_.sseqid}</td>
            </tr>
         </table>
      </div>`;

      /*
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
                  <div class="bitscore">
                     <div class="bitscore-label">Bitscore</div>
                     <div class="bitscore-value">${hit_.bitscore}</div>
                  </div>
                  <div class="evalue">
                     <div class="evalue-label">E-value</div>
                     <div class="evalue-value">${eValue}</div>
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
         </div>`;*/

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

      // Use this filename for the CSV file.
      const csvName = `${sequence.qseqid.replace(" ", "_")}.csv`;

      // Create a URL for the job details/results page.
      const jobDetailsURL = this.parent.createUrlUsingState(PanelKey.jobDetails);

      // Create the link panel HTML containing a link to this job's details.
      const linkPanelHTML = this.parent.createLinkPanel(PanelKey.blastHits);

      // Create the panel's HTML.
      this.elements.container.innerHTML = 
         `<div class="panel-title">BLAST hits for sequence ${sequence.qseqid}</div>
         <div class="panel-controls">
            ${linkPanelHTML}
            <div class="sequence-controls">
               <button class="btn btn-generic ${ButtonClass.viewHTML} has-tooltip"
                  data-filename="${sequence.blast_html}"
                  data-tippy-content="View the alignments in a new tab"
                  data-title="${sequence.qseqid}"
               >${Icon.html} View alignments</button>

               <button class="btn btn-generic ${ButtonClass.downloadCSV} has-tooltip"
                  data-filename="${sequence.blast_csv}"
                  data-tippy-content="Download the BLAST hits as a CSV file"
                  data-title="${csvName}"
               >${Icon.csv} Download results as CSV</button>

               <button class="btn btn-generic ${ButtonClass.back} has-tooltip"
                  data-tippy-content="Return to the ${Constants.APPLICATION_NAME} results page"
                  data-url="${jobDetailsURL}"
               >${Icon.back} Return to search results</button>

               <button class="btn ${ButtonClass.newSearch} has-tooltip"
                  data-tippy-content="Use ${Constants.APPLICATION_NAME} again with different FASTA files"
                  data-url="${this.parent.createUrlUsingState(PanelKey.upload)}"
               >${Icon.search} New search</button>
            </div>
         </div>
         <div class="blast-hits">${hitsHTML}</div>`;

      // Initialize tippy tooltips for buttons.
      tippy(".has-tooltip");

      // Get a reference to the BLAST hits element.
      this.elements.blastHits = this.elements.container.querySelector(".blast-hits");
      if (!this.elements.blastHits) { throw new Error("Invalid blast hits DOM element"); }

      // Add a click event handler.
      this.elements.blastHits.addEventListener("click", async (event_) => {
         return await this.parent.handleClickEvent(this.elements.container, event_.target as HTMLElement);
      })

      // Get a reference to the panel controls element.
      this.elements.panelControls = this.elements.container.querySelector(".panel-controls");
      if (!this.elements.panelControls) { throw new Error("Invalid panel controls DOM element"); }

      // Handle clicks in the panel controls.
      this.elements.panelControls.addEventListener("click", async (event_) => {
         return await this.parent.handleClickEvent(this.elements.container, event_.target as HTMLElement);
      })
   }

   unload() {
      this.isActive = false;
      this.elements.container.classList.remove("active");

      // TODO: should we remove event listeners?
   }


}