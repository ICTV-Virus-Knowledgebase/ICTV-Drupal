
import { AlertBuilder } from "../../../helpers/AlertBuilder";
import { BlastParams } from "../BlastParams";
import { BlastTask, ButtonClass, Constants, GetBlastTaskDescription, GetBlastTaskLabel, Icon, PanelKey, ParameterKey, ReadFileAsync } from "../Common";
import { DialogBuilder } from "../../../helpers/DialogBuilder";
import { FastaError } from "../../../models/FastaError";
import { FastaFile } from "../../../models/FastaFile";
import { FastaStatus } from "../../../global/Types";
import { IFileData } from "../../../models/IFileData";
import { ITaxaBlastPanel } from "./ITaxaBlastPanel";
import { JobSubmission } from "../JobSubmission";
import { SelectedFiles } from "../SelectedFiles";
import { TaxaBLAST } from "../TaxaBLAST";
//import { TaxaBlastService } from "../../../services/TaxaBlastService";
import tippy from "tippy.js";
import { Utils } from "../../../helpers/Utils";

// CSS classes for input controls.
enum ControlClass {
   fastaFilename = "fasta-filename",
   fastaMessage = "fasta-message",
   fastaText = "fasta-text",

   // Classes to display or hide buttons
   hidden = "hidden",
   visible = "visible"
}

export class FastaInputPanel implements ITaxaBlastPanel {

   // A (virtual) file populated by the FASTA text dialog. If the file is valid and the user 
   // clicks "add" in the dialog, this file will be added to this.selectedFiles.
   dialogFile: FastaFile;
   
   // DOM elements
   elements: {
      container: HTMLElement,

      // BLAST parameters
      blastMaxHSPS: HTMLInputElement,
      blastMaxTargetSeqs: HTMLInputElement,
      
      enterFastaButton: HTMLButtonElement,
      fileInput: HTMLInputElement,
      filesButton: HTMLButtonElement,
      jobName: HTMLInputElement,

      // A list of selected files
      selectedFilesSection: HTMLElement,
      selectedFilesTitle: HTMLElement,
      selectedFilesContents: HTMLElement, 

      // The FASTA dialog
      fastaDialog: HTMLElement,
      dialogAddButton: HTMLButtonElement,
      dialogFasta: HTMLTextAreaElement,
      dialogFilename: HTMLInputElement,
      dialogMessage: HTMLElement,

      startButton: HTMLButtonElement
   }

   // This is used to only run validation on the FASTA textarea in the dialog after the user finishes typing.
   debounceTimer;

   // Is the panel currently active/displayed?
   isActive: boolean;

   // The parent page
   parent: TaxaBLAST = null;
   
   // FASTA files to be uploaded and BLAST-ed.
   selectedFiles: SelectedFiles;

   

   // C-tor
   constructor(containerEl_: HTMLElement, parent_: TaxaBLAST) {

      if (!containerEl_) { throw new Error("Invalid container element"); }
      if (!parent_) { throw new Error("Invalid parent parameter"); }
      
      this.parent = parent_;

      this.elements = {
         blastMaxHSPS: null,
         blastMaxTargetSeqs: null,
         container: containerEl_,
         dialogAddButton: null,
         dialogFasta: null,
         dialogFilename: null,
         dialogMessage: null,
         enterFastaButton: null,
         fastaDialog: null,
         fileInput: null,
         filesButton: null,
         jobName: null,
         selectedFilesSection: null,
         selectedFilesTitle: null,
         selectedFilesContents: null,
         startButton: null
      }

      // Create a new job submission object.
      this.parent.jobSubmission = new JobSubmission();

      // Create a new SelectedFiles instance.
      this.selectedFiles = new SelectedFiles();
   }

