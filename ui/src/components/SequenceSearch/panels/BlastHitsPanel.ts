
import { AlertBuilder } from "../../../helpers/AlertBuilder";
import { AppSettings } from "../../../global/AppSettings";
import { CreateTaxonDetailsURL, Icon } from "../Common";
import { IBlastHit } from "../IBlastHit";
import { ISeqSearchPanel } from "./ISeqSearchPanel";
import { SequenceSearch } from "../SequenceSearch";
import { Utils } from "../../../helpers/Utils";


export class BlastHitsPanel implements ISeqSearchPanel {

   // DOM elements
   elements: {
      blastHits: HTMLElement,
      container: HTMLElement
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
         container: containerEl_
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
      
      let html =
         `<div class="ictv-accordion-item" data-id="${hitIndex_}">
            <div class="ictv-accordion-header">
               <div class="ictv-accordion-control" data-id="${hitIndex_}">
                  <i class="fa fa-chevron-down ictv-accordion-control-icon"></i>
               </div>
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

      let hitsCount = sequence.hits.length;
      let hitsHTML = "";

      // Generate HTML for the hits.
      sequence.hits.forEach((hit_: IBlastHit, hitIndex_: number) => {
         hitsHTML += this.createHitHTML(hit_, hitIndex_);
      })

      this.elements.container.innerHTML = 
         `<div class="blast-hits-title">BLAST hits for ${sequence.qseqid}</div>
         <div class="blast-hits">${hitsHTML}</div>`;

      this.elements.blastHits = this.elements.container.querySelector(".blast-hits");
      if (!this.elements.blastHits) { throw new Error("Invalid blast hits DOM element"); }

      this.elements.blastHits.addEventListener("click", (event_) => {

         let targetEl = event_.target as HTMLElement;

         // If the chevron icon was clicked, use its parent Element.
         if (targetEl.classList.contains("ictv-accordion-control-icon")) { targetEl = targetEl.parentElement; }

         if (targetEl.classList.contains("ictv-accordion-control")) {

            const itemID = targetEl.getAttribute("data-id");
            if (!itemID) { return; }
            
            event_.preventDefault();
            event_.stopPropagation();

            const accordionItemEl = this.elements.blastHits.querySelector(`.ictv-accordion-item[data-id="${itemID}"]`);
            if (!accordionItemEl) { return; }

            const bodyEl = this.elements.blastHits.querySelector(`.ictv-accordion-body[data-id="${itemID}"]`) as HTMLElement;
            if (!bodyEl) { return; }

            if (accordionItemEl.classList.contains("active")) {
               accordionItemEl.classList.remove("active");
               bodyEl.style.maxHeight = "0";
            } else {
               accordionItemEl.classList.add("active");
               bodyEl.style.maxHeight = bodyEl.scrollHeight + "px";
            }
         }

         return;
      })
   }

   async handleResultsClick(event_) {

      console.log("in blast hits panel handleResultsClick")

      if (event_.target.tagName !== "BUTTON") { return; }

      /*
      const button = event_.target as HTMLButtonElement;

      // Get and validate the button's data index attribute.
      let strDataIndex = button.getAttribute("data-index");
      const dataIndex = parseInt(strDataIndex);
      if (dataIndex < 0 || dataIndex > this.parent.job.data.results.length) {
         await AlertBuilder.displayError(`Invalid result index: ${dataIndex}`);
         return;
      }

      console.debug(button)
      */
      // The button's class determines which action to take.
      /*if (button.classList.contains(ButtonClass.copyURL)) {
         await this.copyJobURL();

      } else if (button.classList.contains(ButtonClass.downloadCSV)) {
         await this.downloadCSV(dataIndex);

      } else if (button.classList.contains(ButtonClass.viewHTML)) {
         await this.viewHTML(dataIndex);
      } */
     
      return;
   }

   unload() {

      console.log("unloading BLAST hits panel")
      console.debug("this.elements.container = ", this.elements.container)

      this.isActive = false;
      this.elements.container.classList.remove("active");
   }


}