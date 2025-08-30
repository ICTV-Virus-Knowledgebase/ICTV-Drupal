
import { AlertBuilder } from "../../../helpers/AlertBuilder";
import { AppSettings } from "../../../global/AppSettings";
import { ButtonClass, Constants, CreateTaxonDetailsURL, Icon, PanelKey } from "../Common";
import { IBlastHit } from "../IBlastHit";
import { IBlastHitScore } from "../IBlastHitScore";
import { ISeqSearchPanel } from "./ISeqSearchPanel";
import { SequenceSearch } from "../SequenceSearch";
import tippy from "tippy.js";
import { Utils } from "../../../helpers/Utils";


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


   // Consolidate the BLAST hits by combining multiple hits for the same species.
   consolidateBlastHits(hits_: IBlastHit[]): IBlastHit[] {

      let results = [];

      let latestHit: IBlastHit = null;

      hits_.forEach((hit_: IBlastHit) => {

         if (!hit_) { return; }

         // Should we add the latest hit to the results?
         if (latestHit !== null && hit_.ictv_id !== latestHit.ictv_id) {

            results.push(latestHit);

            // This hit is now the latest. Initialize its hsps array.
            latestHit = hit_;
            latestHit.hsps = [];

         } else if (!latestHit) {

            // Set the first "latest hit".
            latestHit = hit_;
            latestHit.hsps = [];
         }

         // Add this bitscore and e-value to the latest hit.
         latestHit.hsps.push({ bitscore: hit_.bitscore, evalue: hit_.evalue} as IBlastHitScore)
      })

      // Add the latest hit to the results.
      if (latestHit !== null) { results.push(latestHit); }

      return results;
   }

   // Create HTML for a BLAST hit.
   createHitHTML(hit_: IBlastHit, hitIndex_: number): string {

      const scoresTitle = hitIndex_ === 0 ? "High-scoring Segment Pairs (HSPs)" : "HSPs";

      // Format the hit's lineage.
      const lineage = this.formatLineage(hit_);

      // Create a taxon details URL for this virus.
      const hitURL = CreateTaxonDetailsURL(hit_.ictv_id, hit_.sseqid_lineage.species);

      // Create the link using the taxon details URL.
      const linkedHitName = `<a href="${hitURL}" target="_blank">${hit_.sseqid_lineage.species}</a>`;

      // Create a link to GenBank using the accession.
      let accessionLink = Utils.createGenBankAccessionLink(hit_.sseqid_accession);
      
      // Is this an exemplar or an additional isolate?
      let exemplarOrAdditional = hit_.exemplar_additional === "E" ? "Exemplar" : "Additional";

      let virusNames = Utils.safeTrim(hit_.virus_names);
      if (virusNames.length < 1) { virusNames = "unknown"; }

      let segment = Utils.safeTrim(hit_.segmentname);
      if (segment.length > 0) { segment = `<span class="segment-name"> segment ${segment}</span>`; }

      // Format the HSP bitscores and e-values.
      let hspHTML = this.createScoresHTML(hit_);

      let html = 
         `<div class="blast-hit-tile">
            <div class="left-side">
               <div class="result-index">#${hitIndex_ + 1}</div>
               <div class="lineage-and-result">
                  <div class="lineage">${lineage}</div>
                  <div class="result">
                     <div class="result-name"><b>Species</b>: <i>${linkedHitName}</i>${segment}</div>
                     <div class="result-note">${exemplarOrAdditional} virus: ${virusNames} (${accessionLink})</div>
                  </div>
               </div>
            </div>
            <div class="right-side">
               <div class="blast-scores-title">${scoresTitle}</div>
               <div class="hsps">${hspHTML}</div>
            </div>
         </div>`;

      return html;
   }

   // Create HTML for the BLAST hit's bitscores and evalues.
   createScoresHTML(hit_: IBlastHit): string {

      let html = "";

      if (!Array.isArray(hit_.hsps) || hit_.hsps.length < 1) { return "No data available"; }

      const hspCount = hit_.hsps.length;

      hit_.hsps.forEach((hsp_: IBlastHitScore, index_: number) => {

         let indexHTML = "";
         if (hspCount > 1) { indexHTML = `<span class="hit-index">${index_ + 1})</span>`; }

         let bitscore = isNaN(hsp_.bitscore) ? "0" : `${hsp_.bitscore}`;

         let eValue = "0";

         if (hsp_.evalue > 0) {

            // Format to exponential with 3 decimals
            const exponential = hsp_.evalue.toExponential(3); // "7.050e-140"

            // Split into parts
            const [coefficient, exponent] = exponential.split('e');

            // Format the final HTML string
            eValue = `${coefficient}×10<sup>${exponent}</sup>`;
         }

         html += `<div class="hit-score-row">
            ${indexHTML}
            <span class="bitscore">
               <span class="score-label">Bitscore</span>
               <span class="score-value">${bitscore}</span>
            </span>
            <span class="evalue">
               <span class="score-label">E-value</span>
               <span class="score-value">${eValue}</span>
            </span>
         </div>`;
      })
      
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

      // Validate the file's sequences and the specified sequence index.
      if (!Array.isArray(file.sequences) || file.sequences.length < 1 || file.sequences.length < this.parent.state.sequenceIndex + 1) { 
         return this.displayErrorMessage("The specified sequence is invalid"); 
      }

      // Get the sequence.
      const sequence = file.sequences[this.parent.state.sequenceIndex];
      if (!sequence) { return this.displayErrorMessage("The specified sequence is invalid"); }

      // Consolidate the BLAST hits by combining multiple hits for the same species.
      const consolidatedHits = this.consolidateBlastHits(sequence.hits);

      let hitsHTML = "";

      if (!Array.isArray(consolidatedHits) || consolidatedHits.length < 1) { 
         hitsHTML = "No BLAST hits are available"; 
      } else {
         // Generate HTML for the consolidated hits.
         consolidatedHits.forEach((hit_: IBlastHit, hitIndex_: number) => {
            hitsHTML += this.createHitHTML(hit_, hitIndex_);
         })
      }

      // Use the query ID for the CSV filename.
      const csvName = `${sequence.qseqid.replace(" ", "_")}.csv`;

      // Create a URL for the job details/results page.
      const jobDetailsURL = this.parent.createUrlUsingState(PanelKey.jobDetails);

      // Create the link panel HTML containing a link to this job's details.
      const linkPanelHTML = this.parent.createLinkPanel(PanelKey.blastHits);

      // Create the panel's HTML.
      this.elements.container.innerHTML = 
         `<div class="panel-title">BLAST hits for Query ID ${sequence.qseqid}</div>
         <div class="panel-controls">
            ${linkPanelHTML}
            <div class="sequence-controls">

               <button class="btn btn-generic ${ButtonClass.back} has-tooltip"
                  data-tippy-content="Return to the ${Constants.APPLICATION_NAME} results page"
                  data-url="${jobDetailsURL}"
               >${Icon.back} Return to search results</button>

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