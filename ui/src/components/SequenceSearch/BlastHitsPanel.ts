
import { AlertBuilder } from "../../helpers/AlertBuilder";
import { AppSettings } from "../../global/AppSettings";
import { Icon } from "./Common";
import { IBlastHit } from "./IBlastHit";
import { ISearchResult } from "./ISearchResult";
import { ISeqSearchPanel } from "./ISeqSearchPanel";
import { SequenceSearch } from "./SequenceSearch";
import { Utils } from "../../helpers/Utils";


export class BlastHitsPanel implements ISeqSearchPanel {

   // DOM elements
   elements: {
      blastHits: HTMLElement,
      container: HTMLElement
   }

   // The parent page
   parent: SequenceSearch = null;

   // The job's tax_result object
   result: ISearchResult = null;

   resultIndex: number = NaN;


   // C-tor
   constructor(parent_: SequenceSearch) {

      if (!parent_) { throw new Error("Invalid parent parameter"); }
      this.parent = parent_;

      this.elements = {

         blastHits: null,

         // Create a local copy of the parent's BLAST hits panel Element.
         container: this.parent.elements.blastHitsPanel
      }

   }


   createHitHTML(hit_: IBlastHit, hitIndex_: number): string {

      // Format the hit's lineage.
      const lineage = this.formatLineage(hit_);

      const hitURL = this.parent.createTaxonDetailsURL(hit_.ICTV_ID, hit_.sseqid_lineage.species);

      const linkedHitName = `<a href="${hitURL}" target="_blank">${hit_.sseqid_lineage.species}</a>`;

      let sseqAccessionLink = Utils.createGenBankAccessionLink(hit_.sseqid_accession);
      
      let virusNames = Utils.safeTrim(hit_.virus_names);
      if (virusNames.length < 1) { virusNames = "unknown"; }

      let segment = Utils.safeTrim(hit_.segmentname);
      if (segment.length > 0) {
         segment = 
            `<td class="blast-column">
               <label>Segment</label>
               <span class="value">${segment}</span>
            </td>`;
      }

      let startAndEnd = "";
      if (hit_.start_loc !== null && !isNaN(hit_.start_loc) && hit_.end_loc !== null && !isNaN(hit_.end_loc)) { 
         startAndEnd = 
            `<tr class="blast-row">
               <td class="blast-column">
                  <label>Start location</label>
                  <span class="value">${hit_.start_loc}</span>
               </td>
               <td class="blast-column" colspan="2">
                  <label>End location</label>
                  <span class="value">${hit_.end_loc}</span>
               </td>
            </tr>`;
      }

      let vmrID = Utils.safeTrim(hit_.isolate_id);
      if (vmrID.length > 0) {
         vmrID = 
            `<td class="blast-column" colspan="2">
               <label>Isolate ID</label>
               <span class="value"><a href="${AppSettings.taxonHistoryPage}?vmr_id=${hit_.isolate_id}" target="_blank">${hit_.isolate_id}</a></span>
            </td>`;
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
                        <div class="result-name">Species: <i>${linkedHitName}</i></div>
                        <div class="result-note">Exemplar virus: ${virusNames} (${sseqAccessionLink})</div>
                     </div>
                  </div>
               </div>
            </div>
            <div class="ictv-accordion-body" data-id="${hitIndex_}">
               <div class="ictv-accordion-content">
                  
                  <table class="blast-hit">
      
                     <tr class="blast-row">
                        ${segment}
                        <td class="blast-column">
                           <label>Exemplar/additional</label>
                           <span class="value">${hit_.exemplar_additional}</span>
                        </td>
                     </tr>

                     <tr class="blast-row">
                        <td class="blast-column">
                           <label>E-value</label>
                           <span class="value">${hit_.evalue}</span>
                        </td>
                        <td class="blast-column" colspan="2">
                           <label>Bitscore</label>
                           <span class="value">${hit_.bitscore}</span>
                        </td>
                     </tr>

                     <tr class="blast-row">
                        <td class="blast-column">
                           <label>ICTV ID</label>
                           <span class="value"><a href="${AppSettings.taxonHistoryPage}?ictv_id=${hit_.ICTV_ID}" target="_blank">${hit_.ICTV_ID}</a></span>
                        </td>
                        ${vmrID}
                     </tr>

                     ${startAndEnd}

                     <tr class="blast-row">
                        <td class="blast-column">
                           <label>qseqid</label>
                           <span class="value">${hit_.qseqid}</span>
                        </td>
                        <td class="blast-column">
                           <label>sseqid</label>
                           <span class="value">${hit_.sseqid}</span>
                        </td>
                        <td class="blast-column">
                           <label>sseqid accession</label>
                           <span class="value">${sseqAccessionLink}</span>
                        </td>
                     </tr>
                  
                  </table>

               </div>
            </div>
         </div>`;

      /*
      let html = `<table class="blast-hit">
      
         <tr class="blast-row">
            <td class="blast-column">
               <label>Virus name(s)</label>
               <span class="value">${hit_.virus_names}</span>
            </td>
            <td class="blast-column">
               <label>Segment</label>
               <span class="value">${hit_.segmentname}</span>
            </td>
            <td class="blast-column">
               <label>Exemplar/additional</label>
               <span class="value">${hit_.exemplar_additional}</span>
            </td>
         </tr>

         <tr class="blast-row">
            <td class="blast-column">
               <label>E-value</label>
               <span class="value">${hit_.evalue}</span>
            </td>
            <td class="blast-column" colspan="2">
               <label>Bitscore</label>
               <span class="value">${hit_.bitscore}</span>
            </td>
         </tr>

         <tr class="blast-row">
            <td class="blast-column">
               <label>ICTV ID</label>
               <span class="value"><a href="${AppSettings.taxonHistoryPage}?ictv_id=${hit_.ICTV_ID}" target="_blank">${hit_.ICTV_ID}</a></span>
            </td>
            <td class="blast-column" colspan="2">
               <label>Isolate ID</label>
               <span class="value"><a href="${AppSettings.taxonHistoryPage}?vmr_id=${hit_.isolate_id}" target="_blank">${hit_.isolate_id}</a></span>
            </td>
         </tr>

         <tr class="blast-row">
            <td class="blast-column">
               <label>Start location</label>
               <span class="value">${hit_.start_loc}</span>
            </td>
            <td class="blast-column" colspan="2">
               <label>End location</label>
               <span class="value">${hit_.end_loc}</span>
            </td>
         </tr>

         <tr class="blast-row">
            <td class="blast-column">
               <label>qseqid</label>
               <span class="value">${hit_.qseqid}</span>
            </td>
            <td class="blast-column">
               <label>sseqid</label>
               <span class="value">${hit_.sseqid}</span>
            </td>
            <td class="blast-column">
               <label>sseqid accession</label>
               <span class="value">${sseqAccessionLink}</span>
            </td>
         </tr>
      
      </table>`;*/

      

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
            
      // Make the container visible.
      this.elements.container.classList.add("active");

      // Validate the job and the selected result.
      if (!this.parent.job || !this.parent.job.data || !Array.isArray(this.parent.job.data.results)) {
         return this.displayErrorMessage("The specified job is invalid");
      }
      if (isNaN(this.parent.state.resultIndex) || this.parent.job.data.results.length < this.parent.state.resultIndex) {
            return this.displayErrorMessage("The specified search result is invalid");
      }
      
      this.resultIndex = this.parent.state.resultIndex;

      // Get and validate the specified search result.
      this.result = this.parent.job.data.results[this.resultIndex];
      if (!this.result || !Array.isArray(this.result.hits) || this.result.hits.length < 1) { 
         return this.displayErrorMessage("No BLAST hits are available for the specified search result"); 
      }

      console.debug("result = ", this.result)
      
      const inputSequenceName = this.result.hits[0].input_seq;

      /*
      //----------------------------------------------------------------------------------------------------------------
      // Create the URL that can be used to view this job result.
      //----------------------------------------------------------------------------------------------------------------
      this.jobResultURL = window.location.href;

      // TODO: Get rid of this line soon!!!
      this.jobResultURL = this.jobResultURL.replace("://ictv.global", "://test.ictv.global");

      // Remove any existing query string parameters.
      let qIndex = this.jobResultURL.indexOf("?");
      if (qIndex > -1) { this.jobResultURL = this.jobResultURL.substring(0, qIndex); }

      this.jobResultURL += `?job=${this.job.uid}&result=${this.parent.state.resultIndex}`;

      console.debug(`this.jobResultURL = ${this.jobResultURL}`)
      */

      
      let hitsHTML = "";

      // Generate HTML for the hits.
      this.result.hits.forEach((hit_: IBlastHit, hitIndex_: number) => {
         hitsHTML += this.createHitHTML(hit_, hitIndex_);
      })

      this.elements.container.innerHTML = 
         `<div class="blast-hits-title">BLAST hits for ${inputSequenceName}</div>
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

      if (event_.target.tagName !== "BUTTON") { return; }

      const button = event_.target as HTMLButtonElement;

      // Get and validate the button's data index attribute.
      let strDataIndex = button.getAttribute("data-index");
      const dataIndex = parseInt(strDataIndex);
      if (dataIndex < 0 || dataIndex > this.parent.job.data.results.length) {
         await AlertBuilder.displayError(`Invalid result index: ${dataIndex}`);
         return;
      }

      console.debug(button)

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

      this.elements.container.classList.remove("active");
   }


}