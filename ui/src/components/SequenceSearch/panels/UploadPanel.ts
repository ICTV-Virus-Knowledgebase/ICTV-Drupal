

import { AlertBuilder } from "../../../helpers/AlertBuilder";
import { ButtonClass, FormatBytes, Constants, Icon, GetSpinnerHTML, PanelKey } from "../Common";
import { DateTime } from "luxon";
import { IFileData } from "../../../models/IFileData";
import { ISeqSearchPanel } from "./ISeqSearchPanel";
import { IUploadResult } from "../IUploadResults";
import { JobStatus } from "../../../global/Types";
import { SequenceSearch } from "../SequenceSearch";
import { SequenceSearchService } from "../../../services/SequenceSearchService";
import tippy from "tippy.js";

enum PanelMode {

   // The user can select one or more FASTA files.
   file_selection = "file_selection",

   // If FASTA files have been selected, the user can name the job and upload the file(s).
   job_submission = "job_submission",

   // The user has uploaded the file(s) to the web service and we're waiting for the new  
   // job UID and the status of the upload.
   job_submitted = "job_submitted",

   // The files have been uploaded and we are waiting for the SeqSearch job to complete.
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

   // Metadata about polling the web service for job status.
   jobResults: {
      endedOn: any, // DateTime
      intervalID: number,
      isComplete: boolean,
      retries: number,
      startedOn: any // DateTime
   }

   mode: PanelMode;

   // The parent page
   parent: SequenceSearch = null;

   // TEST
   previousPanelMode: PanelMode = null;


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

