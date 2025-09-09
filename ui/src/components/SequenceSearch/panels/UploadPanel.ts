
import { AlertBuilder } from "../../../helpers/AlertBuilder";
import { ButtonClass, FormatBytes, Constants, Icon, GetSpinnerHTML, PanelKey } from "../Common";
import { IFileData } from "../../../models/IFileData";
import { ISeqSearchPanel } from "./ISeqSearchPanel";
import { IUploadResult } from "../IUploadResults";
import { JobStatus } from "../../../global/Types";
import { ParseFASTA } from "../../../helpers/FastaUtils";
import { SequenceSearch } from "../SequenceSearch";
import { SequenceSearchService } from "../../../services/SequenceSearchService";
import { SubmissionStatus } from "../SubmissionStatus";
import tippy from "tippy.js";
import { Utils } from "../../../helpers/Utils";


enum PanelMode {

   // The user can select one or more FASTA files.
   file_selection = "file_selection",

   // If FASTA files have been selected, the user can name the job and upload the file(s).
   job_submission = "job_submission",

   // The user has uploaded the file(s) to the web service and we're waiting for the new  
   // job UID and the status of the upload.
   job_submitted = "job_submitted",

   // The files have been uploaded and we are waiting for the TaxaBLAST job to complete.
   pending_results = "pending_results",

   // TEST
   previous_panel = "previous_panel"
}


export class UploadPanel implements ISeqSearchPanel {

   containerSelector: string;

   // DOM elements
   elements: {
      container: HTMLElement,

      // The file selection sub-panel
      fileSelectionSubPanel: HTMLElement,
      fileControl: HTMLElement,
      fileInput: HTMLInputElement,
      
      // The job submission sub-panel
      jobSubmissionSubPanel: HTMLElement,
      cancelButton: HTMLButtonElement,
      jobName: HTMLInputElement,
      jobNameLabel: HTMLElement,
      selectedFiles: HTMLElement,
      uploadButton: HTMLButtonElement,

      // The "job submitted" sub-panel
      jobSubmittedSubPanel: HTMLElement,

      // The "pending results" sub-panel
      resultsSubPanel: HTMLElement
   }

   // Is the panel currently active/displayed?
   isActive: boolean;

   mode: PanelMode;

   // The parent page
   parent: SequenceSearch = null;

   // TEST
   previousPanelMode: PanelMode = null;

   // Metadata about polling the web service for job status.
   submissionStatus: SubmissionStatus;


   // C-tor
   constructor(containerEl_: HTMLElement, parent_: SequenceSearch) {

      if (!containerEl_) { throw new Error("Invalid container element"); }

      this.mode = PanelMode.file_selection;

      if (!parent_) { throw new Error("Invalid parent parameter"); }
      this.parent = parent_;

      this.elements = {
         container: containerEl_,
         
         // The file selection panel
         fileSelectionSubPanel: null,
         fileControl: null,
         fileInput: null,

         // The "job submitted" panel
         jobSubmittedSubPanel: null,
         
         // The job submission panel
         jobSubmissionSubPanel: null,
         cancelButton: null,
         jobName: null,
         jobNameLabel: null,
         selectedFiles: null,
         uploadButton: null,

         // The "pending results" panel
         resultsSubPanel: null
      }

      this.submissionStatus = new SubmissionStatus();
   }

