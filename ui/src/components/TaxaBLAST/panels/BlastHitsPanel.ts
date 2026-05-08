
import { BlastStatus, BlastTask, ButtonClass, Constants, 
   CreateTaxonDetailsURL, GetBlastTaskLabel, GetSequenceTypeFromBlastTask, Icon, 
   PanelKey } from "../Common";
import DataTables from "datatables.net-dt";
import { IBlastHit } from "../IBlastHit";
import { GetTaxonomyRankLabel, IctvRank } from "../../../global/Types";
import { BlastHSP } from "../BlastHSP";
import { BlastIsolate } from "../BlastIsolate";
import { BlastSpecies } from "../BlastSpecies";
import { ITaxaBlastPanel } from "./ITaxaBlastPanel";
import { JobStatus, SequenceType } from "../../CuratedNameManager";
import { TaxaBLAST } from "../TaxaBLAST";
import tippy from "tippy.js";
import { Utils } from "../../../helpers/Utils";
import { ISequenceFile } from "../ISequenceFile";
import { ISequence } from "../ISequence";
import { AlertBuilder } from "../../../helpers/AlertBuilder";


export class BlastHitsPanel implements ITaxaBlastPanel {

   // The window's base URL: The protocol, host name, and port (optional) without subdirectories, page names, or query parameters.
   baseURL: string;

   // DOM elements
   elements: {
      blastHits: HTMLElement,
      container: HTMLElement,
      jobDetails: HTMLElement,
      panelControls: HTMLElement,
      panelTitle: HTMLElement
   }

   // Is the panel currently active/displayed?
   isActive: boolean;

   includeProteinResults: boolean = false;

   // The parent page
   parent: TaxaBLAST = null;

   // Configuration settings and constants.
   settings = {
      
      // In some situations, text longer than this will be truncated with "(...)" appended.
      MAX_CHARS_FROM_LONG_TEXT: 40,

      // Use this delimiter in a range like query start/end and hit start/end.
      rangeDelimiter: "&mdash;" 
   }

   // C-tor
   constructor(containerEl_: HTMLElement, parent_: TaxaBLAST) {

      if (!containerEl_) { throw new Error("Invalid container element"); }

      if (!parent_) { throw new Error("Invalid parent parameter"); }
      this.parent = parent_;

      this.elements = {
         blastHits: null,
         container: containerEl_,
         jobDetails: null,
         panelControls: null,
         panelTitle: null
      }

      this.baseURL = Utils.getBaseURL();
   }

   // Consolidate the BLAST hits by species and isolate.
   consolidateBlastHits(filename_: string, hits_: IBlastHit[], sequenceType_: SequenceType): Map<string, BlastSpecies> {

      // A map containing all species referenced in the BLAST hits.
      const speciesMap = new Map<string, BlastSpecies>();

      hits_.forEach((hit_: IBlastHit) => {

         if (!hit_) { return; }

         let isolate: BlastIsolate = null;
         let species: BlastSpecies = null;

         // Get the species if it's already in the species map. Otherwise, create a new one.
         if (speciesMap.has(hit_.sseq_ictv.species_ictv_id)) {
            species = speciesMap.get(hit_.sseq_ictv.species_ictv_id);
            if (species === null) { 
               throw new Error(`Invalid species in the species map for ICTV ID ${hit_.sseq_ictv.species_ictv_id}`);
            }
         } else {
            species = new BlastSpecies(filename_, hit_);
         }

         // Get the isolate if it's already in the isolates map. Otherwise, create a new one.
         if (species.isolates.has(hit_.sseq_ictv.isolate_id)) {
            isolate = species.isolates.get(hit_.sseq_ictv.isolate_id);
            if (isolate === null || typeof isolate === "undefined") { 
               throw new Error(`Invalid isolates in the isolates map for VMR ID ${hit_.sseq_ictv.isolate_id}`);
            }
         } else {
            isolate = new BlastIsolate(hit_, sequenceType_);
         }

         // Is this the species' highest bitscore?
         if (hit_.bitscore > species.topBitscore) { 
            species.topBitscore = hit_.bitscore; 
         }

         // Add this hit's HSP to the isolate.
         isolate.hsps.push(new BlastHSP(hit_));

         // Update the species with this isolate.
         species.isolates.set(hit_.sseq_ictv.isolate_id, isolate);

         if (isolate.isolateExemplar === "E") {
            species.exemplarIsolateID = isolate.isolateID;
         }

         // Update the species map.
         speciesMap.set(hit_.sseq_ictv.species_ictv_id, species);
      })

      return speciesMap;
   }

