
import { AlertBuilder } from "../../helpers/AlertBuilder";
import { ButtonClass, Constants, Icon, PanelAction, PanelKey } from "./Common";
import { decode } from "base64-arraybuffer";
import { ISearchResult } from "./ISearchResult";
import { ISeqSearchJob } from "./ISeqSearchJob";
import { ISeqSearchPanel } from "./ISeqSearchPanel";
import { SequenceSearch } from "./SequenceSearch";
import { SequenceSearchService } from "../../services/SequenceSearchService";
import { Utils } from "../../helpers/Utils";
import * as pako from "pako";


export class SearchResultsPanel implements ISeqSearchPanel {
   
   // DOM elements
   elements: {
      container: HTMLElement,
      searchResults: HTMLElement
   }

   job: ISeqSearchJob = null;

   // The URL that can be used to return and view the job data.
   jobURL: string = null;

   // The parent page
   parent: SequenceSearch = null;



   // C-tor
   constructor(parent_: SequenceSearch) {

      if (!parent_) { throw new Error("Invalid parent parameter"); }
      this.parent = parent_;

      this.elements = {
         container: null,
         searchResults: null
      }

   }

   // Create HTML for a search result row.
   createSearchResult(result_: ISearchResult, index_: number): string {

      let html = `<tr>
         <td>${index_ + 1}</td>
         <td>${result_.input_file}</td>
         <td>${Array.isArray(result_.hits) ? result_.hits.length : 0}</td>            
         <td>${result_.status.toLowerCase()}</td>
         <td>
            <button class="btn ${ButtonClass.viewHits} has-tooltip" 
               data-index="${index_}" 
               data-tippy-content="Click to view the BLAST hits"
            >${Icon.dna} View BLAST hits</button>
            <button class="btn ${ButtonClass.viewHTML} has-tooltip" 
               data-index="${index_}" 
               data-tippy-content="Click to view the HTML results (${result_.blast_html})"
            >${Icon.html} View HTML results</button>
            <button class="btn ${ButtonClass.downloadCSV} has-tooltip" 
               data-index="${index_}"
               data-tippy-content="Click to download the results as a CSV file (${result_.blast_csv})"
            >${Icon.csv} Download CSV results</button>
         </td>
      </tr>`;
      
      // TODO: Where to display errors?
      return html;
   }

   displayErrorMessage(message_: string) {
      this.elements.container.innerHTML = `<div class="error-message">${message_}</div>`;
      return;
   }

   // Download the BLAST CSV data for a specific result.
   async downloadCSV(index_: number) {

      // Get the result with the specified index.
      const result = this.job.data.results[index_];
      if (!result || !result.csv_file || !result.blast_csv) {
         await AlertBuilder.displayError("No CSV file is available for download.");
         return;
      }

      // Decode the base64-encoded CSV file and decompress it.
      const arrayBuffer: ArrayBuffer = pako.inflate(decode(result.csv_file));
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
      link.download = result.blast_csv;
      link.click();

      return;
   }

   
   async handleResultsClick(event_) {

      if (event_.target.tagName !== 'BUTTON') { return; }

      const button = event_.target as HTMLButtonElement;

      // Get and validate the button's data index attribute.
      let strDataIndex = button.getAttribute("data-index");
      const dataIndex = parseInt(strDataIndex);
      if (dataIndex < 0 || dataIndex > this.job.data.results.length) {
         await AlertBuilder.displayError(`Invalid result index: ${dataIndex}`);
         return;
      }

      // The button's class determines which action to take.
      if (button.classList.contains(ButtonClass.viewHits)) {

         this.parent.state.resultIndex = dataIndex;
         
         await this.parent.handleAction(PanelAction.displayBlastHits, PanelKey.jobDetails);

      } else if (button.classList.contains(ButtonClass.downloadCSV)) {
         await this.downloadCSV(dataIndex);

      } else if (button.classList.contains(ButtonClass.viewHTML)) {
         await this.viewHTML(dataIndex);
      }
     
      return;
   }

   async load() {

      console.log("in searchResults.load")
      
      // Create a local copy of the parent's job container Element.
      this.elements.container = this.parent.elements.searchResultsPanel;

      // Make the container visible.
      this.elements.container.classList.add("active");

      // Make a local copy of the job data.
      this.job = this.parent.job;

      if (!this.job || !this.job.data) {
         return this.displayErrorMessage("The specified job is invalid");

      } else if (!Array.isArray(this.job.data.results) || this.job.data.results.length < 1) {
         return this.displayErrorMessage("No results are available for this job");
      }

      let rowsHTML = "";

      // Generate HTML for the search results.
      this.job.data.results.forEach((result_: ISearchResult, resultIndex_: number) => {
         rowsHTML += this.createSearchResult(result_, resultIndex_);
      })
      
      // Populate the container
      this.elements.container.innerHTML = 
         `<div class="search-results-title">Search results</div>
         <table class="search-results">
            <thead>
               <tr class="header-row">
                  <th>#</th>
                  <th>Input file</th>
                  <th>Hits</th>
                  <th>Status</th>
                  <th></th>
               </tr>
            </thead>
            <tbody>${rowsHTML}</tbody>
         </table>`;

      // Get references to DOM elements.
      this.elements.searchResults = this.elements.container.querySelector(`.search-results`);
      if (!this.elements.searchResults) { throw new Error("Invalid search results element"); }

      // Add event listeners.
      this.elements.searchResults.addEventListener("click", (event_) => this.handleResultsClick(event_));
      return;
   }


   unload() {

      console.log("unloading search results panel")

      this.elements.container.classList.remove("active");

      // TODO: should we remove event listeners?
      // TODO: anything else?
   }

   // Display the BLAST HTML data for a specific result.
   async viewHTML(index_: number) {

      // Get the result with the specified index.
      const result = this.job.data.results[index_];

      // Open a new tab/window and populate it with the contents of the BLAST HTML file.
      const blastWindow = window.open("", "_blank");

      // Decode the base64-encoded HTML file and decompress it.
      const html = pako.inflate(decode(result.html_file), { to: 'string' });
      blastWindow.document.writeln(html);

      // Remove the extension from the file name and use it as the window's title.
      blastWindow.document.title = result.blast_html.replace(".html", "");

      return;
   }
}