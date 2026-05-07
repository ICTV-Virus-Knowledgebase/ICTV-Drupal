
import { ButtonClass, Constants, CreateKeyFromName, CreateNewSearchURL, FormatDate, FormatDuration, Icon,
   PanelKey, ToggleAccordion } from "../Common";
import { ISequence } from "../ISequence";
import { ISequenceFile } from "../ISequenceFile";
import { ITaxaBlastPanel } from "./ITaxaBlastPanel";
import { DateTime } from "luxon";
import { TaxaBLAST } from "../TaxaBLAST";
import tippy from "tippy.js";
import { Utils } from "../../../helpers/Utils";
import { JobStatus } from "../../CuratedNameManager";


export class JobDetailsPanel implements ITaxaBlastPanel {
   
   // DOM elements
   elements: {
      container: HTMLElement,

      // The error message view
      errorView: HTMLElement,

      // The job details view and its children.
      detailsView: HTMLElement,
      jobName: HTMLInputElement,
      jobNameLabel: HTMLElement,
      detailsPanelControls: HTMLElement,
      jobFiles: HTMLElement,
      sequenceResults: HTMLElement,

      // The pending job view and its children.
      pendingView: HTMLElement,
      pendingElapsed: HTMLElement,
      pendingJobName: HTMLElement,
      pendingPanelControls: HTMLElement
   }

   // Is the panel currently active/displayed?
   isActive: boolean;

   // The parent page
   parent: TaxaBLAST = null;

   // Data used for the pending job view.
   pendingData: {
      pollIntervalID: number,
      timespan: {
         
         // The number of times getJob has been called.
         attempts: number,

         // The number of seconds that have elapsed from when the job was created until it ends or now (which ever comes first).
         elapsed: number,

         intervalID: number,

         // The number of seconds until getJob is called again.
         remainingSeconds: number
      }
   }
   

   // C-tor
   constructor(containerEl_: HTMLElement, parent_: TaxaBLAST) {

      if (!containerEl_) { throw new Error("Invalid container element"); }

      if (!parent_) { throw new Error("Invalid parent parameter"); }
      this.parent = parent_;

      this.elements = {
         container: containerEl_,
         errorView: null,
         detailsView: null,
         jobFiles: null,
         jobName: null,
         jobNameLabel: null,
         detailsPanelControls: null,
         pendingJobName: null,
         pendingElapsed: null,
         pendingPanelControls: null,
         pendingView: null,
         sequenceResults: null
      }

      // Initialize the data that keeps track of pending jobs.
      this.pendingData = {
         pollIntervalID: NaN,
         timespan: {
            attempts: 1,
            elapsed: 0,
            intervalID: NaN,
            remainingSeconds: Math.floor(Constants.JOB_POLLING_INTERVAL / 1000)
         }
      }
   }

   async checkJobStatus() {

      // Load the job to see if it has completed.
      await this.parent.getJob();

      if (this.parent.job) {

         if (this.parent.job.status === JobStatus.complete) {

            if (typeof this.pendingData.pollIntervalID === "number") {
               window.clearInterval(this.pendingData.pollIntervalID);
               this.pendingData.pollIntervalID = NaN;
            }

            if (typeof this.pendingData.timespan.intervalID === "number") {
               window.clearInterval(this.pendingData.timespan.intervalID);
               this.pendingData.timespan.intervalID = NaN;
            }

            this.pendingData.timespan.remainingSeconds = 0;

            this.displayJobView();
         }
      }
      
      return;
   }

   /*
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
                     <th class="index">#</th>
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
            <div class="ictv-accordion-header sequence-file-header" data-id="${fileKey}">
               <div class="ictv-accordion-control" data-id="${fileKey}">${Icon.chevronDown}</div>
               <div class="ictv-accordion-label">
                  <div class="filename">Sequences in ${file_.name}</div>
                  <div class="sequence-count">(${sequenceCount})</div>
               </div>
            </div>
            <div class="ictv-accordion-body" data-id="${fileKey}">
               <div class="ictv-accordion-content">${sequencesHTML}</div>
            </div>
         </div>`;

      // TODO: Where to display errors?
      return html;
   }*/

