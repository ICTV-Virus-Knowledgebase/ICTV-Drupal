
import { ButtonClass, Constants, CreateKeyFromName, CreateNewSearchURL, FormatDate, FormatDuration, Icon,
   PanelKey, ToggleAccordion } from "../Common";
import { ISequence } from "../ISequence";
import { ISequenceFile } from "../ISequenceFile";
//import { ITaxaBlastJob } from "../ITaxaBlastJob";
import { ITaxaBlastPanel } from "./ITaxaBlastPanel";
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
      panelControls: HTMLElement,
      jobFiles: HTMLElement,
      resultFiles: HTMLElement,

      // The pending job view and its children.
      pendingView: HTMLElement,
      //pendingAttempts: HTMLElement,
      pendingElapsed: HTMLElement,
      pendingJobName: HTMLElement,
      //pendingTimespan: HTMLElement
   }

   // Is the panel currently active/displayed?
   isActive: boolean;

   // The parent page
   parent: TaxaBLAST = null;

   // Data used for the pending job view.
   pendingData = {
      pollIntervalID: NaN,
      timespan: {
         
         // The number of times getJob has been called.
         attempts: 1,

         elapsed: 0,

         intervalID: NaN,

         // The number of seconds until getJob is called again.
         remainingSeconds: Math.floor(Constants.JOB_POLLING_INTERVAL / 1000)
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
         panelControls: null,
         //pendingAttempts: null,
         pendingJobName: null,
         pendingElapsed: null,
         pendingView: null,
         resultFiles: null
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
            <div class="ictv-accordion-header" data-id="${fileKey}">
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

      const hitsCount = Array.isArray(sequence_.hits) ? sequence_.hits.length.toLocaleString("en-US") : 0;

      const csvTitle = `${sequence_.qseqid.replace(" ", "_")}.csv`;

      let html = `<tr>
         <td class="qseqid">${sequence_.qseqid}</td>
         <td class="hits">${hitsCount}</td>
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

      this.elements.errorView.innerHTML = message;

      // Display the error view and hide the others.
      this.elements.errorView.classList.add("active");
      this.elements.detailsView.classList.remove("active");
      this.elements.pendingView.classList.remove("active");
   }

   displayJobView() {

      // If the job is invalid or has a status other than "complete", display an appropriate message in
      // the container element. The boolean value that's returned indicates whether a job doesn't have a 
      // completed status (and also, if a message was displayed).

      //if (DisplayMessageForIncompleteJob(this.elements.detailsView, this.parent.job)) { return; }

      // Clear any existing content in the container.
      this.elements.detailsView.innerHTML = "";

      // Format the job name
      let jobName = Utils.safeTrim(this.parent.job.name);
      if (jobName.length < 1) { jobName = "(No job name provided)"; }

      // Format the created on and ended on date/times.
      let createdOn = FormatDate(this.parent.job.createdOn);

      // Format the duration between two date/times.
      let duration = FormatDuration(this.parent.job.createdOn, this.parent.job.endedOn);

      // TODO: Temporary fix to display taxablast instead of seqsearch.
      let programName = "taxablast"; // this.parent.job.data.program_name;

      // Create the link panel HTML containing a link to this job's details.
      const linkPanelHTML = this.parent.createLinkRow(PanelKey.jobDetails);

      const newSearchURL = CreateNewSearchURL();

      //----------------------------------------------------------------------------------------------------------------
      // Generate the HTML for the job details
      //----------------------------------------------------------------------------------------------------------------
      let html = 
         `<div class="panel-title">Search Results</div>
         <div class="panel-controls">
            ${linkPanelHTML}
            <button class="btn ${ButtonClass.newSearch} has-tooltip"
               data-tippy-content="Use ${Constants.APPLICATION_NAME} again with different FASTA files"
               data-url="${newSearchURL}"
            >${Icon.search} New search</button>
         </div>
         <table class="job-details">
            <tbody>
               <tr class="job-name-row">
                  <th class="job-name-label">Job name</th>
                  <td class="job-name">${jobName}</td>
               </tr>
               <tr>
                  <th>Started</th>
                  <td>${createdOn || "(unknown)"}</td>
               </tr>
               <tr>
                  <th>Duration</th>
                  <td>${duration || "(unknown)"}</td>
               </tr>
               <tr>
                  <th>Status</th>
                  <td>${this.parent.job.status}</td>
               </tr>
               <tr>
                  <th>Program and version</th>
                  <td>${programName} (version ${this.parent.job.data.version})</td>
               </tr>
               <tr>
                  <th>Database</th>
                  <td>${this.parent.job.data.database_title}</td>
               </tr>
               <tr>
                  <th>BLAST parameters</th>
                  <td class="blast-parameters">
                     <div class="blast-parameter-row">
                        <label>Task</label>
                        <div class="blast-value">${this.parent.job.data.task}</div>
                     </div>
                     <div class="blast-parameter-row">
                        <label>Max HSPS</label>
                        <div class="blast-value">${this.parent.job.data.max_hsps}</div>
                     </div>
                     <div class="blast-parameter-row">
                        <label>Max target seqs</label>
                        <div class="blast-value">${this.parent.job.data.max_target_seqs}</div>
                     </div>
                     <div class="blast-parameter-row">
                        <label>Command</label>
                        <div class="blast-command">${this.parent.job.data.blastasn_cmd}</div>
                     </div>      
                  </td>
               </tr>
            </tbody>
         </table>
         <div class="job-files"></div>`;

      this.elements.detailsView.innerHTML = html;

      // Get a reference to the "panel controls" DOM element.
      this.elements.panelControls = this.elements.detailsView.querySelector(".panel-controls");
      if (!this.elements.panelControls) { throw new Error(`Invalid "panel controls" DOM element`); }

      // Handle clicks in the panel controls.
      this.elements.panelControls.addEventListener("click", async (event_) => {
         return await this.parent.handleClickEvent(this.elements.detailsView, event_.target as HTMLElement);
      })

      // Get a reference to the job files DOM element.
      this.elements.jobFiles = this.elements.detailsView.querySelector(".job-files");
      if (!this.elements.jobFiles) { throw new Error("Invalid job files DOM element"); }

      // Populate the section with job file panels.
      this.populateFilesPanel();

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

      // Check for the job results based on the defined interval.
      this.pendingData.pollIntervalID = window.setInterval(async () => {

         this.pendingData.timespan.remainingSeconds = Math.floor(Constants.JOB_POLLING_INTERVAL / 1000);

         console.log(`in poll interval, remaining seconds = ${this.pendingData.timespan.remainingSeconds}`)

         // Load the job to see if it has completed.
         //await this.checkJobStatus()

         this.pendingData.timespan.attempts += 1;

         //this.elements.pendingAttempts.innerHTML = `${this.pendingData.timespan.attempts}`;

      }, Constants.JOB_POLLING_INTERVAL);

      // Reset the timespan's number of seconds remaining until the next "get job" (converting milliseconds to seconds).
      //this.pendingData.timespan.remainingSeconds = Constants.JOB_POLLING_INTERVAL / 1000;

      this.pendingData.timespan.intervalID = window.setInterval(() => {

         this.elements.pendingElapsed.innerHTML = Utils.formatSeconds(this.pendingData.timespan.elapsed);

         this.pendingData.timespan.elapsed += 1;

      }, 1000);

      /*
      // Update the number of seconds remaining every second.
      this.pendingData.timespan.intervalID = window.setInterval(async () => {
         
         console.log(`in the timespan interval remainingSeconds = ${this.pendingData.timespan.remainingSeconds}`)

         this.elements.pendingTimespan.innerHTML = Utils.formatSeconds(this.pendingData.timespan.remainingSeconds);
         this.pendingData.timespan.remainingSeconds -= 1;
      }, 1000);
      */

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
   async load() {

      console.info("LOADING job details panel")

      this.isActive = true;

      // Make the container visible.
      this.elements.container.classList.add("active");
      
      // The initial time remaining until calling getJobs again.
      //const refreshSeconds = Utils.formatSeconds(Math.floor(Constants.JOB_POLLING_INTERVAL / 1000));

      const html = 
         `<div class="job-details panel-view"></div>
         <div class="pending-message panel-view">
            <div class="pending-job-name"></div>
            <div class="processing-message">Your job is being processed. This can take several minutes depending on the size of your input 
            FASTA file(s) and the current load on the system.</div>
            <div class="pending-elapsed-panel">
               <label>Elapsed time:</label>
               <span class="pending-elapsed">0</span>
            </div>
         </div>
         <div class="error-message panel-view"></div>`;

      //Your job<span class="pending-job-name"></span> is still running, but we will check on it in <span class="pending-timespan">${refreshSeconds}</span>
      // (attempt #<span class="pending-attempts">1</span>)
      
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

      //this.elements.pendingAttempts = this.elements.pendingView.querySelector(".pending-attempts");
      //if (!this.elements.pendingAttempts) { throw new Error("Invalid pending attempts element"); }

      this.elements.pendingJobName = this.elements.pendingView.querySelector(".pending-job-name");
      if (!this.elements.pendingJobName) { throw new Error("Invalid pending job name element"); }

      //this.elements.pendingTimespan = this.elements.pendingView.querySelector(".pending-timespan");
      //if (!this.elements.pendingTimespan) { throw new Error("Invalid pending timespan element"); }

      this.elements.pendingElapsed = this.elements.pendingView.querySelector(".pending-elapsed");
      if (!this.elements.pendingElapsed) { throw new Error("Invalid pending elapsed element"); }

      // TODO: determine whether to display the details section, the pending message section, or the error message section.

      // Get the job associated with the job UID.
      await this.parent.getJob();

      console.log("in load(), parent job = ", this.parent.job)

      // TODO: remove pending!!!
      await this.displayView(JobStatus.pending);

      return;
   }

   populateFilesPanel() {

      if (!Array.isArray(this.parent.job.data.files) || this.parent.job.data.files.length < 1) {
         this.elements.jobFiles.innerHTML = "No FASTA files are available for this job";
         return;
      }

      let html = "";

      // Generate HTML for the search results.
      this.parent.job.data.files.forEach((file_: ISequenceFile, fileIndex_: number) => {
         html += this.createFileHTML(file_, fileIndex_);
      })
      
      // Populate the container
      this.elements.jobFiles.innerHTML = 
         `<div class="result-files-title">Files</div>
         <div class="result-files">${html}</div>`;

      // Get references to DOM elements.
      this.elements.resultFiles = this.elements.jobFiles.querySelector(`.result-files`);
      if (!this.elements.resultFiles) { throw new Error("Invalid result files element"); }

      // Add a click event handler.
      this.elements.resultFiles.addEventListener("click", async (event_) => {
         return await this.parent.handleClickEvent(this.elements.jobFiles, event_.target as HTMLElement);
      });
      
      // If there's only one file, go ahead and expand its accordion.
      if (this.parent.job.data.files.length === 1 && !!this.parent.job.data.files[0]) {
         const file = this.parent.job.data.files[0];
         const fileKey = CreateKeyFromName(file.name);

         const itemEl = this.elements.resultFiles.querySelector(`.ictv-accordion-item[data-id="${fileKey}"]`) as HTMLElement;
         if (!itemEl) { throw new Error(`Invalid element for file key ${fileKey}`); }
         
         itemEl.classList.add("active"); // TEST

         // Click to expand the accordion for the single file.
         itemEl.click();
      }

      return;
   }

   unload() {
      this.isActive = false;
      this.elements.container.classList.remove("active");

      // TODO: should we remove event listeners?
   }
}