
import { AlertBuilder } from "../../helpers/AlertBuilder";
import { decode } from "base64-arraybuffer";
import { ISeqSearchJob } from "./ISeqSearchJob";
import { IFileData } from "../../models/IFileData";
import { ISequenceResult } from "./ISequenceResult";
import { SequenceSearchService } from "../../services/SequenceSearchService";
import { Utils } from "../../helpers/Utils";
import { LookupTaxonomyRank, WebStorageKey } from "../../global/Types";
import { data } from "jquery";

enum Buttons {
   copyURL = "copy-url-button",
   downloadCSV = "download-csv-button",
   viewHTML = "view-html-button"
}


export class SequenceSearch {

   authToken: string;

   config = {
      acceptedFileTypes: [".fasta", ".fastq"],
      contactEmail: null
   }

   constants = {
      NO_EMAIL: "NO_EMAIL"
   }

   // TODO: I'm thinking about using this to flag new results the user has not yet viewed.
   currentJobUID: string;

   elements: {
      container: HTMLElement,
      copyIdButton: HTMLButtonElement,
      fileControl: HTMLElement,
      fileInput: HTMLInputElement,
      fileUploadDetails: HTMLElement,
      jobName: HTMLInputElement,
      jobNameLabel: HTMLElement,
      results: HTMLElement,
      resultsContainer: HTMLElement,
      uploadButton: HTMLButtonElement
   }

