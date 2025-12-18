
import { ButtonClass, Constants, Icon, PanelKey } from "../Common";
import { ITaxaBlastPanel } from "./ITaxaBlastPanel";
import { TaxaBLAST } from "../TaxaBLAST";
import tippy from "tippy.js";
import { Utils } from "../../../helpers/Utils";


export class JobSubmissionPanel implements ITaxaBlastPanel {

   containerSelector: string;

   // DOM elements
   elements: {
      cancelButton: HTMLButtonElement,
      container: HTMLElement,
      jobName: HTMLInputElement,
      jobNameLabel: HTMLElement,
      selectedFiles: HTMLElement,
      uploadButton: HTMLButtonElement
   }

   /*
   cancelButton
   jobName
   jobNameLabel
   selectedFiles
   uploadButton
      */
   // Is the panel currently active/displayed?
   isActive: boolean;

   // The parent page
   parent: TaxaBLAST = null;
   

   // C-tor
   constructor(containerEl_: HTMLElement, parent_: TaxaBLAST) {

      if (!containerEl_) { throw new Error("Invalid container element"); }
      if (!parent_) { throw new Error("Invalid parent parameter"); }
      
      this.parent = parent_;

      this.elements = {
         cancelButton: null,
         container: containerEl_,
         jobName: null,
         jobNameLabel: null,
         selectedFiles: null,
         uploadButton: null
      }
   }


   // Make the panel visible and populate it with data.
   async load() {

      console.info("LOADING job submission panel")

      this.isActive = true;

      // Make the container visible.
      this.elements.container.classList.add("active");

      // Create HTML for the container Element.
      const html = 
         `<div class="job-submission sub-panel">
         
            <div class="job-name-row">
               <div class=\"job-name-label\">Job name</div>
               <input type=\"text\" class=\"job-name\" placeholder=\"optional\" />
            </div>
            
            <div class="selected-files-label">Selected files</div>
            <div class="selected-files"></div>

            <div class="controls">
               <button class=\"btn ${ButtonClass.upload}\">${Icon.upload} Run</button>
               <button class=\"btn ${ButtonClass.cancel}\">${Icon.cancel} Cancel</button>
            </div>
         </div>`;

      this.elements.container.innerHTML = html;

      // Get references to the DOM elements.
      
      // The upload button
      this.elements.uploadButton = this.elements.container.querySelector(`.${ButtonClass.upload}`) as HTMLButtonElement;
      if (!this.elements.uploadButton) { throw new Error("Invalid upload button element"); }
      this.elements.uploadButton.addEventListener("click", () => { this.uploadSequences(); })

      // The job name control and its label.
      this.elements.jobNameLabel = this.elements.container.querySelector(".job-name-label") as HTMLElement;
      if (!this.elements.jobNameLabel) { throw new Error("Invalid job name label element"); }

      this.elements.jobName = this.elements.container.querySelector(".job-name") as HTMLInputElement;
      if (!this.elements.jobName) { throw new Error("Invalid job name element"); }

      // The "cancel upload" button
      this.elements.cancelButton = this.elements.container.querySelector(`.${ButtonClass.cancel}`) as HTMLButtonElement;
      if (!this.elements.cancelButton) { throw new Error("Invalid cancel button element"); }

      // The cancel button will hide the job submission panel and display the file selection panel.
      this.elements.cancelButton.addEventListener("click", async () => { return await this.parent.displayPanel(PanelKey.fastaInput); })

      // The "selected files" element
      this.elements.selectedFiles = this.elements.container.querySelector(".selected-files") as HTMLElement;
      if (!this.elements.selectedFiles) { throw new Error("Invalid selected files element"); }

      // Initialize tippy tooltips for buttons.
      tippy(".has-tooltip");
      return
   }

   // Unload and hide the panel.
   unload() {

      this.isActive = false;
      this.elements.container.classList.remove("active");
      
      // TODO: should we remove event listeners?
   }

   
   // Upload the selected files to the web service for processing.
   async uploadSequences() {

      console.log("in uploadSequences: TODO!")

      /*
      if (!this.elements.fileInput) { throw new Error("Invalid file control"); }

      if (!this.elements.fileInput.files || this.elements.fileInput.files.length < 1) { 
         return await AlertBuilder.displayError(`No files were selected to upload`); 
      }
      
      // Get the (optional) job name.
      let jobName = this.elements.jobName.value;
      if (!jobName) { jobName = null; }

      // Get BLAST parameters from the URL.
      const blastParams = await this.getBlastParams();

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

            // Add file data to the array.
            files.push({
               name: file.name,
               contents: contents
            })
         }
         
         if (files.length < 1) { return await AlertBuilder.displayError("Unable to upload: no valid files were found"); }

         // Validate the number of FASTA records/sequences found in the file(s).
         if (recordCount >= Constants.MAX_SEQUENCE_COUNT) {  

            const s = recordCount === 1 ? "" : "s";

            // Create an error message.
            const errorMessage = `Unable to process your file${s}: The maximum number of sequences that can be run is ${Constants.MAX_SEQUENCE_COUNT} ` +
            `(you tried to upload ${recordCount} sequence${s})`

            return await AlertBuilder.displayError(errorMessage, null, () => this.changePanelMode(PanelMode.file_selection));

         } else if (recordCount < 1) {
            return await AlertBuilder.displayError(`Your selected file(s) do not contain any valid FASTA sequences`, null, () => this.changePanelMode(PanelMode.file_selection));
         }

         // Initialize the submission status.
         this.submissionStatus.start(files.length, recordCount);

         // Change the panel mode to "job submitted".
         await this.changePanelMode(PanelMode.job_submitted);
         
         // Upload the sequence file(s) to the web service for processing.
         const result = await TaxaBlastService.uploadSequences(this.parent.authToken, blastParams, files, jobName, this.parent.user.email, this.parent.user.uid);

         // Handle the upload result and display the correct sub-panel.
         await this.handleUploadResult(result);
         
      } catch (error_) {
         await AlertBuilder.displayError(error_);
      }*/

      return;
   }

}