
import { AlertBuilder } from "../../helpers/AlertBuilder";
import { ButtonClass, Constants, Icon, PanelKey } from "./Common";
import { decode } from "base64-arraybuffer";
import { ISearchResult } from "./ISearchResult";
import { ISeqSearchJob } from "./ISeqSearchJob";
import { ISeqSearchPanel } from "./ISeqSearchPanel";
import { SequenceSearch } from "./SequenceSearch";
import { SequenceSearchService } from "../../services/SequenceSearchService";
import * as pako from "pako";


export class JobPanel implements ISeqSearchPanel {
   
   // DOM elements
   elements: {
      container: HTMLElement,
      copyIdButton: HTMLButtonElement,
      jobName: HTMLInputElement,
      jobNameLabel: HTMLElement
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
         copyIdButton: null,
         jobName: null,
         jobNameLabel: null
      }

   }

   async copyJobURL() {

      // Copy the URL to the clipboard.
      await navigator.clipboard.writeText(this.jobURL);

      // Display a success message.
      return await AlertBuilder.displaySuccess("The URL has been copied to your clipboard. You can now bookmark it or paste it into a document for future reference.");
   }

   display() {

      // Create a local copy of the parent's job container Element.
      this.elements.container = this.parent.elements.jobContainer;

      // Make a local copy of the job data.
      this.job = this.parent.job;

      if (!this.job || !this.job) {
         this.elements.container.innerHTML = `<div class="no-results">No results</div>`;
         return;
      }

      // Clear any existing content in the container.
      this.elements.container.innerHTML = "";

      //----------------------------------------------------------------------------------------------------------------
      // Create the URL that can be used to view the job data.
      //----------------------------------------------------------------------------------------------------------------
      this.jobURL = window.location.href;

      // TODO: Get rid of this line soon!!!
      this.jobURL = this.jobURL.replace("test.ictv.global", "ictv.global");

      // Remove any existing query string parameters.
      let qIndex = this.jobURL.indexOf("?");
      if (qIndex > -1) { this.jobURL = this.jobURL.substring(0, qIndex); }

      this.jobURL += `?job=${this.job.uid}`;

      //----------------------------------------------------------------------------------------------------------------
      // Generate HTML for the search results.
      //----------------------------------------------------------------------------------------------------------------
      let resultsHTML = "";

      if (Array.isArray(this.parent.job.data.results) && this.parent.job.data.results.length > 0) {

         this.job.data.results.forEach((result_: ISearchResult, resultIndex_: number) => {
            resultsHTML += this.createSearchResult(result_, resultIndex_);
         })

         if (resultsHTML.length > 0) {
            resultsHTML = 
               `<table class="results-table">
                  <thead>
                     <tr class="header-row">
                        <th>Input file</th>
                        <th>Status</th>
                        <th>Hits</th>
                        <th></th>
                     </tr>
                  </thead>
                  <tbody>${resultsHTML}</tbody>
               </table>`;
         }  
      } else {
         resultsHTML = `<div class="no-results">No results</div>`;
      }

      //----------------------------------------------------------------------------------------------------------------
      // Generate the HTML for the job
      //----------------------------------------------------------------------------------------------------------------
      let html = 
         `<hr />
         <div class="results">
            <div class="results-title">Your results</div>
            <div class="job-details">
               <div class="job-table">
                  <div class="job-row">
                     <label>Job name:</label>
                     <div class="job-value">${this.job.name || "(none)"}</div>
                  </div>
                  <div class="job-row">
                     <label>Job status:</label>
                     <div class="job-value">${this.job.status}</div>
                  </div>
                  <div class="job-row">
                     <label>Program and version:</label>
                     <div class="job-value">${this.job.data.program_name} (version ${this.job.data.version})</div>
                  </div>
                  <div class="job-row">
                     <label>Database:</label>
                     <div class="job-value">${this.job.data.database_name}</div>
                  </div>
               </div>
               <div class="link-panel">
                  <div class="instructions">You can view these results again using the following URL:</div>
                  <div class="controls">
                     <a href="${this.jobURL}" target="_blank">${this.jobURL}</a> 
                     <button class="btn ${ButtonClass.copyURL}">${Icon.copy} Copy to clipboard</button>
                  </div>
               </div>
            </div>
            <hr />
            <div class="blast-hits-title">Results</div>
            <div class="search-results">${resultsHTML}</div>
         </div>`;

      this.elements.container.innerHTML = html;

      return;
   }

   // Create HTML for a search result row.
   createSearchResult(result_: ISearchResult, index_: number): string {

      let html = `<tr>
         <td>${result_.input_file}</td>
         <td>${result_.status}</td>
         <td>${Array.isArray(result_.hits) ? result_.hits.length : 0}</td>            
         <td>
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

   

   unload() {


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