   // Create table rows for HSPs.
   createHspRowsHTML(hsps_: BlastHSP[]): string {

      let numColumns = 6;
      if (this.includeProteinResults) { numColumns = 6; }

      if (!Array.isArray(hsps_) || hsps_.length < 1) { return `<tr><td colspan="${numColumns}">No data available</td></tr>`; }
      
      let html = "";

      hsps_.forEach((hsp_: BlastHSP, index_: number) => {

         let rowClass = index_ % 2 == 0 ? "even" : "odd";

         let bitscore = isNaN(hsp_.bitscore) ? "0" : hsp_.bitscore.toLocaleString("en-US");
         if (bitscore.indexOf(".") < 0) { bitscore += ".0"; }

         /*
         if (hsp_.evalue > 0) {
            // Format to exponential with 3 decimals
            const exponential = hsp_.evalue.toExponential(3); // ex. "7.050e-140"
            // Split into parts
            const [coefficient, exponent] = exponential.split('e');
            // Format the final HTML string
            eValue = `${coefficient}×10<sup>${exponent}</sup>`;
         }*/

         let pIdent = "unknown";
         if (!isNaN(hsp_.pident)) { pIdent = `${hsp_.pident.toLocaleString("en-US", {minimumFractionDigits: 2, maximumFractionDigits: 2})}%`; }

         // Protein results have additional data.
         let proteinColumns = ""; 

         if (this.includeProteinResults) {

            let note = hsp_.note;
            let productName = hsp_.productName;
            let proteinID = hsp_.proteinID;
            
            let linkedName = Utils.createGenBankAccessionLink(proteinID, proteinID);

            let productExcerpt = productName;
            if (productExcerpt.length > this.settings.MAX_CHARS_FROM_LONG_TEXT) { 
               productExcerpt = productExcerpt.substring(0, this.settings.MAX_CHARS_FROM_LONG_TEXT) + "(...)";
            }

            let noteExcerpt = note;
            if (noteExcerpt.length > this.settings.MAX_CHARS_FROM_LONG_TEXT) { 
               noteExcerpt = noteExcerpt.substring(0, this.settings.MAX_CHARS_FROM_LONG_TEXT) + "(...)";
            }

            proteinColumns = 
               `<td class="protein-id">${linkedName}</td>
               <td class="product has-tooltip" data-tippy-content="${productName}">${productExcerpt}</td>`;
         }

         let queryRange = "";
         let hitRange = "";

         if (!isNaN(hsp_.queryStart) && !isNaN(hsp_.queryEnd) && !isNaN(hsp_.hitStart) && !isNaN(hsp_.hitEnd)) {
            queryRange = `${hsp_.queryStart}${this.settings.rangeDelimiter}${hsp_.queryEnd}`;
            hitRange = `${hsp_.hitStart}${this.settings.rangeDelimiter}${hsp_.hitEnd}`;
         }

         html += `<tr class="${rowClass}">
            <td class="hit-index">${index_ + 1}</td>
            <td class="bitscore">${bitscore}</td>
            <td class="length">${hsp_.length.toLocaleString("en-US")}</td>
            <td class="pident">${pIdent}</td>
            ${proteinColumns}
            <td class="start-or-end">${queryRange}</td>
            <td class="start-or-end">${hitRange}</td>
         </tr>`;

         // <td class="evalue">${eValue}</td>
         // <td class="note has-tooltip" data-tippy-content="${note}">${noteExcerpt}</td>
      })
      
      return html;
   }

