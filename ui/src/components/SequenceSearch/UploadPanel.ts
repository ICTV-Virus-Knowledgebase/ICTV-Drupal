

import { AlertBuilder } from "../../helpers/AlertBuilder";
import { ButtonClass, Constants, Icon, PanelAction, PanelKey } from "./Common";
import { decode } from "base64-arraybuffer";
import { IFileData } from "../../models/IFileData";
import { ISeqSearchPanel } from "./ISeqSearchPanel";
import { SequenceSearch } from "./SequenceSearch";
import { SequenceSearchService } from "../../services/SequenceSearchService";
import * as pako from "pako";


export class UploadPanel implements ISeqSearchPanel {
   
   config = {
      acceptedFileTypes: [".fa", ".faa", ".fas", ".fasta", ".ffn", ".fna", ".frn", ".mpfa", ".txt"]
      //contactEmail: null
   }

   containerSelector: string;

   // DOM elements
   elements: {
      cancelButton: HTMLButtonElement,
      container: HTMLElement,
      fileControl: HTMLElement,
      fileInput: HTMLInputElement,
      fileSelection: HTMLElement,
      fileSubmission: HTMLElement,
      fileUploadDetails: HTMLElement,
      jobName: HTMLInputElement,
      jobNameLabel: HTMLElement,
      uploadButton: HTMLButtonElement
   }

   // The parent page
   parent: SequenceSearch = null;


   // C-tor
   constructor(parent_: SequenceSearch) {

      if (!parent_) { throw new Error("Invalid parent parameter"); }
      this.parent = parent_;

      this.elements = {
         cancelButton: null,
         container: null,
         fileControl: null,
         fileInput: null,
         fileSelection: null,
         fileSubmission: null,
         fileUploadDetails: null,
         jobName: null,
         jobNameLabel: null,
         uploadButton: null
      }

   }



   async load() {

      console.log("in uploadPanel.load")
      
      // Create a local copy of the parent's upload panel Element.
      this.elements.container = this.parent.elements.uploadPanel;

      // Make the container visible.
      this.elements.container.classList.add("active");

      // Format the accepted file types.
      let fileFormats = this.config.acceptedFileTypes.join(",");

      // Create HTML for the container Element.
      const html = 
         `<div class=\"upload-panel\">
            <div class="file-selection active">
               <div class="upload-message">Upload your FASTA sequence(s)</div>
               <button class=\"btn file-control\">${Icon.browse} Select file(s)</button>
               <input type=\"file\" id=\"file_input\" multiple accept="${fileFormats}" />
            </div>
            <div class="file-submission">
               <div class=\"job-name-label\">Job name</div>
               <input type=\"text\" class=\"job-name\" placeholder=\"(optional)\" />
               <button class=\"btn ${ButtonClass.upload}\">Submit file(s)</button>
               <button class=\"btn ${ButtonClass.cancel}\">${Icon.cancel} Cancel</button>
            </div>
         </div>`;

      this.elements.container.innerHTML = html;

      // Get references to the DOM elements.

      
      // Get and validate the file selection panel.
      this.elements.fileSelection = <HTMLElement>this.elements.container.querySelector(".file-selection");
      if (!this.elements.fileSelection) { throw new Error("Invalid file selection Element"); }

      // Get and validate the file submission panel.
      this.elements.fileSubmission = <HTMLElement>this.elements.container.querySelector(".file-submission");
      if (!this.elements.fileSubmission) { throw new Error("Invalid file submission Element"); }  

      // Get and validate the upload button.
      this.elements.uploadButton = <HTMLButtonElement>this.elements.container.querySelector(`.${ButtonClass.upload}`);
      if (!this.elements.uploadButton) { throw new Error("Invalid upload button Element"); }

      this.elements.uploadButton.addEventListener("click", () => { this.uploadSequences(); })

      // Get and validate the file input Element.
      this.elements.fileInput = <HTMLInputElement>this.elements.container.querySelector("#file_input");
      if (!this.elements.fileInput) { throw new Error("Invalid file input Element"); }

      // Handle a file selection change.
      this.elements.fileInput.addEventListener("change", async (event_: MouseEvent) => {
      
         if (!this.elements.fileInput.files || this.elements.fileInput.files.length < 1) {
            
            // Hide the file submission panel.
            this.elements.fileSubmission.classList.remove("active");
            return;
         }
         
         // Begin populating the upload button text.
         let buttonText = `${Icon.upload} Submit`;
         
         if (this.elements.fileInput.files.length === 1) {
            buttonText += " file";
         } else {
            buttonText += ` ${this.elements.fileInput.files.length} files`;
         }

         // Hide the file selection panel.
         this.elements.fileSelection.classList.remove("active");

         // Display the file submission panel.
         this.elements.fileSubmission.classList.add("active");

         // Update the upload button text.
         this.elements.uploadButton.innerHTML = buttonText;
      })

      this.elements.fileControl = <HTMLElement>this.elements.container.querySelector(".file-control");
      if (!this.elements.fileControl) { throw new Error("Invalid file control Element"); }

      // Clicking on the file button will trigger a click on the file input element.
      this.elements.fileControl.addEventListener("click", async (event_: MouseEvent) => {
         this.elements.fileInput.click();
      })

      // The job name control and its label.
      this.elements.jobNameLabel = <HTMLElement>this.elements.container.querySelector(".job-name-label");
      if (!this.elements.jobNameLabel) { throw new Error("Invalid job name label Element"); }

      this.elements.jobName = <HTMLInputElement>this.elements.container.querySelector(".job-name");
      if (!this.elements.jobName) { throw new Error("Invalid job name Element"); }

      // The cancel (submission) button
      this.elements.cancelButton = <HTMLButtonElement>this.elements.container.querySelector(`.${ButtonClass.cancel}`);
      if (!this.elements.cancelButton) { throw new Error("Invalid cancel button Element"); }

      // Handle the cancel button click event.
      this.elements.cancelButton.addEventListener("click", (event_: MouseEvent) => {

         // Display the file selection panel again.
         this.elements.fileSelection.classList.add("active");

         // Hide the file submission panel.
         this.elements.fileSubmission.classList.remove("active");

         // Clear the file input
         this.elements.fileInput.value = ""; 

         // Clear the job name input
         this.elements.jobName.value = ""; 
      })

      // TODO: Wire up event handlers. (???)
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
         content = "Your sequence file has been uploaded. Depending on the size of the file, the processing may take several minutes to copmlete.";

      } else {
         title = "Processing your sequence files";
         content = "Your sequence files have been uploaded. Depending on the number of files and their size, the processing may take several minutes to copmlete.";
      }