   // Create HTML controls for BLAST task selection.
   createBlastTaskHTML() {

      const html = 
         `<table class="blast-tasks">
            <thead>
               <tr class="header-row">
                  <th class="control-column"></th>
                  <th class="task-column">BLAST program</th>
                  <th class="optimizes-column">Optimizes for...</th>
               </tr>
            </thead>
            <tbody>
               <tr class="task-row">
                  <td><input type="radio" name="blast-task" value="${BlastTask.blastn}" checked /></td>
                  <td>${GetBlastTaskLabel(BlastTask.blastn)}</td>
                  <td>${GetBlastTaskDescription(BlastTask.blastn)}</td>
               </tr>
               <tr class="task-row">
                  <td><input type="radio" name="blast-task" value="${BlastTask.dcMegablast}" /></td>
                  <td>${GetBlastTaskLabel(BlastTask.dcMegablast)}</td>
                  <td>${GetBlastTaskDescription(BlastTask.dcMegablast)}</td>
               </tr>
               <tr class="task-row">
                  <td><input type="radio" name="blast-task" value="${BlastTask.megablast}" /></td>
                  <td>${GetBlastTaskLabel(BlastTask.megablast)}</td>
                  <td>${GetBlastTaskDescription(BlastTask.megablast)}</td>
               </tr>
               <tr class="task-row">
                  <td><input type="radio" name="blast-task" value="${BlastTask.blastp}" /></td>
                  <td>${GetBlastTaskLabel(BlastTask.blastp)}</td>
                  <td>${GetBlastTaskDescription(BlastTask.blastp)}</td>
               </tr>
            </tbody>
         </table>`;

      return html;
   }

   // Create HTML for the "enter FASTA text" dialog.
   createFastaDialogHTML() {
      
      const id = "fasta_dialog";

      let title = "Enter FASTA text to upload";

      let body = 
         `<div class="dialog-row">
            <label>Filename</label>
            <input type="text" class="${ControlClass.fastaFilename}" placeholder="(optional)">
         </div>
         <div class="dialog-row">
            <textarea class="${ControlClass.fastaText}" rows="15" placeholder="Enter FASTA here"  
               data-file-size="0"
               data-record-count="0"
               data-status="${FastaStatus.empty}"
            ></textarea>
         </div>
         <div class="${ControlClass.fastaMessage}" data-status="${FastaStatus.empty}"></div>`;

      // Create dialog buttons    
      let addButton = DialogBuilder.CreateButtonHTML(ButtonClass.add, "Add FASTA", Icon.add, true);
      let closeButton = DialogBuilder.CreateButtonHTML(ButtonClass.cancel, "Cancel", Icon.close);

      let footer = `${addButton} ${closeButton}`;

      return DialogBuilder.CreateDialogHTML(footer, body, id, title);
   }

   // Format FASTA error messages as HTML.
   createFastaErrorHTML(messages_: string[]): string {

      let body = "";
      let bullets = ""; 
      let title = "";
      
      if (messages_ == null || messages_.length < 1) {
         title = "An unknown error was found";

      } else if (messages_.length === 1) {

         // Display the error message in the title.
         title = `Error: ${messages_[0]}`;
      } else {

         // Display the errors in a bulleted list.
         title = `${messages_.length} errors:`;
         messages_.forEach((message_) => {
            bullets += `<li class="error-message">${message_}</li>`;
         })
         body = `<ul class="error-messages">${bullets}</ul>`
      }

      return `<div class="error-title">${Icon.error} ${title}</div>${body}`;
   }
   
   // Display errors associated with a FASTA file.
   displayFileSelectionErrors(filename_: string) {

      try {
         // Get the FASTA file from the selected files.
         const file = this.selectedFiles.getFile(filename_);
         if (!file) { throw new Error(`File ${filename_} is invalid`); }

         let bullets = "";

         let errors = file.getErrors();
         if (!Array.isArray(errors) || errors.length < 1) { throw new Error(`No errors were found for file ${filename_}`); }

         errors.forEach((error_) => {
            bullets += `<li class="error-item">${error_}</li>`;
         })

         AlertBuilder.displayErrorSync(`<ul class="errors">${bullets}</ul>`, `Errors in ${filename_}`);

      } catch (error_) {
         AlertBuilder.displayErrorSync(error_);
      }
      
      return;
   }

