
import { ButtonClass, Constants, DisplayMessageForIncompleteJob, FormatDate, FormatDuration, Icon, PanelKey } from "../Common";
import { ITaxaBlastJob } from "../ITaxaBlastJob";
import { ITaxaBlastPanel } from "./ITaxaBlastPanel";
import { TaxaBLAST } from "../TaxaBLAST";
import tippy from "tippy.js";
import { Utils } from "../../../helpers/Utils";


export class JobDetailsPanel implements ITaxaBlastPanel {
   
   // DOM elements
   elements: {
      container: HTMLElement,
      jobName: HTMLInputElement,
      jobNameLabel: HTMLElement,
      panelControls: HTMLElement,
      searchResults: HTMLElement
   }

   // Is the panel currently active/displayed?
   isActive: boolean;

   job: ITaxaBlastJob = null;

   // The parent page
   parent: TaxaBLAST = null;



   // C-tor
   constructor(containerEl_: HTMLElement, parent_: TaxaBLAST) {

      if (!containerEl_) { throw new Error("Invalid container element"); }

      if (!parent_) { throw new Error("Invalid parent parameter"); }
      this.parent = parent_;

      this.elements = {
         container: containerEl_,
         jobName: null,
         jobNameLabel: null,
         panelControls: null,
         searchResults: null
      }
   }

   
   // Load the panel contents and display them on the page.
   async load() {

      console.info("LOADING job details panel")

      this.isActive = true;

      // Make the container visible.
      this.elements.container.classList.add("active");

      // Make a local copy of the job data.
      this.job = this.parent.job;

      console.log("in jobDetailsPanel.load()")
      
      // If the job is invalid or has a status other than "complete", display an appropriate message in
      // the container element. The boolean value that's returned indicates whether a job doesn't have a 
      // completed status (and also, if a message was displayed).
      if (DisplayMessageForIncompleteJob(this.elements.container, this.job)) { return; }

      // Clear any existing content in the container.
      this.elements.container.innerHTML = "";

      // Format the job name
      let jobName = Utils.safeTrim(this.job.name);
      if (jobName.length < 1) { jobName = "(No job name provided)"; }

      // Format the created on and ended on date/times.
      let createdOn = FormatDate(this.job.createdOn);

      // Format the duration between two date/times.
      let duration = FormatDuration(this.job.createdOn, this.job.endedOn);

      // TODO: Temporary fix to display taxablast instead of seqsearch.
      let programName = "taxablast"; // this.job.data.program_name;

      // Create the link panel HTML containing a link to this job's details.
      const linkPanelHTML = this.parent.createLinkRow(PanelKey.jobDetails);

      //----------------------------------------------------------------------------------------------------------------
      // Generate the HTML for the job details
      //----------------------------------------------------------------------------------------------------------------
      let html = 
         `<div class="panel-title">Search Results</div>
         <div class="panel-controls">
            ${linkPanelHTML}
            <button class="btn ${ButtonClass.newSearch} has-tooltip"
               data-tippy-content="Use ${Constants.APPLICATION_NAME} again with different FASTA files"
               data-url="${this.parent.createUrlFromState(PanelKey.fastaInput)}"
            >${Icon.search} New search</button>
         </div>
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
                  <td>${programName} (version ${this.job.data.version})</td>
               </tr>
               <tr>
                  <th>Database</th>
                  <td>${this.job.data.database_title}</td>
               </tr>
            </tbody>
         </table>`;

      this.elements.container.innerHTML = html;

      // Get a reference to the "panel controls" DOM element.
      this.elements.panelControls = this.elements.container.querySelector(".panel-controls");
      if (!this.elements.panelControls) { throw new Error(`Invalid "panel controls" DOM element`); }

      // Handle clicks in the panel controls.
      this.elements.panelControls.addEventListener("click", async (event_) => {
         return await this.parent.handleClickEvent(this.elements.container, event_.target as HTMLElement);
      })

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