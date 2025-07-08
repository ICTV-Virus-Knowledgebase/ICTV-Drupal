
import { AlertBuilder } from "../../helpers/AlertBuilder";
import { AppSettings } from "../../global/AppSettings";
import { ButtonClass, Constants, Icon, PanelKey } from "./Common";
import { decode } from "base64-arraybuffer";
import { IBlastHit } from "./IBlastHit";
import { ISeqSearchJob } from "./ISeqSearchJob";
import { ISeqSearchPanel } from "./ISeqSearchPanel";
import { SequenceSearch } from "./SequenceSearch";
import { SequenceSearchService } from "../../services/SequenceSearchService";
import { Utils } from "../../helpers/Utils";
import * as pako from "pako";


export class BlastPanel implements ISeqSearchPanel {

   // DOM elements
   elements: {
      container: HTMLElement
   }

   job: ISeqSearchJob = null;

   jobResultURL: string = null;

   // The parent page
   parent: SequenceSearch = null;


   // C-tor
   constructor(parent_: SequenceSearch) {

      if (!parent_) { throw new Error("Invalid parent parameter"); }
      this.parent = parent_;

      this.elements = {
         container: null
      }

   }


   createHitHTML(hit_: IBlastHit, hitIndex_: number): string {

      
      let sseqAccessionLink = Utils.createGenBankAccessionLink(hit_.sseqid_accession);
      
      let html = `<table class="blast-hit">
      
         <tr class="blast-row">
            <td class="blast-column" colspan="3">
               <label>Input sequence</label>
               <span class="value">${hit_.input_seq}</span>
            </td>
         </tr>

         <tr class="blast-row">
            <td class="blast-column">
               <label>Virus name(s)</label>
               <span class="value">${hit_.virus_names}</span>
            </td>
            <td class="blast-column">
               <label>Segment</label>
               <span class="value">${hit_.segmentname}</span>
            </td>
            <td class="blast-column">
               <label>Exemplar/additional</label>
               <span class="value">${hit_.exemplar_additional}</span>
            </td>
         </tr>

         <tr class="blast-row">
            <td class="blast-column" colspan="3">
               
               <span class="value">TODO: lineage</span>
            </td>
         </tr>

         <tr class="blast-row">
            <td class="blast-column">
               <label>E-value</label>
               <span class="value">${hit_.evalue}</span>
            </td>
            <td class="blast-column" colspan="2">
               <label>Bitscore</label>
               <span class="value">${hit_.bitscore}</span>
            </td>
         </tr>

         <tr class="blast-row">
            <td class="blast-column">
               <label>ICTV ID</label>
               <span class="value"><a href="${AppSettings.taxonHistoryPage}?ictv_id=${hit_.ICTV_ID}" target="_blank">${hit_.ICTV_ID}</a></span>
            </td>
            <td class="blast-column" colspan="2">
               <label>Isolate ID</label>
               <span class="value"><a href="${AppSettings.taxonHistoryPage}?vmr_id=${hit_.isolate_id}" target="_blank">${hit_.isolate_id}</a></span>
            </td>
         </tr>

         <tr class="blast-row">
            <td class="blast-column">
               <label>Start location</label>
               <span class="value">${hit_.start_loc}</span>
            </td>
            <td class="blast-column" colspan="2">
               <label>End location</label>
               <span class="value">${hit_.end_loc}</span>
            </td>
         </tr>

         <tr class="blast-row">
            <td class="blast-column">
               <label>qseqid</label>
               <span class="value">${hit_.qseqid}</span>
            </td>
            <td class="blast-column">
               <label>sseqid</label>
               <span class="value">${hit_.sseqid}</span>
            </td>
            <td class="blast-column">
               <label>sseqid accession</label>
               <span class="value">${sseqAccessionLink}</span>
            </td>
         </tr>
      
      </table>`;

      /*
      let html = `<div class="blast-hit">
      
         <div class="blast-row">
            <div class="blast-column">
               <label>Input sequence</label>
               <div class="value">${hit_.input_seq}</div>
            </div>
         </div>

         <div class="blast-row">
            <div class="blast-column">
               <label>Virus name(s)</label>
               <div class="value">${hit_.virus_names}</div>
            </div>
            <div class="blast-column">
               <label>Segment</label>
               <div class="value">${hit_.segmentname}</div>
            </div>
            <div class="blast-column">
               <label>Exemplar/additional</label>
               <div class="value">${hit_.exemplar_additional}</div>
            </div>
         </div>

         <div class="blast-row">
            <div class="blast-column">
               <label></label>
               <div class="value">TODO: lineage</div>
            </div>
         </div>

         <div class="blast-row">
            <div class="blast-column">
               <label>E-value</label>
               <div class="value">${hit_.evalue}</div>
            </div>
            <div class="blast-column">
               <label>Bitscore</label>
               <div class="value">${hit_.bitscore}</div>
            </div>
         </div>

         <div class="blast-row">
            <div class="blast-column">
               <label>ICTV ID</label>
               <div class="value"><a href="${AppSettings.taxonHistoryPage}?ictv_id=${hit_.ICTV_ID}" target="_blank">${hit_.ICTV_ID}</a></div>
            </div>
            <div class="blast-column">
               <label>Isolate ID</label>
               <div class="value"><a href="${AppSettings.taxonHistoryPage}?vmr_id=${hit_.isolate_id}" target="_blank">${hit_.isolate_id}</a></div>
            </div>
         </div>

         <div class="blast-row">
            <div class="blast-column">
               <label>Start location</label>
               <div class="value">${hit_.start_loc}</div>
            </div>
            <div class="blast-column">
               <label>End location</label>
               <div class="value">${hit_.end_loc}</div>
            </div>
         </div>

         <div class="blast-row">
            <div class="blast-column">
               <label>qseqid</label>
               <div class="value">${hit_.qseqid}</div>
            </div>
            <div class="blast-column">
               <label>sseqid</label>
               <div class="value">${hit_.sseqid}</div>
            </div>
            <div class="blast-column">
               <label>sseqid accession</label>
               <div class="value">${sseqAccessionLink}</div>
            </div>
         </div>
      
      </div>`; */

      return html;
   }