   icons: {
      browse: string,
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

   // CSS selectors
   selectors: { [key: string]: string; } = {
      container: null
   }

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
      this.selectors.container = containerSelector_;

      this.user = {
         email: email_, 
         name: name_,
         uid: userUID_
      }

      this.elements = {
         copyIdButton: null,
         container: null,
         fileControl: null,
         fileInput: null,
         fileUploadDetails: null,
         jobName: null,
         jobNameLabel: null,
         results: null,
         resultsContainer: null,
         uploadButton: null
      }

      this.icons = {
         browse: `<i class=\"fa fa-file\"></i>`,
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


   // Download the BLAST CSV data for a specific result.
   async downloadCSV(index_: number) {

      const result = this.job.data.results[index_];
      if (!result || !result.csv_file || !result.blast_csv) {
         await AlertBuilder.displayError("No CSV file is available for download.");
         return;
      }

      const arrayBuffer: ArrayBuffer = decode(result.blast_csv);

      const link = document.createElement('a')
      link.href = URL.createObjectURL(new Blob(
         [ arrayBuffer ],
         { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }
      ))
      link.download = result.csv_file;
      link.click();

      /*
      const arrayBuffer: ArrayBuffer = decode(result.csv_file);

      // Create the CSV link.
      const link = document.createElement('a');
      link.className = "csv-link";
      link.href = URL.createObjectURL(new Blob(
         [ arrayBuffer ],
         { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }
      ))
      link.innerHTML = `Download ${result.blast_csv}`;
      link.download = result.blast_csv;
      */
      return;
   }


   async displayJob() {

      if (!this.job.data || !this.job.data.results) {
         this.elements.resultsContainer.innerHTML = "No results";
         return;
      }

      // Clear any existing content in the results container.
      this.elements.resultsContainer.innerHTML = "";

      //----------------------------------------------------------------------------------------------------------------
      // Create the URL that can be used to view the job data.
      //----------------------------------------------------------------------------------------------------------------
      this.jobURL = window.location.href;

      // Remove any existing query string parameters.
      let qIndex = this.jobURL.indexOf("?");
      if (qIndex > -1) { this.jobURL = this.jobURL.substring(0, qIndex); }

      this.jobURL += `?job=${this.job.uid}`;

      //----------------------------------------------------------------------------------------------------------------
      // Generate the HTML for the job results.
      //----------------------------------------------------------------------------------------------------------------
      let resultsHTML = "";

      this.job.data.results.forEach((result_: ISequenceResult, index_: number) => {

         // One-based instead of zero-based.
         const displayIndex = index_ + 1;

         // Get the result's rank and taxon name.
         let taxonName = result_.classification_lineage[result_.classification_rank] || "Unknown";


         let isFirstRank = true;
         let lineageHTML = "";
         
         // Populate the lineage HTML.
         if (!result_.classification_lineage) {
            lineageHTML = "No lineage";

         } else {

            // Iterate over the classification lineage ranks.
            Object.keys(result_.classification_lineage).forEach(rank_ => {

               // Lookup this rank's taxon name in the lineage.
               let name = result_.classification_lineage[rank_];
               if (isFirstRank) { 
                  isFirstRank = false;
               } else {
                  lineageHTML += this.icons.lineageDelimiter;
               }
   
               const formattedRank = LookupTaxonomyRank(rank_);

               lineageHTML += `<span class="result-lineage">${formattedRank}: <i>${name}</i></span>`;
            })
         }
         
         let resultHTML =
            `<div class="sequence-result-item">
               <div class="info">
                  <div class="result-index">#${displayIndex}</div>
                  <div class="lineage-and-result">
                     <div class="lineage">${lineageHTML}</div>
                     <div class="result">
                        <div class="result-name">
                           <span class="rank-name">${result_.classification_rank}</span>: 
                           <span class="taxon-name">${taxonName}</span>
                        </div>
                        <div class="result-info">
                           <label>Input file</label>: ${result_.input_file},&nbsp;<label>Input sequence</label>: ${result_.input_seq}
                        </div>
                     </div>
                  </div>
               </div>
               <div class="controls">
                  <button class="btn ${Buttons.viewHTML}" data-index="${index_}">${this.icons.html} View HTML results</button>
                  <button class="btn ${Buttons.downloadCSV}" data-index="${index_}">${this.icons.csv} Download CSV results</button>
               </div>  
            </div>`;

         resultsHTML += resultHTML;
      })
   
      let html = 
         `<div class="results">
            <div class="job-details">
               <table>
                  <tr>
                     <th>Job name</th>
                     <td>${this.job.name || "(none)"}</td>
                  </tr>
                  <tr>
                     <th>Job status</th>
                     <td>${this.job.status}</td>
                  </tr>
                  <tr>
                     <th>Program and version</th>
                     <td>${this.job.data.program_name} (version ${this.job.data.version})</td>
                  </tr>
               </table>
               <div class="link-panel">You can view these results again using the following URL: 
               <a href="${this.jobURL}" target="_blank">${this.jobURL}</a> <button class="btn ${Buttons.copyURL}">${this.icons.copy} Copy to clipboard</button>
               </div>
            </div>
            <div class="sequence-results">${resultsHTML}</div>
         </div>`;

      this.elements.resultsContainer.innerHTML = html;


      // Get a reference to the results element.
      this.elements.results = this.elements.resultsContainer.querySelector(".results");
      if (!this.elements.results) { throw new Error("Invalid results element"); }

      // Add event handlers
      this.elements.results.addEventListener("click", async (event_) => this.handleResultsClick(event_));

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

      let strDataIndex = button.getAttribute("data-index");
      const dataIndex = parseInt(strDataIndex);

      console.log(`Button clicked: ${button.className}, data index = ${dataIndex}`, )

      // Handle specific button actions based on class
      if (button.classList.contains(Buttons.copyURL)) {
         await this.copyJobURL();

      } else if (button.classList.contains(Buttons.downloadCSV)) {
         await this.downloadCSV(dataIndex);

      } else if (button.classList.contains(Buttons.viewHTML)) {
         await this.viewHTML(dataIndex);
      }
     
      return;
   }


   // Initialize the Sequence Search component.
   async initialize() {

      // If the user UID is empty, look for one in web storage or generate a new one.
      if (!this.user.uid) { this.setDefaultUserUID(); }

      // Get a reference to the container element.
      this.elements.container = <HTMLElement>document.querySelector(this.selectors.container);
      if (!this.elements.container) { throw new Error("Invalid container Element"); }

      // Format the accepted file types.
      let fileFormats = this.config.acceptedFileTypes.join(",");

      // Create HTML for the container Element.
      const html = 
         `<div class=\"upload-panel\">
               <button class=\"btn file-control\">${this.icons.browse} Select file(s)</button>
               <input type=\"file\" id=\"file_input\" multiple accept="${fileFormats}" />
               <label class=\"job-name-label hidden\">Job name</label><input type=\"text\" class=\"job-name hidden\" placeholder=\"(optional)\" />
               <button class=\"btn upload-button hidden\">Submit file(s)</button>
         </div>
         <div class=\"results-container\"></div>`;

      this.elements.container.innerHTML = html;

      // Get and validate the upload button.
      this.elements.uploadButton = <HTMLButtonElement>this.elements.container.querySelector(".upload-button");
      if (!this.elements.uploadButton) { throw new Error("Invalid upload button Element"); }

      this.elements.uploadButton.addEventListener("click", () => { this.uploadSequences(); })

      // Get and validate the file input Element.
      this.elements.fileInput = <HTMLInputElement>this.elements.container.querySelector("#file_input");
      if (!this.elements.fileInput) { throw new Error("Invalid file input Element"); }

      this.elements.fileInput.addEventListener("change", async (event_: MouseEvent) => {
      
         if (!this.elements.fileInput.files || this.elements.fileInput.files.length < 1) {
               
            // Hide the upload button and job name.
            this.elements.uploadButton.innerHTML = `Nothing to upload`;
            this.elements.uploadButton.classList.remove("visible");
            this.elements.uploadButton.classList.add("hidden");
            return;
         }
         
         // Begin populating the upload button text.
         let buttonText = `${this.icons.upload} Submit`;
         
         if (this.elements.fileInput.files.length === 1) {
            buttonText += " file";
         } else {
            buttonText += ` ${this.elements.fileInput.files.length} files`;
         }

         // Display the upload button.
         this.elements.uploadButton.innerHTML = buttonText;
         this.elements.uploadButton.classList.remove("hidden");
         this.elements.uploadButton.classList.add("visible");

         // Display the job name control and its label.
         this.elements.jobNameLabel.classList.remove("hidden");
         this.elements.jobNameLabel.classList.add("visible");
         this.elements.jobName.classList.remove("hidden");
         this.elements.jobName.classList.add("visible");
      });

      this.elements.fileControl = <HTMLElement>this.elements.container.querySelector(".file-control");
      if (!this.elements.fileControl) { throw new Error("Invalid file control Element"); }

      // Clicking on the file button will trigger a click on the file input element.
      this.elements.fileControl.addEventListener("click", async (event_: MouseEvent) => {
         this.elements.fileInput.click();
      });

      // The job name control and its label.
      this.elements.jobNameLabel = <HTMLElement>this.elements.container.querySelector(".job-name-label");
      if (!this.elements.jobNameLabel) { throw new Error("Invalid job name label Element"); }

      this.elements.jobName = <HTMLInputElement>this.elements.container.querySelector(".job-name");
      if (!this.elements.jobName) { throw new Error("Invalid job name Element"); }


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
      
      // Disable the upload button.
      this.elements.uploadButton.disabled = true;

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

      // Update the upload button and hide it.
      this.elements.uploadButton.disabled = false;
      this.elements.uploadButton.innerHTML = `Nothing to submit`;
      this.elements.uploadButton.classList.remove("visible");
      this.elements.uploadButton.classList.add("hidden");

      // Hide the job name control and its label.
      this.elements.jobNameLabel.classList.remove("visible");
      this.elements.jobNameLabel.classList.add("hidden");
      this.elements.jobName.classList.remove("visible");
      this.elements.jobName.classList.add("hidden");
      this.elements.jobName.value = "";

      // If a job was returned, display it.
      if (this.job !== null) { await this.displayJob(); }

      return;
   }


   // Display the BLAST HTML data for a specific result.
   async viewHTML(index_: number) {

      const result = this.job.data.results[index_];

      // Open a new tab/window and populate it with the contents of the BLAST HTML file.
      const blastWindow = window.open("", "_blank");
      blastWindow.document.title = result.blast_html;
      blastWindow.document.writeln(atob(result.html_file));

      return;
   }

}