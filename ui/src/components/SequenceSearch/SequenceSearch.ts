
import { AlertBuilder } from "../../helpers/AlertBuilder";
import { decode } from "base64-arraybuffer";
import { ISeqSearchJob } from "./ISeqSearchJob";
import { IFileData } from "../../models/IFileData";
import { ISequenceResult } from "./ISequenceResult";
import { LookupTaxonomyRank, WebStorageKey } from "../../global/Types";
import * as pako from "pako";
import { SequenceSearchService } from "../../services/SequenceSearchService";
import tippy from "tippy.js";
import { Utils } from "../../helpers/Utils";
import { AppSettings } from "../CuratedNameManager";


// CSS class names for buttons.
enum ButtonClass {
   cancel = "cancel-button",
   copyURL = "copy-url-button",
   downloadCSV = "download-csv-button",
   upload = "upload-button",
   viewHTML = "view-html-button"
}


export class SequenceSearch {

   authToken: string;

   config = {
      acceptedFileTypes: [".fa", ".faa", ".fas", ".fasta", ".ffn", ".fna", ".frn", ".mpfa", ".txt"],
      contactEmail: null
   }

   constants = {
      NO_EMAIL: "NO_EMAIL"
   }

   // The CSS selector for the container element where the Sequence Search UI will be rendered.
   containerSelector: string = null;

   // DOM elements
   elements: {
      cancelButton: HTMLButtonElement,
      container: HTMLElement,
      copyIdButton: HTMLButtonElement,
      fileControl: HTMLElement,
      fileInput: HTMLInputElement,
      fileSelection: HTMLElement,
      fileSubmission: HTMLElement,
      fileUploadDetails: HTMLElement,
      jobName: HTMLInputElement,
      jobNameLabel: HTMLElement,
      results: HTMLElement,
      resultsContainer: HTMLElement,
      uploadButton: HTMLButtonElement
   }

   // Icons used on the page.
   icons: {
      browse: string,
      cancel: string,
      chevronDown: string,
      chevronRight: string,
      close: string,
      copy: string,
      csv: string,
      download: string,
      html: string,
      lineageDelimiter: string,
      upload: string
   }

   job: ISeqSearchJob = null;

   // The current job UID (optional)
   jobUID: string = null;
   
   // The URL that can be used to return and view the job data.
   jobURL: string = null;

   // User information
   user: {
      email: string, 
      name: string,
      uid: string
   }

   
   // C-tor
   constructor(authToken_: string, contactEmail_: string, containerSelector_: string, email_: string, 
      name_: string, userUID_: string) {
      
      // Validate parameters
      if (!authToken_ || authToken_.length < 1) { throw new Error("Invalid auth token in SequenceSearch"); }
      if (!contactEmail_) { throw new Error("Invalid contact email"); }
      if (!containerSelector_ || containerSelector_.length < 1) { throw new Error("Invalid container selector in SequenceSearch"); }
      if (!email_ || email_.length < 1) { email_ = this.constants.NO_EMAIL; }
      if (!name_ || name_.length < 1) { name_ = "Anonymous user"; }
      userUID_ = Utils.safeTrim(userUID_);


      this.authToken = authToken_;
      this.config.contactEmail = contactEmail_;
      this.containerSelector = containerSelector_;

      this.user = {
         email: email_, 
         name: name_,
         uid: userUID_
      }

      this.elements = {
         cancelButton: null,
         container: null,
         copyIdButton: null,
         fileControl: null,
         fileInput: null,
         fileSelection: null,
         fileSubmission: null,
         fileUploadDetails: null,
         jobName: null,
         jobNameLabel: null,
         results: null,
         resultsContainer: null,
         uploadButton: null
      }

      this.icons = {
         browse: `<i class=\"fa fa-file\"></i>`,
         cancel: `<i class="fa-solid fa-xmark"></i>`,
         chevronDown: `<i class=\"fa fa-chevron-circle-down expanded\"></i>`,
         chevronRight: `<i class=\"fa fa-chevron-circle-right collapsed\"></i>`,
         close: `<i class=\"fa fa-xmark\"></i>`,
         copy: `<i class=\"fa-regular fa-clipboard\"></i>`,
         csv: `<i class="fa-regular fa-file-csv"></i>`,
         download: `<i class=\"fa fa-download\"></i>`,
         html: `<i class="fa-regular fa-file-lines"></i>`,
         lineageDelimiter: `<i class="fa-solid fa-chevron-right"></i>`,
         upload: `<i class=\"fa fa-upload\"></i>`
      }
   }

   
   async copyJobURL() {

      // Copy the URL to the clipboard.
      await navigator.clipboard.writeText(this.jobURL);

      // Display a success message.
      return await AlertBuilder.displaySuccess("The URL has been copied to your clipboard. You can now bookmark it or paste it into a document for future reference.");
   }


