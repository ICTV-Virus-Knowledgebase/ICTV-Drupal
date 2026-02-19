
import { AlertBuilder } from "../../helpers/AlertBuilder";
import { BlastHitsPanel } from "./panels/BlastHitsPanel";
import { ButtonClass, Constants, FormatDate, FormatDuration, GetSpinnerHTML, Icon, PanelKey, ParameterKey, ToggleAccordion } from "./Common";
import { decode } from "base64-arraybuffer";
import { ITaxaBlastJob } from "./ITaxaBlastJob";
import { ITaxaBlastPanel } from "./panels/ITaxaBlastPanel";
import { JobStatus, WebStorageKey } from "../../global/Types";
import { JobSubmission } from "./JobSubmission";
import * as pako from "pako";
import { TaxaBlastService } from "../../services/TaxaBlastService";
import { Utils } from "../../helpers/Utils";

// Panels
import { JobDetailsPanel } from "./panels/JobDetailsPanel";
import { JobHistoryPanel } from "./panels/JobHistoryPanel";
import { JobSubmissionPanel } from "./panels/JobSubmissionPanel";
import { MessagePanel } from "./panels/MessagePanel";


export class TaxaBLAST {

   // The authentication token that will be used when making API calls.
   authToken: string;

   // The CSS selector for the container element where the TaxaBLAST UI will be rendered.
   containerSelector: string = null;

   // DOM elements
   elements: {
      blastHitsPanel: HTMLElement,
      container: HTMLElement,
      jobDetailsPanel: HTMLElement,
      jobHistoryPanel: HTMLElement,
      jobSubmissionPanel: HTMLElement,
      messagePanel: HTMLElement
   }

   job: ITaxaBlastJob = null;

   // This keeps track of a submitted job and its status.
   jobSubmission: JobSubmission = null;

   // The collection of panels used by this component.
   panels: Map<PanelKey, ITaxaBlastPanel>;

   state: {

      // The currently-selected input file associated with the job.
      fileIndex: number,

      // The current job UID (optional)
      jobUID: string,

      // The currently-selected sequence index associated with the input filename.
      sequenceIndex: number,

      // The job's current status
      status: JobStatus
   }

   // User information
   user: {
      email: string,
      name: string,
      uid: string,

      // The user UID provided as a URL parameter (optional).
      urlUID: string
   }

   
   // C-tor
   constructor(authToken_: string, containerSelector_: string, email_: string, 
      name_: string, userUID_: string) {
      
      // Validate parameters
      if (!authToken_ || authToken_.length < 1) { throw new Error("Invalid auth token in TaxaBLAST"); }
      if (!containerSelector_ || containerSelector_.length < 1) { throw new Error("Invalid container selector in TaxaBLAST"); }
      if (!email_ || email_.length < 1) { email_ = Constants.NO_EMAIL; }
      if (!name_ || name_.length < 1) { name_ = "Anonymous user"; }
      userUID_ = Utils.safeTrim(userUID_);

      this.authToken = authToken_;
      this.containerSelector = containerSelector_;

      this.user = {
         email: email_,
         name: name_,
         uid: userUID_,
         urlUID: null
      }

      this.elements = {
         blastHitsPanel: null,
         container: null,
         jobSubmissionPanel: null,
         jobDetailsPanel: null,
         jobHistoryPanel: null,
         messagePanel: null
      }

      this.panels = new Map<PanelKey, ITaxaBlastPanel>();

      this.state = {
         fileIndex: NaN,
         jobUID: null,
         sequenceIndex: NaN,
         status: JobStatus.notSubmitted
      }
   }

   // Create an HTML table containing the job details. If emphasizeFirstRow_ is true, the first row will be emphasized.
   createJobDetailsTable(emphasizeFirstRow_: boolean): string {

      if (!this.job) { return ""; }

      // Format the job name
      let jobName = Utils.safeTrim(this.job.name);
      if (jobName.length < 1) { jobName = "(No job name provided)"; }

      // Format the created on and ended on date/times.
      let createdOn = FormatDate(this.job.createdOn);

      // Format the duration between two date/times.
      let duration = FormatDuration(this.job.createdOn, this.job.endedOn);

      // TODO: should this be overridden by "taxablast"?
      let programName = this.job.data.program_name;


      //----------------------------------------------------------------------------------------------------------------
      // Generate the HTML for the job details
      //----------------------------------------------------------------------------------------------------------------

      let nameRowClass = emphasizeFirstRow_ ? " emphasized-row" : "";

      return `<table class="details-table job-details">
         <tbody>
            <tr class="${nameRowClass}">
               <th>Job name</th>
               <td>${jobName}</td>
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
            <tr>
               <th>BLAST parameters</th>
               <td class="blast-parameters">
                  <div class="blast-parameter-row">
                     <label>Task</label>
                     <div class="blast-value">${this.job.data.task}</div>
                  </div>
                  <div class="blast-parameter-row">
                     <label>Max HSPS</label>
                     <div class="blast-value">${this.job.data.max_hsps}</div>
                  </div>
                  <div class="blast-parameter-row">
                     <label>Max target seqs</label>
                     <div class="blast-value">${this.job.data.max_target_seqs}</div>
                  </div>
                  <div class="blast-parameter-row">
                     <label>Command</label>
                     <div class="blast-command">${this.job.data.blastasn_cmd}</div>
                  </div>      
               </td>
            </tr>
         </tbody>
      </table>`;
   }


