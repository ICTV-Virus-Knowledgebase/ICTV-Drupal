
import { AlertBuilder } from "../../helpers/AlertBuilder";
import { ButtonClass, Constants, Icon, PanelAction, PanelKey } from "./Common";
import { DateTime, Interval } from "luxon";
import { decode } from "base64-arraybuffer";
import { ISearchResult } from "./ISearchResult";
import { ISeqSearchJob } from "./ISeqSearchJob";
import { ISeqSearchPanel } from "./ISeqSearchPanel";
import { SequenceSearch } from "./SequenceSearch";
import { Utils } from "../../helpers/Utils";
import * as pako from "pako";


export class JobDetailsPanel implements ISeqSearchPanel {
   
   dateFormat = {
      from: "yyyy-MM-dd HH:mm:ss",
      toDate: "cccc, LLLL d, y",
      toTime: "h:mm:ss a"
   }

   // DOM elements
   elements: {
      container: HTMLElement,
      copyUrlButton: HTMLButtonElement,
      jobName: HTMLInputElement,
      jobNameLabel: HTMLElement,
      searchResults: HTMLElement
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
         copyUrlButton: null,
         jobName: null,
         jobNameLabel: null,
         searchResults: null
      }

   }

   async copyJobURL() {

      // Copy the URL to the clipboard.
      await navigator.clipboard.writeText(this.jobURL);

      // Display a success message.
      return await AlertBuilder.displaySuccess("The URL has been copied to your clipboard. You can now bookmark it or paste it into a document for future reference.");
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

   formatDate(date_: string) {

      date_ = Utils.safeTrim(date_);
      if (date_.length < 1) { return "(invalid date)"; }

      const dateObject = DateTime.fromFormat(date_, this.dateFormat.from);
      
      const datePart = Utils.safeTrim(dateObject.toFormat(this.dateFormat.toDate));
      const timePart = Utils.safeTrim(dateObject.toFormat(this.dateFormat.toTime));

      return `${datePart} at ${timePart}`;
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
         
         await this.parent.updatePage();
   
         //await this.parent.handleAction(PanelAction.displayBlastHits);

      } else if (button.classList.contains(ButtonClass.downloadCSV)) {
         await this.downloadCSV(dataIndex);

      } else if (button.classList.contains(ButtonClass.viewHTML)) {
         await this.viewHTML(dataIndex);
      }
     
      return;
   }

   async load() {

      console.log("in jobPanel.load")
      
      this.isActive = true;

      // Make the container visible.
      this.elements.container.classList.add("active");

      // Make a local copy of the job data.
      this.job = this.parent.job;

      if (!this.job || !this.job.data) {
         this.elements.container.innerHTML = `<div class="no-results">Invalid job</div>`;
         return;
      }

      // Clear any existing content in the container.
      this.elements.container.innerHTML = "";

      //----------------------------------------------------------------------------------------------------------------
      // Create the URL that can be used to view the job data.
      //----------------------------------------------------------------------------------------------------------------
      this.jobURL = this.parent.createUrlUsingState();

      /*window.location.href;

      // TODO: Get rid of this line soon!!!
      this.jobURL = this.jobURL.replace("://ictv.global", "://test.ictv.global");

      // Remove any existing query string parameters.
      let qIndex = this.jobURL.indexOf("?");
      if (qIndex > -1) { this.jobURL = this.jobURL.substring(0, qIndex); }

      this.jobURL += `?job=${this.job.uid}`;
      */

      // Format the created on and ended on date/times.
      let createdOn = this.formatDate(this.job.createdOn);
      let endedOn = this.formatDate(this.job.endedOn);

      //----------------------------------------------------------------------------------------------------------------
      // Generate the HTML for the job
      //----------------------------------------------------------------------------------------------------------------
      let html = 
         `<table class="job-details">
            <tbody>
               <tr>
                  <th>Job name</th>
                  <td>${this.job.name || "(none)"}</td>
               </tr>
               <tr>
                  <th>Started</th>
                  <td>${createdOn || "(unknown)"}</td>
               </tr>
               <tr>
                  <th>Ended</th>
                  <td>${endedOn || "(unknown)"}</td>
               </tr>
               <tr>
                  <th>Status</th>
                  <td>${this.job.status}</td>
               </tr>
               <tr>
                  <th>Program and version</th>
                  <td>${this.job.data.program_name} (version ${this.job.data.version})</td>
               </tr>
               <tr>
                  <th>Database</th>
                  <td>${this.job.data.database_name}</td>
               </tr>
            </tbody>
         </table>

         <div class="link-panel">
            <div class="instructions">You can view these search results again using the following URL:</div>
            <div class="controls">
               <a href="${this.jobURL}" target="_blank">${this.jobURL}</a> 
               <button class="btn ${ButtonClass.copyURL}">${Icon.copy} Copy to clipboard</button>
            </div>
         </div>`;
         
      this.elements.container.innerHTML = html;

      this.elements.copyUrlButton = this.elements.container.querySelector(`.${ButtonClass.copyURL}`);
      if (!this.elements.copyUrlButton) { throw new Error("Invalid copy URL button element"); }

      // Add event listeners.
      this.elements.copyUrlButton.addEventListener("click", () => this.copyJobURL());
      return;
   }


   unload() {

      console.log("unloading upload panel")
      console.debug("this.elements.container = ", this.elements.container)

      this.isActive = false;

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