   createResultsTableHTML() {

      let sequenceRows = "";

      let resultCount = 1;

      this.parent.job.data.files.forEach((file_: ISequenceFile, fileIndex_: number) => {

         console.log(`file ${fileIndex_}`, file_)

         file_.sequences.forEach((sequence_: ISequence, sequenceIndex_: number) => {

            console.log(`sequence ${sequenceIndex_}`)

            const csvTitle = `${sequence_.qseqid.replace(" ", "_")}.csv`;

            const hits = sequence_.hits !== null ? sequence_.hits.length : 0;

            const rowClass = resultCount % 2 === 0 ? "even-row" : "odd-row";

            let row = `<tr class="${rowClass}">
               <td class="query-index">${resultCount}</td>
               <td class="filename">${file_.filename}</td>
               <td class="query-id">${sequence_.qseqid}</td>
               <td class="hits">${hits}</td>
               <td class="controls">
                  <button class="btn btn-generic ${ButtonClass.viewHits} has-tooltip"
                     data-file-index="${fileIndex_}"
                     data-seq-index="${sequenceIndex_}" 
                     data-tippy-content="View the BLAST hits in a new tab"
                  >${Icon.dna}<span class="btn-label">View BLAST hits</span></button>

                  <button class="btn btn-generic ${ButtonClass.viewHTML} has-tooltip" 
                     data-filename="${sequence_.blast_html}"
                     data-tippy-content="View the alignments in a new tab"
                     data-title="${sequence_.qseqid}"
                  >${Icon.html}<span class="btn-label">View alignments</span></button>
                  
                  <button class="btn btn-generic ${ButtonClass.downloadCSV} has-tooltip" 
                     data-filename="${sequence_.blast_csv}"
                     data-tippy-content="Download the BLAST hits as a CSV file"
                     data-title="${csvTitle}"
                  >${Icon.csv}<span class="btn-label">Download results as CSV</span></button>
               </td>
            </tr>`;

            sequenceRows += row;

            resultCount += 1;
         })
      })

      let html = `<table class="query-results-table">
         <thead>
            <tr class="header-row">
               <th class="query-index">#</th>
               <th class="filename">Filename</th>
               <th class="query-id">Query ID</th>
               <th class="hits">Hits</th>
               <th class="controls"></th>
            </tr>
         </thead>
         <tbody>
         ${sequenceRows}
         </tbody>
      </table>`;

      return html;
   }

   /*
   createSequenceRow(fileIndex_: number, sequence_: ISequence, seqIndex_: number): string {

      if (!Array.isArray(sequence_.hits) || sequence_.hits.length < 1) {
         return `<tr class="no-hits-row">
            <td class="index">${seqIndex_ + 1}</td>
            <td class="qseqid">No BLAST hits for sequence ${seqIndex_ + 1}</td>
            <td class="hits">0</td>
            <td class="controls"></td>
         </tr>`
      }

      const csvTitle = `${sequence_.qseqid.replace(" ", "_")}.csv`;

      const rowClass = seqIndex_ % 2 === 0 ? "even-row" : "odd-row";
      
      let html = `<tr class="${rowClass}">
         <td class="index">${seqIndex_ + 1}</td>
         <td class="qseqid">${sequence_.qseqid}</td>
         <td class="hits">${sequence_.hits.length.toLocaleString("en-US")}</td>
         <td class="controls">
            <button class="btn btn-generic ${ButtonClass.viewHits} has-tooltip"
               data-file-index="${fileIndex_}"
               data-seq-index="${seqIndex_}" 
               data-tippy-content="View the BLAST hits in a new tab"
            >${Icon.dna}<span class="btn-label">View BLAST hits</span></button>

            <button class="btn btn-generic ${ButtonClass.viewHTML} has-tooltip" 
               data-filename="${sequence_.blast_html}"
               data-tippy-content="View the alignments in a new tab"
               data-title="${sequence_.qseqid}"
            >${Icon.html}<span class="btn-label">View alignments</span></button>
            
            <button class="btn btn-generic ${ButtonClass.downloadCSV} has-tooltip" 
               data-filename="${sequence_.blast_csv}"
               data-tippy-content="Download the BLAST hits as a CSV file"
               data-title="${csvTitle}"
            >${Icon.csv}<span class="btn-label">Download results as CSV</span></button>
         </td>
      </tr>`;

      return html;
   }*/

   // Display a message in the error view and hide the other views.
   displayErrorView(message_?: string) {

      let message = message_;
      
      if (!message) {
         if (!this.parent.job || !this.parent.job.message) {
            message = "An unknown error occurred";
         } else {
            message = this.parent.job.message;
         }
      }

      // Display the error message.
      this.elements.errorView.innerHTML = 
         `<div class="error-title">Error:</div>
         <div class="message">${message}</div>`;

      // Display the error view and hide the others.
      this.elements.errorView.classList.add("active");
      this.elements.detailsView.classList.remove("active");
      this.elements.pendingView.classList.remove("active");
   }