   // Create HTML for an isolate.
   createIsolateHTML(isolate_: BlastIsolate) {

      // Is this an exemplar or an additional isolate?
      let exemplarOrAdditional = isolate_.isolateExemplar.toUpperCase() === "E" ? "Exemplar" : "Additional";

      let linkedIsolateName = isolate_.accession.length > 0 
         ? Utils.createTaxonDetailsLink(isolate_.isolateID, isolate_.isolateName)
         : isolate_.isolateName;

      let designation = isolate_.isolateDesignation.length > 0
         ? `<span class="designation">(${isolate_.isolateDesignation})</span>`
         : "";

      let otherNames = "";

      if (isolate_.accession.length > 0) {
         const accessionLink = Utils.createGenBankAccessionLink(isolate_.accession, isolate_.accession)
         otherNames += `<span class="accession-label">Accession:</span> <span class="accession">${accessionLink}</span>`;
      }

      if (isolate_.isolateAbbrev.length > 0) {
         if (isolate_.accession.length > 0) { otherNames += `<span class="name-delimiter">;</span>`; }
         otherNames += `<span class="abbrev-label">Abbrev:</span> <span class="abbrev">${isolate_.isolateAbbrev}</span>`
      }

      // Create rows for the HSPs
      const hspRows = this.createHspRowsHTML(isolate_.hsps);

      // Include additional columns for BLAST tasks that return protein data.
      let proteinHeaders = this.includeProteinResults 
         ? `<th class="protein-id">Protein ID</th>
            <th class="product">Product</th>`
         : "";
      
      let html = `<div class="isolate-group">
         <div class="hit-names">
            <span class="hit-label">Hit:</span>
            <span class="isolate-name">${linkedIsolateName}</span>
            ${designation}
            <span class="e-or-a">${exemplarOrAdditional} virus</span>
         </div>
         <div class="hit-other-names">${otherNames}</div>
         <table class="hsp-table" data-isolate-id="${isolate_.isolateID}" data-hsp-count="${isolate_.hsps.length}">
            <thead>
               <tr class="header-row">
                  <th class="hit-index">#</th>
                  <th class="bitscore">Bitscore</th>
                  <th class="length">Length</th>
                  <th class="pident">% Identity</th>
                  ${proteinHeaders}
                  <th class="start-or-end">Query start${this.settings.rangeDelimiter}end</th>
                  <th class="start-or-end">Hit start${this.settings.rangeDelimiter}end</th>
               </tr>
            </thead>
            <tbody>
            ${hspRows}
            </tbody>
         </table>
      </div>`;

      return html;
   }

   // Create HTML for the query sequence details at the top of the panel.
   createQueryDetailsHTML(file_: ISequenceFile, sequence_: ISequence): string {

      // Validate the hits count and provide a default value (zero).
      let hitsCount = Array.isArray(sequence_.hits) ? sequence_.hits.length : 0;

      // Get the BLAST task's label.
      let blastTask = GetBlastTaskLabel(this.parent.job.data.task as BlastTask);

      return `<div class="query-details-title">Query sequence</div>
         <table class="details-table has-borders">
            <tbody>
               <tr class="emphasized-row">
                  <th>Query ID</th>
                  <td>${sequence_.qseqid}</td>
               </tr>
               <tr>
                  <th>Number of hits</th>
                  <td>${hitsCount.toLocaleString("en-us")}</td>
               </tr>
               <tr>
                  <th>Sequence length</th>
                  <td>${sequence_.sequence_length.toLocaleString("en-us")}</td>
               </tr>
               <tr>
                  <th>Filename</th>
                  <td>${file_.filename}</td>
               </tr>
               <tr>
                  <th>BLAST task</th>
                  <td>${blastTask}</td>
               </tr>  
            </tbody>
         </table>`;
   }