   // Change which panel will be displayed (the other panel will be hidden).
   async changePanelMode(mode_: PanelMode) {

      switch (mode_) {

         case PanelMode.file_selection:

            // Display the file selection panel.
            this.elements.fileSelectionSubPanel.classList.add("active");

            // Clear the file input
            this.elements.fileInput.value = ""; 
            this.elements.fileInput.files = null;

            // Hide the other panels.
            this.elements.jobSubmittedSubPanel.innerHTML = "";
            this.elements.jobSubmittedSubPanel.classList.remove("active");
            this.elements.jobSubmissionSubPanel.classList.remove("active");
            break;

         case PanelMode.job_submission:

            // TODO: What if we get here but no files are selected?

            // Display the job submission panel.
            this.elements.jobSubmissionSubPanel.classList.add("active");

            // Hide the other sub-panels.
            this.elements.fileSelectionSubPanel.classList.remove("active");
            this.elements.jobSubmittedSubPanel.innerHTML = "";
            this.elements.jobSubmittedSubPanel.classList.remove("active");
            this.elements.resultsSubPanel.classList.remove("active");

            // Hide the other top-level panels.
            this.parent.updatePanel(PanelKey.jobDetails, false);
            this.parent.updatePanel(PanelKey.searchResults, false);
            this.parent.updatePanel(PanelKey.blastHits, false);

            // List the selected files.
            let filesHTML = "";
            for (let f=0; f < this.elements.fileInput.files.length; f++) {
               const file = this.elements.fileInput.files.item(f);
               if (!file) { continue; }

               filesHTML += `<li>${file.name} (${FormatBytes(file.size, 1)})</li>`;
            }

            this.elements.selectedFiles.innerHTML = `<ul>${filesHTML}</ul>`;
            break;

         case PanelMode.job_submitted:

            // Display the file processing panel.
            this.elements.jobSubmittedSubPanel.classList.add("active");

            const spinnerHTML = GetSpinnerHTML("Submitting your sequence file(s)...");
            this.elements.jobSubmittedSubPanel.innerHTML = spinnerHTML;

            // Hide the other sub-panels.
            this.elements.fileSelectionSubPanel.classList.remove("active");
            this.elements.jobSubmissionSubPanel.classList.remove("active");
            this.elements.resultsSubPanel.classList.remove("active");
            break;

         case PanelMode.pending_results:

            // Display the results panel.
            this.elements.resultsSubPanel.classList.add("active");

            //this.elements.resultsSubPanel.innerHTML = "";

            console.log("TODO: start the timer loop and try to retrieve the job data")

            // Hide the other sub-panels.
            this.elements.fileSelectionSubPanel.classList.remove("active");
            this.elements.jobSubmissionSubPanel.classList.remove("active");
            this.elements.jobSubmittedSubPanel.classList.remove("active");
            break;

         case PanelMode.previous_panel:

            console.log("handling previous_panel mode")

            // TEST
            if (!this.previousPanelMode || this.previousPanelMode === PanelMode.file_selection) { 
               return await this.changePanelMode(PanelMode.file_selection); 
            } 
            
            this.parent.updatePage();
            break;

         default:
            return await AlertBuilder.displayError(`Unrecognized panel mode ${mode_}`);
      }

      this.previousPanelMode = this.mode;

      return;
   }

   // Load the pending job if it has completed.
   async getJobStatus() {

      console.log("in getJobStatus")

      this.submissionStatus.retries += 1;

      // Populate the results sub-panel with a link to the job details and a message about the job status.
      this.populateResultsSubPanel();
      
      // Try to load the job data.
      await this.parent.getJob();

      // If the results are available, update the job results metadata and clear the interval timer.
      if (this.parent.job && this.parent.job.data) {

         // Clear the interval timer.
         if (!isNaN(this.submissionStatus.intervalID)) { window.clearInterval(this.submissionStatus.intervalID); }
         
         this.submissionStatus.end();

         // Load the job details panel.
         return await this.parent.updatePanelFromURL();
      }

      return;
   }

