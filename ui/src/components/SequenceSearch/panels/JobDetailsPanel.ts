
import { ButtonClass, FormatDate, FormatDuration, Icon, PanelKey } from "../Common";
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

   
   // Load the panel contents and display them on the page.
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

      // Format the job name
      let jobName = Utils.safeTrim(this.job.name);
      if (jobName.length < 1) { jobName = "(No job name provided)"; }

      // Format the created on and ended on date/times.
      let createdOn = FormatDate(this.job.createdOn);

      // Format the duration between two date/times.
      let duration = FormatDuration(this.job.createdOn, this.job.endedOn);

      // Create a URL for the upload panel.
      const uploadURL = this.parent.createUrlUsingState(PanelKey.upload);

      // Create the link panel HTML containing a link to this job's details.
      const linkPanelHTML = this.parent.createLinkPanel(PanelKey.jobDetails);

      //----------------------------------------------------------------------------------------------------------------
      // Generate the HTML for the job details
      //----------------------------------------------------------------------------------------------------------------
      let html = 
         `<div class="navigation-panel">
            <a href="${uploadURL}" target="_blank">Use SeqSearch again</a> with different FASTA files.
         </div>
         <div class="panel-title">Your results</div>
         <table class="job-details">
            <tbody>
               <tr class="job-name-row">
                  <th class="job-name-label">Job name</th>
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
         ${linkPanelHTML}`;
         
         /*
         <div class="link-panel">
            <div class="instructions">${Icon.link} You can view these results again using the following URL:</div>
            <div class="controls">
               <a href="${jobURL}" target="_blank">${jobURL}</a> 
               <button class="btn ${ButtonClass.copyURL}">${Icon.copy} Copy to clipboard</button>
            </div>
         </div>
         */
      this.elements.container.innerHTML = html;

      if (linkPanelHTML && linkPanelHTML.length > 0) {

         this.elements.copyUrlButton = this.elements.container.querySelector(`.${ButtonClass.copyURL}`);
         if (!this.elements.copyUrlButton) { throw new Error("Invalid copy URL button element"); }

         // Add a click handler to the copy URL button.
         this.elements.copyUrlButton.addEventListener("click", async (event_: MouseEvent) => {
            return await this.parent.copyLinkURL(event_);
         })
      } else {
         // TEST
         console.warn("No link panel HTML was generated for the job details panel");
      }

      // Initialize tippy tooltips for buttons.
      tippy(".has-tooltip");

      return;
   }

   unload() {
      this.isActive = false;
      this.elements.container.classList.remove("active");

      // TODO: should we remove event listeners?
   }

}