      // Display a "success" dialog.
      return await AlertBuilder.displaySuccess(content, title, async () => {
         await this.parent.handleAction(PanelAction.displayJob, PanelKey.upload);
      });
   }

   // Unload and hide the panel.
   unload() {

      console.log("unloading upload panel")

      this.elements.container.classList.remove("active");
      console.log("this.elements.container = ", this.elements.container)

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
         
         if (files.length < 1) { 
            return await AlertBuilder.displayError("Unable to upload: no valid files were found");
         }

         if (sequenceCount >= Constants.MAX_SEQUENCE_COUNT) {    
            return await AlertBuilder.displayError(`Unable to upload: The maximum number of sequences ` +
               `that can be loaded is ${Constants.MAX_SEQUENCE_COUNT} (you tried to submit ${sequenceCount} sequences)`);
         }

         // Upload the sequence file(s) to the web service for processing.
         const job = await SequenceSearchService.uploadSequences(this.parent.authToken, files, jobName, this.parent.user.email, this.parent.user.uid);
         if (!!job) {
            console.log("returned job = ", job)
            this.parent.job = job; 
            this.parent.state.jobUID = job.uid; 
         }
         
         // Show a modal dialog with information about the uploaded files.
         await this.showInfoDialog(files.length, filenames);

         console.debug("after awaiting show info dialog")
         //])
         //.then((results_) => {
         //   if (results_[0].status === "rejected") { throw new Error(results_[0].reason); }
         //});
         
      } catch (error_) {
         await AlertBuilder.displayError(error_);
      }

      // Re-initialize the upload controls.
      this.elements.fileInput.files = null;

      // Update the upload button.
      this.elements.uploadButton.innerHTML = `Nothing to submit`;

      // Clear the job name control.
      this.elements.jobName.value = "";

      // Display the file selection panel.
      this.elements.fileSelection.classList.add("active");

      // Hide the file submission panel.
      this.elements.fileSubmission.classList.remove("active");

      // If a job was returned, display it.
      //if (this.job !== null) { await this.displayJob(); }

      return;
   }

}