   // Handle the web service's response to uploading FASTA file(s).
   async handleUploadResult(result_: IUploadResult) {

      // Error conditions
      if (!result_ || result_.status !== JobStatus.pending || !result_.jobUID) {

         let errorMessage = "An error occurred uploading your file(s)";

         if (!!result_ && !!result_.errorMessage) { 
            errorMessage += `: ${result_.errorMessage}`; 
         } else if (!result_.jobUID) {
            errorMessage += ": No job UID was returned";
         }

         await AlertBuilder.displayError(errorMessage);

         await this.changePanelMode(PanelMode.file_selection);
         return;
      }

      // Update the parent component's state with the new job UID.
      this.parent.state.jobUID = result_.jobUID;
      this.parent.state.fileIndex = NaN;
      this.parent.state.sequenceIndex = NaN;

      // Update the URL parameters without reloading the page.
      this.parent.updateUrlFromState();

      // Display the "pending results" sub-panel.
      await this.changePanelMode(PanelMode.pending_results);

      // Load the pending job to see if it has completed.
      await this.getJobStatus();

      if (!this.submissionStatus.isComplete) {

         // Check for the job results every few seconds.
         this.submissionStatus.intervalID = window.setInterval(async () => {

            // Load the pending job to see if it has completed.
            return this.getJobStatus();

         }, Constants.JOB_POLLING_INTERVAL);
      }
      
      return;
   }

   // Make the panel visible and populate it with data.
   async load() {

      this.isActive = true;

      // Make the container visible.
      this.elements.container.classList.add("active");

      // Format the accepted file types.
      let fileFormats = Constants.ACCEPTED_FILE_TYPES.join(",");
      
      let appleWarning = "";
      if (Utils.isIOS()) {
         appleWarning = `<div class="ios-warning">
            <i class="fa-solid fa-triangle-exclamation warning"></i> 
            <div class="warning-message">
               <b>NOTE</b>: iOS devices only permit the upload of files with the <b>.txt</b> extension, so you'll need to change 
               the extension of your FASTA files to <b>.txt</b> before they can be selected for upload. 
               For example: change <span class="filename">my_data.fas</span> to <span class="filename">my_data.txt</span>.
            </div>
         </div>`;
      }

      // Create HTML for the container Element.
      const html = 
         `<div class="file-selection sub-panel">
            <div class="selection-controls">
               <div class="upload-message">Upload your <b>nucleotide-only</b> FASTA sequence(s)</div>
               <button 
                  class=\"btn file-control has-tooltip\"
                  data-tippy-content="Click to select one or more nucleotide-only FASTA files to upload. Up to ${Constants.MAX_SEQUENCE_COUNT} sequences can be submitted in one or multiple files."
               >${Icon.browse} Select file(s)</button>
               <input type=\"file\" id=\"file_input\" multiple accept="${fileFormats}" />
            </div>
            ${appleWarning}
         </div>

         <div class="job-submission sub-panel">
         
            <div class="job-name-row">
               <div class=\"job-name-label\">Job name</div>
               <input type=\"text\" class=\"job-name\" placeholder=\"optional\" />
            </div>
            
            <div class="selected-files-label">Selected files</div>
            <div class="selected-files"></div>

            <div class="controls">
               <button class=\"btn ${ButtonClass.upload}\">${Icon.upload} Upload</button>
               <button class=\"btn ${ButtonClass.cancel}\">${Icon.cancel} Cancel</button>
            </div>
         </div>

         <div class="job-submitted sub-panel"></div>
         
         <div class="results sub-panel"></div>`;

      this.elements.container.innerHTML = html;

      // Get references to the DOM elements.
      
      //------------------------------------------------------------------------------------------------------------------------------------
      // The file selection panel
      //------------------------------------------------------------------------------------------------------------------------------------
      this.elements.fileSelectionSubPanel = this.elements.container.querySelector(".file-selection.sub-panel") as HTMLElement;
      if (!this.elements.fileSelectionSubPanel) { throw new Error("Invalid file selection panel element"); }

      // The file input control
      this.elements.fileInput = this.elements.container.querySelector("#file_input") as HTMLInputElement;
      if (!this.elements.fileInput) { throw new Error("Invalid file input element"); }
      this.elements.fileInput.addEventListener("change", async () => this.changePanelMode(PanelMode.job_submission));

      // The file control
      this.elements.fileControl = this.elements.container.querySelector(".file-control") as HTMLElement;
      if (!this.elements.fileControl) { throw new Error("Invalid file control element"); }

      // Clicking on the file button will trigger a click on the file input element.
      this.elements.fileControl.addEventListener("click", () => this.elements.fileInput.click());

      //------------------------------------------------------------------------------------------------------------------------------------
      // The job submission panel
      //------------------------------------------------------------------------------------------------------------------------------------
      this.elements.jobSubmissionSubPanel = this.elements.container.querySelector(".job-submission.sub-panel") as HTMLElement;
      if (!this.elements.jobSubmissionSubPanel) { throw new Error("Invalid job submission panel element"); }

      // The upload button
      this.elements.uploadButton = this.elements.jobSubmissionSubPanel.querySelector(`.${ButtonClass.upload}`) as HTMLButtonElement;
      if (!this.elements.uploadButton) { throw new Error("Invalid upload button element"); }
      this.elements.uploadButton.addEventListener("click", () => { this.uploadSequences(); })

      // The job name control and its label.
      this.elements.jobNameLabel = this.elements.jobSubmissionSubPanel.querySelector(".job-name-label") as HTMLElement;
      if (!this.elements.jobNameLabel) { throw new Error("Invalid job name label element"); }

      this.elements.jobName = this.elements.jobSubmissionSubPanel.querySelector(".job-name") as HTMLInputElement;
      if (!this.elements.jobName) { throw new Error("Invalid job name element"); }

      // The "cancel upload" button
      this.elements.cancelButton = this.elements.jobSubmissionSubPanel.querySelector(`.${ButtonClass.cancel}`) as HTMLButtonElement;
      if (!this.elements.cancelButton) { throw new Error("Invalid cancel button element"); }

      // The cancel button will hide the job submission panel and display the file selection panel.
      this.elements.cancelButton.addEventListener("click", async () => { return this.changePanelMode(PanelMode.previous_panel); })

      // The "selected files" element
      this.elements.selectedFiles = this.elements.jobSubmissionSubPanel.querySelector(".selected-files") as HTMLElement;
      if (!this.elements.selectedFiles) { throw new Error("Invalid selected files element"); }

      //------------------------------------------------------------------------------------------------------------------------------------
      // The "job submitted" sub-panel
      //------------------------------------------------------------------------------------------------------------------------------------
      this.elements.jobSubmittedSubPanel = this.elements.container.querySelector(".job-submitted.sub-panel") as HTMLElement;
      if (!this.elements.jobSubmittedSubPanel) { throw new Error("Invalid job submitted panel element"); }

      //------------------------------------------------------------------------------------------------------------------------------------
      // The results panel
      //------------------------------------------------------------------------------------------------------------------------------------
      this.elements.resultsSubPanel = this.elements.container.querySelector(".results.sub-panel") as HTMLElement;

      // Initialize tippy tooltips for buttons.
      tippy(".has-tooltip");

      // The file selection sub-panel will be displayed by default.
      await this.changePanelMode(PanelMode.file_selection);
      return
   }

