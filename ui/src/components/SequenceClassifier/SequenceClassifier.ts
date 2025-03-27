
import { AlertBuilder } from "../../helpers/AlertBuilder";
import DataTables from "datatables.net-dt";
import { DateTime } from "luxon";
import { decode } from "base64-arraybuffer";
import { IClassificationJob } from "./IClassificationJob";
import { IFileData } from "../../models/IFileData";
import { IJobFile } from "./IJobFile";
import { SequenceClassifierService } from "../../services/SequenceClassifierService";
import { Utils } from "../../helpers/Utils";
import { WebStorageKey } from "../../global/Types";
import { ISearchResult } from "../VirusNameLookup/ISearchResult";
import { ISequenceResult } from "./ISequenceResult";


export class SequenceClassifier {

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

   // The DataTable instance.
   dataTable;

   elements: {
      anonymousID: HTMLInputElement,
      classifyButton: HTMLButtonElement,
      container: HTMLElement,
      copyIdButton: HTMLButtonElement,
      fileControl: HTMLElement,
      fileInput: HTMLInputElement,
      fileUploadDetails: HTMLElement,
      jobName: HTMLInputElement,
      jobNameLabel: HTMLElement,
      jobPanel: HTMLElement,
      resultsBody: HTMLElement,
      //jobs: HTMLElement,
      userInfo: HTMLElement
   }

   icons: {
      browse: string,
      chevronDown: string,
      chevronRight: string,
      close: string,
      download: string,
      classify: string
   }

   job: IClassificationJob = null;

   // Map a job's UID to its job files formatted as HTML.
   jobFileLookup: Map<string, string>;

   //jobs: IClassificationJob[];

   // dmd 032425
   jobUID: string = null;
   
   // User information
   user: {
      email: string, 
      name: string,
      uid: string
   }

   // CSS selectors
   selectors: { [key: string]: string; } = {
      container: null
   }


   // C-tor
   constructor(authToken_: string, contactEmail_: string, containerSelector_: string, email_: string, 
      name_: string, userUID_: string) {
      
      // Validate parameters
      if (!authToken_ || authToken_.length < 1) { throw new Error("Invalid auth token in SequenceClassifier"); }
      if (!contactEmail_) { throw new Error("Invalid contact email"); }
      if (!containerSelector_ || containerSelector_.length < 1) { throw new Error("Invalid container selector in SequenceClassifier"); }
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
         anonymousID: null,
         classifyButton: null,
         copyIdButton: null,
         container: null,
         fileControl: null,
         fileInput: null,
         fileUploadDetails: null,
         jobName: null,
         jobNameLabel: null,
         jobPanel: null,
         //jobs: null,
         resultsBody: null,
         userInfo: null
      }

      this.icons = {
         browse: `<i class=\"fa fa-file\"></i>`,
         chevronDown: `<i class=\"fa fa-chevron-circle-down expanded\"></i>`,
         chevronRight: `<i class=\"fa fa-chevron-circle-right collapsed\"></i>`,
         close: `<i class=\"fa fa-xmark\"></i>`,
         download: `<i class=\"fa fa-download\"></i>`,
         classify: `<i class=\"fa fa-upload\"></i>`
      }

