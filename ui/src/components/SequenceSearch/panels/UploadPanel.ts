

import { AlertBuilder } from "../../../helpers/AlertBuilder";
import { ButtonClass, Constants, Icon, GetSpinnerHTML } from "../Common";
import { IFileData } from "../../../models/IFileData";
import { ISeqSearchPanel } from "./ISeqSearchPanel";
import { JobStatus } from "../../../global/Types";
import { SequenceSearch } from "../SequenceSearch";
import { SequenceSearchService } from "../../../services/SequenceSearchService";
import tippy from "tippy.js";

enum PanelMode {
   processing = "processing",
   selection = "selection",
   submission = "submission"
}


export class UploadPanel implements ISeqSearchPanel {

   containerSelector: string;

   // DOM elements
   elements: {
      cancelButton: HTMLButtonElement,
      container: HTMLElement,
      fileControl: HTMLElement,
      fileInput: HTMLInputElement,
      fileProcessingPanel: HTMLElement,
      fileSelectionPanel: HTMLElement,
      fileSubmissionPanel: HTMLElement,
      fileUploadDetails: HTMLElement,
      jobName: HTMLInputElement,
      jobNameLabel: HTMLElement,
      uploadButton: HTMLButtonElement
   }

   // Is the panel currently active/displayed?
   isActive: boolean;

   mode: PanelMode;

   // The parent page
   parent: SequenceSearch = null;


   // C-tor
   constructor(containerEl_: HTMLElement, parent_: SequenceSearch) {

      if (!containerEl_) { throw new Error("Invalid container element"); }

      this.mode = PanelMode.selection;

      if (!parent_) { throw new Error("Invalid parent parameter"); }
      this.parent = parent_;

      this.elements = {
         cancelButton: null,
         container: containerEl_,
         fileControl: null,
         fileInput: null,
         fileProcessingPanel: null,
         fileSelectionPanel: null,
         fileSubmissionPanel: null,
         fileUploadDetails: null,
         jobName: null,
         jobNameLabel: null,
         uploadButton: null
      }
   }