   // Populate the results sub-panel with a link to the job details and a message about the job status.
   populateResultsSubPanel() {

      // If a valid job UID exists, create a link panel to the job details.
      let linkPanelHTML = this.parent.createLinkPanel(PanelKey.jobDetails);

      let messageItems = "";
      let title = "";

      // The message content depends on the number of files.
      if (this.submissionStatus.fileCount === 1) {
         title = "Processing your sequence file";
         messageItems = 
            `<li>Your sequence file has been uploaded and is being processed.</li>
            <li>When processing is complete, this page will automatically be updated.</li> 
            <li>Depending on the sequence size, the processing may take several minutes to complete.</li>`

      } else {
         title = "Processing your sequence files";
         messageItems = 
            `<li>Your sequence files have been uploaded and are being processed.</li>
            <li>When processing is complete, this page will automatically be updated.</li>
            <li>Depending on the number of sequences and their size, the processing may take several minutes to complete.</li>`;
      }

      // How many seconds until the next retry?
      const seconds = (Constants.JOB_POLLING_INTERVAL / 1000).toFixed(0); 
      const s = seconds === "1" ? "" : "s";

      // Populate the results sub-panel with a message about the job status.
      const retryMessage = `Trying again in ${seconds} second${s} (retry #${this.submissionStatus.retries + 1})`;

      // Populate the results sub-panel.
      this.elements.resultsSubPanel.innerHTML = 
         `<div class="status-title">${title}</div>
         <div class="status-message">
            <ul>${messageItems}</ul>
         </div>
         ${linkPanelHTML}
         <div class="retry-message">${retryMessage}</div>`;

      this.elements.resultsSubPanel.addEventListener("click", async (event_) => {
         return await this.parent.handleClickEvent(this.elements.container, event_.target as HTMLElement);
      })
   }