      // Initialize the map of a job's UID to its job files formatted as HTML.
      this.jobFileLookup = new Map<string, string>;
   }

   /*
   // Copy the user's unique identifier to the clipboard.
   async copyIdentifier() {
         
      if (!this.elements.anonymousID) { throw new Error("Invalid anonymous ID Element"); }
      let uid = Utils.safeTrim(this.elements.anonymousID.value);
      if (!uid) { throw new Error("Invalid anonymous ID"); }

      // Copy the URL to the clipboard.
      await navigator.clipboard.writeText(uid);

      const message = "Your unique identifier has been copied to your clipboard. Please keep it in a safe place and " +
         "enter it in the ID text field when you return to the page.";

      // Display a success message. When it is closed, the reset password dialog will be closed.
      return await AlertBuilder.displaySuccess(message);
   }*/

   /*
   async createDynamicWindow() {

      const newWindow = window.open("", "_blank", "width=600,height=400"); 
      if (!newWindow) { throw new Error("Unable to open a new window"); }

      newWindow.document.write(`
         <!DOCTYPE html>
         <html>
            <head>
            <title>Dynamic Content</title>
            <style>
               body { font-family: Arial, sans-serif; padding: 20px; }
               h1 { color: #4CAF50; }
            </style>
            </head>
            <body>
            <h1>Hello from JavaScript!</h1>
            <p>This content was dynamically generated.</p>
            <div id="content"></div>
            </body>
         </html>
      `);

      // Ensure that the document is fully loaded.
      newWindow.document.close(); 
      return;
   }*/


   // Decode the base64-encoded file and download it.
   async decodeAndDownload(base64_: string, filename_: string) {

      if (!base64_) { throw new Error("The base64-encoded file is empty"); }
      if (!filename_) { filename_ = "file.xlsx"; }

      const arrayBuffer: ArrayBuffer = decode(base64_);

      const link = document.createElement('a')
      link.href = URL.createObjectURL(new Blob(
         [ arrayBuffer ],
         { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }
      ))
      link.download = filename_;
      link.click();
      return;
   }


   async displayJob() {

      if (!this.job.data || !this.job.data.results) {
         this.elements.resultsBody.innerHTML = "No results";
         return;
      }

      // Clear any existing content in the results body.
      this.elements.resultsBody.innerHTML = "";

      this.job.data.results.forEach((result_: ISequenceResult) => {

         // Create a row for a sequence that was submitted and processed.
         const sequenceRow = document.createElement("div");
         sequenceRow.className = "sequence-row";

         if (!!result_.blast_html && !!result_.html_file) {

            // Create a container for the HTML button.
            const htmlRow = document.createElement("div");
            htmlRow.className = "html-row";

            // Create the button that will open the BLAST HTML in a new window.
            const htmlButton = document.createElement("button");
            htmlButton.innerHTML = `View ${result_.blast_html}`;
            htmlButton.addEventListener("click", () => {

               // Open a new tab/window and populate it with the contents of the BLAST HTML file.
               const blastWindow = window.open("", "_blank");
               blastWindow.document.title = result_.blast_html;
               blastWindow.document.writeln(atob(result_.html_file));
            })

            htmlRow.appendChild(htmlButton);
            sequenceRow.appendChild(htmlRow);
         }

         if (!!result_.blast_csv && !!result_.csv_file) {

            // Create a container for the CSV link.
            const csvRow = document.createElement("div");
            csvRow.className = "csv-row";

            const arrayBuffer: ArrayBuffer = decode(result_.csv_file);

            // Create the CSV link.
            const link = document.createElement('a');
            link.className = "csv-link";
            link.href = URL.createObjectURL(new Blob(
               [ arrayBuffer ],
               { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }
            ))
            link.innerHTML = `Download ${result_.blast_csv}`;
            link.download = result_.blast_csv;

            csvRow.appendChild(link);
            sequenceRow.appendChild(csvRow);
         }

         this.elements.resultsBody.appendChild(sequenceRow);
      })
   
      return;
   }


   /*
   // Display all of this user's classified sequences (jobs).
   async displayClassifiedSequences() {

      if (!this.jobs || this.jobs.length < 1) {
         this.elements.jobs.innerHTML = "No sequences have been submitted";
         return;
      }

      let html = `<div class="jobs-title">Previous Submissions</div>
         <div class="jobs-help">Click on the download button to view an uploaded file's results.</div>
         <table class="jobs-table">
            <thead>
               <tr class="header-row">
                  <th></th>
                  <th class=\"download-column\">Results</th>
                  <th class=\"upload-col\">Uploaded on</th>
                  <th>Name</th>
                  <th>Status</th>
                  <th>Details</th>
                  <th>UID</th>
               </tr>
            </thead>
            <tbody>`;

      this.jobs.forEach((job_: IClassificationJob, index_: number) => {

         // Alternate the CSS class every row.
         const rowClass = index_ % 2 === 0 ? "odd-bg" : "even-bg";

         let createdOn = "";

         // Move from UTC 0 to -5
         if (!!job_.createdOn) { createdOn = DateTime.fromISO(job_.createdOn.replace(" ", "T")).minus({hours: 5}).toFormat("F"); }

         // If there isn't a message, display an empty string.
         const message = !job_.message ? "" : job_.message;

         // If there isn't a name, display an empty string.
         const name = !job_.name ? "" : job_.name;

         // Create the job row.
         html += 
               `<tr class="${rowClass}" data-uid="${job_.uid}">
                  <td class="child-control-column" 
                     data-is-expanded="false"
                     data-orderable="false"
                     data-uid="${job_.uid}">${this.icons.chevronRight}
                  </td>
                  <td class="download-column" data-orderable="false">
                     <button class="btn download-button" data-job-uid="${job_.uid}">${this.icons.download} Download</button>
                  </td>
                  <td>${createdOn}</td>
                  <td>${name}</td>
                  <td>${job_.status}</td>
                  <td>${message}</td>
                  <td>${job_.uid}</td>
               </tr>`;

         if (job_.files !== null && job_.files.length > 0) {

            // Create a table for the job's job files.
            let filesHTML = 
               `<table class="job-files-table ${rowClass}">
               <thead>
                  <tr class="job-files-header-row ${job_.status}">
                     <th>Filename</th>
                     <th class="small">Status</th>
                     <th>Details</th>
                     <th>UID</th>     
                  </tr>
               </thead>
               <tbody>`;

            // Add a row for every job file.
            job_.files.forEach((jobFile_: IJobFile, index_: number) => {

               const innerRowClass = index_ % 2 === 0 ? "odd-bg" : "even-bg";

               filesHTML += 
                  `<tr class="${innerRowClass}">
                        <td>${jobFile_.filename}</td>
                        <td>${jobFile_.status}</td>
                        <td>${jobFile_.message}</td>
                        <td>${jobFile_.uid}</td>
                  </tr>`;
            })

            filesHTML += "</tbody></table>";

            // Associate the job UID with its job files formatted as HTML.
            this.jobFileLookup.set(job_.uid, filesHTML);
         }
      }) 

      html += "</tbody></table>";

      this.elements.jobs.innerHTML = html;

      // Create a DataTable instance using the table Element.
      this.dataTable = new DataTables(`${this.selectors.container} table.jobs-table`, {
         columnDefs: [
               { targets: [0,1], orderable: false },
               { target: 2, orderable: true, type: "date" },
               { targets: [3,4,5,6], orderable: true }
         ],
         dom: "ltip",
         order: [], // Important: If this isn't an empty array it will move the child rows to the end!
         searching: false,
         stripeClasses: []
      });

      // TODO: Consider removing the jQuery dependency.
      // Handle an event that's triggered when a new child row is added to the DataTable.
      jQuery(`${this.selectors.container} table.jobs-table`).on("childRow.dt", (e_, show_: boolean, parentRow_) => {

         if (!show_) { return; }

         // Get the parent TR Element.
         const parentTrEl = parentRow_.node();
         if (!parentTrEl) { console.log("couldn't find the parent TR node"); return; }

         // Get the child TR that was just created.
         const trEl = parentTrEl.nextElementSibling;
         if (!trEl) { console.log("couldn't find the child TR node"); return; }

         // Have we already modified this child row?
         if (trEl.classList.contains("modified")) { return; }

         // Get the first TD Element.
         const tdEl = trEl.firstChild as HTMLElement;
         if (tdEl && tdEl.nodeName.toLowerCase() === "td") {

            let strColspan = tdEl.getAttribute("colspan");
            if (strColspan && strColspan.length > 0) {

               let colspan = parseInt(strColspan);
               if (isNaN(colspan)) { colspan = 7; }

               // Subtract one from the colspan and replace the existing attribute value.
               colspan = colspan - 1;

               tdEl.setAttribute("colspan", `${colspan}`);

               // Insert a column before the existing column.
               const newTdEl = document.createElement("td");
               trEl.insertBefore(newTdEl, tdEl);
            }
         }

         // Adding the "modified" class will prevent the previous modifications from happening multiple times.
         trEl.classList.add("modified");
      })
      
      return;
   }*/


   async displayJobs() {

      /*
      // Get and validate the jobs Element.
      this.elements.jobs = <HTMLElement>this.elements.container.querySelector(".jobs");
      if (!this.elements.jobs) { throw new Error("Invalid jobs Element")}
   
      // Add a click event listener to the jobs panel.
      this.elements.jobs.addEventListener("click", async (event_: MouseEvent) => {

         const target = <HTMLElement>event_.target;

         if (target.classList.contains("expanded") ||
            target.classList.contains("collapsed") ||
            target.classList.contains("child-control-column")) {

            // Get the associated "child control" column.
            let columnEl = null;
            if (target.classList.contains(".child-control-column")) {
               columnEl = target;
            } else {
               columnEl = target.closest("td.child-control-column");
            }
            
            // Get the job UID
            const jobUID = columnEl.getAttribute("data-uid");
            if (!jobUID) { throw new Error("Invalid data-uid attribute"); }

            // Show or hide the job row's child row.
            await this.updateChildRowVisibility(jobUID);

         } else if (target.classList.contains("download-column") || target.classList.contains("download-button")) {

            // Get the closest button Element to the target Element.
            const buttonEl = target.closest(`button`);
            if (!buttonEl) { return; }

            // Get the job UID.
            const jobUID = buttonEl.getAttribute("data-job-uid");
            if (!jobUID) { return false; }

            await this.downloadSummary(jobUID);
         }

         event_.preventDefault();
         event_.stopPropagation();
         return;
      });*/

      return;
   }


   async downloadSummary(jobUID_: string) {

      await AlertBuilder.displayInfo("TODO: not yet implemented");

      /*
      // Validate the job UID.
      if (!jobUID_) { throw new Error("Unable to download summary: invalid job UID"); }

      // Get the sequence classifier's summary for this job.
      const summary = await SequenceClassifierService.getClassificationSummary(this.authToken, jobUID_, this.user.email, this.user.uid);
      console.log("In downloadSummary, validationSummary= ", summary)

      // Download the file as a spreadsheet.
      this.decodeAndDownload(summary.file, summary.filename);
      */
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


   // Retrieve the classification job with this UID.
   async getJob() {

      if (!this.jobUID) { return; }

      this.job = await SequenceClassifierService.getClassificationResult(this.authToken, this.jobUID, this.user.email, this.user.uid);
      console.log("job = ", this.job)
      return;
   }


   /*
   // Get this user's classified sequences (jobs) from the web service.
   async getClassifiedSequences() {

      // Get the user's classified sequences.
      this.jobs = await SequenceClassifierService.getClassifiedSequences(this.authToken, this.user.email, this.user.uid);

      // Display the classified sequences.
      return await this.displayClassifiedSequences();
   }*/


   // Initialize the Sequence Classifier.
   async initialize() {

      // If the user UID is empty, look for one in web storage or generate a new one.
      if (!this.user.uid) { this.setDefaultUserUID(); }

      // Get a reference to the container element.
      this.elements.container = <HTMLElement>document.querySelector(this.selectors.container);
      if (!this.elements.container) { throw new Error("Invalid container Element"); }

      // Format the accepted file types.
      let fileFormats = this.config.acceptedFileTypes.join(",");

      let greeting = "";

      if (this.user.email === this.constants.NO_EMAIL) {

         greeting = `You are not logged in, but as long as you view this page in the same browser, a history of your results will be maintained.`;
         /*`Since you are not logged in, you have been assigned the unique identifier <input type="text" class="anonymous-id" value="${this.user.uid}"/>` +
            `<button class="ictv-button copy-id-button">Copy</button>` +
            `<br/>This identifier will allow you to retrieve your results later. Please copy it and keep it in a safe place.`;*/
      } else {
         greeting = `You are logged in as ${this.user.name} (${this.user.email})`;
      }

      // Create HTML for the container Element.
      const html = 
         `<div class=\"user-row\">${greeting}</div>
         <div class=\"upload-panel\">
               <button class=\"btn file-control\">${this.icons.browse} Select file</button>
               <input type=\"file\" id=\"file_input\" multiple accept="${fileFormats}" />
               <label class=\"job-name-label hidden\">Job name</label><input type=\"text\" class=\"job-name hidden\" placeholder=\"(optional)\" />
               <button class=\"btn classify-button hidden\">Classify</button>
         </div>
         <div class=\"job-panel\">
            <div class=\"title\">Your results</div>
            <div class=\"body\"></div>
         </div>`; 
         
         // <div class=\"jobs\"></div>

      this.elements.container.innerHTML = html;

      /*
      // Get and validate the "anonymous ID" text field.
      this.elements.anonymousID = <HTMLInputElement>this.elements.container.querySelector(".anonymous-id");
      if (!!this.elements.anonymousID) {
         this.elements.anonymousID.addEventListener("change", (ev_) => {

            let newUID = Utils.safeTrim((ev_.target as HTMLInputElement).value);
            if (!!newUID) {
               this.user.uid = newUID;
            }
         })
      }

      // Get and validate the "copy ID" button.
      this.elements.copyIdButton = <HTMLButtonElement>this.elements.container.querySelector(".copy-id-button");
      if (!!this.elements.copyIdButton) { 
         this.elements.copyIdButton.addEventListener("click", () => { this.copyIdentifier(); })
      }*/

      // Get and validate the classify button.
      this.elements.classifyButton = <HTMLButtonElement>this.elements.container.querySelector(".classify-button");
      if (!this.elements.classifyButton) { throw new Error("Invalid classify button Element"); }

      this.elements.classifyButton.addEventListener("click", () => { this.uploadSequences(); })

      // Get and validate the file input Element.
      this.elements.fileInput = <HTMLInputElement>this.elements.container.querySelector("#file_input");
      if (!this.elements.fileInput) { throw new Error("Invalid file input Element"); }

      this.elements.fileInput.addEventListener("change", async (event_: MouseEvent) => {
      
         if (!this.elements.fileInput.files || this.elements.fileInput.files.length < 1) {
               
            // Hide the classify button and job name.
            this.elements.classifyButton.innerHTML = `Nothing to classify`;
            this.elements.classifyButton.classList.remove("visible");
            this.elements.classifyButton.classList.add("hidden");
            return;
         }
         
         // Begin populating the classify button text.
         let buttonText = `${this.icons.classify} Classify`;
         
         if (this.elements.fileInput.files.length === 1) {
            buttonText += " file";
         } else {
            buttonText += ` ${this.elements.fileInput.files.length} files`;
         }

         // Display the classify button.
         this.elements.classifyButton.innerHTML = buttonText;
         this.elements.classifyButton.classList.remove("hidden");
         this.elements.classifyButton.classList.add("visible");

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
      this.elements.jobPanel = <HTMLElement>this.elements.container.querySelector(".job-panel");
      if (!this.elements.jobPanel) { throw new Error("Invalid job panel Element"); }

      this.elements.resultsBody = <HTMLElement>this.elements.container.querySelector(".job-panel .body");
      if (!this.elements.resultsBody) { throw new Error("Invalid results body Element"); }


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
         this.user.uid = localStorage.getItem(WebStorageKey.sequenceClassifierUserUID);

         console.log("userUID from web storage = ", this.user.uid)
      }

      if (!this.user.uid) { 

         // Generate a new user UID.
         this.user.uid = this.generateUUID(); 
      
         console.log("just generated this userUID: ", this.user.uid)

         if (typeof(Storage) !== "undefined") {

            // Save it in web storage
            localStorage.setItem(WebStorageKey.sequenceClassifierUserUID, this.user.uid);
         }
      }

      return;
   }


   // This dialog lets the user know that their files are being classified, and what to expect.
   async showInfoDialog(fileCount_: number, filenames_: string) {

      let content: string;
      let title: string;

      // Message content depends on the number of files.
      if (fileCount_ === 1) {
         title = "Classifying your sequence file";
         content = "Your sequence file has been uploaded and is being classified. When the process is complete, " +
            "the results will be available in the list of jobs below.";

      } else {
         title = "Classifying your sequence files";
         content = "Your sequence files have been uploaded and are being classified. When the process is complete, " +
            "the results will be available in the list of jobs below. If the results are not immediately available in the list below, " +
            "you might want to wait a few minutes and then refresh the page.";
      }

      // Display a "success" dialog.
      return await AlertBuilder.displaySuccess(content, title);
   }

   
   async updateChildRowVisibility(jobUID_: string) {

      // Get the TR DOM Element with this job UID.
      const trEl = this.elements.container.querySelector(`.jobs-table tr[data-uid="${jobUID_}"]`);
      if (!trEl) { console.log(`Couldn't find a row with data-uid ${jobUID_}`); return;  }
      
      // Get the corresponding virtual row from the data table.
      let row = this.dataTable.row(trEl);
   
      if (row.child.isShown()) {

         // Hide the child row.
         row.child.hide();

      } else {
      
         // Display the child row.
         let jobFileHTML = this.jobFileLookup.get(jobUID_);
         if (!jobFileHTML) { return; }

         row.child(jobFileHTML).show();
      }

      return;
   }


   // Upload the selected files to the web service for classification.
   async uploadSequences() {

      if (!this.elements.fileInput) { throw new Error("Invalid file control"); }
      if (!this.elements.fileInput.files || !this.elements.fileInput.files[0]) { throw new Error("Invalid upload file"); }
      
      // Disable the classify button.
      this.elements.classifyButton.disabled = true;

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

            // Upload the sequence file(s) to the web service for classification.
            SequenceClassifierService.uploadSequences(this.authToken, files, jobName, this.user.email, this.user.uid)
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

      // Update the classify button and hide it.
      this.elements.classifyButton.disabled = false;
      this.elements.classifyButton.innerHTML = `Nothing to classify`;
      this.elements.classifyButton.classList.remove("visible");
      this.elements.classifyButton.classList.add("hidden");

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
}