   createSpeciesTile(species_: BlastSpecies, speciesIndex_: number): string {

      // Format the species' lineage.
      const lineage = this.formatLineage(species_);
      
      // Create a taxon details URL for this species.
      const taxonDetailsURL = CreateTaxonDetailsURL(species_.ictvID, species_.species);

      // Create the link using the taxon details URL.
      const speciesNameLink = `<a href="${taxonDetailsURL}" target="_blank">${species_.species}</a>`;

      // Create HTML for the species' isolate(s).
      let isolatesHTML = "";

      // Add the exemplar isolate first.
      if (species_.exemplarIsolateID) {
         const exemplar = species_.isolates.get(species_.exemplarIsolateID);
         if (exemplar !== null) {
            isolatesHTML += this.createIsolateHTML(exemplar);
         }
      }

      species_.isolates.forEach((isolate_: BlastIsolate) => {

         // Skip the exemplar isolate.
         if (isolate_.isolateID === species_.exemplarIsolateID) { return; }

         isolatesHTML += this.createIsolateHTML(isolate_);
      })

      const itemClass = speciesIndex_ % 2 === 0 ? "even" : "odd";

      let html =
         `<div class="ictv-accordion-item ${itemClass}" data-id="${species_.ictvID}">
            <div class="ictv-accordion-header blast-hits-header" data-id="${species_.ictvID}">
               <div class="ictv-accordion-control" data-id="${species_.ictvID}">${Icon.chevronDown}</div>
               <div class="species-accordion-label">
                  <div class="left-side">
                     <div class="species-rank-and-name">
                        <div class="species-rank">Species</div>
                        <div class="species-name">${speciesNameLink}</div>
                        <div class="segment-name">${species_.segmentName}</div>
                     </div>
                     <div class="species-lineage">${lineage}</div>
                  </div>
                  <div class="right-side">
                     <div class="bitscore-label">Top bitscore:</div>
                     <div class="bitscore">${species_.topBitscore.toLocaleString("en-US")}</div>
                  </div>
               </div>
            </div>
            <div class="ictv-accordion-body" data-id="${species_.ictvID}">
               <div class="ictv-accordion-content">${isolatesHTML}</div>
            </div>
         </div>`;

      return html;
   }

   displayErrorMessage(message_: string) {
      this.elements.container.innerHTML = `<div class="error-message">${message_}</div>`;
      return;
   }

   
   formatLineage(species_: BlastSpecies): string {

      // The lineage between taxa.
      const delimiter = `<span class="lineage-chevron" aria-hidden="true">${Icon.lineageDelimiter}</span>`;

      let higherRanks = "";
      let lowerRanks = "";

      Object.keys(IctvRank).forEach((rank_: string) => {
      
         // Get this rank's name.
         let taxonName = species_[rank_ as keyof BlastSpecies];
         if (!taxonName) { return; }

         // Get the display label for the taxonomic rank.
         const label = GetTaxonomyRankLabel(rank_ as IctvRank);
         let taxon = `<span class="lineage-name has-tooltip" data-tippy-content="${label}"><i>${taxonName}</i></span>`;

         // If we aren't displaying all ranks and this rank isn't Family or below, continue;
         if ([IctvRank.family, IctvRank.subfamily, IctvRank.genus, IctvRank.subgenus, IctvRank.species].includes(rank_ as IctvRank)) { 
            
            // The rank is family or below.
            if (lowerRanks.length > 0) { lowerRanks += delimiter; }
            lowerRanks += taxon;

         } else {
            // The rank is above family, so always append a lineage delimiter.
            higherRanks += taxon + delimiter;
         }
      })

      //const displayButton = `<button class="display-ranks-button hide-ranks">Display all</button>`;
      
      return `<span class="higher-ranks">${higherRanks}</span>${lowerRanks}`;
   }

   /*
   // Format the lineage of the BLAST hit.
   formatLineage(species_: BlastSpecies) {

      let html = "";
      
      let family = species_.family;
      let subfamily = species_.subfamily;
      let genus = species_.genus;
      let subgenus = species_.subgenus;

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
   }*/

