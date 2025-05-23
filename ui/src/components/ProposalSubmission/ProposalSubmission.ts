
import DataTables from "datatables.net-dt";
import { DateTime } from "luxon";
import { decode } from "base64-arraybuffer";
import { IFileData } from "../../models/IFileData";
import { IJob } from "./IJob";
import { ProposalService } from "../../services/ProposalService";
import { IJobFile } from "./IJobFile";
import Swal from "sweetalert2";


export class ProposalSubmission {

   authToken: string;

   contactEmail = null;

   // TODO: I'm thinking about using this to flag new results the user has not yet viewed.
   currentJobUID: string;

   dataTable;

   elements: {
      container: HTMLElement,
      fileControl: HTMLElement,
      fileInput: HTMLInputElement,
      fileUploadDetails: HTMLElement,
      jobName: HTMLInputElement,
      jobNameLabel: HTMLElement,
      jobs: HTMLElement,
      userInfo: HTMLElement,
      validateButton: HTMLButtonElement
   }

   icons: {
      browse: string,
      chevronDown: string,
      chevronRight: string,
      close: string,
      download: string,
      validate: string
   }

   // Map a job's UID to its job files formatted as HTML.
   jobFileLookup: Map<string, string>;

   jobs: IJob[];

   // The DOM id for the modal dialog.
   modalID = "ictv_proposal_submission_modal";

   // User information
   user: {
      email: string, 
      name: string,
      uid: number
   }

   // CSS selectors
   selectors: { [key: string]: string; } = {
      container: null
   }


   // C-tor
   constructor(authToken_: string, contactEmail_: string, containerSelector_: string, email_: string, 
      name_: string, userUID_: number) {
      
      // Validate parameters
      if (!authToken_ || authToken_.length < 1) { throw new Error("Invalid auth token in ProposalSubmission"); }
      if (!contactEmail_) { throw new Error("Invalid contact email"); }
      if (!containerSelector_ || containerSelector_.length < 1) { throw new Error("Invalid container selector in ProposalSubmission"); }
      if (!email_ || email_.length < 1) { throw new Error("Invalid user email in ProposalSubmission"); }
      if (!name_ || name_.length < 1) { throw new Error("Invalid user name in ProposalSubmission"); }

      this.authToken = authToken_;
      this.contactEmail = contactEmail_;
      this.selectors.container = containerSelector_;

      this.user = {
         email: email_, 
         name: name_,
         uid: userUID_
      }

      this.elements = {
         container: null,
         fileControl: null,
         fileInput: null,
         fileUploadDetails: null,
         jobName: null,
         jobNameLabel: null,
         jobs: null,
         userInfo: null,
         validateButton: null
      }

      this.icons = {
         browse: `<i class=\"fa fa-file\"></i>`,
         chevronDown: `<i class=\"fa fa-chevron-circle-down expanded\"></i>`,
         chevronRight: `<i class=\"fa fa-chevron-circle-right collapsed\"></i>`,
         close: `<i class=\"fa fa-xmark\"></i>`,
         download: `<i class=\"fa fa-download\"></i>`,
         validate: `<i class=\"fa fa-upload\"></i>`
      }

      // Initialize the map of a job's UID to its job files formatted as HTML.
      this.jobFileLookup = new Map<string, string>;
   }


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