   displayJobView() {

      // If the job is invalid or has a status other than "complete", display an appropriate message in
      // the container element. The boolean value that's returned indicates whether a job doesn't have a 
      // completed status (and also, if a message was displayed).

      // Clear any existing content in the container.
      this.elements.detailsView.innerHTML = "";

      // Format the job name
      let jobName = Utils.safeTrim(this.parent.job.name);
      if (jobName.length < 1) { jobName = "(No job name provided)"; }

      // Emphasize the job name since it's the most important detail for users to see at a glance.
      const emphasizeName = true; 

      // Create the job details table HTML.
      const tableHTML = this.parent.createJobDetailsTable(emphasizeName);

      // Create link panel HTML with a link to the current job's details.
      const linkPanelHTML = this.parent.createLinkRow(PanelKey.jobDetails);

      const newSearchURL = CreateNewSearchURL();

      //----------------------------------------------------------------------------------------------------------------
      // Generate the HTML for the job details
      //----------------------------------------------------------------------------------------------------------------
      let html = 
         `<div class="panel-controls">
            ${linkPanelHTML}
            <button class="btn ${ButtonClass.newSearch} has-tooltip"
               data-tippy-content="Use ${Constants.APPLICATION_NAME} again with different FASTA files"
               data-url="${newSearchURL}"
            >${Icon.search} New search</button>
         </div>
         ${tableHTML}
         <div class="job-files"></div>`;

      this.elements.detailsView.innerHTML = html;

      // Get a reference to the "panel controls" DOM element.
      this.elements.detailsPanelControls = this.elements.detailsView.querySelector(".panel-controls");
      if (!this.elements.detailsPanelControls) { throw new Error(`Invalid "panel controls" DOM element`); }

      // Handle clicks in the panel controls.
      this.elements.detailsPanelControls.addEventListener("click", async (event_) => {
         return await this.parent.handleClickEvent(this.elements.detailsView, event_.target as HTMLElement);
      })

      // Get a reference to the job files DOM element.
      this.elements.jobFiles = this.elements.detailsView.querySelector(".job-files");
      if (!this.elements.jobFiles) { throw new Error("Invalid job files DOM element"); }

      // Populate the section with job file panels.
      this.populateResultsPanel();

      // Initialize tippy tooltips for buttons.
      tippy(".has-tooltip");

      // Display the details view and hide the others.
      this.elements.detailsView.classList.add("active");
      this.elements.pendingView.classList.remove("active");
      this.elements.errorView.classList.remove("active");  
   }

   displayPendingView() {

      // Format the job name.
      let jobName = !this.parent.job || !this.parent.job.name
         ? ""
         : `Job ${this.parent.job.name}`;

      this.elements.pendingJobName.innerHTML = jobName;

      // Initialize the pending data's elapsed seconds from the job's duration (in seconds) attribute.
      if (this.parent.job !== null && !isNaN(this.parent.job.duration)) {
         this.pendingData.timespan.elapsed = this.parent.job.duration;
      }

      // Check for the job results based on the defined interval.
      this.pendingData.pollIntervalID = window.setInterval(async () => {

         // Calculate the number of seconds until we check the job status again.
         this.pendingData.timespan.remainingSeconds = Math.floor(Constants.JOB_POLLING_INTERVAL / 1000);

         // Load the job to see if it has completed.
         await this.checkJobStatus();

         // Update the pending data with the job duration provided by the server.
         this.pendingData.timespan.elapsed = this.parent.job.duration;
         this.pendingData.timespan.attempts += 1;

      }, Constants.JOB_POLLING_INTERVAL);

      // This is called every second to update the number of elapsed seconds.
      this.pendingData.timespan.intervalID = window.setInterval(() => {

         // Display the number of elapsed seconds (the job duration) and then increment by one.
         this.elements.pendingElapsed.innerHTML = Utils.formatSeconds(this.pendingData.timespan.elapsed);
         this.pendingData.timespan.elapsed += 1;

      }, 1000);

      // Display the pending view and hide the others.
      this.elements.pendingView.classList.add("active");
      this.elements.detailsView.classList.remove("active");
      this.elements.errorView.classList.remove("active");  
   }

   async displayView(status_?: JobStatus) {

      if (!status_) {
         if (this.parent.job && this.parent.job.status) {
            status_ = this.parent.job.status;
         } else {
            status_ = JobStatus.pending;
         }
      }

      switch(status_) {

         case JobStatus.complete:

            // TODO: update job request metadata?

            // Display the completed job view.
            this.displayJobView();
            break;

         case JobStatus.crashed:
         case JobStatus.error:
         case JobStatus.invalid:

            // Display the error message view.
            this.displayErrorView();
            break;

         case JobStatus.pending:

            this.displayPendingView();
            break;

         default:
            this.displayErrorView(`Unrecognized job status ${status_}`);
      }

      return;
   }

