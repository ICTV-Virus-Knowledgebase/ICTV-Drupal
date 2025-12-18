
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
import { TaxaBLAST } from "../TaxaBLAST";
//import { TaxaBlastService } from "../../../services/TaxaBlastService";
import tippy from "tippy.js";
import { Utils } from "../../../helpers/Utils";


export class FastaInputPanel implements ITaxaBlastPanel {

   // DOM elements
   elements: {
      blastMaxHSPS: HTMLInputElement,
      blastMaxTargetSeqs: HTMLInputElement,
      container: HTMLElement,
      fastaButton: HTMLButtonElement,
      fastaControl: HTMLTextAreaElement,
      fastaControlMessage: HTMLElement,
      fastaDialog: HTMLElement,
      fileInput: HTMLInputElement,
      filesButton: HTMLButtonElement,
      jobName: HTMLInputElement,
      selectedFilesSection: HTMLElement,
      selectedFilesTitle: HTMLElement,
      selectedFilesContents: HTMLElement,
      startButton: HTMLButtonElement
   }

   // Is the panel currently active/displayed?
   isActive: boolean;

   // The parent page
   parent: TaxaBLAST = null;
   
   // Files selected for upload
   selectedFiles: {
      files: FastaFile[],
      recordCount: number,
      // status?
      totalSize: number;
   }