   // Create a row containing a link that allows the user to return to this page with the current job data.
   createLinkRow(panelKey_: PanelKey): string {

      // All link panels require a valid job UID.
      if (!this.state.jobUID || this.state.jobUID.length < 1) { return ""; }

      let instructions = "";

      // Create a link URL for the specified panel.
      const url = this.createUrlFromState(panelKey_);

      switch (panelKey_) {

         case PanelKey.blastHits:

            // Specify the instructions for the BLAST hits panel.
            instructions = `Save this page's URL to view these results later`;
            break;

         case PanelKey.jobDetails:

            // Specify the instructions for the job details panel.
            instructions = `Save this page's URL to view these results later`;
            break;

         default:
            AlertBuilder.displayErrorSync(`Unable to create a link panel for the unhandled panel key: ${panelKey_}`);
            break;
      }

      return `<div class="link-panel">
         ${Icon.info} ${instructions}
         <button class="btn btn-generic ${ButtonClass.copyURL} has-tooltip"
            data-tippy-content="Copy the URL to your clipboard"
            data-url="${url}"
         >${Icon.copy}<span class="btn-label">Copy URL to clipboard</span></button>
      </div>`;
   }

   // Create a URL with parameters derived from the state.
   createUrlFromState(panelKey_?: PanelKey): string {
      
      let url = window.location.href;
      const qIndex = url.indexOf("?");
      if (qIndex > -1) { url = url.substring(0, qIndex); }

      const params = this.getUrlParamsFromState(panelKey_);

      return `${url}?${params.toString()}`;
   }

   // Display (load) a panel and hide (unload) the other ones.
   async displayPanel(selectedKey_: PanelKey) {

      console.log(`in displayPanel with panel key ${selectedKey_}`)

      // The selected panel might need updates to metadata.
      switch (selectedKey_) {

         case PanelKey.jobDetails:

            // Remove any previously-selected file index and sequence index from the state.
            this.state.fileIndex = NaN;
            this.state.sequenceIndex = NaN;
            break;

         case PanelKey.jobSubmission:

            // Clear the job and state.
            this.job = null;
            this.state.fileIndex = NaN;
            this.state.jobUID = null;
            this.state.sequenceIndex = NaN;
            this.state.status = JobStatus.notSubmitted
            break;
      }

      // Iterate over every panel and load or unload.
      for (const key of Object.keys(PanelKey)) {

         const panelKey = key as PanelKey;
         const panel: ITaxaBlastPanel = this.panels.get(panelKey);
         if (!panel) { throw new Error(`Invalid panel for key ${key}`); }

         if (panelKey === selectedKey_) {
            await panel.load();
         } else {
            await panel.unload();
         }
      }
   }

   // Download the BLAST CSV data for a specific result.
   async downloadCSV(filename_: string, title_: string) {

      filename_ = Utils.safeTrim(filename_);
      if (filename_.length < 1) { return await AlertBuilder.displayError("Invalid CSV filename"); }

      title_ = Utils.safeTrim(title_);
      if (title_.length < 1) { title_ = filename_; }

      // Determine which user UID to use.
      let userUID = !this.user.urlUID ? this.user.uid : this.user.urlUID;

      // Get the output file and its metadata.
      const outputFile = await TaxaBlastService.getOutputFile(this.authToken, filename_, this.state.jobUID, userUID);
      if (!outputFile || !outputFile.contents) { return await AlertBuilder.displayError("The CSV file is invalid"); }

      // Decompress the CSV file, if necessary.
      let csv = outputFile.contents;
      if (outputFile.isCompressed) { csv = pako.ungzip(decode(csv), { to: 'string' }); }
      if (!csv || csv.length < 1) { return await AlertBuilder.displayError("The CSV file is empty or invalid"); }

      // Associate the ArrayBuffer with a Blob, create a download link, and trigger the download.
      const link = document.createElement('a')
      link.href = URL.createObjectURL(new Blob(
         [ csv ],
         { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }
      ))
      link.download = title_;
      link.click();

      return;
   }

