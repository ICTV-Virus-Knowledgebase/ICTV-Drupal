

import { AlertBuilder } from "../../../helpers/AlertBuilder";
import { ButtonClass, Constants, Icon, GetSpinnerHTML } from "../Common";
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
   pending_results = "pending_results"
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
         uploadButton: null,

         // The "pending results" panel
         resultsSubPanel: null
      }
   }

   // Change which panel will be displayed (the other panel will be hidden).
   async changePanelMode(mode_: PanelMode) {

      console.log(`in changePanelMode mode_ = ${mode_}`)

      // Clear the job name input
      this.elements.jobName.value = ""; 

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

            // Display the job submission panel.
            this.elements.jobSubmissionSubPanel.classList.add("active");

            // Generate the upload button text.
            let buttonText = `${Icon.upload} Submit`;
            
            if (this.elements.fileInput.files.length === 1) {
               buttonText += " file";
            } else {
               buttonText += ` ${this.elements.fileInput.files.length} files`;
            }
            
            // Update the upload button text.
            this.elements.uploadButton.innerHTML = buttonText;

            // Hide the other panels.
            this.elements.fileSelectionSubPanel.classList.remove("active");
            this.elements.jobSubmittedSubPanel.innerHTML = "";
            this.elements.jobSubmittedSubPanel.classList.remove("active");
            this.elements.resultsSubPanel.classList.remove("active");
            break;

         case PanelMode.job_submitted:

            // Display the file processing panel.
            this.elements.jobSubmittedSubPanel.classList.add("active");

            const spinnerHTML = GetSpinnerHTML("Processing...");
            this.elements.jobSubmittedSubPanel.innerHTML = spinnerHTML;

            // Hide the other panels.
            this.elements.fileSelectionSubPanel.classList.remove("active");
            this.elements.jobSubmissionSubPanel.classList.remove("active");
            this.elements.resultsSubPanel.classList.remove("active");
            break;

         case PanelMode.pending_results:

            // Display the results panel.
            this.elements.resultsSubPanel.classList.add("active");

            this.elements.resultsSubPanel.innerHTML = "Checking to see if the job has completed";

            console.log("TODO: start the timer loop and try to retrieve the job data")

            // Hide the other panels.
            this.elements.fileSelectionSubPanel.classList.remove("active");
            this.elements.jobSubmissionSubPanel.classList.remove("active");
            this.elements.jobSubmittedSubPanel.classList.remove("active");
            break;

         default:
            return await AlertBuilder.displayError(`Unrecognized panel mode ${mode_}`);
      }

      return;
   }

   // Handle the web service's response to uploading FASTA file(s).
   async handleUploadResult(result_: IUploadResult) {

      // Error conditions
      if (!result_ || result_.status !== JobStatus.pending) {

         let errorMessage = "An error occurred uploading your file(s)";
         if (!!result_ && !!result_.errorMessage) { errorMessage += `: ${result_.errorMessage}`; }

         await AlertBuilder.displayError(errorMessage);

         await this.changePanelMode(PanelMode.file_selection);
         return;
      }

      // TODO: what if the job UID is empty?

      this.parent.state.jobUID = result_.jobUID;
      this.parent.state.fileIndex = NaN;
      this.parent.state.sequenceIndex = NaN;

      return await this.changePanelMode(PanelMode.pending_results);
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
            <div class=\"job-name-label\">Job name</div>
            <input type=\"text\" class=\"job-name\" placeholder=\"(optional)\" />
            <button class=\"btn ${ButtonClass.upload}\">Submit file(s)</button>
            <button class=\"btn ${ButtonClass.cancel}\">${Icon.cancel} Cancel</button>
         </div>

         <div class="job-submitted sub-panel"></div>
         
         <div class="results sub-panel"></div>`;

      this.elements.container.innerHTML = html;

      // Get references to the DOM elements.
      
      //------------------------------------------------------------------------------------------------------------------------------------
      // The "job submitted" sub-panel
      //------------------------------------------------------------------------------------------------------------------------------------
      this.elements.jobSubmittedSubPanel = <HTMLElement>this.elements.container.querySelector(".job-submitted.sub-panel");
      if (!this.elements.jobSubmittedSubPanel) { throw new Error("Invalid job submitted panel element"); }

      //------------------------------------------------------------------------------------------------------------------------------------
      // The file selection panel
      //------------------------------------------------------------------------------------------------------------------------------------
      this.elements.fileSelectionSubPanel = <HTMLElement>this.elements.container.querySelector(".file-selection.sub-panel");
      if (!this.elements.fileSelectionSubPanel) { throw new Error("Invalid file selection panel element"); }

      // The file input control
      this.elements.fileInput = <HTMLInputElement>this.elements.container.querySelector("#file_input");
      if (!this.elements.fileInput) { throw new Error("Invalid file input element"); }
      this.elements.fileInput.addEventListener("change", async () => this.changePanelMode(PanelMode.job_submission));

      // The file control
      this.elements.fileControl = <HTMLElement>this.elements.container.querySelector(".file-control");
      if (!this.elements.fileControl) { throw new Error("Invalid file control element"); }

      // Clicking on the file button will trigger a click on the file input element.
      this.elements.fileControl.addEventListener("click", () => this.elements.fileInput.click());

      //------------------------------------------------------------------------------------------------------------------------------------
      // The results panel
      //------------------------------------------------------------------------------------------------------------------------------------
      this.elements.resultsSubPanel = <HTMLElement>this.elements.container.querySelector(".results.sub-panel");

      //------------------------------------------------------------------------------------------------------------------------------------
      // The job submission panel
      //------------------------------------------------------------------------------------------------------------------------------------
      this.elements.jobSubmissionSubPanel = <HTMLElement>this.elements.container.querySelector(".job-submission.sub-panel");
      if (!this.elements.jobSubmissionSubPanel) { throw new Error("Invalid job submission panel element"); }

      // The upload button
      this.elements.uploadButton = <HTMLButtonElement>this.elements.container.querySelector(`.${ButtonClass.upload}`);
      if (!this.elements.uploadButton) { throw new Error("Invalid upload button element"); }
      this.elements.uploadButton.addEventListener("click", () => { this.uploadSequences(); })

      // The job name control and its label.
      this.elements.jobNameLabel = <HTMLElement>this.elements.container.querySelector(".job-name-label");
      if (!this.elements.jobNameLabel) { throw new Error("Invalid job name label element"); }

      this.elements.jobName = <HTMLInputElement>this.elements.container.querySelector(".job-name");
      if (!this.elements.jobName) { throw new Error("Invalid job name element"); }

      // The "cancel upload" button
      this.elements.cancelButton = <HTMLButtonElement>this.elements.container.querySelector(`.${ButtonClass.cancel}`);
      if (!this.elements.cancelButton) { throw new Error("Invalid cancel button element"); }

      // The cancel button will hide the upload panel and display the selection panel.
      this.elements.cancelButton.addEventListener("click", async () => { return this.changePanelMode(PanelMode.file_selection); })


      // Initialize tippy tooltips for buttons.
      tippy(".has-tooltip");

      // Display the file selection sub-panel.
      await this.changePanelMode(PanelMode.file_selection);
      return
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
            return await AlertBuilder.displayError(`Unable to upload: The maximum number of sequences ` +
               `that can be loaded is ${Constants.MAX_SEQUENCE_COUNT} (you tried to submit ${sequenceCount} sequences)`);
         }

         // Change the panel mode to "job submitted".
         await this.changePanelMode(PanelMode.job_submitted);
         
         // Show a modal dialog with information about the uploaded files.
         //await this.showInfoDialog(files.length, filenames);

         // Upload the sequence file(s) to the web service for processing.
         let result = await SequenceSearchService.uploadSequences(this.parent.authToken, files, jobName, this.parent.user.email, this.parent.user.uid);

         console.log("upload result = ", result)

         // Handle the upload result and display the correct sub-panel.
         await this.handleUploadResult(result);
       
      } catch (error_) {
         await AlertBuilder.displayError(error_);
      }

      return;
   }

}