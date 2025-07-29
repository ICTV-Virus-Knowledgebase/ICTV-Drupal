
import { AlertBuilder } from "../../helpers/AlertBuilder";
import { BlastHitsPanel } from "./panels/BlastHitsPanel";
import { Constants, GenerateUUID, PanelAction, PanelKey, ParameterKey, ResultFileType, testJob } from "./Common";
import { decode } from "base64-arraybuffer";
import { IResultFiles } from "./IResultFiles";
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
      uid: string
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
         uid: userUID_
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
   async downloadCSV(filename_: string, seqIndex_: number) {

      // Specify the file type to retrieve.
      const fileTypes = ResultFileType.csv;

      const resultFiles = await SequenceSearchService.getResultFiles(this.authToken, fileTypes, filename_, this.state.jobUID, seqIndex_, this.user.email, this.user.uid);
      console.log("resultFiles = ", resultFiles)
      
      if (!resultFiles || !resultFiles.files || resultFiles.files.length < 1) {
         return await AlertBuilder.displayError("No CSV files are available for download");
      }

      // Get the CSV file contents.
      const csv = Utils.safeTrim(this.getResultFileContents(resultFiles, ResultFileType.csv));
      if (!csv || csv.length < 1) { return await AlertBuilder.displayError("The CSV file is empty or invalid"); }

      // Decode the base64-encoded CSV file and decompress it.
      const arrayBuffer: ArrayBuffer = decode(csv); // pako.inflate(decode(csv));
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
      link.download = csv;
      link.click();

      return;
   }

   // Retrieve the job with this UID.
   async getJob() {

      if (!this.state.jobUID) { return await AlertBuilder.displayError("No job UID provided"); }

      // Get the job data from the server.
      this.job = await SequenceSearchService.getSearchResults(this.authToken, this.state.jobUID, this.user.email, this.user.uid);

      return;
   }

   // Get the specified file type's content from the result files.
   getResultFileContents(files_: IResultFiles, type_: ResultFileType): string {

      let contents = "";

      for (let i = 0; i < files_.files.length; i++) {
         const file = files_.files[i];
         if (file.type === type_) { 
            contents = file.contents;
            if (file.isCompressed) {
               // Decompress the file contents.
               contents = pako.ungzip(decode(contents), { to: 'string' });
               //pako.inflate(decode(contents), { to: 'string' });
            }
            break; 
         }
      }

      return contents;
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

   // Display the BLAST HTML data for a specific result.
   async viewHTML(fileIndex_: number, filename_: string, seqIndex_: number) {

      // Specify the file type to retrieve.
      const fileTypes = ResultFileType.html;

      // Get the HTML result file.
      const resultFiles = await SequenceSearchService.getResultFiles(this.authToken, fileTypes, filename_, this.state.jobUID, seqIndex_, this.user.email, this.user.uid);
      if (!resultFiles || !resultFiles.files || resultFiles.files.length < 1) {
         return await AlertBuilder.displayError("No HTML files are available for download");
      }

      const htmlContent = Utils.safeTrim(this.getResultFileContents(resultFiles, ResultFileType.html));
      if (!htmlContent || htmlContent.length < 1) {
         return await AlertBuilder.displayError("The HTML file is empty or invalid");
      }

      // Open a new tab/window and populate it with the contents of the BLAST HTML file.
      const blastWindow = window.open("", "_blank");

      // Decode the base64-encoded HTML file and decompress it.
      const html = htmlContent; //pako.inflate(decode(htmlContent), { to: 'string' });
      blastWindow.document.writeln(html);

      // Use the input filename as the window's title.
      blastWindow.document.title = this.job.data.files[fileIndex_].name;

      return;
   }
}