   async displayJob() {

      if (!this.job || !this.job.data || !this.job.data.results) {
         this.elements.resultsContainer.innerHTML = "No results";
         return;
      }

      // Clear any existing content in the results container.
      this.elements.resultsContainer.innerHTML = "";

      //----------------------------------------------------------------------------------------------------------------
      // Create the URL that can be used to view the job data.
      //----------------------------------------------------------------------------------------------------------------
      this.jobURL = window.location.href;

      // TODO: Get rid of this line soon!!!
      this.jobURL = this.jobURL.replace("test.ictv.global", "ictv.global");

      // Remove any existing query string parameters.
      let qIndex = this.jobURL.indexOf("?");
      if (qIndex > -1) { this.jobURL = this.jobURL.substring(0, qIndex); }

      this.jobURL += `?job=${this.job.uid}`;

      //----------------------------------------------------------------------------------------------------------------
      // Generate the HTML for the job results.
      //----------------------------------------------------------------------------------------------------------------
      let resultsHTML = "";

      let inputFiles = [];
      //let inputSequences = [];

      this.job.data.results.forEach((result_: ISequenceResult, index_: number) => {

         // One-based instead of zero-based.
         const displayIndex = index_ + 1;

         // Get the result's taxon name.
         let taxonName = result_.sseqid_lineage.species || "Unknown";

         let isFirstRank = true;
         let lineage = "";
         
         // Populate the lineage to be displayed.
         if (!result_.sseqid_lineage) {
            lineage = "No lineage";

         } else {

            // Iterate over the classification lineage ranks.
            Object.keys(result_.sseqid_lineage).forEach(rank_ => {

               // Skip the species rank.
               if (rank_ === "species") { return; } 

               // Lookup this rank's taxon name in the lineage.
               let name = Utils.safeTrim(result_.sseqid_lineage[rank_]);
               if (!name || name.length < 1) { return; }

               // Should we add a lineage delimiter?
               if (isFirstRank) { 
                  isFirstRank = false;
               } else {
                  lineage += this.icons.lineageDelimiter;
               }
   
               const formattedRank = LookupTaxonomyRank(rank_);

               lineage += `<span class="result-lineage">${formattedRank}: <i>${name}</i></span>`;
            })
         }
         
         // Add the input file to the list of files.
         if (!inputFiles.includes(result_.input_file)) { inputFiles.push(result_.input_file); }

         // Add the input sequence to the list of sequences.
         //if (!inputSequences.includes(result_.input_seq)) { inputSequences.push(result_.input_seq); }

         let subjectInfo = "";

         // Display the BLAST subject and its GenBank accession(s), if available.
         if (!!result_.sseqid_accession && !!result_.sseqid_species_name) {
            
            const genbankLink = Utils.createGenBankAccessionLink(result_.sseqid_accession);

            subjectInfo = `<label>Virus name</label>: ${result_.sseqid_virus_names} (${genbankLink})`;
         }

         // Link the taxon name to the taxon details/history page.
         const detailsURL = `https://${window.location.hostname}/${AppSettings.taxonHistoryPage}?taxon_name=${taxonName}`;
         const linkedName = `<a href="${detailsURL}" target="_blank">${taxonName}</a>`;

         let resultHTML =
            `<div class="sequence-result">
               <div class="info">
                  <div class="result-index">#${displayIndex}</div>
                  <div class="lineage-and-result">
                     <div class="lineage">${lineage}</div>
                     <div class="result">
                        <div class="result-name">
                           <span class="rank-name">Species</span>: 
                           <span class="taxon-name">${linkedName}</span>
                        </div>
                        <div class="data-row">${subjectInfo}</div>
                        <div class="data-row">
                           <label>Bitscore</label>: ${result_.bitscore} bits
                        </div>
                        <div class="data-row">
                           <label>E-value</label>: ${result_.evalue}
                        </div>
                     </div>
                  </div>
               </div>
               <div class="controls">
                  <button class="btn ${ButtonClass.viewHTML} has-tooltip" 
                     data-index="${index_}" 
                     data-tippy-content="Click to view the HTML results (${result_.blast_html})"
                  >${this.icons.html} View HTML results</button>
                  <button class="btn ${ButtonClass.downloadCSV} has-tooltip" 
                     data-index="${index_}"
                     data-tippy-content="Click to download the results as a CSV file (${result_.blast_csv})"
                  >${this.icons.csv} Download CSV results</button>
               </div>  
            </div>`;

         resultsHTML += resultHTML;
      })
   
      
      // Should the input file and input sequence labels be singular or plural?
      const filesS = inputFiles.length == 1 ? "" : "s";
      //const sequenceS = inputSequences.length == 1 ? "" : "s";

      // Convert the lists of files and sequences to delimited strings.
      const inputFilesHTML = inputFiles.join(", ");
      //const inputSequencesHTML = inputSequences.join(", ");

      let html = 
         `<hr />
         <div class="results">
            <div class="results-title">Your results</div>
            <div class="job-details">
               <div class="job-table">
                  <div class="job-row">
                     <label>Job name:</label>
                     <div class="job-value">${this.job.name || "(none)"}</div>
                  </div>
                  <div class="job-row">
                     <label>Job status:</label>
                     <div class="job-value">${this.job.status}</div>
                  </div>
                  <div class="job-row">
                     <label>Program and version:</label>
                     <div class="job-value">${this.job.data.program_name} (version ${this.job.data.program_version})</div>
                  </div>
                  <div class="job-row">
                     <label>Database:</label>
                     <div class="job-value">${this.job.data.database_title}</div>
                  </div>
                  <div class="job-row">
                     <label>Database size:</label>
                     <div class="job-value">${this.job.data.database_size}</div>
                  </div>
                  <div class="job-row">
                     <label>Input file${filesS}:</label>
                     <div class="job-value">${inputFilesHTML}</div>
                  </div>
               </div>
               <div class="link-panel">
                  <div class="instructions">You can view these results again using the following URL:</div>
                  <div class="controls">
                     <a href="${this.jobURL}" target="_blank">${this.jobURL}</a> 
                     <button class="btn ${ButtonClass.copyURL}">${this.icons.copy} Copy to clipboard</button>
                  </div>
               </div>
            </div>
            <hr />
            <div class="blast-hits-title">BLAST Hits</div>
            <div class="sequence-results">${resultsHTML}</div>
         </div>`;

      this.elements.resultsContainer.innerHTML = html;

      // Get a reference to the results element.
      this.elements.results = this.elements.resultsContainer.querySelector(".results");
      if (!this.elements.results) { throw new Error("Invalid results element"); }

      // Add event handlers
      this.elements.results.addEventListener("click", async (event_) => this.handleResultsClick(event_));

      // Initialize tippy tooltips for the buttons
      tippy(".has-tooltip");

      return;
   }