   // Load the panel contents and display them on the page.
   async load(): Promise<void> {

      this.isActive = true;

      // Make the container visible.
      this.elements.container.classList.add("active");
      

      // Create link panel HTML with a link to the current job's details.
      const linkPanelHTML = this.parent.createLinkRow(PanelKey.jobDetails);

      // The URL for a new search.
      const newSearchURL = CreateNewSearchURL();

      //----------------------------------------------------------------------------------------------------------------
      // Generate HTML for the job details and pending job views.
      //----------------------------------------------------------------------------------------------------------------
      const html = 
         `<div class="job-details panel-view"></div>
         <div class="pending-message panel-view">
            <div class="panel-controls">
               ${linkPanelHTML}
               <button class="btn ${ButtonClass.newSearch} has-tooltip"
                  data-tippy-content="Use ${Constants.APPLICATION_NAME} again with different FASTA files"
                  data-url="${newSearchURL}"
               >${Icon.search} New search</button>
            </div>
            <div class="pending-job-name"></div>
            <div class="processing-message">Your job is being processed. This can take several minutes depending on the size of your input 
            FASTA file(s) and the current load on the system.</div>
            <div class="pending-elapsed-panel">
               <label>Elapsed time:</label>
               <span class="pending-elapsed">calculating...</span>
            </div>
         </div>
         <div class="error-message panel-view"></div>`;
      
      this.elements.container.innerHTML = html;

      // The job details view
      this.elements.detailsView = this.elements.container.querySelector(".job-details");
      if (!this.elements.detailsView) { throw new Error("Invalid details section element"); }

      // The error message view
      this.elements.errorView = this.elements.container.querySelector(".error-message");
      if (!this.elements.errorView) { throw new Error("Invalid error section element"); }

      // The pending message view and its child elements.
      this.elements.pendingView = this.elements.container.querySelector(".pending-message");
      if (!this.elements.pendingView) { throw new Error("Invalid pending section element"); }

      this.elements.pendingJobName = this.elements.pendingView.querySelector(".pending-job-name");
      if (!this.elements.pendingJobName) { throw new Error("Invalid pending job name element"); }

      this.elements.pendingElapsed = this.elements.pendingView.querySelector(".pending-elapsed");
      if (!this.elements.pendingElapsed) { throw new Error("Invalid pending elapsed element"); }

      this.elements.pendingPanelControls = this.elements.pendingView.querySelector(".panel-controls");
      if (!this.elements.pendingPanelControls) { throw new Error("Invalid pending panel controls element"); }

      // Handle clicks in the pending view's new search row.
      this.elements.pendingPanelControls.addEventListener("click", async (event_) => {
         return await this.parent.handleClickEvent(this.elements.pendingPanelControls, event_.target as HTMLElement);
      })

      // Get a reference to the "panel controls" DOM element.
      //this.elements.detailsPanelControls = this.elements.detailsView.querySelector(".panel-controls");
      //if (!this.elements.detailsPanelControls) { throw new Error(`Invalid "panel controls" DOM element`); }

      // Handle clicks in the panel controls.
      //this.elements.detailsPanelControls.addEventListener("click", async (event_) => {
      //   return await this.parent.handleClickEvent(this.elements.detailsView, event_.target as HTMLElement);
      //})


      // Get the job associated with the job UID.
      await this.parent.getJob();

      // Use the job status to determine which view to display.
      return await this.displayView();
   }

   populateResultsPanel() {

      if (!Array.isArray(this.parent.job.data.files) || this.parent.job.data.files.length < 1) {
         this.elements.jobFiles.innerHTML = "No FASTA files are available for this job";
         return;
      }

      let resultsHTML = this.createResultsTableHTML();

      // Generate HTML for the search results.
      //this.parent.job.data.files.forEach((file_: ISequenceFile, fileIndex_: number) => {
      //   html += this.createFileHTML(file_, fileIndex_);
      //})
      
      // Populate the container
      this.elements.jobFiles.innerHTML = 
         `<div class="query-results-title">Query results</div>
         <div class="query-results">${resultsHTML}</div>`;

      // Get references to DOM elements.
      this.elements.sequenceResults = this.elements.jobFiles.querySelector(`.query-results`);
      if (!this.elements.sequenceResults) { throw new Error("Invalid sequence results element"); }

      // Add a click event handler.
      this.elements.sequenceResults.addEventListener("click", async (event_) => {
         return await this.parent.handleClickEvent(this.elements.jobFiles, event_.target as HTMLElement);
      });
      
      /*
      // If there's only one file, go ahead and expand its accordion.
      if (this.parent.job.data.files.length === 1 && !!this.parent.job.data.files[0]) {
         const file = this.parent.job.data.files[0];
         const fileKey = CreateKeyFromName(file.name);

         const itemEl = this.elements.sequenceResults.querySelector(`.ictv-accordion-item[data-id="${fileKey}"]`) as HTMLElement;
         if (!itemEl) { throw new Error(`Invalid element for file key ${fileKey}`); }
         
         itemEl.classList.add("active"); // TEST

         // Click to expand the accordion for the single file.
         itemEl.click();
      }*/

      return;
   }

   async unload(): Promise<void> {
      this.isActive = false;
      this.elements.container.classList.remove("active");

      // TODO: should we remove event listeners?
      return;
   }
}