   load() {

      console.log("in blastPanel.load")
            
      console.debug("this.parent.elements.blastContainer = ", this.parent.elements.blastContainer)

      // Create a local copy of the parent's blast container Element.
      this.elements.container = this.parent.elements.blastContainer;

      // Make the container visible.
      this.elements.container.classList.add("active");

      // Make a local copy of the job data.
      this.job = this.parent.job;

      if (!this.job || !this.job) {
         this.elements.container.innerHTML = `<div class="no-results">No BLAST hits</div>`;
         return;
      }

      // Clear any existing content in the container.
      this.elements.container.innerHTML = "";

      //----------------------------------------------------------------------------------------------------------------
      // Create the URL that can be used to view this job result.
      //----------------------------------------------------------------------------------------------------------------
      this.jobResultURL = window.location.href;

      // TODO: Get rid of this line soon!!!
      this.jobResultURL = this.jobResultURL.replace("://ictv.global", "://test.ictv.global");

      // Remove any existing query string parameters.
      let qIndex = this.jobResultURL.indexOf("?");
      if (qIndex > -1) { this.jobResultURL = this.jobResultURL.substring(0, qIndex); }

      this.jobResultURL += `?job=${this.job.uid}&result=${this.parent.state.resultIndex}`;

      console.debug(`this.jobResultURL = ${this.jobResultURL}`)

      //----------------------------------------------------------------------------------------------------------------
      // Generate HTML for the hits.
      //----------------------------------------------------------------------------------------------------------------
      let hitsHTML = "";

      const result = this.parent.job.data.results[this.parent.state.resultIndex];
      console.debug("result = ", result)
      
      if (Array.isArray(result.hits) && result.hits.length > 0) {

         result.hits.forEach((hit_: IBlastHit, hitIndex_: number) => {
            hitsHTML += this.createHitHTML(hit_, hitIndex_);
         })

      } else {
         hitsHTML = `<div class="no-results">No results</div>`;
      }

      //----------------------------------------------------------------------------------------------------------------
      // Generate the HTML for the job
      //----------------------------------------------------------------------------------------------------------------
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
                     <div class="job-value">${this.job.data.database_name}</div>
                  </div>
               </div>
               <div class="link-panel">
                  <div class="instructions">You can view these results again using the following URL:</div>
                  <div class="controls">
                     <a href="${this.jobResultURL}" target="_blank">${this.jobResultURL}</a> 
                     <button class="btn ${ButtonClass.copyURL}">${Icon.copy} Copy to clipboard</button>
                  </div>
               </div>
            </div>
            <hr />
            <div class="blast-hits-title">BLAST hits</div>
            <div class="hits">${hitsHTML}</div>
         </div>`;

      this.elements.container.innerHTML = html;
   }

   async handleResultsClick(event_) {

      if (event_.target.tagName !== "BUTTON") { return; }

      const button = event_.target as HTMLButtonElement;

      // Get and validate the button's data index attribute.
      let strDataIndex = button.getAttribute("data-index");
      const dataIndex = parseInt(strDataIndex);
      if (dataIndex < 0 || dataIndex > this.parent.job.data.results.length) {
         await AlertBuilder.displayError(`Invalid result index: ${dataIndex}`);
         return;
      }

      console.debug(button)

      // The button's class determines which action to take.
      /*if (button.classList.contains(ButtonClass.copyURL)) {
         await this.copyJobURL();

      } else if (button.classList.contains(ButtonClass.downloadCSV)) {
         await this.downloadCSV(dataIndex);

      } else if (button.classList.contains(ButtonClass.viewHTML)) {
         await this.viewHTML(dataIndex);
      } */
     
      return;
   }

   unload() {


   }

   // Display the BLAST HTML data for a specific result.
   async viewHTML(index_: number) {

      // Get the result with the specified index.
      const result = this.parent.job.data.results[index_];

      // Open a new tab/window and populate it with the contents of the BLAST HTML file.
      const blastWindow = window.open("", "_blank");

      // Decode the base64-encoded HTML file and decompress it.
      const html = pako.inflate(decode(result.html_file), { to: 'string' });
      blastWindow.document.writeln(html);

      // Remove the extension from the file name and use it as the window's title.
      blastWindow.document.title = result.blast_html.replace(".html", "");

      return;
   }

}