   // Download the BLAST CSV data for a specific result.
   async downloadCSV(index_: number) {

      // Get the result with the specified index.
      const result = this.job.data.results[index_];
      if (!result || !result.csv_file || !result.blast_csv) {
         await AlertBuilder.displayError("No CSV file is available for download.");
         return;
      }

      // Decode the base64-encoded CSV file and decompress it.
      const arrayBuffer: ArrayBuffer = pako.inflate(decode(result.csv_file));
      if (!arrayBuffer || arrayBuffer.byteLength === 0) {
         await AlertBuilder.displayError("The CSV file is invalid: It may be empty or corrupted.");
         return;
      }

      // Associate the ArrayBuffer with a Blob, create a download link, and trigger the download.
      const link = document.createElement('a')
      link.href = URL.createObjectURL(new Blob(
         [ arrayBuffer ],
         { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }
      ))
      link.download = result.blast_csv;
      link.click();

      return;
   }


   // Generate a universally unique identifier (UUID).
   generateUUID() {

      const bytes = new Uint8Array(16);
      crypto.getRandomValues(bytes);
    
      // Set version (4) and variant bits as per RFC 4122
      bytes[6] = (bytes[6] & 0x0f) | 0x40; // Version 4 (random)
      bytes[8] = (bytes[8] & 0x3f) | 0x80; // Variant 1 (RFC-compliant)
    
      // Convert to hexadecimal format
      return [...bytes].map((b, i) =>
        ([4, 6, 8, 10].includes(i) ? '-' : '') + b.toString(16).padStart(2, '0')
      ).join('');
   }


   // Retrieve the job with this UID.
   async getJob() {

      if (!this.jobUID) { return; }

      this.job = await SequenceSearchService.getSearchResult(this.authToken, this.jobUID, this.user.email, this.user.uid);
      return;
   }


   async handleResultsClick(event_) {

      if (event_.target.tagName !== 'BUTTON') { return; }

      const button = event_.target as HTMLButtonElement;

      // Get and validate the button's data index attribute.
      let strDataIndex = button.getAttribute("data-index");
      const dataIndex = parseInt(strDataIndex);
      if (dataIndex < 0 || dataIndex > this.job.data.results.length) {
         await AlertBuilder.displayError(`Invalid result index: ${dataIndex}`);
         return;
      }

      // The button's class determines which action to take.
      if (button.classList.contains(ButtonClass.copyURL)) {
         await this.copyJobURL();

      } else if (button.classList.contains(ButtonClass.downloadCSV)) {
         await this.downloadCSV(dataIndex);

      } else if (button.classList.contains(ButtonClass.viewHTML)) {
         await this.viewHTML(dataIndex);
      }
     
      return;
   }