   // C-tor
   constructor(containerEl_: HTMLElement, parent_: TaxaBLAST) {

      if (!containerEl_) { throw new Error("Invalid container element"); }
      if (!parent_) { throw new Error("Invalid parent parameter"); }
      
      this.parent = parent_;

      this.elements = {
         blastMaxHSPS: null,
         blastMaxTargetSeqs: null,
         container: containerEl_,
         fastaButton: null,
         fastaControl: null,
         fastaControlMessage: null,
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

      this.selectedFiles = {
         files: [],
         recordCount: 0,
         totalSize: 0
      }
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
            <input type="text" class="dialog-filename" placeholder="(optional)">
         </div>
         <div class="dialog-row">
            <textarea class="dialog-fasta-text" rows="15" placeholder="Enter FASTA here"  
               data-file-size="0"
               data-record-count="0"
               data-status="${FastaStatus.empty}"
            ></textarea>
         </div>
         <div class="dialog-fasta-message" data-status="${FastaStatus.empty}"></div>`;

      let saveButton = DialogBuilder.createButtonHTML("dialog-save-button", "Add FASTA", Icon.add);
      let closeButton = DialogBuilder.createButtonHTML("dialog-close-button", "Close", Icon.close);

      let footer = `${saveButton} ${closeButton}`;

      return DialogBuilder.createDialogHTML(footer, body, id, title);
   }

   // Format FASTA error messages as HTML.
   createFastaErrorHTML(messages_: string[]): string {

      let body = "";
      let bullets = ""; 
      let title = "";
      
      if (messages_ == null || messages_.length < 1) {
         title = "An unknown error was found";
      } else {
         title = messages_.length > 1 ? `${messages_.length} errors were found` : "The following error was found";
         messages_.forEach((message_) => {
            bullets += `<li class="error-message">${message_}</li>`;
         })
         body = `<ul class="error-messages">${bullets}</ul>`
      }

      return `<div class="error-title">${Icon.error} ${title}</div>${body}`;
   }
   
   // TODO: move down
   displayFileSelectionErrors(filename_: string) {

   }

   // Display the list of selected files and include metadata.
   displaySelectedFiles() {

      if (!Array.isArray(this.selectedFiles.files) || this.selectedFiles.files.length < 1) {
         this.elements.selectedFilesContents.innerHTML = "";
         this.elements.selectedFilesSection.classList.remove("active");
         return;
      }

      // Populate the title row
      let sequenceText = this.selectedFiles.recordCount === 1 ? "1 sequence" : `${this.selectedFiles.recordCount} sequences`;
      let sizeText = Utils.formatBytes(this.selectedFiles.totalSize);

      this.elements.selectedFilesTitle.innerHTML = `<span class="title-text">Selected files</span> (${sizeText}, ${sequenceText})
         <button class="toggle-button">${Icon.toggle} Toggle selection</button>
         <button class="remove-files-button">${Icon.delete} Remove selected files</button>`;
      
      let rows = "";

      // Add a row element for every selected file.
      this.selectedFiles.files.forEach((file_) => {

         let status = "";
         if (file_.errorCount < 1) {
            status = "Valid";
         } else {
            let errorsLabel = file_.errorCount == 1 ? "1 error" : `${file_.errorCount} errors`;
            status = `<button class="link-button" data-filename="${file_.filename}">${errorsLabel}</button>`
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

   // TODO: we should let the user specify a filename but still provide a default.
   generateFastaFilename(): string {

      // TODO: include timestamp?
      let filename = "manually_entered_fasta_.fasta";

      return filename;
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


   handleSelectedFilesClick(event_) {

      const target = event_.target as HTMLElement;

      const button = target.closest("button");
      if (button) {
         if (button.classList.contains("toggle-button")) {
            this.toggleFileSelections();

         } else if (button.classList.contains("remove-files-button")) {
            this.removeFileSelections();

         } else if (button.classList.contains("link-button")) {
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
               <button class=\"btn fasta-button has-tooltip\"
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

      /*
      <textarea class="fasta-control" rows="5" placeholder="Enter FASTA here (optional)"  
            data-file-size="0"
            data-record-count="0"
            data-status="${FastaStatus.empty}"
         ></textarea>
         <div class="fasta-control-message" data-status="${FastaStatus.empty}"></div>
      */

      this.elements.container.innerHTML = html;

      // Get references to the DOM elements.
      
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

      this.elements.fastaDialog.addEventListener("click", async (event_) => {
         
         const target = (event_.target) as HTMLElement;

         if (target.classList.contains("modal-dialog") || target.classList.contains("dialog-close-button")) {
            this.elements.fastaDialog.style.display = "none";

         } else if (target.classList.contains("dialog-save-button")) {
            await this.validateFastaText();
            //this.elements.fastaDialog.style.display = "none";
         }

         return;
      })

      // The textarea for FASTA
      /*this.elements.fastaControl = this.elements.container.querySelector(".fasta-control") as HTMLTextAreaElement;
      if (!this.elements.fastaControl) { throw new Error("Invalid FASTA control"); }
      
      this.elements.fastaControl.addEventListener("change", async () => await this.validateFastaText());

      // The FASTA control message element
      this.elements.fastaControlMessage = this.elements.container.querySelector(".fasta-control-message") as HTMLElement;
      if (!this.elements.fastaControlMessage) { throw new Error("Invalid FASTA control message element"); }
      */

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
      this.elements.fastaButton = this.elements.container.querySelector(`.fasta-button`);
      if (!this.elements.fastaButton) { throw new Error("Invalid FASTA button element"); }

      this.elements.fastaButton.addEventListener("click", () => this.openFastaDialog());

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
      this.elements.startButton = this.elements.container.querySelector(".start-button") as HTMLButtonElement;
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

      const selectedFiles: NodeListOf<HTMLInputElement> = this.elements.selectedFilesContents.querySelectorAll(`input[type="checkbox"][data-filename]:checked`);

      if (!selectedFiles || selectedFiles.length < 1) { console.log("no selections"); return; }

      console.log(`there are ${selectedFiles.length} selections`)
   }

   
   // Reset / clear the contents of the FASTA dialog.
   resetFastaDialog() {

      const filenameEl = this.elements.fastaDialog.querySelector(".dialog-filename") as HTMLInputElement;
      if (!filenameEl) { throw new Error("Invalid filename element in the FASTA dialog"); }
      filenameEl.value = "";

      const textEl = this.elements.fastaDialog.querySelector(".dialog-fasta-text") as HTMLTextAreaElement;
      if (!textEl) { throw new Error("Invalid FASTA text element in the FASTA dialog"); }
      textEl.value = "";
   }

   // Upload the FASTA file(s) to create a new job.
   async submitJob(): Promise<boolean> {

      try {
         // Does the FASTA control contain valid FASTA text?
         const fastaCtrlStatus = this.elements.fastaControl.getAttribute("data-status") as FastaStatus;

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

   }

   // Unload and hide the panel.
   unload() {

      this.isActive = false;
      this.elements.container.classList.remove("active");
      
      // TODO: should we remove event listeners?
   }

   // Update the FASTA control's data attributes and message.
   updateFastaControlStatus(status_: FastaStatus, fileSize_: number, recordCount_: number, errors_?: string[]) {

      if (fileSize_ == null || isNaN(fileSize_)) { fileSize_ = 0; }
      if (recordCount_ == null || isNaN(recordCount_)) { recordCount_ = 0; }

      /*this.elements.fastaControl.setAttribute("data-status", status_);
      this.elements.fastaControl.setAttribute("data-file-size", fileSize_.toString());
      this.elements.fastaControl.setAttribute("data-record-count", recordCount_.toString());*/

      let message = "";

      if (status_ == FastaStatus.invalid) {
         message = this.createFastaErrorHTML(errors_);

      } else if (status_ === FastaStatus.valid) {
         message = `${Icon.success} The FASTA sequence is valid. (${recordCount_} record${recordCount_ === 1 ? "" : "s"}, ${Utils.formatBytes(fileSize_)})`;

      } else {
         // TODO: success message?
      }

      // Get the FASTA message element.
      const messageEl = this.elements.fastaDialog.querySelector(".dialog-fasta-message");
      if (!messageEl) { throw new Error("Invalid dialog FASTA message element"); }
      messageEl.innerHTML = message;

      // Update the message element.
      //this.elements.fastaControlMessage.setAttribute("data-status", status_);
      //this.elements.fastaControlMessage.innerHTML = message;
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
            fastaFile.populateRecords();
            
            console.log(fastaFile)

            // Update the collection of selected files.
            this.selectedFiles.files.push(fastaFile);

            // Display the selected files.
            this.displaySelectedFiles();
         }
      }
      catch (error_) {
         await AlertBuilder.displayError(error_);
      }
   }

   // Validate the FASTA text in the FASTA textarea.
   async validateFastaText() {

      let errors = null;

      try {       
         // Get and validate the filename element.
         const filenameEl = this.elements.fastaDialog.querySelector(".dialog-filename") as HTMLInputElement;
         if (!filenameEl) { throw new Error("Invalid filename element in the FASTA dialog"); }

         // Get and validate the FASTA text element.
         const textEl = this.elements.fastaDialog.querySelector(".dialog-fasta-text") as HTMLTextAreaElement;
         if (!textEl) { throw new Error("Invalid FASTA text element in the FASTA dialog"); }

         
         // Get the FASTA text entered in the textarea.
         let fastaText = Utils.safeTrim(textEl.value);
         if (!fastaText) {
            this.updateFastaControlStatus(FastaStatus.empty, 0, 0);
            return; 
         }
         
         // Did the user enter a filename? If not, use the first FASTA header ID (if the FASTA is valid).
         let filename = Utils.safeTrim(filenameEl.value);

         // Get the file size of the FASTA text in bytes.
         const fileSize = new Blob([fastaText]).size;
         let status = FastaStatus.valid;

         // Create a FastaFile object.
         const fastaFile = new FastaFile(fastaText, filename, fileSize);
         fastaFile.populateRecords();

         if (fastaFile.errorCount > 0) { 

            status = FastaStatus.invalid;
            errors = fastaFile.getErrors();

         } else if (fastaFile.records.length < 1) {
            status = FastaStatus.empty;
         }

         if (!filename && Array.isArray(fastaFile.records) && fastaFile.records.length > 0) {
            let headerID = fastaFile.records[0].getHeaderID();
            if (!headerID) { headerID = "manually_entered_fasta"; }
            fastaFile.filename = `${headerID}.fasta`;
         }

         // Update the FASTA control's status.
         this.updateFastaControlStatus(status, fastaFile.size, fastaFile.records.length, errors);

         // Add the FASTA to the selected files.
         this.selectedFiles.files.push(fastaFile);

         // Update the table of selected files.
         this.displaySelectedFiles();

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
         console.log("error in validateFastaText = ", error_)
         //await AlertBuilder.displayError(error_);
      }
   }

}