
import { AlertBuilder } from "../../helpers/AlertBuilder";
import { BlastHitsPanel } from "./panels/BlastHitsPanel";
import { ButtonClass, Constants, GenerateUUID, PanelAction, PanelKey, ParameterKey, ToggleAccordion } from "./Common";
import { decode } from "base64-arraybuffer";
import { ISeqSearchJob } from "./ISeqSearchJob";
import { ISeqSearchPanel } from "./panels/ISeqSearchPanel";
import { JobDetailsPanel } from "./panels/JobDetailsPanel";
import { WebStorageKey } from "../../global/Types";
import * as pako from "pako";
import { SearchResultsPanel } from "./panels/SearchResultsPanel";
import { SequenceSearchService } from "../../services/SequenceSearchService";
import { UploadPanel } from "./panels/UploadPanel";
import { Utils } from "../../helpers/Utils";


export class SequenceSearch {

   // The authentication token that will be used when making API calls.
   authToken: string;

   // The CSS selector for the container element where the Sequence Search UI will be rendered.
   containerSelector: string = null;

   // DOM elements
   elements: {
      blastHitsPanel: HTMLElement,
      container: HTMLElement,
      jobDetailsPanel: HTMLElement,
      searchResultsPanel: HTMLElement,
      uploadPanel: HTMLElement
   }

   job: ISeqSearchJob = null;

   panels: Map<PanelKey, ISeqSearchPanel>;

   state: {

      // The currently-selected input file associated with the job.
      fileIndex: number,
      //filename: string,

      // The current job UID (optional)
      jobUID: string,

      // The currently-selected sequence index associated with the input filename.
      sequenceIndex: number
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
      if (!authToken_ || authToken_.length < 1) { throw new Error("Invalid auth token in SequenceSearch"); }
      if (!containerSelector_ || containerSelector_.length < 1) { throw new Error("Invalid container selector in SequenceSearch"); }
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
         jobDetailsPanel: null,
         searchResultsPanel: null,
         uploadPanel: null
      }

      this.panels = new Map<PanelKey, ISeqSearchPanel>();