   // Convert the HSP tables into DataTable instances.
   initializeHspTables() {

      const hspTableEls = this.elements.blastHits.querySelectorAll(".isolate-group table.hsp-table") as NodeListOf<HTMLTableElement>;
      if (hspTableEls == null || hspTableEls.length < 1) { return; }

      hspTableEls.forEach((hspTableEl_) => {
      
         const isolateID = hspTableEl_.dataset.isolateId;
         if (!isolateID) { return; }

         const strHspCount = hspTableEl_.dataset.hspCount;
         const hspCount = parseInt(strHspCount);
         if (isNaN(hspCount)) { return; }

         
         
         let displayInfo = true;
         let useOrdering = true;
         let usePaging = true;
         
         // Tables with less than 5 HSPs don't need to have paging, info, or ordering.
         if (hspCount < 5) { 
            displayInfo = false;
            useOrdering = false;
            usePaging = false;
         }

         new DataTables(`.isolate-group table.hsp-table[data-isolate-id="${isolateID}"]`, {
            autoWidth: false,
            info: displayInfo,
            language: {
               info: "Showing _START_ - _END_ of _TOTAL_ high-scoring pairs",
               lengthLabels: { "-1": "All"},
               lengthMenu: "_MENU_ high-scoring pairs per page"
            },
            layout: {
               topStart: "pageLength",
               topEnd: null,
               bottomStart: "info",
               bottomEnd: {
                  paging: {
                     buttons: 4
                  }
               }
            },
            lengthMenu: [5, 25, 50, 100, -1],
            ordering: useOrdering,
            paging: usePaging,
            searching: false
         });
      })
   }