   // Display all of this user's jobs.
   async displayJobs() {

      if (!this.jobs || this.jobs.length < 1) {
         this.elements.jobs.innerHTML = "No proposals submitted";
         return;
      }

      let html = `<div class="jobs-title">Previous Submissions</div>
         <div class="jobs-help">Click on the download button to view an uploaded file's validation results.</div>
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

      this.jobs.forEach((job_: IJob, index_: number) => {

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
   }


   async downloadSummary(jobUID_: string) {

      // Validate the job UID.
      if (!jobUID_) { throw new Error("Unable to download summary: invalid job UID"); }

      // Get the proposal validator's summary for this job.
      const summary = await ProposalService.getValidationSummary(this.authToken, jobUID_, this.user.email, this.user.uid);
      console.log("In downloadSummary, validationSummary= ", summary)

      // Download the file as a spreadsheet.
      this.decodeAndDownload(summary.file, summary.filename);

      return;
   }


   // Get this user's jobs from the web service.
   async getJobs() {

      this.jobs = await ProposalService.getJobs(this.authToken, this.user.email, this.user.uid);

      await this.displayJobs();
      return;
   }


   initialize() {

      this.elements.container = <HTMLElement>document.querySelector(this.selectors.container);
      if (!this.elements.container) { throw new Error("Invalid container Element"); }

      // Create HTML for the container Element.
      const html = 
         `<div class=\"user-row\">You are logged in as ${this.user.name} (${this.user.email})</div>
         <div class=\"upload-panel\">
               <button class=\"btn file-control\">${this.icons.browse} Browse for files</button>
               <input type=\"file\" id=\"file_input\" multiple
                  accept=".xlsx,.csv,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,.docx" />
               <label class=\"job-name-label hidden\">Job name</label><input type=\"text\" class=\"job-name hidden\" placeholder=\"(optional)\" />
               <button class=\"btn validate-button hidden\">Validate</button>
         </div>
         <div class=\"jobs\"></div>`;

      this.elements.container.innerHTML = html;

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
      });

      // Get and validate the validate button.
      this.elements.validateButton = <HTMLButtonElement>this.elements.container.querySelector(".validate-button");
      if (!this.elements.validateButton) { throw new Error("Invalid validate button Element"); }

      this.elements.validateButton.addEventListener("click", () => { this.uploadProposals(); })

      // Get and validate the file input Element.
      this.elements.fileInput = <HTMLInputElement>this.elements.container.querySelector("#file_input");
      if (!this.elements.fileInput) { throw new Error("Invalid file input Element"); }

      this.elements.fileInput.addEventListener("change", async (event_: MouseEvent) => {
      
         if (!this.elements.fileInput.files || this.elements.fileInput.files.length < 1) {
               
            // Hide the validate button and job name.
            this.elements.validateButton.innerHTML = `Nothing to validate`;
            this.elements.validateButton.classList.remove("visible");
            this.elements.validateButton.classList.add("hidden");
            return;
         }
         
         // Begin populating the validate button text.
         let buttonText = `${this.icons.validate} Validate`;
         
         if (this.elements.fileInput.files.length === 1) {
            buttonText += " file";
         } else {
            buttonText += ` ${this.elements.fileInput.files.length} files`;
         }

         // Display the validate button.
         this.elements.validateButton.innerHTML = buttonText;
         this.elements.validateButton.classList.remove("hidden");
         this.elements.validateButton.classList.add("visible");

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


   // This dialog lets the user know that their files are being validated, and what to expect.
   async showInfoDialog(fileCount_: number, filenames_: string) {

      let content: string;
      let title: string;

      if (fileCount_ === 1) {
         title = "Validating your proposal file";
         content = "Your proposal file has been uploaded and is being validated. When the process is complete, " +
            "the results will be available in the list of jobs below.";

      } else {
         title = "Validating your proposal files";
         content = "Your proposal files have been uploaded and are being validated. When the process is complete, " +
            "the results will be available in the list of jobs below. If the results are not immediately available in the list below, " +
            "you might want to wait a few minutes and then refresh the page.";
      }

      // Display a "success" dialog.
      await Swal.fire({
         title: title,
         text: content,
         icon: "success"
      });

      return;
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

   async uploadProposals() {

      if (!this.elements.fileInput) { throw new Error("Invalid file control"); }
      if (!this.elements.fileInput.files || !this.elements.fileInput.files[0]) { throw new Error("Invalid upload file"); }
      
      // Disable the validate button.
      this.elements.validateButton.disabled = true;

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
            
            // Display an error dialog.
            return await Swal.fire({
               title: "Error",
               text: "Unable to upload: no valid files were found",
               icon: "error"
            });
         }

         await Promise.allSettled([

            // Upload the proposal file(s) to the web service for validation.
            ProposalService.uploadProposals(this.authToken, files, jobName, this.user.email, this.user.uid), 
            
            // Show a modal dialog with information about the uploaded files.
            this.showInfoDialog(files.length, filenames)
         ])
         .then((results_) => {
            if (results_[0].status === "fulfilled") {
               this.currentJobUID = results_[0].value.jobUID;
               console.log(`just set currentJobUID to ${this.currentJobUID}`)
            } else {
               this.currentJobUID = null;
            }
         });
         
         // Reload the jobs.
         await this.getJobs();

      } catch (error_) {

         // Display an error dialog.
         await Swal.fire({
            title: "Error",
            text: error_,
            icon: "error"
         });
      }

      // Re-initialize the upload controls.
      this.elements.fileInput.files = null;

      // Update the validate button and hide it.
      this.elements.validateButton.disabled = false;
      this.elements.validateButton.innerHTML = `Nothing to validate`;
      this.elements.validateButton.classList.remove("visible");
      this.elements.validateButton.classList.add("hidden");

      // Hide the job name control and its label.
      this.elements.jobNameLabel.classList.remove("visible");
      this.elements.jobNameLabel.classList.add("hidden");
      this.elements.jobName.classList.remove("visible");
      this.elements.jobName.classList.add("hidden");
      this.elements.jobName.value = "";

      return;
   }
}