   // Display the list of selected files and their metadata.
   displaySelectedFiles() {

      if (this.selectedFiles.isEmpty) {
         this.elements.selectedFilesContents.innerHTML = "";
         this.elements.selectedFilesSection.classList.remove("active");
         return;
      }

      //console.log("in displaySelectedFiles this.selectedFiles = ", this.selectedFiles)

      // Populate the title row
      let sequenceText = this.selectedFiles.recordCount === 1 ? "1 sequence" : `${this.selectedFiles.recordCount} sequences`;
      let sizeText = Utils.formatBytes(this.selectedFiles.totalSize);

      this.elements.selectedFilesTitle.innerHTML = `<span class="title-text">Files to upload</span> (${sizeText}, ${sequenceText})
         <button class="${ButtonClass.removeFiles}">${Icon.delete} Remove selected files</button>
         <button class="${ButtonClass.toggle}">${Icon.toggle} Toggle selection</button>`;
      
      let rows = "";

      // Add a row element for every selected file.
      this.selectedFiles.files.forEach((file_) => {

         let status = "";
         if (file_.errorCount < 1) {
            status = "Valid";
         } else {
            let errorsLabel = file_.errorCount == 1 ? "1 error" : `${file_.errorCount} errors`;
            status = `<button class="${ButtonClass.link}" data-filename="${file_.filename}">${errorsLabel}</button>`
         }

         rows += `<tr class="selected-file">
            <td class="select"><input type="checkbox" data-filename="${file_.filename}" /></td>
            <td class="filename">${file_.filename}</td>
            <td class="size">${Utils.formatBytes(file_.size)}</td>
            <td class="status">${status}</td> 
            <td class="sequences">${file_.records.length}</td>
         </li>`;
      })

      let html = `<table class="selected-files">
         <thead>
            <tr class="header-row">
               <th class="select"></th>
               <th class="filename">Filename</th>
               <th class="size">Size</th>
               <th class="status">Status</th>
               <th class="sequences">Sequences</th>
            </tr>
         </thead>
         <tbody>${rows}</tbody>
      </table>`;

      this.elements.selectedFilesContents.innerHTML = html;
      this.elements.selectedFilesSection.classList.add("active");
   }

   // Get BLAST parameters from the panel.
   async getBlastParams(): Promise<BlastParams> {

      // Get the selected BLAST task.
      const selectedTaskEl = this.elements.container.querySelector("input[name=\"blast-task\"]:checked") as HTMLInputElement;
      if (!selectedTaskEl) { throw new Error("Please select a BLAST task"); }

      const task = selectedTaskEl.value as BlastTask;
      if (!task) { throw new Error("The selected BLAST task is invalid"); }

      let maxHSPS = parseInt(Utils.safeTrim(this.elements.blastMaxHSPS.value));
      if (isNaN(maxHSPS) || maxHSPS < 1) { maxHSPS = Constants.DEFAULT_MAX_HSPS; }

      let maxTargetSeqs = parseInt(Utils.safeTrim(this.elements.blastMaxTargetSeqs.value));
      if (isNaN(maxTargetSeqs) || maxTargetSeqs < 1) { maxTargetSeqs = Constants.DEFAULT_MAX_TARGET_SEQS; }
      
      return new BlastParams(maxHSPS, maxTargetSeqs, task);
   }

   // Handle a click in the "selected files" section.
   handleSelectedFilesClick(event_) {

      const target = event_.target as HTMLElement;

      const button = target.closest("button");
      if (button) {
         if (button.classList.contains(ButtonClass.toggle)) {
            this.toggleFileSelections();

         } else if (button.classList.contains(ButtonClass.removeFiles)) {
            this.removeFileSelections();

         } else if (button.classList.contains(ButtonClass.link)) {

            const filename = button.getAttribute("data-filename");
            this.displayFileSelectionErrors(filename);

         } else {
            console.log("unknown button")
         }

         return;
      }

      const checkbox = target.closest("input");
      if (checkbox) {

         console.log("closest checkbox = ", checkbox)

         let filename = checkbox.getAttribute("data-filename");
         console.log("checkbox filename = ", filename)

         return;
      }  
   }

   // Populate the panel and make it visible.
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

      // Get the HTML for the BLAST task selection table.
      const blastTaskHTML = this.createBlastTaskHTML();
      