   async load(): Promise<void> {
     
      this.isActive = true;

      // Make the container visible.
      this.elements.container.classList.add("active");

      // Validate the state
      if (isNaN(this.parent.state.fileIndex) || isNaN(this.parent.state.sequenceIndex)) { return this.displayErrorMessage("The panel state is invalid"); }
      
      try {
         // Get the job associated with the job UID.
         await this.parent.getJob();

         // Validate the job and its data.
         if (!this.parent.job || !this.parent.job.data) {
            return this.displayErrorMessage("The specified job is invalid");
         }

         if (this.parent.job.status !== JobStatus.complete) {
            return this.displayErrorMessage("The specified job has not yet completed");
         }

         // Make sure the job has files.
         if (!Array.isArray(this.parent.job.data.files) || this.parent.job.data.files.length < 1 ||
            this.parent.job.data.files.length < this.parent.state.fileIndex + 1) {

            return this.displayErrorMessage("The data files for this job are invalid");
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

         if (sequence.status === BlastStatus.NO_HITS) {
            return this.displayErrorMessage(`No BLAST hits were found for sequence ${this.parent.state.sequenceIndex + 1} in file ${file.filename}`);
         } else if (!Array.isArray(sequence.hits) || sequence.hits.length < 1) { 
            return this.displayErrorMessage(`The BLAST hits for sequence ${this.parent.state.sequenceIndex + 1} in file ${file.filename} are invalid`);
         }

         // Use the BLAST task to determine the sequence type.
         const sequenceType: SequenceType = GetSequenceTypeFromBlastTask(this.parent.job.data.task as BlastTask);

         // BLAST tasks blastp and blastx will have protein results in the HSPs.
         this.includeProteinResults = [ BlastTask.blastp, BlastTask.blastx].includes(this.parent.job.data.task as BlastTask);

         // Consolidate the BLAST hits by species and isolates.
         const speciesMap = this.consolidateBlastHits(file.filename, sequence.hits, sequenceType);
         if (speciesMap === null || speciesMap.size < 1) { 
            return this.displayErrorMessage(`The species information in the BLAST hits for sequence ${this.parent.state.sequenceIndex + 1} in file ${file.filename} is invalid`);
         }

         let speciesIndex = 0;
         let speciesTilesHTML = "";
         
         // Generate "species tile" HTML for all species in the map.
         speciesMap.forEach((species_: BlastSpecies) => {
            speciesTilesHTML += this.createSpeciesTile(species_, speciesIndex);
            speciesIndex += 1;
         })
      
         // Use the query ID for the CSV filename.
         const csvName = `${sequence.qseqid.replace(" ", "_")}.csv`;

         // Create HTML for the query sequence details displayed at the top.
         const queryDetailsHTML = this.createQueryDetailsHTML(file, sequence);

         // Create a URL for the job details page.
         const jobDetailsURL = this.parent.createPanelURL(PanelKey.jobDetails);

         // Create a link that will display a page with BLAST hits for this job, file, and sequence.
         const linkPanelHTML = this.parent.createLinkRow(PanelKey.blastHits);

         // Don't emphasize the job name since this isn't the most important detail for users to see at a glance.
         const emphasizeFirstRow = false;

         // Create the job details table HTML.
         const tableClass = "no-borders";
         const jobDetailsHTML = this.parent.createJobDetailsTable(emphasizeFirstRow, tableClass);
         
         // A key for the job details accordion item.
         const detailsKey = "job_details";

         // Create the panel's HTML.
         this.elements.container.innerHTML = 
            `${queryDetailsHTML}
            <div class="ictv-accordion-item job-details" data-id="${detailsKey}">
               <div class="ictv-accordion-header blast-hits-header" data-id="${detailsKey}">
                  <div class="ictv-accordion-control" data-id="${detailsKey}">${Icon.chevronDown}</div>
                  <div class="ictv-accordion-label">Job details</div>
               </div>
               <div class="ictv-accordion-body" data-id="${detailsKey}">
                  <div class="ictv-accordion-content">${jobDetailsHTML}</div>
               </div>
            </div>
            <div class="blast-hits-title">BLAST hits</div>
            <div class="blast-hits-panel-controls">
               ${linkPanelHTML}
               <div class="sequence-controls">
                  <button class="btn btn-generic ${ButtonClass.back} has-tooltip"
                     data-tippy-content="Return to the ${Constants.APPLICATION_NAME} results page"
                     data-url="${jobDetailsURL}"
                  >${Icon.back}<span class="btn-label">Return to search results</span></button>

                  <button class="btn btn-generic ${ButtonClass.viewHTML} has-tooltip"
                     data-filename="${sequence.blast_html}"
                     data-tippy-content="View the alignments in a new tab"
                     data-title="${sequence.qseqid}"
                  >${Icon.html}<span class="btn-label">View alignments</span></button>

                  <button class="btn btn-generic ${ButtonClass.downloadCSV} has-tooltip"
                     data-filename="${sequence.blast_csv}"
                     data-tippy-content="Download the BLAST hits as a CSV file"
                     data-title="${csvName}"
                  >${Icon.csv}<span class="btn-label">Download results as CSV</span></button>

                  <button class="btn ${ButtonClass.newSearch} has-tooltip"
                     data-tippy-content="Use ${Constants.APPLICATION_NAME} again with different FASTA files"
                     data-url="${this.parent.createPanelURL(PanelKey.jobSubmission)}"
                  >${Icon.search}<span class="btn-label">New search</span></button>
               </div>
            </div>
            <div class="blast-hits">${speciesTilesHTML}</div>`;


         // Initialize tippy tooltips for buttons.
         tippy(".has-tooltip");

         // Get a reference to the BLAST hits element.
         this.elements.blastHits = this.elements.container.querySelector(".blast-hits");
         if (!this.elements.blastHits) { throw new Error("Invalid blast hits DOM element"); }

         // Get a reference to the job details accordion element.
         this.elements.jobDetails = this.elements.container.querySelector(".job-details");
         if (!this.elements.jobDetails) { throw new Error("Invalid job details DOM element"); }
         
         // Get a reference to the panel controls element.
         this.elements.panelControls = this.elements.container.querySelector(".blast-hits-panel-controls");
         if (!this.elements.panelControls) { throw new Error("Invalid panel controls DOM element"); }

         // Handle clicks in the BLAST hits element. 
         this.elements.blastHits.addEventListener("click", async (event_) => {
            return await this.parent.handleClickEvent(this.elements.container, event_.target as HTMLElement);
         })

         // Handle clicks in the job details element. 
         this.elements.jobDetails.addEventListener("click", async (event_) => {
            return await this.parent.handleClickEvent(this.elements.jobDetails, event_.target as HTMLElement);
         })

         // Handle clicks in the panel controls.
         this.elements.panelControls.addEventListener("click", async (event_) => {
            return await this.parent.handleClickEvent(this.elements.container, event_.target as HTMLElement);
         })

         // Convert the HSP tables into DataTable instances.
         this.initializeHspTables();
         
      } catch (error_: any) {
         await AlertBuilder.displayError(error_);
      }

      return;
   }

   async unload(): Promise<void> {
      this.isActive = false;
      this.elements.container.classList.remove("active");

      // TODO: should we remove event listeners?
      return;
   }


}