   // Retrieve the job with this UID.
   async getJob() {

      if (!this.state.jobUID) { return await AlertBuilder.displayError("No job UID provided"); }

      // Get the job data from the server.
      this.job = await TaxaBlastService.getJob(this.authToken, this.state.jobUID);

      return;
   }

   // Use the current state to generate URL search parameters.
   getUrlParamsFromState(panelKey_?: PanelKey): URLSearchParams {
      
      // Get the current URL parameters
      const params = new URLSearchParams(window.location.search);
      
      // TESTING: Remove the history parameter.
      if (params.has(ParameterKey.history)) { params.delete(ParameterKey.history); }

      // If the job UID is valid, update its URL parameter.
      if (this.state.jobUID && this.state.jobUID.length > 0) {
         params.set(ParameterKey.job, this.state.jobUID);

         // If the sequence and file indices are valid, update their URL parameters.
         if (!isNaN(this.state.sequenceIndex) && !isNaN(this.state.fileIndex)) {
            params.set(ParameterKey.sequence, this.state.sequenceIndex.toString());
            params.set(ParameterKey.file, this.state.fileIndex.toString());
         } else {
            params.delete(ParameterKey.sequence);
            params.delete(ParameterKey.file);
         }
      } else {
         params.delete(ParameterKey.job);
         params.delete(ParameterKey.sequence);
         params.delete(ParameterKey.file);
         // TODO: filename and userUID?
      }

      // The job details page doesn't need sequence or file parameters.
      if (panelKey_ && panelKey_ === PanelKey.jobDetails) {
         params.delete(ParameterKey.sequence);
         params.delete(ParameterKey.file);
      }

      return params;
   }

   // Handle a click event on a button or accordion control.
   async handleClickEvent(containerEl_: HTMLElement, targetEl_: HTMLElement) {

      let url = null;

      // Was an icon clicked?
      if (targetEl_.tagName === "I") { 
         if (targetEl_.classList.contains("copy-url-link")) {

            // Get the icon's URL data attribute.
            url = targetEl_.getAttribute("data-url");
            if (!url || url.length < 1) { throw new Error("Unable to copy the URL: Invalid URL"); }

            // Copy the URL to the clipboard.
            await navigator.clipboard.writeText(url);

            // Display a success message.
            return await AlertBuilder.displaySuccess("The URL has been copied to your clipboard. You can now paste it into a document for future reference or include it in an email.");

         } else {
            // Use its parent element.
            targetEl_ = targetEl_.parentElement; 
         }
      }

      // Was a "btn-label" on a button clicked? If so, use its parent button element as the target element.
      if (targetEl_.classList.contains("btn-label")) { targetEl_ = targetEl_.parentElement; }

      // Was a button on a sequence row clicked?
      if (targetEl_.tagName === "BUTTON") {

         const button = targetEl_ as HTMLButtonElement;
         
         // Variables for button attributes.
         let filename = null;
         let title = null;
         

         // The button's class determines which action to take.
         if (button.classList.contains(ButtonClass.back) || button.classList.contains(ButtonClass.newSearch)) {

            // Get the button's URL data attribute.
            url = Utils.safeTrim(button.getAttribute("data-url"));
            if (!url || url.length < 1) { throw new Error("Invalid URL attribute"); }
            
            // Open the URL in a new browser tab.
            window.open(url, "_blank");

         } else if (button.classList.contains(ButtonClass.copyURL)) {

            // Get the button's URL data attribute.
            url = button.getAttribute("data-url");
            if (!url || url.length < 1) { throw new Error("Unable to copy the URL: Invalid URL"); }

            // Copy the URL to the clipboard.
            await navigator.clipboard.writeText(url);

            // Display a success message.
            await AlertBuilder.displaySuccess("The URL has been copied to your clipboard. You can now paste it into a document for future reference or include it in an email.");
               
         } else if (button.classList.contains(ButtonClass.downloadCSV)) {
            
            // Get the button's filename attribute.
            filename = Utils.safeTrim(button.getAttribute("data-filename"));
            if (filename.length < 1) { return await AlertBuilder.displayError("Invalid CSV filename button attribute"); }

            // Get the button's title attribute.
            title = Utils.safeTrim(button.getAttribute("data-title"));

            // Download the CSV file.
            await this.downloadCSV(filename, title);

         } else if (button.classList.contains(ButtonClass.viewHits)) {

            // Get and validate the file index attribute.
            let strFileIndex = Utils.safeTrim(button.getAttribute("data-file-index"));
            const fileIndex = parseInt(strFileIndex);
            if (isNaN(fileIndex)) { return await AlertBuilder.displayError("The file index attribute is invalid"); }
      
            // Get and validate the sequence index attribute.
            let strSeqIndex = button.getAttribute("data-seq-index");
            const seqIndex = parseInt(strSeqIndex);
            if (isNaN(seqIndex)) { return await AlertBuilder.displayError(`Invalid sequence index: ${seqIndex}`); }

            // Update the state.
            this.state.fileIndex = fileIndex;
            this.state.sequenceIndex = seqIndex;
            
            window.open(this.createUrlFromState(), "_blank");

         } else if (button.classList.contains(ButtonClass.viewHTML)) {
            
            // Get and validate the button's filename attribute.
            filename = Utils.safeTrim(button.getAttribute("data-filename"));
            if (filename.length < 1) { return await AlertBuilder.displayError("Invalid HTML filename button attribute"); }

            // Get the button's title attribute.
            title = Utils.safeTrim(button.getAttribute("data-title"));

            // Display the HTML file in a new browser tab.
            await this.viewHTML(filename, title);
         }

         return;
      }

      // Was the child of an accordion header clicked?
      const accordionHeaderEl = targetEl_.closest(".ictv-accordion-header");
      if (accordionHeaderEl) {

         // Validate the container element.
         if (!containerEl_) { await AlertBuilder.displayError("Unable to toggle accordion: Invalid container element"); }

         // Get the accordion's ID.
         const itemID = accordionHeaderEl.getAttribute("data-id");
         if (!itemID) { return; }

         // Toggle the accordion item.
         ToggleAccordion(this.elements.container, itemID);
      }
      
      return;
   }

