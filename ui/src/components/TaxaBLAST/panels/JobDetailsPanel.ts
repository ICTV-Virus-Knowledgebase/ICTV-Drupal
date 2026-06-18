
import { ButtonClass, Constants, CreateNewSearchURL, Icon,
   PanelKey } from "../Common";
import { ISequence } from "../ISequence";
import { ISequenceFile } from "../ISequenceFile";
import { ITaxaBlastPanel } from "./ITaxaBlastPanel";
import { TaxaBLAST } from "../TaxaBLAST";
import tippy from "tippy.js";
import { Utils } from "../../../helpers/Utils";
import { JobStatus } from "../../CuratedNameManager";
import { AlertBuilder } from "../../../helpers/AlertBuilder";


export class JobDetailsPanel implements ITaxaBlastPanel {
   
   // DOM elements
   elements: {
      container: HTMLElement,

      // The error message view
      errorView: HTMLElement,

      // The job details view and its children.
      detailsView: HTMLElement,
      detailsPanelControls: HTMLElement,
      linkPanel: HTMLElement,
      resultsPanel: HTMLElement,

      // The pending job view and its children.
      pendingView: HTMLElement,
      pendingElapsed: HTMLElement,
      pendingJobName: HTMLElement,
      pendingPanelControls: HTMLElement,
      pendingLowerControls: HTMLElement
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
         linkPanel: null,
         resultsPanel: null,
         detailsPanelControls: null,
         pendingJobName: null,
         pendingElapsed: null,
         pendingPanelControls: null,
         pendingLowerControls: null,
         pendingView: null
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

         } else if ([JobStatus.crashed, JobStatus.error, JobStatus.invalid].includes(this.parent.job.status)) {

            // Turn off the polling and elapsed time update.
            if (typeof this.pendingData.pollIntervalID === "number") {
               window.clearInterval(this.pendingData.pollIntervalID);
               this.pendingData.pollIntervalID = NaN;
            }

            if (typeof this.pendingData.timespan.intervalID === "number") {
               window.clearInterval(this.pendingData.timespan.intervalID);
               this.pendingData.timespan.intervalID = NaN;
            }

            this.pendingData.timespan.remainingSeconds = 0;

            let message = Utils.safeTrim(this.parent.job.message);
            if (!message) { message = `An unknown error occurred and the job exited with status "${this.parent.job.status}"`; }

            this.displayErrorView(message);
         }
      }
      
      return;
   }

   createResultsTableHTML() {

      let sequenceRows = "";

      let resultIndex = 0;

      this.parent.job.data.files.forEach((file_: ISequenceFile, fileIndex_: number) => {

         file_.sequences.forEach((sequence_: ISequence, sequenceIndex_: number) => {

            const csvTitle = `${sequence_.qseqid.replace(" ", "_")}.csv`;

            const hits = sequence_.hits !== null ? sequence_.hits.length : 0;

            const enabled = hits < 1 ? "disabled" : "";

            const rowClass = resultIndex % 2 === 0 ? "even-row" : "odd-row";

            let row = `<tr class="${rowClass}">
               <td class="query-index">${resultIndex + 1}</td>
               <td class="filename">${file_.filename}</td>
               <td class="query-id">${sequence_.qseqid}</td>
               <td class="hits">${hits}</td>
               <td class="controls">
                  <button class="btn btn-generic ${ButtonClass.viewHits} has-tooltip" ${enabled}
                     data-file-index="${fileIndex_}"
                     data-seq-index="${sequenceIndex_}" 
                     data-tippy-content="View the BLAST hits in a new tab"
                  >${Icon.dna}<span class="btn-label">View BLAST hits</span></button>

                  <button class="btn btn-generic ${ButtonClass.viewHTML} has-tooltip" ${enabled}
                     data-filename="${sequence_.blast_html}"
                     data-tippy-content="View the alignments in a new tab"
                     data-title="${sequence_.qseqid}"
                  >${Icon.html}<span class="btn-label">View alignments</span></button>
                  
                  <button class="btn btn-generic ${ButtonClass.downloadCSV} has-tooltip" ${enabled}
                     data-filename="${sequence_.blast_csv}"
                     data-tippy-content="Download the BLAST hits as a CSV file"
                     data-title="${csvTitle}"
                  >${Icon.csv}<span class="btn-label">Download results as CSV</span></button>
               </td>
            </tr>`;

            sequenceRows += row;

            resultIndex += 1;
         })
      })

      let html = `<table class="job-results">
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

      // Get the message element and populate it.
      const messageEl = this.elements.errorView.querySelector(".message");
      if (!messageEl) { 
         AlertBuilder.displayErrorSync("The error message element is invalid"); 
      } else {
         messageEl.innerHTML = message;
      }
      
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

      // Create the job details table HTML.
      const jobDetailsHTML = this.parent.createJobDetailsTable(false);

      // Create link panel HTML with a link to the current job's details.
      const linkPanelHTML = this.parent.createLinkRow(PanelKey.jobDetails);

      // When the user clicks on the "new search" button, this URL is opened in a new tab.
      const newSearchURL = CreateNewSearchURL();

      let resultsHTML = "";

      if (!Array.isArray(this.parent.job.data.files) || this.parent.job.data.files.length < 1) {
         resultsHTML = `<div class="no-results">No results are available for this job.</div>`;
      } else {
         // Create HTML for the results table.
         resultsHTML = this.createResultsTableHTML();
      }

      //----------------------------------------------------------------------------------------------------------------
      // Generate the HTML for the details view.
      //----------------------------------------------------------------------------------------------------------------
      this.elements.detailsView.innerHTML = 
         `<div class="controls-row">
            <button class="btn ${ButtonClass.newSearch} has-tooltip"
               data-tippy-content="Use ${Constants.APPLICATION_NAME} again with different FASTA files"
               data-url="${newSearchURL}"
            >${Icon.search} New search</button>
         </div>
         ${linkPanelHTML}

         <div class="panel-title">Job details</div>
         ${jobDetailsHTML}
         <div class="panel-title">Search results</div>
         <div class="job-results">${resultsHTML}</div>`;

      //--------------------------------------------------------------------------------------------------------------------------------------
      // Get references to DOM elements
      //--------------------------------------------------------------------------------------------------------------------------------------
      this.elements.detailsPanelControls = this.elements.detailsView.querySelector(".controls-row");
      if (!this.elements.detailsPanelControls) { throw new Error(`Invalid "panel controls" DOM element`); }

      this.elements.linkPanel = this.elements.container.querySelector(".link-panel");
      if (!this.elements.linkPanel) { throw new Error("Invalid link panel DOM element"); }

      this.elements.resultsPanel = this.elements.detailsView.querySelector(".job-results");
      if (!this.elements.resultsPanel) { throw new Error("Invalid results panel DOM element"); }

      //--------------------------------------------------------------------------------------------------------------------------------------
      // Handle click events
      //--------------------------------------------------------------------------------------------------------------------------------------
      this.elements.detailsPanelControls.addEventListener("click", async (event_) => {
         return await this.parent.handleClickEvent(this.elements.detailsView, event_.target as HTMLElement);
      })

      this.elements.linkPanel.addEventListener("click", async (event_: MouseEvent) => {
         const target = event_.target as HTMLElement;
         return await this.parent.handleClickEvent(this.elements.container, target);
      })

      this.elements.resultsPanel.addEventListener("click", async (event_) => {
         return await this.parent.handleClickEvent(this.elements.resultsPanel, event_.target as HTMLElement);
      });

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
      
      // The URL for a new search.
      const newSearchURL = CreateNewSearchURL();

      // Create link panel HTML with a link to the current job's details.
      const linkPanelHTML = this.parent.createLinkRow(PanelKey.jobDetails);

      //----------------------------------------------------------------------------------------------------------------
      // Generate HTML for the job details and pending job views.
      //----------------------------------------------------------------------------------------------------------------
      const html = 
         `<div class="job-details panel-view"></div>
         <div class="pending-message panel-view">
            ${linkPanelHTML}
            <div class="pending-job-name"></div>
            <div class="processing-message">Your job is being processed. This can take several minutes depending on the size of your input 
            FASTA file(s) and the current load on the system.</div>
            <div class="pending-elapsed-panel">
               <label>Elapsed time:</label>
               <span class="pending-elapsed">calculating...</span>
            </div>
            <div class="lower-controls">
               <button class="btn ${ButtonClass.newSearch} has-tooltip"
                  data-tippy-content="Use ${Constants.APPLICATION_NAME} again with different FASTA files"
                  data-url="${newSearchURL}"
               >${Icon.search} New search</button>
            </div>
         </div>
         <div class="error-message panel-view">
            <div class="message"></div>
            <div class="controls-row">
               <button class="btn ${ButtonClass.newSearch} has-tooltip"
                  data-tippy-content="Use ${Constants.APPLICATION_NAME} again with different FASTA files"
                  data-url="${newSearchURL}"
               >${Icon.search} New search</button>
            </div>
         </div>`;
      
      this.elements.container.innerHTML = html;

      //--------------------------------------------------------------------------------------------------------------------------------------
      // Get references to DOM elements
      //--------------------------------------------------------------------------------------------------------------------------------------
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

      //--------------------------------------------------------------------------------------------------------------------------------------
      // Handle click events
      //--------------------------------------------------------------------------------------------------------------------------------------
      this.elements.errorView.addEventListener("click", async (event_) => {
         return await this.parent.handleClickEvent(this.elements.errorView, event_.target as HTMLElement);
      })

      this.elements.pendingView.addEventListener("click", async (event_) => {
         return await this.parent.handleClickEvent(this.elements.pendingView, event_.target as HTMLElement);
      })
      
      // Get the job associated with the job UID.
      await this.parent.getJob();

      // Use the job status to determine which view to display.
      return await this.displayView();
   }

   async unload(): Promise<void> {
      this.isActive = false;
      this.elements.container.classList.remove("active");

      // TODO: should we remove event listeners?
      return;
   }
}