      this.jobResults = {
         endedOn: null,
         intervalID: null,
         isComplete: false,
         retries: 0,
         startedOn: null
      }
   }

   // Change which panel will be displayed (the other panel will be hidden).
   async changePanelMode(mode_: PanelMode) {

      // Clear the job name input
      //this.elements.jobName.value = ""; 

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

            const spinnerHTML = GetSpinnerHTML("Processing...");
            this.elements.jobSubmittedSubPanel.innerHTML = spinnerHTML;

            // Hide the other sub-panels.
            this.elements.fileSelectionSubPanel.classList.remove("active");
            this.elements.jobSubmissionSubPanel.classList.remove("active");
            this.elements.resultsSubPanel.classList.remove("active");
            break;

         case PanelMode.pending_results:

            // Display the results panel.
            this.elements.resultsSubPanel.classList.add("active");

            this.elements.resultsSubPanel.innerHTML = "Checking to see if the job has completed";

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

      // Initialize the job results metadata.
      this.jobResults.endedOn = null;
      this.jobResults.isComplete = false;
      this.jobResults.retries = 0;
      this.jobResults.startedOn = DateTime.now();
      
      // Display the "pending results" sub-panel.
      await this.changePanelMode(PanelMode.pending_results);

      // Check for the job results every few seconds.
      this.jobResults.intervalID = window.setInterval(async () => {

         this.jobResults.retries += 1;

         // Populate the results sub-panel with a link to the job details and a message about the job status.
         this.populateResultsSubPanel();
         
         // Try to load the job data.
         await this.parent.getJob();

         // If the results are available, update the job results metadata and clear the interval timer.
         if (this.parent.job && this.parent.job.data) {

            // Clear the interval timer.
            window.clearInterval(this.jobResults.intervalID);

            this.jobResults.isComplete = true;
            this.jobResults.endedOn = DateTime.now();
            this.jobResults.intervalID = null;

            // Load the job details panel.
            return await this.parent.updatePage();
         }

         return;

      }, Constants.JOB_POLLING_INTERVAL);

      return;
   }

   // Make the panel visible and populate it with data.
   async load() {

      this.isActive = true;

      // Make the container visible.
      this.elements.container.classList.add("active");

      // Format the accepted file types.
      let fileFormats = Constants.ACCEPTED_FILE_TYPES.join(",");
      
      // Create HTML for the container Element.
      const html = 
         `<div class="file-selection sub-panel">
            <div class="upload-message">Upload your <b>nucleotide-only</b> FASTA sequence(s)</div>
            <button 
               class=\"btn file-control\"
               data-tippy-content="Click to select one or more nucleotide-only FASTA files to upload. Up to 100 sequences can be submitted in one or multiple files."
            >${Icon.browse} Select file(s)</button>
            <input type=\"file\" id=\"file_input\" multiple accept="${fileFormats}" />
         </div>

         <div class="job-submission sub-panel">
         
            <div class="job-name-row">
               <div class=\"job-name-label\">Job name</div>
               <input type=\"text\" class=\"job-name\" placeholder=\"(optional)\" />
            </div>
            
            <div class="selected-files-label">Selected file(s)</div>
            <div class="selected-files"></div>

            <div class="controls">
               <button class=\"btn ${ButtonClass.upload}\">${Icon.upload} Upload</button>
               <button class=\"btn ${ButtonClass.cancel}\">${Icon.cancel} Cancel</button>
            </div>
         </div>

         <div class="job-submitted sub-panel"></div>
         
         <div class="results sub-panel"></div>`;

         /* job submission sub-panel HTML pre-noon

            <div class="controls">
               <div class=\"job-name-label\">Job name</div>
               <input type=\"text\" class=\"job-name\" placeholder=\"(optional)\" />
               <button class=\"btn ${ButtonClass.upload}\">Submit file(s)</button>
               <button class=\"btn ${ButtonClass.cancel}\">${Icon.cancel} Cancel</button>
            </div>
            <div class="selected-files"></div>

         */
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

      // How many seconds until the next retry?
      const seconds = (Constants.JOB_POLLING_INTERVAL / 1000).toFixed(0); 
      const s = seconds === "1" ? "" : "s";

      // Populate the results sub-panel with a message about the job status.
      const message = `The SeqSearch job is still running, but the page will be updated with the results as soon as they're ready.`;
      const retryMessage = `Trying again in ${seconds} second${s} (retry #${this.jobResults.retries + 1})`;

      // Populate the results sub-panel.
      this.elements.resultsSubPanel.innerHTML = 
         `${linkPanelHTML}
         <div class="status-message">${message}</div>
         <div class="retry-message">${retryMessage}</div>`;

      // If a valid job details link was able to be created (and link panel HTML was generated), add a click handler to the copy URL button.),
      if (linkPanelHTML && linkPanelHTML.length > 0) {

         // Get a reference to the copy URL button.
         const copyUrlButton = this.elements.resultsSubPanel.querySelector(`.${ButtonClass.copyURL}`);
         if (!copyUrlButton) { throw new Error("Invalid copy URL button element"); }

         // Add a click handler to the copy URL button.
         copyUrlButton.addEventListener("click", async (event_: MouseEvent) => {
            return await this.parent.copyLinkURL(event_);
         });
      }
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

   // This dialog lets the user know that their files are being processed and what to expect.
   async showInfoDialog(fileCount_: number, filenames_: string) {

      let content: string;
      let title: string;

      // The message content depends on the number of files.
      if (fileCount_ === 1) {
         title = "Processing your sequence file";
         content = "Your sequence file has been uploaded and is being processed. When processing is complete, this page will be updated. " +
            "Depending on the size of the file, the processing may take several minutes to complete.";

      } else {
         title = "Processing your sequence files";
         content = "Your sequence files have been uploaded and are being processed. When processing is complete, this page will be updated. " +
            "Depending on the number of files and their size, the processing may take several minutes to complete.";
      }

      // Display a "success" dialog.
      return await AlertBuilder.displaySuccess(content, title);
   }

   // Unload and hide the panel.
   unload() {

      this.isActive = false;
      this.elements.container.classList.remove("active");
      
      // Re-initialize the job results metadata.
      this.jobResults = {
         endedOn: null,
         isComplete: false,
         retries: 0,
         startedOn: null,
         intervalID: null
      }

      // TODO: should we remove event listeners?
   }

   // Upload the selected files to the web service for processing.
   async uploadSequences() {

      if (!this.elements.fileInput) { throw new Error("Invalid file control"); }
      if (!this.elements.fileInput.files || !this.elements.fileInput.files[0]) { throw new Error("Invalid upload file"); }
      
      // Get the (optional) job name.
      let jobName = this.elements.jobName.value;
      if (!jobName) { jobName = null; }

      try {
         let filenames = "";
         let files: IFileData[] = [];
         let sequenceCount = 0;

         // Iterate over all files
         for (let f=0; f < this.elements.fileInput.files.length; f++) {

            const file = this.elements.fileInput.files.item(f);
            if (!file) { continue; }

            // Get the file's contents
            const contents = await this.readFileAsync(file);
            if (!contents) { continue; }

            // Update the sequence count with the number of FASTA headers in this file.
            sequenceCount += (contents.match(/>/g) || []).length;

            if (filenames.length > 0) { filenames += ", "; }
            filenames += file.name;

            // Add file data to the array.
            files.push({
               name: file.name,
               contents: contents
            })
         }
         
         if (files.length < 1) { return await AlertBuilder.displayError("Unable to upload: no valid files were found"); }

         if (sequenceCount >= Constants.MAX_SEQUENCE_COUNT) {    
            const s = sequenceCount === 1 ? "" : "s";
            const message = `Unable to upload your file${s}: The maximum number of sequences that can be loaded is ${Constants.MAX_SEQUENCE_COUNT} ` +
            `(you tried to upload ${sequenceCount} sequences)`

            return await AlertBuilder.displayError(message, null, () => this.changePanelMode(PanelMode.file_selection));
         }

         // Change the panel mode to "job submitted".
         await this.changePanelMode(PanelMode.job_submitted);
         
         const [_, result] = await Promise.all([

            // Show a modal dialog with information about the uploaded files.
            this.showInfoDialog(files.length, filenames),

            // Upload the sequence file(s) to the web service for processing.
            SequenceSearchService.uploadSequences(this.parent.authToken, files, jobName, this.parent.user.email, this.parent.user.uid)
         ]);
         console.log("upload result = ", result)

         // Handle the upload result and display the correct sub-panel.
         await this.handleUploadResult(result);
       
      } catch (error_) {
         await AlertBuilder.displayError(error_);
      }

      return;
   }

}