   // Initialize the TaxaBLAST component.
   async initialize() {

      // If the user UID is empty, look for one in web storage or generate a new one.
      if (!this.user.uid || this.user.uid === "0") { this.setDefaultUserUID(); } 

      // Get a reference to the container element.
      this.elements.container = document.querySelector(this.containerSelector);
      if (!this.elements.container) { throw new Error("Invalid container Element"); }

      // Get a spinner and message for the message panel.
      const spinnerHTML = GetSpinnerHTML("Loading...");

      // Create HTML for the container elements.
      const html = 
         `<div class=\"blast-hits-panel container\"></div>
         <div class=\"job-details-panel container\"></div>
         <div class=\"job-history-panel container\"></div>
         <div class=\"job-submission-panel container\"></div>
         <div class=\"message-panel container active\">${spinnerHTML}</div>`;

      this.elements.container.innerHTML = html;


      // The BLAST hits panel
      this.elements.blastHitsPanel = this.elements.container.querySelector(".blast-hits-panel") as HTMLElement;
      if (!this.elements.blastHitsPanel) { throw new Error("Invalid BLAST hits panel Element"); }

      // The Job submission panel
      this.elements.jobSubmissionPanel = this.elements.container.querySelector(".job-submission-panel") as HTMLElement;
      if (!this.elements.jobSubmissionPanel) { throw new Error("Invalid Job submission panel Element"); }

      // The job details panel
      this.elements.jobDetailsPanel = this.elements.container.querySelector(".job-details-panel") as HTMLElement;
      if (!this.elements.jobDetailsPanel) { throw new Error("Invalid job details panel Element"); }

      // The job history panel
      this.elements.jobHistoryPanel = this.elements.container.querySelector(".job-history-panel") as HTMLElement;
      if (!this.elements.jobHistoryPanel) { throw new Error("Invalid job history panel Element"); }

      // The message panel
      this.elements.messagePanel = this.elements.container.querySelector(".message-panel") as HTMLElement;
      if (!this.elements.messagePanel) { throw new Error("Invalid message panel Element"); }

      
   
      // Create the panel instances.
      this.panels.set(PanelKey.blastHits, new BlastHitsPanel(this.elements.blastHitsPanel, this));
      this.panels.set(PanelKey.jobDetails, new JobDetailsPanel(this.elements.jobDetailsPanel, this));
      this.panels.set(PanelKey.jobHistory, new JobHistoryPanel(this.elements.jobHistoryPanel, this));
      this.panels.set(PanelKey.jobSubmission, new JobSubmissionPanel(this.elements.jobSubmissionPanel, this));
      this.panels.set(PanelKey.message, new MessagePanel(this.elements.messagePanel, this));

      // Use URL parameters to determine which panel to display.
      return this.processURL();
   }

