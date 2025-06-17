
import { AlertBuilder } from "../../helpers/AlertBuilder";
import { BlastPanel } from "./BlastPanel";
import { ButtonClass, Constants, Icon, PanelKey } from "./Common";
import { decode } from "base64-arraybuffer";
import { ISeqSearchJob } from "./ISeqSearchJob";
import { ISeqSearchPanel } from "./ISeqSearchPanel";
import { JobPanel } from "./JobPanel";
import { LookupTaxonomyRank, WebStorageKey } from "../../global/Types";

import { SequenceSearchService } from "../../services/SequenceSearchService";
import tippy from "tippy.js";
import { UploadPanel } from "./UploadPanel";
import { Utils } from "../../helpers/Utils";



export class SequenceSearch {

   authToken: string;

   config = {
      acceptedFileTypes: [".fa", ".faa", ".fas", ".fasta", ".ffn", ".fna", ".frn", ".mpfa", ".txt"],
      contactEmail: null
   }

   // The CSS selector for the container element where the Sequence Search UI will be rendered.
   containerSelector: string = null;

   // DOM elements
   elements: {
      blastContainer: HTMLElement,
      container: HTMLElement,
      jobContainer: HTMLElement,
      uploadContainer: HTMLElement
   }

   job: ISeqSearchJob = null;

   // The current job UID (optional)
   jobUID: string = null;
   
   // Which panel is currently displayed?
   panelKey: PanelKey = null;

   panels: Map<PanelKey, ISeqSearchPanel>;

   // The previous panel key
   previousPanelKey: PanelKey = null;

   // The current result index (optional)
   resultIndex: number = null;

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
      if (!email_ || email_.length < 1) { email_ = Constants.NO_EMAIL; }
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
         container: null,
         jobContainer: null,
         blastContainer: null,
         uploadContainer: null
      }

      this.panels = new Map<PanelKey, ISeqSearchPanel>();
   }

   
   /*async displayJob() {

      if (!this.job || !this.job.data || !this.job.data.results) {
         this.elements.blastContainer.innerHTML = "No results";
         return;
      }

      // Clear any existing content in the results container.
      this.elements.blastContainer.innerHTML = "";

      
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

      this.job.data.results.forEach((result_: ISearchResult, index_: number) => {

         // One-based instead of zero-based.
         const displayIndex = index_ + 1;

         // Get the result's taxon name.
         //let taxonName = result_.sseqid_lineage.species || "Unknown";

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

         //resultsHTML += resultHTML;
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
                     <div class="job-value">${this.job.data.program_name} (version ${this.job.data.version})</div>
                  </div>
                  <div class="job-row">
                     <label>Database:</label>
                     <div class="job-value">${this.job.data.database_title}</div>
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
   }*/

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

      if (!this.jobUID) {
         await AlertBuilder.displayError("No job UID provided");
         return; 
      }

      this.job = await SequenceSearchService.getSearchResult(this.authToken, this.jobUID, this.user.email, this.user.uid);
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
         `<div class=\"blast-container container\"></div>
         <div class=\"job-container container\"></div>
         <div class=\"upload-container container active\"></div>`;

      this.elements.container.innerHTML = html;

      // The BLAST container
      this.elements.blastContainer = this.elements.container.querySelector(".blast-container") as HTMLElement;
      if (!this.elements.blastContainer) { throw new Error("Invalid BLAST container Element"); }

      // The job container
      this.elements.jobContainer = this.elements.container.querySelector(".job-container") as HTMLElement;
      if (!this.elements.jobContainer) { throw new Error("Invalid job container Element"); }

      // The upload container
      this.elements.uploadContainer = this.elements.container.querySelector(".upload-container") as HTMLElement;
      if (!this.elements.uploadContainer) { throw new Error("Invalid upload container Element"); }


      // Create the panel instances.
      this.panels.set(PanelKey.blastPanel, new BlastPanel(this));
      this.panels.set(PanelKey.jobPanel, new JobPanel(this));
      this.panels.set(PanelKey.uploadPanel, new UploadPanel(this));

      // Process the query string parameters.
      this.processParameters();

      // Unload the previous panel.
      if (this.previousPanelKey) {
         // TODO
      }

      let panel: ISeqSearchPanel = null;

      switch (this.panelKey) {

         case PanelKey.blastPanel:
            // TODO
            console.log("Displaying BLAST panel");
            await this.getJob();
            break;

         case PanelKey.jobPanel:
            
            console.log("Displaying job panel");
            await this.getJob();

            // Get and validate the job panel.
            panel = this.panels.get(PanelKey.jobPanel);
            if (!panel) { throw new Error("Invalid job panel"); }

            panel.display();
            break;

         case PanelKey.uploadPanel:
            
            console.log("Displaying upload panel");

            // Get and validate the upload panel.
            panel = this.panels.get(PanelKey.uploadPanel);
            console.debug("upload panel = ", panel);
            
            if (!panel) { throw new Error("Invalid upload panel"); }
            
            panel.display();
            break;

         default:
            return await AlertBuilder.displayError(`Unhandled panel key: ${this.panelKey}`);
      }

      /*
      // If a job UID was provided as a query string parameter, retrieve the corresponding job and display it.
      if (this.jobUID !== null) { 
         await this.getJob();
         await this.displayJob();
      }*/

      return;
   }

   // Look for query string parameters and use them to determine which panel to display.
   processParameters() {

      // Was a job UID parameter provided?
      const urlParams = new URLSearchParams(window.location.search);
      
      // Set default values
      this.jobUID = null;
      this.panelKey = PanelKey.uploadPanel;
      this.resultIndex = null;

      // Was a job UID provided in the query string?
      this.jobUID = urlParams.get("job");
      if (this.jobUID) {

         // Was a result index provided in the query string?
         let strResult = Utils.safeTrim(urlParams.get("result"));
         if (strResult) {
            this.resultIndex = parseInt(strResult, 10);
            if (isNaN(this.resultIndex)) { 
               this.resultIndex = null; 
            } else {
               // If a result index was provided, display the BLAST panel.
               this.panelKey = PanelKey.blastPanel;
            }
         } else {
            // If no result index was provided, display the job panel.
            this.panelKey = PanelKey.jobPanel;
         }
      }  
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

}