      this.state = {
         fileIndex: NaN,
         jobUID: null,
         sequenceIndex: NaN
      }
   }


   // Copy the job/state URL to the clipboard.
   async copyJobURL() {

      // Create the URL that can be used to view the job data.
      const jobURL = this.createUrlUsingState();

      // Copy the URL to the clipboard.
      await navigator.clipboard.writeText(jobURL);

      // Display a success message.
      return await AlertBuilder.displaySuccess("The URL has been copied to your clipboard. You can now bookmark it or paste it into a document for future reference.");
   }

   // Create a SeqSearch URL using the current state. 
   createUrlUsingState(): string {
      
      let url = window.location.href;

      // Remove any existing query string parameters.
      let qIndex = url.indexOf("?");
      if (qIndex > -1) { url = url.substring(0, qIndex); }

      // Do we have a valid job UID?
      if (this.state.jobUID !== null && this.state.jobUID.length > 0) {
         url += `?${ParameterKey.job}=${this.state.jobUID}`;

         // Do we have a valid file index?
         if (!isNaN(this.state.fileIndex)) { 
            url += `&${ParameterKey.file}=${this.state.fileIndex}`;

            // Do we have a valid sequence index?
            if (this.state.sequenceIndex !== null && !isNaN(this.state.sequenceIndex)) {
               url += `&${ParameterKey.sequence}=${this.state.sequenceIndex}`;
            }
         }
      }
      
      return url;
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
      const outputFile = await SequenceSearchService.getOutputFile(this.authToken, filename_, this.state.jobUID, userUID);
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
      this.job = await SequenceSearchService.getJob(this.authToken, this.state.jobUID);

      return;
   }

   // Handle the panel action that was provided.
   async handleAction(action_: PanelAction) {

      if (!action_) { throw new Error("Invalid action parameter"); }
      
      let loadBlastHits = false;
      let loadJobDetails = false;
      let loadSearchResults = false;
      let loadUpload = false;

      // All panels besides the upload panel need to load the job specified in the state.
      if (action_ != PanelAction.displayUpload && (!this.job || this.job.uid !== this.state.jobUID)) { await this.getJob(); }

      switch (action_) {

         case PanelAction.displayBlastHits:

            // Which panels will be loaded?
            loadBlastHits = true;
            loadJobDetails = false;
            loadUpload = false;
            break;

         case PanelAction.displayJob:

            this.state.fileIndex = NaN;
            this.state.sequenceIndex = NaN;

            // Which panels will be loaded?
            loadJobDetails = true;
            loadSearchResults = true;
            loadUpload = true;
            break;

         case PanelAction.displayUpload:

            // Clear the job and state.
            this.job = null;
            this.state.fileIndex = NaN;
            this.state.jobUID = null;
            this.state.sequenceIndex = NaN;

            // Which panels will be loaded?
            loadUpload = true;

            break;

         default:
            return await AlertBuilder.displayError(`Unhandled panel action: ${action_}`);
      }

      // Load or unload panels as determined above.
      await this.updatePanel(PanelKey.blastHits, loadBlastHits);
      await this.updatePanel(PanelKey.jobDetails, loadJobDetails);
      await this.updatePanel(PanelKey.searchResults, loadSearchResults);
      await this.updatePanel(PanelKey.upload, loadUpload);

      return;
   }

   // Handle a click event on a button or accordion control.
   async handleClickEvent(containerEl_: HTMLElement, targetEl_: HTMLElement) {

      // If an icon was clicked, use its parent Element.
      if (targetEl_.tagName === "I") { targetEl_ = targetEl_.parentElement; }

      // Was a button on a sequence row clicked?
      if (targetEl_.tagName === "BUTTON") {

         const button = targetEl_ as HTMLButtonElement;
         
         // Get and validate the filename attribute.
         const filename = Utils.safeTrim(button.getAttribute("data-filename"));

         // Get and validate the title attribute.
         const title = Utils.safeTrim(button.getAttribute("data-title"));
         
         // The button's class determines which action to take.
         if (button.classList.contains(ButtonClass.viewHits)) {

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
            
            window.open(this.createUrlUsingState(), "_blank");

         } else if (button.classList.contains(ButtonClass.downloadCSV)) {
            
            if (filename.length < 1) { return await AlertBuilder.displayError("Invalid CSV filename button attribute"); }

            // Download the CSV file.
            await this.downloadCSV(filename, title);

         } else if (button.classList.contains(ButtonClass.viewHTML)) {
            
            if (filename.length < 1) { return await AlertBuilder.displayError("Invalid HTML filename button attribute"); }

            // Display the HTML file in a new browser tab.
            await this.viewHTML(filename, title);
         }

         return;
      }

      // Was an accordion control clicked?
      if (targetEl_.classList.contains("ictv-accordion-control")) {

         const itemID = targetEl_.getAttribute("data-id");
         if (!itemID) { return; }

         if (!containerEl_) { await AlertBuilder.displayError("Unable to toggle accordion: Invalid container element"); }

         ToggleAccordion(this.elements.container, itemID);
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

      // Create HTML for the container elements.
      const html = 
         `<div class=\"upload-panel container active\"></div>
         <div class=\"job-details-panel container\"></div>
         <div class=\"search-results-panel container\"></div>
         <div class=\"blast-hits-panel container\"></div>`;

      this.elements.container.innerHTML = html;

      // The BLAST hits panel
      this.elements.blastHitsPanel = this.elements.container.querySelector(".blast-hits-panel") as HTMLElement;
      if (!this.elements.blastHitsPanel) { throw new Error("Invalid BLAST hits panel Element"); }

      // The job details panel
      this.elements.jobDetailsPanel = this.elements.container.querySelector(".job-details-panel") as HTMLElement;
      if (!this.elements.jobDetailsPanel) { throw new Error("Invalid job details panel Element"); }

      // The search results panel
      this.elements.searchResultsPanel = this.elements.container.querySelector(".search-results-panel") as HTMLElement;
      if (!this.elements.searchResultsPanel) { throw new Error("Invalid search results panel Element"); }

      // The upload panel
      this.elements.uploadPanel = this.elements.container.querySelector(".upload-panel") as HTMLElement;
      if (!this.elements.uploadPanel) { throw new Error("Invalid upload panel Element"); }


      // Create the panel instances.
      this.panels.set(PanelKey.blastHits, new BlastHitsPanel(this.elements.blastHitsPanel, this));
      this.panels.set(PanelKey.jobDetails, new JobDetailsPanel(this.elements.jobDetailsPanel, this));
      this.panels.set(PanelKey.searchResults, new SearchResultsPanel(this.elements.searchResultsPanel, this));
      this.panels.set(PanelKey.upload, new UploadPanel(this.elements.uploadPanel, this));

      //--------------------------------------------------------------------------------------------------------------
      // Look for query string parameters and use them to determine which panel to display.
      //--------------------------------------------------------------------------------------------------------------

      // Set a default action.
      let action = PanelAction.displayUpload;

      // Was a job UID parameter provided?
      const urlParams = new URLSearchParams(window.location.search);
      
      // Set default state values
      this.state.fileIndex = NaN;
      this.state.sequenceIndex = NaN;

      // Was a job UID provided in the query string?
      this.state.jobUID = Utils.safeTrim(urlParams.get(ParameterKey.job));
      if (this.state.jobUID && this.state.jobUID.length > 0) {

         action = PanelAction.displayJob;

         // Were file index and sequence index parameters provided?
         let strFileIndex = Utils.safeTrim(urlParams.get(ParameterKey.file));
         let strSeqIndex = Utils.safeTrim(urlParams.get(ParameterKey.sequence));

         if (strFileIndex && strSeqIndex) {
            this.state.fileIndex = parseInt(strFileIndex);
            this.state.sequenceIndex = parseInt(strSeqIndex);

            if (!isNaN(this.state.fileIndex) && !isNaN(this.state.sequenceIndex)) {
               action = PanelAction.displayBlastHits; 
            }
         }
      }

      return await this.handleAction(action);
   }

   // If the user UID is empty, look for one in web storage or generate a new one.
   async setDefaultUserUID() {

      // Is there already a user UID in web storage?
      if (typeof(Storage) !== "undefined") { this.user.uid = localStorage.getItem(WebStorageKey.sequenceSearchUserUID); }
      if (!this.user.uid) { 

         // Generate a new user UID.
         this.user.uid = GenerateUUID(); 
   
         // If web storage is available, save the user UID in local storage.
         if (typeof(Storage) !== "undefined") { localStorage.setItem(WebStorageKey.sequenceSearchUserUID, this.user.uid); }
      }

      return;
   }

   
   // Update the window's location with a state-maintaining URL.
   async updatePage() {
      const url = this.createUrlUsingState();
      window.location.assign(url);
      return;
   }

   // Unload/hide the specified panel.
   async updatePanel(panelKey_: PanelKey, load_: boolean) {

      // Get the requested panel.
      let panel: ISeqSearchPanel = this.panels.get(panelKey_);
      if (!panel) { throw new Error(`Unhandled panel: ${panelKey_}`); }

      if (load_) { 
         await panel.load(); 
      } else {
         await panel.unload();
      }

      return;
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
      const outputFile = await SequenceSearchService.getOutputFile(this.authToken, filename_, this.state.jobUID, userUID);
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