      // Create HTML for the container Element.
      const html = 
         `<div class="input-section">
            <div class="number-column">1.</div>
            <div class="content-column">
               Select one or more FASTA files or enter FASTA text.
               <button class=\"btn ${ButtonClass.selectFiles} has-tooltip\"
                  data-tippy-content="Click to select one or more FASTA files to upload. Up to ${Constants.MAX_SEQUENCE_COUNT} sequences can be submitted in one or multiple files."
               >${Icon.search} Select files</button>
               <button class=\"btn ${ButtonClass.enterFASTA} has-tooltip\"
                  data-tippy-content="Click to enter FASTA text to be uploaded. Up to ${Constants.MAX_SEQUENCE_COUNT} sequences can be included."
               >${Icon.edit} Enter FASTA text</button>
               <input type=\"file\" id=\"file_input\" multiple accept="${fileFormats}" />

               ${appleWarning}

               <div class="selected-files-section">
                  <div class="title">Selected files</div>
                  <div class="contents"></div>
               </div>  
            </div>
         </div>
         
         <div class="input-section">
            <div class="number-column">2.</div>
            <div class="content-column">Enter BLAST parameters (optional)
               <div class="control-row">${blastTaskHTML}</div>
               <div class="control-row">
                  <label>Max HSPs per target sequence </label>
                  <input type="number" class="max-hsps" value="${Constants.DEFAULT_MAX_HSPS}" />
               </div>
               <div class="control-row">
                  <label>Max target sequences </label>
                  <input type="number" class="max-target-seqs" value="${Constants.DEFAULT_MAX_TARGET_SEQS}" />
               </div>
            </div>
         </div>

         <div class="input-section">
            <div class="number-column">3.</div>
            <div class="content-column">
               Enter a job name <input type=\"text\" class=\"job-name\" placeholder="optional" />
            </div>
         </div>

         <div class="input-section">
            <div class="number-column">4.</div>
            <div class="content-column">
               Upload FASTA files and run TaxaBLAST <button class=\"btn start-button\">Start</button>
            </div>
         </div>
         ${this.createFastaDialogHTML()}`;

      this.elements.container.innerHTML = html;

      //------------------------------------------------------------------------------------------------------------------------
      // Get references to the DOM elements.
      //------------------------------------------------------------------------------------------------------------------------
      
      // The "selected files" display elements
      this.elements.selectedFilesSection = this.elements.container.querySelector(".selected-files-section") as HTMLElement;
      if (!this.elements.selectedFilesSection) { throw new Error("Invalid selected files element"); }

      this.elements.selectedFilesSection.addEventListener("click", (event_) => this.handleSelectedFilesClick(event_));

      this.elements.selectedFilesTitle = this.elements.selectedFilesSection.querySelector(".title") as HTMLElement;
      if (!this.elements.selectedFilesTitle) { throw new Error("Invalid selected files title element"); }

      this.elements.selectedFilesContents = this.elements.selectedFilesSection.querySelector(".contents") as HTMLElement;
      if (!this.elements.selectedFilesContents) { throw new Error("Invalid selected files contents element"); }

      // The FASTA dialog
      this.elements.fastaDialog = this.elements.container.querySelector("#fasta_dialog");
      if (!this.elements.fastaDialog) { throw new Error("Invalid FASTA dialog"); }

      this.elements.dialogFilename = this.elements.fastaDialog.querySelector(`.${ControlClass.fastaFilename}`);
      if (!this.elements.dialogFilename) { throw new Error("Invalid filename control in the dialog"); }

      this.elements.dialogFasta = this.elements.fastaDialog.querySelector(`.${ControlClass.fastaText}`);
      if (!this.elements.dialogFasta) { throw new Error("Invalid FASTA text control in the dialog"); }

      this.elements.dialogMessage = this.elements.fastaDialog.querySelector(`.${ControlClass.fastaMessage}`);
      if (!this.elements.dialogMessage) { throw new Error("Invalid message element in the dialog"); }

      this.elements.dialogAddButton = this.elements.fastaDialog.querySelector(`.${ButtonClass.add}`);
      if (!this.elements.dialogAddButton) { throw new Error("Invalid add button in the dialog"); }

      // Handle changes to the dialog controls.
      this.elements.fastaDialog.addEventListener("input", async (event_) => {

         const target = (event_.target) as HTMLElement;
         if (!target) { throw new Error("Invalid target element in change event"); }

         clearTimeout(this.debounceTimer);

         if (target.classList.contains(ControlClass.fastaFilename)) {

            console.log("filename was changed")
            // TODO: Make sure there isn't already a file with this name in this.selectedFiles?

         } else if (target.classList.contains(ControlClass.fastaText)) {
            
            console.log("you modified the FASTA textarea")

            this.debounceTimer = setTimeout(async () => {

               const status = await this.validateDialogFASTA();

               console.log(`${status} was returned by validateDialogFASTA`)

               // The status determines whether the button is disabled.
               this.elements.dialogAddButton.disabled = status !== FastaStatus.valid;

               return;
            }, 1000); // Adjust delay as needed

            //await this.validateDialogFASTA();
         }
      })

