
import { AlertBuilder } from "../../../helpers/AlertBuilder";
import { ButtonClass, Constants, Icon, PanelAction, PanelKey, ResultFileType } from "../Common";
import { decode } from "base64-arraybuffer";
import { IResultFiles } from "../IResultFiles";
import { ISeqSearchJob } from "../ISeqSearchJob";
import { ISeqSearchPanel } from "./ISeqSearchPanel";
import { ISequence } from "../ISequence";
import { ISequenceFile } from "../ISequenceFile";
import { SequenceSearch } from "../SequenceSearch";
import { SequenceSearchService } from "../../../services/SequenceSearchService";
import * as pako from "pako";
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


   // Initialize the accordion Elements.
   async addEventHandlers() {

      this.elements.resultFiles.addEventListener("click", async (event_) => {

         let targetEl = event_.target as HTMLElement;

         // Was a button on a sequence row clicked?
         if (targetEl.tagName === "BUTTON") {

            const button = targetEl as HTMLButtonElement;
            
            // Get and validate the button's filename attribute.
            const filename = Utils.safeTrim(button.getAttribute("data-filename"));
            if (filename.length < 1) {
               await AlertBuilder.displayError("The filename attribute is invalid");
               return;
            }
      
            // Get and validate the button's sequence index attribute.
            let strSeqIndex = button.getAttribute("data-seq-index");
            const seqIndex = parseInt(strSeqIndex);
            if (seqIndex < 0) { // || seqIndex > this.job.data.files.length) {
               await AlertBuilder.displayError(`Invalid sequence index: ${seqIndex}`);
               return;
            }

            // The button's class determines which action to take.
            if (button.classList.contains(ButtonClass.viewHits)) {

               this.parent.state.resultIndex = seqIndex;
               
               await this.parent.updatePage();

            } else if (button.classList.contains(ButtonClass.downloadCSV)) {
               
               await this.downloadCSV(filename, seqIndex);

            } else if (button.classList.contains(ButtonClass.viewHTML)) {
               
               await this.viewHTML(filename, seqIndex);
            }

            return;
         }

         // If the chevron icon was clicked, use its parent Element.
         if (targetEl.classList.contains("ictv-accordion-control-icon")) { targetEl = targetEl.parentElement; }

         if (targetEl.classList.contains("ictv-accordion-control")) {

            const itemID = targetEl.getAttribute("data-id");
            if (!itemID) { return; }
            
            event_.preventDefault();
            event_.stopPropagation();

            const accordionItemEl = this.elements.resultFiles.querySelector(`.ictv-accordion-item[data-id="${itemID}"]`);
            if (!accordionItemEl) { return; }

            const bodyEl = this.elements.resultFiles.querySelector(`.ictv-accordion-body[data-id="${itemID}"]`) as HTMLElement;
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

      return;
   }

   // Create HTML for a sequence file panel.
   createFileHTML(file_: ISequenceFile, fileIndex_: number): string {

      const fileID = file_.name.toLowerCase().replace(/\W+/g, '_');

      const sequenceCount = Array.isArray(file_.sequences) ? file_.sequences.length : 0;

      let sequencesHTML = "";

      if (Array.isArray(file_.sequences) && file_.sequences.length > 0) {

         let sequenceRows = "";

         file_.sequences.forEach((sequence_: ISequence, sequenceIndex_: number) => {
            sequenceRows += this.createSequenceRow(file_.name, sequence_, sequenceIndex_);
         })

         sequencesHTML = 
            `<table class="${fileID}_table sequences-table" data-count="${sequenceCount}">
               <thead>
                  <tr class="header-row">
                     <th class="qseqid">qseqID</th>
                     <th class="hits">Hits</th>
                     <th class="controls"></th>
                  </tr>
               </thead>
               <tbody>${sequenceRows}</tbody>
            </table>`;
      } else {
         sequencesHTML = `<div class="no-sequences">No sequences were found in this file.</div>`;
      }

      let html =
         `<div class="ictv-accordion-item" data-id="${fileID}">
            <div class="ictv-accordion-header">
               <div class="ictv-accordion-control" data-id="${fileID}">${Icon.chevronDown}</div>
               <div class="ictv-accordion-label">
                  <div class="filename">${file_.name}</div>
                  <div class="sequence-count">(${sequenceCount} sequence${sequenceCount === 1 ? '' : 's'})</div>
               </div>
            </div>
            <div class="ictv-accordion-body" data-id="${fileID}">
               <div class="ictv-accordion-content">
                  <div class="sequences-title">Sequences</div>
                  ${sequencesHTML}
               </div>
            </div>
         </div>`;

      // TODO: Where to display errors?
      return html;
   }

   createSequenceRow(filename_: string, sequence_: ISequence, seqIndex_: number): string {

      const hitsCount = Array.isArray(sequence_.hits) ? sequence_.hits.length : 0;

      let html = `<tr>
         <td>${sequence_.qseqid}</td>
         <td>${hitsCount}</td>
         <td>
            <button class="btn ${ButtonClass.viewHits} has-tooltip"
               data-filename="${filename_}"
               data-seq-index="${seqIndex_}" 
               data-tippy-content="Click to view the BLAST hits"
            >${Icon.dna} View BLAST hits</button>
            <button class="btn ${ButtonClass.viewHTML} has-tooltip" 
               data-filename="${filename_}"
               data-seq-index="${seqIndex_}" 
               data-tippy-content="Click to view the HTML results (${sequence_.blast_html})"
            >${Icon.html} View HTML results</button>
            <button class="btn ${ButtonClass.downloadCSV} has-tooltip" 
               data-filename="${filename_}"
               data-seq-index="${seqIndex_}" 
               data-tippy-content="Click to download the results as a CSV file (${sequence_.blast_csv})"
            >${Icon.csv} Download CSV results</button>
         </td>
      </tr>`;

      return html;
   }

   displayErrorMessage(message_: string) {
      this.elements.container.innerHTML = `<div class="error-message">${message_}</div>`;
      return;
   }


   // Download the BLAST CSV data for a specific result.
   async downloadCSV(filename_: string, seqIndex_: number) {

      const fileTypes = ResultFileType.csv;

      const resultFiles = await SequenceSearchService.getResultFiles(this.parent.authToken, fileTypes, filename_, this.parent.state.jobUID, seqIndex_, this.parent.user.email, this.parent.user.uid)
      console.log("resultFiles = ", resultFiles)
      
      if (!resultFiles || !resultFiles.files || resultFiles.files.length < 1) {
         return await AlertBuilder.displayError("No CSV files are available for download");
      }

      const csv = Utils.safeTrim(this.getResultFileContents(resultFiles, ResultFileType.csv));
      if (!csv || csv.length < 1) {
         return await AlertBuilder.displayError("The CSV file is empty or invalid");
      }

      // Decode the base64-encoded CSV file and decompress it.
      const arrayBuffer: ArrayBuffer = pako.inflate(decode(csv));
      if (!arrayBuffer || arrayBuffer.byteLength === 0) {
         await AlertBuilder.displayError("The CSV file is invalid: It may be empty or corrupted.");
         return;
      }

      // Associate the ArrayBuffer with a Blob, create a download link, and trigger the download.
      const link = document.createElement('a')
      link.href = URL.createObjectURL(new Blob(
         [ arrayBuffer ],
         { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }
      ))
      link.download = csv;
      link.click();

      return;
   }

   // Get the specified file type's content from the result files.
   getResultFileContents(files_: IResultFiles, type_: ResultFileType): string {

      let contents = "";

      for (let i = 0; i < files_.files.length; i++) {
         const file = files_.files[i];
         if (file.type === type_) { 
            contents = file.contents; 
            break; 
         }
      }

      return contents;
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

      // Initialize the accordion Elements.
      return await this.addEventHandlers();
   }


   unload() {

      console.log("unloading search results panel")
      console.debug("this.elements.container = ", this.elements.container)

      this.isActive = false;

      this.elements.container.classList.remove("active");

      // TODO: should we remove event listeners?
      // TODO: anything else?
   }

   
   // Display the BLAST HTML data for a specific result.
   async viewHTML(filename_: string, seqIndex_: number) {

      console.log("viewing HTML")

      const fileTypes = ResultFileType.html;

      const resultFiles = await SequenceSearchService.getResultFiles(this.parent.authToken, fileTypes, filename_, this.parent.state.jobUID, seqIndex_, this.parent.user.email, this.parent.user.uid)
      console.log("resultFiles = ", resultFiles)
      
      if (!resultFiles || !resultFiles.files || resultFiles.files.length < 1) {
         return await AlertBuilder.displayError("No HTML files are available for download");
      }

      const htmlContent = Utils.safeTrim(this.getResultFileContents(resultFiles, ResultFileType.html));
      if (!htmlContent || htmlContent.length < 1) {
         return await AlertBuilder.displayError("The HTML file is empty or invalid");
      }

      // Open a new tab/window and populate it with the contents of the BLAST HTML file.
      const blastWindow = window.open("", "_blank");

      // Decode the base64-encoded HTML file and decompress it.
      const html = htmlContent; //pako.inflate(decode(htmlContent), { to: 'string' });
      blastWindow.document.writeln(html);

      // Remove the extension from the file name and use it as the window's title.
      blastWindow.document.title = "TODO"; //result.blast_html.replace(".html", "");

      return;
   }
}