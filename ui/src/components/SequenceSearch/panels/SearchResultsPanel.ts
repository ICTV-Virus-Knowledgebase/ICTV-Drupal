
import { ButtonClass, CreateKeyFromName, Icon, ToggleAccordion } from "../Common";
import { ISeqSearchJob } from "../ISeqSearchJob";
import { ISeqSearchPanel } from "./ISeqSearchPanel";
import { ISequence } from "../ISequence";
import { ISequenceFile } from "../ISequenceFile";
import { SequenceSearch } from "../SequenceSearch";
import tippy from "tippy.js";


export class SearchResultsPanel implements ISeqSearchPanel {
   
   // DOM elements
   elements: {
      container: HTMLElement,
      resultFiles: HTMLElement
   }

   // Is the panel currently active/displayed?
   isActive: boolean;

   job: ISeqSearchJob = null;

   // The URL that can be used to return and view the job data.
   jobURL: string = null;

   // The parent page
   parent: SequenceSearch = null;



   // C-tor
   constructor(containerEl_: HTMLElement, parent_: SequenceSearch) {

      if (!containerEl_) { throw new Error("Invalid container element"); }

      if (!parent_) { throw new Error("Invalid parent parameter"); }
      this.parent = parent_;

      this.elements = {
         container: containerEl_,
         resultFiles: null
      }
   }

   // Create HTML for a sequence file panel.
   createFileHTML(file_: ISequenceFile, fileIndex_: number): string {

      // Use the filename as the file ID (lowercase with no whitespace).
      const fileKey = CreateKeyFromName(file_.name);

      // The number of sequences associated with this file.
      const sequenceCount = Array.isArray(file_.sequences) ? file_.sequences.length : 0;

      let sequencesHTML = "";

      if (Array.isArray(file_.sequences) && file_.sequences.length > 0) {

         let sequenceRows = "";

         // Create a TR for every sequence.
         file_.sequences.forEach((sequence_: ISequence, sequenceIndex_: number) => {
            sequenceRows += this.createSequenceRow(fileIndex_, sequence_, sequenceIndex_);
         })

         sequencesHTML = 
            `<table class="${fileKey}_table sequences-table" data-count="${sequenceCount}">
               <thead>
                  <tr class="header-row">
                     <th class="qseqid">Query ID</th>
                     <th class="hits">Hits</th>
                     <th class="controls"></th>
                  </tr>
               </thead>
               <tbody>${sequenceRows}</tbody>
            </table>`;
      } else {
         sequencesHTML = `<div class="no-sequences">No sequences were found in this file.</div>`;
      }

      const title = file_.sequences.length === 1 ? "Sequence" : "Sequences";
      
      let html =
         `<div class="ictv-accordion-item" data-id="${fileKey}">
            <div class="ictv-accordion-header">
               <div class="ictv-accordion-control" data-id="${fileKey}">${Icon.chevronDown}</div>
               <div class="ictv-accordion-label">
                  <div class="filename">${file_.name}</div>
                  <div class="sequence-count">(${sequenceCount} sequence${sequenceCount === 1 ? '' : 's'})</div>
               </div>
            </div>
            <div class="ictv-accordion-body" data-id="${fileKey}">
               <div class="ictv-accordion-content">
                  <div class="sequences-title">${title}</div>
                  ${sequencesHTML}
               </div>
            </div>
         </div>`;

      // TODO: Where to display errors?
      return html;
   }

   createSequenceRow(fileIndex_: number, sequence_: ISequence, seqIndex_: number): string {

      const hitsCount = Array.isArray(sequence_.hits) ? sequence_.hits.length : 0;

      const csvTitle = `${sequence_.qseqid.replace(" ", "_")}.csv`;

      let html = `<tr>
         <td class="qseqid">${sequence_.qseqid}</td>
         <td class="hits">${hitsCount}</td>
         <td class="controls">
            <button class="btn btn-generic ${ButtonClass.viewHits} has-tooltip"
               data-file-index="${fileIndex_}"
               data-seq-index="${seqIndex_}" 
               data-tippy-content="View the BLAST hits in a new tab"
            >${Icon.dna} View BLAST hits</button>

            <button class="btn btn-generic ${ButtonClass.viewHTML} has-tooltip" 
               data-filename="${sequence_.blast_html}"
               data-tippy-content="View the alignments in a new tab"
               data-title="${sequence_.qseqid}"
            >${Icon.html} View alignments</button>
            
            <button class="btn btn-generic ${ButtonClass.downloadCSV} has-tooltip" 
               data-filename="${sequence_.blast_csv}"
               data-tippy-content="Download the BLAST hits as a CSV file"
               data-title="${csvTitle}"
            >${Icon.csv} Download CSV results</button>
         </td>
      </tr>`;

      return html;
   }

   displayErrorMessage(message_: string) {
      this.elements.container.innerHTML = `<div class="error-message">${message_}</div>`;
      return;
   }

   // Make the panel visible and populate it with data.
   async load() {

      this.isActive = true;

      // Make the container visible.
      this.elements.container.classList.add("active");

      // Make a local copy of the job data.
      this.job = this.parent.job;

      if (!this.job || !this.job.data) {
         return this.displayErrorMessage("The specified job is invalid");

      } else if (!Array.isArray(this.job.data.files) || this.job.data.files.length < 1) {
         return this.displayErrorMessage("No results are available for this job");
      }

      let html = "";

      // Generate HTML for the search results.
      this.job.data.files.forEach((file_: ISequenceFile, fileIndex_: number) => {
         html += this.createFileHTML(file_, fileIndex_);
      })
      
      // Populate the container
      this.elements.container.innerHTML = 
         `<div class="result-files-title">Search results</div>
         <div class="result-files">${html}</div>`;

      // Get references to DOM elements.
      this.elements.resultFiles = this.elements.container.querySelector(`.result-files`);
      if (!this.elements.resultFiles) { throw new Error("Invalid result files element"); }

      // Initialize tippy tooltips for buttons.
      tippy(".has-tooltip");

      // Add a click event handler.
      this.elements.resultFiles.addEventListener("click", async (event_) => {
         return await this.parent.handleClickEvent(this.elements.container, event_.target as HTMLElement);
      });
      
      // If there's only one file, go ahead and expand its accordion.
      if (this.job.data.files.length === 1 && !!this.job.data.files[0]) {
         const file = this.job.data.files[0];
         const fileKey = CreateKeyFromName(file.name) 
         ToggleAccordion(this.elements.container, fileKey);
      }

      return;
   }

   unload() {
      this.isActive = false;
      this.elements.container.classList.remove("active");

      // TODO: should we remove event listeners?
   }

}