   // Initialize the Sequence Search component.
   async initialize() {

      // If the user UID is empty, look for one in web storage or generate a new one.
      if (!this.user.uid) { this.setDefaultUserUID(); }

      // Get a reference to the container element.
      this.elements.container = <HTMLElement>document.querySelector(this.containerSelector);
      if (!this.elements.container) { throw new Error("Invalid container Element"); }

      // Format the accepted file types.
      let fileFormats = this.config.acceptedFileTypes.join(",");

      // Create HTML for the container Element.
      const html = 
         `<div class=\"upload-panel\">
            <div class="file-selection active">
               <div class="upload-message">Upload your FASTA sequence(s)</div>
               <button class=\"btn file-control\">${this.icons.browse} Select file(s)</button>
               <input type=\"file\" id=\"file_input\" multiple accept="${fileFormats}" />
            </div>
            <div class="file-submission">
               <div class=\"job-name-label\">Job name</div>
               <input type=\"text\" class=\"job-name\" placeholder=\"(optional)\" />
               <button class=\"btn ${ButtonClass.upload}\">Submit file(s)</button>
               <button class=\"btn ${ButtonClass.cancel}\">${this.icons.cancel} Cancel</button>
            </div>
         </div>
         <div class=\"results-container\"></div>`;

      this.elements.container.innerHTML = html;

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
         let buttonText = `${this.icons.upload} Submit`;
         
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

      // The job panel and results body.
      this.elements.resultsContainer = <HTMLElement>this.elements.container.querySelector(".results-container");
      if (!this.elements.resultsContainer) { throw new Error("Invalid results container Element"); }

      // Was a job UID parameter provided?
      const urlParams = new URLSearchParams(window.location.search);
      this.jobUID = urlParams.get("job");

      // If a job UID was provided as a query string parameter, retrieve the corresponding job and display it.
      if (this.jobUID !== null) { 
         await this.getJob();
         await this.displayJob();
      }

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
         reader.readAsDataURL(file_);
      })
   }


   // If the user UID is empty, look for one in web storage or generate a new one.
   async setDefaultUserUID() {

      // Is there already a user UID in web storage?
      if (typeof(Storage) !== "undefined") {
         this.user.uid = localStorage.getItem(WebStorageKey.sequenceSearchUserUID);

         console.log("userUID from web storage = ", this.user.uid)
      }

      if (!this.user.uid) { 

         // Generate a new user UID.
         this.user.uid = this.generateUUID(); 
      
         console.log("just generated this userUID: ", this.user.uid)

         if (typeof(Storage) !== "undefined") {

            // Save it in web storage
            localStorage.setItem(WebStorageKey.sequenceSearchUserUID, this.user.uid);
         }
      }

      return;
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
      return await AlertBuilder.displaySuccess(content, title);
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

         // Iterate over all files
         for (let f=0; f < this.elements.fileInput.files.length; f++) {

            const file = this.elements.fileInput.files.item(f);
            if (!file) { continue; }

            // Get the file's contents
            const contents = await this.readFileAsync(file);
            if (!contents) { continue; }

            if (filenames.length > 0) { filenames += ", "; }
            filenames += file.name;

            // Add file data to the array.
            files.push({
               name: file.name,
               contents: contents
            })
         }
         
         if (files.length < 1) { 
            await AlertBuilder.displayError("Unable to upload: no valid files were found");
            return;
         }

         await Promise.allSettled([

            // Upload the sequence file(s) to the web service for processing.
            SequenceSearchService.uploadSequences(this.authToken, files, jobName, this.user.email, this.user.uid)
               .then(job_ => { this.job = job_; }), 
            
            // Show a modal dialog with information about the uploaded files.
            this.showInfoDialog(files.length, filenames)
         ])
         .then((results_) => {
            if (results_[0].status === "rejected") { throw new Error(results_[0].reason); }
         });
         
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
      if (this.job !== null) { await this.displayJob(); }

      return;
   }


   // Display the BLAST HTML data for a specific result.
   async viewHTML(index_: number) {

      // Get the result with the specified index.
      const result = this.job.data.results[index_];

      // Open a new tab/window and populate it with the contents of the BLAST HTML file.
      const blastWindow = window.open("", "_blank");

      // Decode the base64-encoded HTML file and decompress it.
      const html = pako.inflate(decode(result.html_file), { to: 'string' });
      blastWindow.document.writeln(html);

      // Remove the extension from the file name and use it as the window's title.
      blastWindow.document.title = result.blast_html.replace(".html", "");

      return;
   }

}