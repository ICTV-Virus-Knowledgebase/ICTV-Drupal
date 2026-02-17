
import { AlertBuilder } from "../../../helpers/AlertBuilder";
import { BlastParams } from "../BlastParams";
import { BlastTask, ButtonClass, Constants, GetBlastTaskDescription, GetBlastTaskLabel, Icon, PanelKey, 
   ReadFileAsync, ValidateFastaFilename } from "../Common";
import { DialogBuilder } from "../../../helpers/DialogBuilder";
import { FastaFile } from "../../../models/FastaFile";
import { FastaStatus, JobStatus } from "../../../global/Types";
import { ITaxaBlastPanel } from "./ITaxaBlastPanel";
import { ISubmissionResult } from "../ISubmissionResult";
import { JobSubmission } from "../JobSubmission";
import { SelectedFiles } from "../SelectedFiles";
import { TaxaBLAST } from "../TaxaBLAST";
import { TaxaBlastService } from "../../../services/TaxaBlastService";
import tippy from "tippy.js";
import { Utils } from "../../../helpers/Utils";

// CSS classes for input controls.
enum ControlClass {
   fastaFilename = "fasta-filename",
   fastaFilenameMessage = "fasta-filename-message",
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
      dialogFilenameMessage: HTMLElement,
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
         dialogFilenameMessage: null,
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
                  <th class="description-column">Description</th>
               </tr>
            </thead>
            <tbody>
               <tr class="task-row even">
                  <td><input type="radio" name="blast-task" value="${BlastTask.megablast}" checked /></td>
                  <td>${GetBlastTaskLabel(BlastTask.megablast)}</td>
                  <td>${GetBlastTaskDescription(BlastTask.megablast)}</td>
               </tr>
               <tr class="task-row odd">
                  <td><input type="radio" name="blast-task" value="${BlastTask.dcMegablast}" /></td>
                  <td>${GetBlastTaskLabel(BlastTask.dcMegablast)}</td>
                  <td>${GetBlastTaskDescription(BlastTask.dcMegablast)}</td>
               </tr>
               <tr class="task-row even">
                  <td><input type="radio" name="blast-task" value="${BlastTask.blastn}" /></td>
                  <td>${GetBlastTaskLabel(BlastTask.blastn)}</td>
                  <td>${GetBlastTaskDescription(BlastTask.blastn)}</td>
               </tr>
               <tr class="task-row odd">
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
      const title = "Enter FASTA text to upload";