   // Read the contents of a file asynchronously and return it as a base64-encoded string.
   async readFileAsync(file_): Promise<string> {

      return new Promise((resolve, reject) => {
         const reader = new FileReader();
         reader.onload = () => {
            resolve(<string>reader.result);
         };
         reader.onerror = reject;
         reader.readAsText(file_);
      })
   }

   // Unload and hide the panel.
   unload() {

      this.isActive = false;
      this.elements.container.classList.remove("active");
      
      // Reset the job submission status.
      this.submissionStatus.reset();

      // TODO: should we remove event listeners?
   }

   // Upload the selected files to the web service for processing.
   async uploadSequences() {

      if (!this.elements.fileInput) { throw new Error("Invalid file control"); }

      if (!this.elements.fileInput.files || this.elements.fileInput.files.length < 1) { 
         return await AlertBuilder.displayError(`No files were selected to upload`); 
      }
      
      // Get the (optional) job name.
      let jobName = this.elements.jobName.value;
      if (!jobName) { jobName = null; }

      try {
         let files: IFileData[] = [];
         let recordCount = 0;
         let totalSize = 0;

         // Iterate over all files
         for (let f=0; f < this.elements.fileInput.files.length; f++) {

            // Is this a valid file?
            const file = this.elements.fileInput.files.item(f);
            if (!file) { continue; }

            // Update the total file size.
            totalSize += file.size;
            if (totalSize > Constants.MAX_FILE_SIZE_TOTAL) { 
               return await AlertBuilder.displayError(`The total size of all uploaded files must be less than ${Constants.MAX_FILE_SIZE_TOTAL}`); 
            }

            // Get the file's contents
            const contents = await this.readFileAsync(file);
            if (!contents) { continue; }

            // Parse the file text as one or more FASTA records and validate them.
            const records = ParseFASTA(contents, true);

            // Update the sequence count with the number of FASTA records in this file.
            recordCount += records.length;
         }
         
         // Validate the number of FASTA records/sequences found in the file(s).
         if (recordCount >= Constants.MAX_SEQUENCE_COUNT) {  

            const s = recordCount === 1 ? "" : "s";

            // Create an error message.
            const errorMessage = `Unable to upload your file${s}: The maximum number of sequences that can be loaded is ${Constants.MAX_SEQUENCE_COUNT} ` +
            `(you tried to upload ${recordCount} sequence${s})`

            return await AlertBuilder.displayError(errorMessage, null, () => this.changePanelMode(PanelMode.file_selection));

         } else if (recordCount < 1) {
            return await AlertBuilder.displayError(`Your selected file(s) do not contain any valid FASTA sequences`, null, () => this.changePanelMode(PanelMode.file_selection));
         }

         // TEST
         console.log(`record count = ${recordCount} and total file size = ${totalSize}`)

         // Initialize the submission status.
         this.submissionStatus.start(files.length, recordCount);

         // Change the panel mode to "job submitted".
         await this.changePanelMode(PanelMode.job_submitted);
         
         // Upload the sequence file(s) to the web service for processing.
         const result = await SequenceSearchService.uploadFiles(this.parent.authToken, this.elements.fileInput.files, jobName, this.parent.user.email, this.parent.user.uid);

         // Handle the upload result and display the correct sub-panel.
         await this.handleUploadResult(result);
       
      } catch (error_) {
         await AlertBuilder.displayError(error_);
      }

      return;
   }

}