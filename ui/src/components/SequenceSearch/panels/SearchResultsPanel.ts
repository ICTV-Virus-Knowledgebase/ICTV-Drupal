
import { AlertBuilder } from "../../../helpers/AlertBuilder";
import { ButtonClass, Constants, CreateKeyFromName, Icon, PanelAction, PanelKey, ResultFileType, ToggleAccordion } from "../Common";
import { ISeqSearchJob } from "../ISeqSearchJob";
import { ISeqSearchPanel } from "./ISeqSearchPanel";
import { ISequence } from "../ISequence";
import { ISequenceFile } from "../ISequenceFile";
import { SequenceSearch } from "../SequenceSearch";
import tippy from "tippy.js";
import { Utils } from "../../../helpers/Utils";


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
            sequenceRows += this.createSequenceRow(fileIndex_, file_.name, sequence_, sequenceIndex_);
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

   createSequenceRow(fileIndex_: number, filename_: string, sequence_: ISequence, seqIndex_: number): string {

      const hitsCount = Array.isArray(sequence_.hits) ? sequence_.hits.length : 0;

      let html = `<tr>
         <td>${sequence_.qseqid}</td>
         <td>${hitsCount}</td>
         <td>
            <button class="btn btn-default ${ButtonClass.viewHits} has-tooltip"
               data-file-index="${fileIndex_}"
               data-filename="${filename_}"
               data-seq-index="${seqIndex_}" 
               data-tippy-content="Click to view the BLAST hits in a new tab"
            >${Icon.dna} View BLAST hits</button>
            <button class="btn btn-default ${ButtonClass.viewHTML} has-tooltip" 
               data-file-index="${fileIndex_}"
               data-filename="${filename_}"
               data-seq-index="${seqIndex_}" 
               data-tippy-content="Click to view the results as HTML in a new tab"
            >${Icon.html} View HTML results</button>
            <button class="btn btn-default ${ButtonClass.downloadCSV} has-tooltip" 
               data-file-index="${fileIndex_}"
               data-filename="${filename_}"
               data-seq-index="${seqIndex_}" 
               data-tippy-content="Click to download the results as a CSV file"
            >${Icon.csv} Download CSV results</button>
         </td>
      </tr>`;

      return html;
   }

   displayErrorMessage(message_: string) {
      this.elements.container.innerHTML = `<div class="error-message">${message_}</div>`;
      return;
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
            await this.parent.viewHTML(filename, seqIndex);
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

   // Make the panel visible and populate it with data.
   async load() {

      console.log("in searchResults.load")
      
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
      
      const title = this.job.data.files.length === 1 ? "Submitted file" : "Submitted files";

      // Populate the container
      this.elements.container.innerHTML = 
         `<div class="result-files-title">${title}</div>
         <div class="result-files">${html}</div>`;

      // Get references to DOM elements.
      this.elements.resultFiles = this.elements.container.querySelector(`.result-files`);
      if (!this.elements.resultFiles) { throw new Error("Invalid result files element"); }

      // Initialize tippy tooltips for buttons.
      tippy(".has-tooltip");

      // Add a click event handler.
      this.elements.resultFiles.addEventListener("click", async (event_) => {
         await this.handleClickEvent(event_.target as HTMLElement);
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

      console.log("unloading search results panel")
      console.debug("this.elements.container = ", this.elements.container)

      this.isActive = false;

      this.elements.container.classList.remove("active");

      // TODO: should we remove event listeners?
      // TODO: anything else?
   }

}