      let body = 
         `<div class="dialog-row">
            <label>Filename</label>
            <input type="text" class="${ControlClass.fastaFilename}" placeholder="Optional" spellcheck="false">
            <div class="${ControlClass.fastaFilenameMessage}"></div>
         </div>
         <div class="dialog-row">
            <textarea class="${ControlClass.fastaText}" rows="15" placeholder="Enter FASTA here" spellcheck="false" 
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
   
   /* 
   NOTE: This is not currently used because file errors are displayed in a tool tip. If they need to be displayed
   in a bulleted list, we would want to use this function.

   // Display errors associated with a FASTA file.
   displayFileSelectionErrors(filename_: string) {

      try {
         // Get the FASTA file from the selected files.
         const file = this.selectedFiles.getFile(filename_);
         if (!file) { throw new Error(`File ${filename_} is invalid`); }

         let bullets = "";
         const includeFilename = false;

         let errors = file.getErrors(includeFilename);
         if (!Array.isArray(errors) || errors.length < 1) { throw new Error(`No errors were found for file ${filename_}`); }

         errors.forEach((error_) => {
            bullets += `<li class="error-item">${error_}</li>`;
         })

         AlertBuilder.displayErrorSync(`<ul class="errors">${bullets}</ul>`, `Errors in ${filename_}`);

      } catch (error_) {
         AlertBuilder.displayErrorSync(error_);
      }
      
      return;
   }*/

   // Display the list of selected files and their metadata.
   displaySelectedFiles() {

      if (this.selectedFiles.isEmpty()) {
         this.elements.selectedFilesContents.innerHTML = "";
         this.elements.selectedFilesSection.classList.remove("active");

         // Make the start button inactive.
         this.elements.startButton.classList.remove("active");
         return;
      }

      // Populate the title row
      let sequenceText = this.selectedFiles.recordCount === 1 ? "1 sequence" : `${this.selectedFiles.recordCount.toLocaleString("en-US")} sequences`;
      let sizeText = Utils.formatBytes(this.selectedFiles.totalSize, 2);

      this.elements.selectedFilesTitle.innerHTML = 
         `<div class="title-row">
            <div class="left-side">
               <span class="title-text">Files to upload</span> (${sizeText}, ${sequenceText})
            </div>
            <div class="right-side">
               <button class="${ButtonClass.toggle} has-tooltip" 
                  data-all-selected="false"
                  data-tippy-content=\"To remove files from the list below, click the checkbox on individual files or click "Select all" and then click "Remove selected files"\"
               >${Icon.toggleOn} Select all</button>
               <button class="${ButtonClass.removeFiles} has-tooltip" 
                  disabled
                  data-tippy-content=\"Remove every file with a checkmark from the list below\"
               >${Icon.delete} Remove selected files</button>
            </div>
         </div>`;
      
      const includeFilename = false;
      let rows = "";

      // Add a row element for every selected file.
      this.selectedFiles.files.forEach((file_: FastaFile, index_: number) => {

         let errorClass = "";
         let status = "";
         if (file_.errorCount < 1) {

            // If there are no errors, the file is valid.
            status = "Valid";

         } else {

            errorClass = " error";

            let errorText = file_.getErrors(includeFilename).join("; ");
            let errorsLabel = file_.errorCount == 1 ? "1 error" : `${file_.errorCount} errors`;
            status = `<button class="${ButtonClass.errorLink} has-tooltip" 
               data-filename="${file_.filename}"
               data-tippy-content="${errorText}"
               disabled
               >${errorsLabel}</button>`
         }

         const rowClass = index_ % 2 === 0 ? "even" : "odd";

         rows += `<tr class="selected-file ${rowClass}">
            <td class="filename${errorClass}">${file_.filename}</td>
            <td class="size">${Utils.formatBytes(file_.size, 2)}</td>
            <td class="status">${status}</td> 
            <td class="sequences">${file_.records.length.toLocaleString("en-US")}</td>
            <td class="select"><input type="checkbox" data-filename="${file_.filename}" /></td>
         </li>`;
      })

      let html = `<table class="selected-files">
         <thead>
            <tr class="header-row">
               <th class="filename">Filename</th>
               <th class="size">Size</th>
               <th class="status">Status</th>
               <th class="sequences">Sequences</th>
               <th class="select"></th>
            </tr>
         </thead>
         <tbody>${rows}</tbody>
      </table>`;

      this.elements.selectedFilesContents.innerHTML = html;
      this.elements.selectedFilesSection.classList.add("active");

      // Initialize tippy tooltips for buttons.
      tippy(".selected-files .has-tooltip");

      // Make the start button active.
      this.elements.startButton.classList.add("active");
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

      const button = target.closest("button") as HTMLButtonElement;
      if (button) {
         if (button.classList.contains(ButtonClass.toggle)) {

            // Select or deselect all file checkboxes.
            this.toggleFileSelections(button);

         } else if (button.classList.contains(ButtonClass.removeFiles)) {

            // Remove the selected files.
            this.removeFileSelections();

         } /*else if (button.classList.contains(ButtonClass.link)) {
            const filename = button.getAttribute("data-filename");
            this.displayFileSelectionErrors(filename);

         } */ else {
            console.log("unknown button")
         }

         return;
      }

      const checkbox = target.closest("input") as HTMLInputElement;
      if (checkbox) {

         let filename = checkbox.getAttribute("data-filename");
         if (!filename) { return; }

         // Get the "remove selected" button.
         const removeButton = this.elements.selectedFilesTitle.querySelector(`.${ButtonClass.removeFiles}`) as HTMLButtonElement;
         if (!removeButton) { throw new Error("Unable to find the \"remove selected files\" button")}
         
         if (checkbox.checked) {

            // If any checkboxes are checked, enable the "remove files" button.
            removeButton.disabled = false;

         } else {

            let selectionCount = 0;

            // Get all file selection checkboxes that have been checked.
            const checkedControls: NodeListOf<HTMLInputElement> = this.elements.selectedFilesContents.querySelectorAll(`input[type="checkbox"][data-filename]:checked`);
            if (checkedControls && checkedControls.length > 0) { selectionCount = Array.from(checkedControls).length; }
            
            // If any of the file selection checkboxes have been checked, enable the "remove files" button. Otherwise, disable the button.
            removeButton.disabled = selectionCount > 0 ? false : true;
         }

         return;
      }  
   }

   // Handle the web service's response to the job submission.
   async handleSubmissionResult(result_: ISubmissionResult) {

      // Validate the result object.
      if (!result_ || result_.status !== JobStatus.pending || !result_.jobUID) {

         let errorMessage = "Job submission error";

         if (result_ && result_.errorMessage) { 
            errorMessage += `: ${result_.errorMessage}`; 
         } else if (!result_.jobUID) {
            errorMessage += ": No job UID was returned";
         }

         // Reset the parent component's state.
         this.parent.state.jobUID = null;
         this.parent.state.fileIndex = NaN;
         this.parent.state.sequenceIndex = NaN;

         await AlertBuilder.displayError(errorMessage);

         // TODO: What needs to happen here?

         //await this.changePanelMode(PanelMode.file_selection);
         return;
      }

      // Update the parent component's state with the new job UID.
      this.parent.state.jobUID = result_.jobUID;
      this.parent.state.fileIndex = NaN;
      this.parent.state.sequenceIndex = NaN;

      // Update the URL parameters without reloading the page.
      this.parent.updateUrlFromState();

      // Navigate to the job details panel.
      this.parent.displayPanel(PanelKey.jobDetails);
      
      /*
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
      }*/
      
      return;
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
               <button class=\"btn ${ButtonClass.selectFiles} active has-tooltip\"
                  data-tippy-content="Click to select one or more FASTA files to upload. Up to ${Constants.MAX_SEQUENCE_COUNT} sequences can be submitted in one or multiple files."
               >${Icon.search} Select files</button>
               <button class=\"btn ${ButtonClass.enterFASTA} active has-tooltip\"
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
               Enter a job name <input type=\"text\" class=\"job-name\" placeholder=\"optional\" spellcheck=\"false\" />
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

      this.elements.dialogFilenameMessage = this.elements.fastaDialog.querySelector(`.${ControlClass.fastaFilenameMessage}`);
      if (!this.elements.dialogFilenameMessage) { throw new Error("Invalid filename message in the dialog"); }

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
            // TODO: Make sure there isn't already a file with this name in this.selectedFiles?

            let filename = (target as HTMLInputElement).value;

            if (!ValidateFastaFilename(filename)) {
               this.elements.dialogFilenameMessage.innerHTML = `${Icon.error} Invalid filename`;
               this.elements.dialogFilenameMessage.classList.add("active");
            } else {           
               this.elements.dialogFilenameMessage.innerHTML = "";
               this.elements.dialogFilenameMessage.classList.remove("active");
            }

         } else if (target.classList.contains(ControlClass.fastaText)) {
            
            this.debounceTimer = setTimeout(async () => {

               const status = await this.validateDialogFASTA();

               // The status determines whether the button is disabled.
               this.elements.dialogAddButton.disabled = status !== FastaStatus.valid;

               return;
            }, 1000); // Adjust delay as needed
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

            console.log("in add button click handler the filename el is ", this.elements.dialogFilename, " and its value is ", this.elements.dialogFilename.value)

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

      // Get all file selection checkboxes that have been checked.
      const checkedControls: NodeListOf<HTMLInputElement> = this.elements.selectedFilesContents.querySelectorAll(`input[type="checkbox"][data-filename]:checked`);
      if (!checkedControls || checkedControls.length < 1) { return AlertBuilder.displayErrorSync("No files were selected for removal"); }

      let filenames = new Array<string>();

      checkedControls.forEach((checkbox_: HTMLInputElement) => {

         let filename = checkbox_.getAttribute("data-filename");
         if (!filename) { return; }

         filenames.push(filename);
      })
      
      // Remove files with these filenames.
      this.selectedFiles.removeFiles(filenames);

      // Update the table of selected files.
      this.displaySelectedFiles();

      return;
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
         // Get the (optional) job name.
         let jobName = this.elements.jobName.value;
         if (!jobName) { jobName = null; }

         // Get BLAST parameters from the URL.
         const blastParams = await this.getBlastParams();

         // Include the errors found during validation.
         const includeFilename = true;
         const errors = this.selectedFiles.getErrors(includeFilename);

         if (errors.length > 0) {

            // Create the error title.
            let s = errors.length === 1 ? "" : "s";
            let errorTitle = `Please resolve the following error${s}:`;

            let bullets = "";
            errors.forEach((error_) => {
               bullets += `<li class="bullet">${error_}</li>`;
            })

            let errorHTML = `<div class="alert-details">
               <div class="title">${errorTitle}</div>
               <ol class="bullets">${bullets}</ol>
            </div>`;

            await AlertBuilder.displayError(errorHTML);
            return false;
         }

         // Start the job submission.
         //this.parent.jobSubmission.start();

         const files = this.selectedFiles.getValidFiles();
         
         // Upload the FASTA file(s) to the web service for processing.
         const result = await TaxaBlastService.uploadSequences(this.parent.authToken, blastParams, files, jobName, this.parent.user.email, this.parent.user.uid);

         console.log("result = ", result)

         // Handle the upload result and display the correct sub-panel.
         await this.handleSubmissionResult(result);
       
      } catch (error_) {
         await AlertBuilder.displayError(error_);
      }

      return;
   }
   
   toggleFileSelections(button_: HTMLButtonElement) {

      let allSelected = button_.getAttribute("data-all-selected");
      if (!allSelected) { throw new Error("Invalid all-selected attribute on the toggle button"); }

      // Get all file selection checkboxes.
      const checkboxes: NodeListOf<HTMLInputElement> = this.elements.selectedFilesContents.querySelectorAll(`input[type="checkbox"][data-filename]`);
      if (!checkboxes || checkboxes.length < 1) { return AlertBuilder.displayErrorSync("No files have been selected"); }

      // Get the "remove selected" button.
      const removeButton = this.elements.selectedFilesTitle.querySelector(`.${ButtonClass.removeFiles}`) as HTMLButtonElement;
      if (!removeButton) { throw new Error("Unable to find the \"remove selected files\" button")}

      let checked: boolean;
      let label = "";

      if (allSelected === "false") {

         // Select all files
         allSelected = "true";
         checked = true;
         label = `${Icon.toggleOff} Deselect all files`;

         // Enable the "remove files" button.
         removeButton.disabled = false;

      } else {

         // Deselect all files
         allSelected = "false";
         checked = false;
         label = `${Icon.toggleOn} Select all`;

         // Disable the "remove files" button.
         removeButton.disabled = true;
      }

      // Update the checked status of all file selection checkboxes.
      checkboxes.forEach((checkbox_: HTMLInputElement) => {
         checkbox_.checked = checked;
      })

      // Update the data attribute and button label.
      button_.setAttribute("data-all-selected", allSelected);
      button_.innerHTML = label;
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
         message = `${Icon.success} The FASTA sequence is valid (${recordCount_} record${recordCount_ === 1 ? "" : "s"}, ${Utils.formatBytes(fileSize_, 2)})`;

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
         
         console.log(`in validateDialogFASTA dialog filename el = `, this.elements.dialogFilename)

         // Did the user enter a filename? If not, use the first FASTA header ID (if the FASTA is valid).
         let filename = Utils.safeTrim(this.elements.dialogFilename.value);

         console.log(`in validateDialogFASTA filename = ${filename}`)

         // Get the file size of the FASTA text in bytes.
         const fileSize = new Blob([fastaText]).size;
         
         // Create a FastaFile object.
         this.dialogFile = new FastaFile(fastaText, filename, fileSize);
   
         if (this.dialogFile.errorCount > 0) { 
            status = FastaStatus.invalid;
            const includeFilename = false;
            errors = this.dialogFile.getErrors(includeFilename);

         } else if (this.dialogFile.records.length < 1) {
            status = FastaStatus.empty;
         }

         // Provide a default filename
         if (!filename && Array.isArray(this.dialogFile.records) && this.dialogFile.records.length > 0) {
            let headerID = this.dialogFile.records[0].getHeaderID();
            if (!headerID) { headerID = "user_entered_fasta"; }
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

            // Update the collection of selected files.
            this.selectedFiles.addFile(fastaFile);
         }

         // Display the selected files.
         this.displaySelectedFiles();
      }
      catch (error_) {
         await AlertBuilder.displayError(error_);
      }
   }

}