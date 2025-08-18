
import { ButtonClass, FormatDate, FormatDuration, Icon } from "../Common";
import { ISeqSearchJob } from "../ISeqSearchJob";
import { ISeqSearchPanel } from "./ISeqSearchPanel";
import { SequenceSearch } from "../SequenceSearch";
import tippy from "tippy.js";
import { Utils } from "../../../helpers/Utils";


export class JobDetailsPanel implements ISeqSearchPanel {
   
   // DOM elements
   elements: {
      container: HTMLElement,
      copyUrlButton: HTMLButtonElement,
      jobName: HTMLInputElement,
      jobNameLabel: HTMLElement,
      searchResults: HTMLElement
   }

   // Is the panel currently active/displayed?
   isActive: boolean;

   job: ISeqSearchJob = null;

   // The parent page
   parent: SequenceSearch = null;



   // C-tor
   constructor(containerEl_: HTMLElement, parent_: SequenceSearch) {

      if (!containerEl_) { throw new Error("Invalid container element"); }

      if (!parent_) { throw new Error("Invalid parent parameter"); }
      this.parent = parent_;

      this.elements = {
         container: containerEl_,
         copyUrlButton: null,
         jobName: null,
         jobNameLabel: null,
         searchResults: null
      }
   }

   
   // Make the panel visible and populate it with data.
   async load() {

      this.isActive = true;

      // Make the container visible.
      this.elements.container.classList.add("active");

      // Make a local copy of the job data.
      this.job = this.parent.job;

      if (!this.job || !this.job.data) {
         this.elements.container.innerHTML = `<div class="no-results">Invalid job</div>`;
         return;
      }

      // Clear any existing content in the container.
      this.elements.container.innerHTML = "";

      // Create the URL that can be used to view the job data.
      const jobURL = this.parent.createUrlUsingState();

      // Format the job name
      let jobName = Utils.safeTrim(this.job.name);
      jobName = jobName.length < 1 ? "(none)" : `<b>${jobName}</b>`;

      // Format the created on and ended on date/times.
      let createdOn = FormatDate(this.job.createdOn);

      // Format the duration between two date/times.
      let duration = FormatDuration(this.job.createdOn, this.job.endedOn);

      //----------------------------------------------------------------------------------------------------------------
      // Generate the HTML for the job details
      //----------------------------------------------------------------------------------------------------------------
      let html = 
         `<table class="job-details">
            <tbody>
               <tr>
                  <th>Job name</th>
                  <td class="job-name">${jobName}</td>
               </tr>
               <tr>
                  <th>Started</th>
                  <td>${createdOn || "(unknown)"}</td>
               </tr>
               <tr>
                  <th>Duration</th>
                  <td>${duration || "(unknown)"}</td>
               </tr>
               <tr>
                  <th>Status</th>
                  <td>${this.job.status}</td>
               </tr>
               <tr>
                  <th>Program and version</th>
                  <td>${this.job.data.program_name} (version ${this.job.data.version})</td>
               </tr>
               <tr>
                  <th>Database</th>
                  <td>${this.job.data.database_title}</td>
               </tr>
            </tbody>
         </table>

         <div class="link-panel">
            <div class="instructions">You can view these search results again using the following URL:</div>
            <div class="controls">
               <a href="${jobURL}" target="_blank">${jobURL}</a> 
               <button class="btn ${ButtonClass.copyURL}">${Icon.copy} Copy to clipboard</button>
            </div>
         </div>`;
         
      this.elements.container.innerHTML = html;

      this.elements.copyUrlButton = this.elements.container.querySelector(`.${ButtonClass.copyURL}`);
      if (!this.elements.copyUrlButton) { throw new Error("Invalid copy URL button element"); }

      // Initialize tippy tooltips for buttons.
      tippy(".has-tooltip");

      // Add a click handler to the copy URL button.
      this.elements.copyUrlButton.addEventListener("click", async () => {
         return await this.parent.copyJobURL();
      });

      return;
   }

   unload() {
      this.isActive = false;
      this.elements.container.classList.remove("active");

      // TODO: should we remove event listeners?
   }

}