      // Handle a click event on the FASTA dialog.
      this.elements.fastaDialog.addEventListener("click", async (event_) => {
         
         const target = (event_.target) as HTMLElement;

         if (target.classList.contains(ButtonClass.cancel)) {

            // Reset/clear the input fields and close the dialog.
            this.resetFastaDialog();
            this.elements.fastaDialog.style.display = "none";

         } else if (target.classList.contains(ButtonClass.add)) {
            
            if (this.elements.dialogAddButton.disabled) { 
               console.error("Error: the add button was clicked even though it is disabled?");
               return;
            }

            try {
               // Update the selected files with the file created using the dialog.
               this.selectedFiles.addFile(this.dialogFile);

               // Reset the dialog
               this.resetFastaDialog();

               // Hide the dialog.
               this.elements.fastaDialog.style.display = "none";

               // Display the selected FASTA files that should now include the file created using the dialog.
               this.displaySelectedFiles();

            } catch (error_) {
               this.dialogFile = null;
               return AlertBuilder.displayError(error_);
            } 
         }

         return;
      })

      // The file input control
      this.elements.fileInput = this.elements.container.querySelector("#file_input") as HTMLInputElement;
      if (!this.elements.fileInput) { throw new Error("Invalid file input element"); }
      
      this.elements.fileInput.addEventListener("change", async () => await this.validateFastaFiles());

      // The "select files" button
      this.elements.filesButton = this.elements.container.querySelector(`.${ButtonClass.selectFiles}`) as HTMLButtonElement;
      if (!this.elements.filesButton) { throw new Error("Invalid files button element"); }

      // Clicking on the files button will trigger a click on the file input element.
      this.elements.filesButton.addEventListener("click", () => this.elements.fileInput.click());

      // The "Enter FASTA text" button
      this.elements.enterFastaButton = this.elements.container.querySelector(`.${ButtonClass.enterFASTA}`);
      if (!this.elements.enterFastaButton) { throw new Error("Invalid \"Enter FASTA\" button element"); }

      this.elements.enterFastaButton.addEventListener("click", () => this.openFastaDialog());

      // NOTE: We're only doing this to make sure they exist.
      const blastTaskRadios = this.elements.container.querySelectorAll('input[name="blast-task"]') as NodeListOf<HTMLInputElement>;
      if (!blastTaskRadios || blastTaskRadios.length < 1) { throw new Error("Invalid BLAST task radio elements"); }

      // The max HSPs input box
      this.elements.blastMaxHSPS = this.elements.container.querySelector(".max-hsps") as HTMLInputElement;
      if (!this.elements.blastMaxHSPS) { throw new Error("Invalid max HSPs input element"); }

      // Replace an empty value with the default.
      this.elements.blastMaxHSPS.addEventListener("change", () => {
         if (isNaN(parseInt(this.elements.blastMaxHSPS.value))) {
            this.elements.blastMaxHSPS.value = Constants.DEFAULT_MAX_HSPS.toString();
         }
      })

      // The max target seqs input box
      this.elements.blastMaxTargetSeqs = this.elements.container.querySelector(".max-target-seqs") as HTMLInputElement;
      if (!this.elements.blastMaxTargetSeqs) { throw new Error("Invalid max target seqs input element"); }

      // Replace an empty value with the default.
      this.elements.blastMaxTargetSeqs.addEventListener("change", () => {
         if (isNaN(parseInt(this.elements.blastMaxTargetSeqs.value))) {
            this.elements.blastMaxTargetSeqs.value = Constants.DEFAULT_MAX_TARGET_SEQS.toString();
         }
      })

      // The job name input box
      this.elements.jobName = this.elements.container.querySelector(".job-name") as HTMLInputElement;
      if (!this.elements.jobName) { throw new Error("Invalid job name input element"); }

      // The start button
      this.elements.startButton = this.elements.container.querySelector(`.${ButtonClass.start}`) as HTMLButtonElement;
      if (!this.elements.startButton) { throw new Error("Invalid start button"); }

      this.elements.startButton.addEventListener("click", async () => await this.submitJob());


      // Initialize tippy tooltips for buttons.
      tippy(".has-tooltip");