   // Process the URL parameters to determine which panel to load.
   async processURL() {

      // The job submission panel is the default.
      let panelKey = PanelKey.jobSubmission;

      // Get the URL parameters
      const urlParams = new URLSearchParams(window.location.search);
      
      // Set default state values
      this.state.jobUID = null;
      this.state.fileIndex = NaN;
      this.state.sequenceIndex = NaN;
      this.state.status = JobStatus.notSubmitted; // TODO: maybe we shouldn't reset this...

      // TESTING
      let history = Utils.safeTrim(urlParams.get(ParameterKey.history));
      if (history === "display") {
         return await this.displayPanel(PanelKey.jobHistory);
      }

      // Was a job UID provided in the query string?
      this.state.jobUID = Utils.safeTrim(urlParams.get(ParameterKey.job));
      if (this.state.jobUID && this.state.jobUID.length > 0) {

         // Since a job UID was provided, default to displaying the job details.
         // TODO: if the job is still in pending status, we should navigate to the pending job panel instead.
         panelKey = PanelKey.jobDetails;

         // Were file index and sequence index parameters provided?
         let strFileIndex = Utils.safeTrim(urlParams.get(ParameterKey.file));
         let strSeqIndex = Utils.safeTrim(urlParams.get(ParameterKey.sequence));

         if (strFileIndex.length > 0 && strSeqIndex.length > 0) {
            this.state.fileIndex = parseInt(strFileIndex);
            this.state.sequenceIndex = parseInt(strSeqIndex);

            if (!isNaN(this.state.fileIndex) && !isNaN(this.state.sequenceIndex)) {
               panelKey = PanelKey.blastHits;
            }
         }
      }

      return await this.displayPanel(panelKey);
   }

   // If the user UID is empty, look for one in web storage or generate a new one.
   async setDefaultUserUID() {

      // Is there already a user UID in web storage?
      if (typeof(Storage) !== "undefined") { this.user.uid = localStorage.getItem(WebStorageKey.taxaBlastUserUID); }
      if (!this.user.uid) { 

         // Generate a new user UID using the current Unix timestamp in seconds.
         this.user.uid = `${Math.floor(Date.now() / 1000)}`;
   
         // If web storage is available, save the user UID in local storage.
         if (typeof(Storage) !== "undefined") { localStorage.setItem(WebStorageKey.taxaBlastUserUID, this.user.uid); }
      }

      return;
   }

   /*
   // Update the window's location with a state-maintaining URL.
   async updatePage() {

      alert("TODO: try not to refresh the browser with the updated URL!")

      const url = this.createUrlUsingState();
      window.location.assign(url);
      return;
   }*/

   // Update the URL parameters without reloading the page.
   updateUrlFromState() {
      
      const params = this.getUrlParamsFromState();

      history.replaceState(null, "", "?" + params.toString());
   }

   // Display the BLAST HTML data for a specific sequence.
   async viewHTML(filename_: string, title_: string) {

      filename_ = Utils.safeTrim(filename_);
      if (filename_.length < 1) { return await AlertBuilder.displayError("Invalid HTML filename"); }

      title_ = Utils.safeTrim(title_);
      if (title_.length < 1) { title_ = filename_; }
      
      // Determine which user UID to use.
      let userUID = !this.user.urlUID ? this.user.uid : this.user.urlUID;

      // Get the output file and its metadata.
      const outputFile = await TaxaBlastService.getOutputFile(this.authToken, filename_, this.state.jobUID, userUID);
      if (!outputFile || !outputFile.contents) { return await AlertBuilder.displayError("The HTML file is invalid"); }

      // Decompress the HTML file, if necessary.
      let html = outputFile.contents;
      if (outputFile.isCompressed) { html = pako.ungzip(decode(html), { to: 'string' }); }
      if (!html || html.length < 1) { return await AlertBuilder.displayError("The HTML file is empty or invalid"); }

      // Open a new tab/window and populate it with the contents of the BLAST HTML file.
      const blastWindow = window.open("", "_blank");
      blastWindow.document.writeln(html);

      // Use the HTML filename as the window's title.
      blastWindow.document.title = title_;

      return;
   }
}