   // Change which panel will be displayed (the other panel will be hidden).
   async changePanelMode(mode_: PanelMode) {

      // Clear the job name input
      this.elements.jobName.value = ""; 

      if (mode_ === PanelMode.processing) {

         // Display the file processing panel.
         this.elements.fileProcessingPanel.classList.add("active");

         const spinnerHTML = GetSpinnerHTML("Processing...");
         this.elements.fileProcessingPanel.innerHTML = spinnerHTML;

         // Hide the other panels.
         this.elements.fileSelectionPanel.classList.remove("active");
         this.elements.fileSubmissionPanel.classList.remove("active");

      } else if (mode_ === PanelMode.selection) {

         // Display the file selection panel.
         this.elements.fileSelectionPanel.classList.add("active");

         // Clear the file input
         this.elements.fileInput.value = ""; 
         this.elements.fileInput.files = null;

         // Hide the other panels.
         this.elements.fileProcessingPanel.innerHTML = "";
         this.elements.fileProcessingPanel.classList.remove("active");
         this.elements.fileSubmissionPanel.classList.remove("active");

      } else if (mode_ === PanelMode.submission) {

         // Display the file submission panel.
         this.elements.fileSubmissionPanel.classList.add("active");

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
         this.elements.fileProcessingPanel.innerHTML = "";
         this.elements.fileProcessingPanel.classList.remove("active");
         this.elements.fileSelectionPanel.classList.remove("active");

      } else {
         return await AlertBuilder.displayError(`Unrecognized panel mode ${mode_}`);
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
      
      // Create HTML for the container Element.
      const html = 
         `<div class="file-selection active">
            <div class="upload-message">Upload your FASTA sequence(s)</div>
            <button 
               class=\"btn file-control\"
               data-tippy-content="Click to select one or more FASTA files to upload"
            >${Icon.browse} Select file(s)</button>
            <input type=\"file\" id=\"file_input\" multiple accept="${fileFormats}" />
         </div>
         <div class="file-submission">
            <div class=\"job-name-label\">Job name</div>
            <input type=\"text\" class=\"job-name\" placeholder=\"(optional)\" />
            <button class=\"btn ${ButtonClass.upload}\">Submit file(s)</button>
            <button class=\"btn ${ButtonClass.cancel}\">${Icon.cancel} Cancel</button>
         </div>
         <div class="file-processing"></div>`;

      this.elements.container.innerHTML = html;

      //------------------------------------------------------------------------------------------------------------------------------------
      // Get references to the DOM elements.
      //------------------------------------------------------------------------------------------------------------------------------------

      // The file processing panel.
      this.elements.fileProcessingPanel = <HTMLElement>this.elements.container.querySelector(".file-processing");
      if (!this.elements.fileProcessingPanel) { throw new Error("Invalid file processing panel element"); }

      // The file selection panel.
      this.elements.fileSelectionPanel = <HTMLElement>this.elements.container.querySelector(".file-selection");
      if (!this.elements.fileSelectionPanel) { throw new Error("Invalid file selection panel element"); }

      // The file submission panel.
      this.elements.fileSubmissionPanel = <HTMLElement>this.elements.container.querySelector(".file-submission");
      if (!this.elements.fileSubmissionPanel) { throw new Error("Invalid file submission panel element"); }

      // The upload button
      this.elements.uploadButton = <HTMLButtonElement>this.elements.container.querySelector(`.${ButtonClass.upload}`);
      if (!this.elements.uploadButton) { throw new Error("Invalid upload button element"); }
      this.elements.uploadButton.addEventListener("click", () => { this.uploadSequences(); })

      // The file input control
      this.elements.fileInput = <HTMLInputElement>this.elements.container.querySelector("#file_input");
      if (!this.elements.fileInput) { throw new Error("Invalid file input element"); }
      this.elements.fileInput.addEventListener("change", async () => this.changePanelMode(PanelMode.submission));

      // The file control
      this.elements.fileControl = <HTMLElement>this.elements.container.querySelector(".file-control");
      if (!this.elements.fileControl) { throw new Error("Invalid file control element"); }

      // Clicking on the file button will trigger a click on the file input element.
      this.elements.fileControl.addEventListener("click", () => this.elements.fileInput.click());

      // The job name control and its label.
      this.elements.jobNameLabel = <HTMLElement>this.elements.container.querySelector(".job-name-label");
      if (!this.elements.jobNameLabel) { throw new Error("Invalid job name label element"); }

      this.elements.jobName = <HTMLInputElement>this.elements.container.querySelector(".job-name");
      if (!this.elements.jobName) { throw new Error("Invalid job name element"); }

      // The cancel (submission) button
      this.elements.cancelButton = <HTMLButtonElement>this.elements.container.querySelector(`.${ButtonClass.cancel}`);
      if (!this.elements.cancelButton) { throw new Error("Invalid cancel button element"); }

      // The cancel button will hide the submission panel and display the selection panel.
      this.elements.cancelButton.addEventListener("click", async () => { return this.changePanelMode(PanelMode.selection); })

      // Initialize tippy tooltips for buttons.
      tippy(".has-tooltip");

      return;
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

      console.log("unloading upload panel")
      console.debug("this.elements.container = ", this.elements.container)

      this.isActive = false;

      //this.elements.container.classList.remove("active");
      

      // TODO: should we remove event listeners?
      // TODO: anything else?
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

         // Change the panel mode to "processing".
         await this.changePanelMode(PanelMode.processing);
         
         // Show a modal dialog with information about the uploaded files.
         await this.showInfoDialog(files.length, filenames);

         // Upload the sequence file(s) to the web service for processing.
         let job = await SequenceSearchService.uploadSequences(this.parent.authToken, files, jobName, this.parent.user.email, this.parent.user.uid);

         if (!job) {

            // Create a placeholder job.
            job = {
               createdOn: null,
               data: null,
               endedOn: null,
               name: null,
               message: "An unknown error occurred",
               status: JobStatus.error,
               uid: null
            }
         }

         if (job.status === JobStatus.complete || job.status === JobStatus.pending) {

            // Update the job and job UID.
            this.parent.job = job; 
            this.parent.state.jobUID = job !== null ? job.uid : null;

            // Update the page to display the job results.
            await this.parent.updatePage();

         } else {
            throw new Error(job.message || "An unknown error occurred");
         }
       
      } catch (error_) {
         await AlertBuilder.displayError(error_);
      }

      // Revert to the file selection mode.
      await this.changePanelMode(PanelMode.selection);

      return;
   }

}