      return;
   }

   // Open the FASTA entry dialog.
   openFastaDialog() {
      this.elements.fastaDialog.style.display = "block";
      return;
   }

   removeFileSelections() {

      const allFiles: NodeListOf<HTMLInputElement> = this.elements.selectedFilesContents.querySelectorAll(`input[type="checkbox"][data-filename]`);

      if (!allFiles || allFiles.length < 1) { return AlertBuilder.displayErrorSync("No files were selected for removal"); }

      console.log(`TODO: remove file selections (${allFiles.length})`)

      // Clear the name lookup so we can rebuild it.
      let newLookup = new Map<string, number>();

      

      allFiles.forEach((checkbox_: HTMLInputElement) => {
         if (!checkbox_.checked) {

         }
      })
      
   }

   // Reset / clear the contents of the FASTA dialog.
   resetFastaDialog() {

      // Clear the FastaFile created by the dialog.
      this.dialogFile = null;

      // Clear the filename and FASTA controls.
      this.elements.dialogFilename.value = "";
      this.elements.dialogFasta.value = "";

      // Disable the add button
      this.elements.dialogAddButton.disabled = true;

      // Update the FASTA text control's status.
      this.updateFastaControlStatus(FastaStatus.empty, 0, 0);
   }

   // Upload the FASTA file(s) to create a new job.
   async submitJob(): Promise<boolean> {

      try {
         // Does the FASTA control contain valid FASTA text?
         const fastaCtrlStatus = this.elements.dialogFasta.getAttribute("data-status") as FastaStatus;

         console.log("fastaCtrlStatus = ", fastaCtrlStatus)
         
         // Validate the FASTA text.
         //await this.validateFastaText();

         // Get the (optional) job name.
         let jobName = this.elements.jobName.value;
         if (!jobName) { jobName = null; }

         // Get BLAST parameters from the URL.
         const blastParams = await this.getBlastParams();

         console.log("blastParams = ", blastParams)

         console.log("selected files = ", this.selectedFiles)

         // Get and validate file selections.
         //await this.validateFastaFiles();

         /*
         // Were any valid files selected?
         if (!Array.isArray(this.parent.jobSubmission.validFiles) || this.parent.jobSubmission.validFiles.length < 1) { 
            await AlertBuilder.displayError("No valid FASTA files were selected for upload");
            return false;
         }

         // Have we exceeded the maxiumum total file size?
         if (this.parent.jobSubmission.totalSize > Constants.MAX_FILE_SIZE_TOTAL) { 
            await AlertBuilder.displayError(`The total size of all uploaded files must be less than ${Constants.MAX_FILE_SIZE_TOTAL}`);
            return false;
         }

         const recordCount = this.parent.jobSubmission.recordCount;

         // Validate the number of FASTA records/sequences found in the file(s).
         if (recordCount > Constants.MAX_SEQUENCE_COUNT) {

            const s = recordCount === 1 ? "" : "s";

            // Create an error message.
            const errorMessage = `Unable to process your file${s}: The maximum number of sequences that can be run is ${Constants.MAX_SEQUENCE_COUNT} ` +
            `(you tried to upload ${recordCount} sequence${s})`

            await AlertBuilder.displayError(errorMessage);
            return false;

         } else if (recordCount < 1) {
            await AlertBuilder.displayError(`Your selected file(s) do not contain any valid FASTA sequences`);
            return false;
         }
         */
         
         //console.log("job submission = ", this.parent.jobSubmission)

         // Start the job submission.
         //this.parent.jobSubmission.start();

         
         // Upload the sequence file(s) to the web service for processing.
         //const result = await TaxaBlastService.uploadSequences(this.parent.authToken, blastParams, files, jobName, this.parent.user.email, this.parent.user.uid);

         // Handle the upload result and display the correct sub-panel.
         //await this.handleUploadResult(result);
       
      } catch (error_) {
         await AlertBuilder.displayError(error_);
      }

      return;
   }
   
   toggleFileSelections() {

      console.log("TODO")
   }

   // Unload and hide the panel.
   unload() {

      this.isActive = false;
      this.elements.container.classList.remove("active");
      
      // TODO: should we remove event listeners?
   }

   // Update the FASTA text control's data attributes and message.
   updateFastaControlStatus(status_: FastaStatus, fileSize_: number, recordCount_: number, errors_?: string[]) {

      if (fileSize_ == null || isNaN(fileSize_)) { fileSize_ = 0; }
      if (recordCount_ == null || isNaN(recordCount_)) { recordCount_ = 0; }

      // Update the dialog's FASTA text control.
      this.elements.dialogFasta.setAttribute("data-status", status_);
      this.elements.dialogFasta.setAttribute("data-file-size", fileSize_.toString());
      this.elements.dialogFasta.setAttribute("data-record-count", recordCount_.toString());

      let message = "";

      if (status_ == FastaStatus.invalid) {
         message = this.createFastaErrorHTML(errors_);

      } else if (status_ === FastaStatus.valid) {
         message = `${Icon.success} The FASTA sequence is valid (${recordCount_} record${recordCount_ === 1 ? "" : "s"}, ${Utils.formatBytes(fileSize_)})`;

      } else {
         // TODO?
         console.log("TODO: update message control for status ", status_)
      }

      // Update the validation message control.
      this.elements.dialogMessage.innerHTML = message;
      this.elements.dialogMessage.setAttribute("data-status", status_);
   }

   // Validate the data entered in the FASTA dialog.
   async validateDialogFASTA(): Promise<FastaStatus> {

      let errors = null;
      let status = FastaStatus.valid;

      try {       
         // Get the FASTA text entered in the textarea.
         let fastaText = Utils.safeTrim(this.elements.dialogFasta.value);
         if (!fastaText) {
            this.updateFastaControlStatus(FastaStatus.empty, 0, 0);
            return FastaStatus.empty; 
         }
         
         // Did the user enter a filename? If not, use the first FASTA header ID (if the FASTA is valid).
         let filename = Utils.safeTrim(this.elements.dialogFilename.value);

         // Get the file size of the FASTA text in bytes.
         const fileSize = new Blob([fastaText]).size;
         
         // Create a FastaFile object.
         this.dialogFile = new FastaFile(fastaText, filename, fileSize);
   
         if (this.dialogFile.errorCount > 0) { 
            status = FastaStatus.invalid;
            errors = this.dialogFile.getErrors();

         } else if (this.dialogFile.records.length < 1) {
            status = FastaStatus.empty;
         }

         // Provide a default filename
         if (!filename && Array.isArray(this.dialogFile.records) && this.dialogFile.records.length > 0) {
            let headerID = this.dialogFile.records[0].getHeaderID();
            if (!headerID) { headerID = "manually_entered_fasta"; }
            this.dialogFile.filename = `${headerID}.fasta`;
         }

         // Update the FASTA control's status.
         this.updateFastaControlStatus(status, this.dialogFile.size, this.dialogFile.records.length, errors);

         console.log("in validate dialog fasta fastaFile = ", this.dialogFile)

         // Add the FASTA to the selected files.
         //this.selectedFiles.files.push(fastaFile);

         // Update the table of selected files.
         //this.displaySelectedFiles();

         /*
         // Update the total file size.
         this.parent.jobSubmission.totalSize += new Blob([fastaText]).size;
         
         // Update the record count with the number of valid FASTA records in this file.
         this.parent.jobSubmission.recordCount += result.records.length;

         // Add the file to the collection of valid files.
         this.parent.jobSubmission.validFiles.push({
            name: this.generateFastaFilename(),
            contents: fastaText
         })*/
      }
      catch (error_) {
         console.log("error in validateDialogFASTA = ", error_)
         //await AlertBuilder.displayError(error_);
      }

      return status;
   }

   // Validate the FASTA files the user has selected.
   async validateFastaFiles() {

      if (!this.elements.fileInput.files || this.elements.fileInput.files.length < 1) { return; }

      try {
         // Iterate over all files.
         for (let f=0; f < this.elements.fileInput.files.length; f++) {

            // Get the file. TODO: should we do any validation here?
            const file = this.elements.fileInput.files.item(f);
            if (!file) { continue; }

            // Get the file's contents
            const contents = await ReadFileAsync(file);
            if (!contents) { continue; }

            // Create a FastaFile object.
            const fastaFile = new FastaFile(contents, file.name, file.size);
            //fastaFile.populateRecords();
            
            console.log(fastaFile)

            // Update the collection of selected files.
            this.selectedFiles.addFile(fastaFile);

            // Display the selected files.
            this.displaySelectedFiles();
         }
      }
      catch (error_) {
         await AlertBuilder.displayError(error_);
      }
   }

}