
import { ButtonClass, Constants, FormatDate, FormatDuration, Icon, PanelKey, ParameterKey } from "../Common";
import DataTables from "datatables.net-dt";
import { ISeqSearchJob } from "../ISeqSearchJob";
import { ISeqSearchPanel } from "./ISeqSearchPanel";
import { DateTime } from "luxon";
import { SequenceSearch } from "../SequenceSearch";
import { SequenceSearchService } from "../../../services/SequenceSearchService";
import tippy from "tippy.js";
import { Utils } from "../../../helpers/Utils";


export class JobHistoryPanel implements ISeqSearchPanel {
   
   // DOM elements
   elements: {
      clearButton: HTMLButtonElement,
      container: HTMLElement,
      jobsPanel: HTMLElement,
      searchButton: HTMLButtonElement,
      searchText: HTMLInputElement
   }

   // Is the panel currently active/displayed?
   isActive: boolean;

   jobs: ISeqSearchJob[] = null;

   // The parent page
   parent: SequenceSearch = null;



   // C-tor
   constructor(containerEl_: HTMLElement, parent_: SequenceSearch) {

      if (!containerEl_) { throw new Error("Invalid container element"); }

      if (!parent_) { throw new Error("Invalid parent parameter"); }
      this.parent = parent_;

      this.elements = {
         clearButton: null,
         container: containerEl_,
         jobsPanel: null,
         searchButton: null,
         searchText: null
      }
   }


   // TODO
   async clearSearch() {
      console.log("TODO: clear search")
      return;
   }

   // Create a link to a job details page.
   createJobLink(jobUID_: string) {

      // The current URL
      let url = window.location.href;

      // Remove any existing query string parameters.
      let qIndex = url.indexOf("?");
      if (qIndex > -1) { url = url.substring(0, qIndex); }

      return `${url}?${ParameterKey.job}=${jobUID_}`;
   }

   // Create a table row for a job.
   createJobRow(job_: ISeqSearchJob, index_: number): string {

      // Alternate the CSS class every row.
      const rowClass = index_ % 2 === 0 ? "odd" : "even";

      let createdOn = "";

      // Move from UTC 0 to -5
      if (!!job_.createdOn) { createdOn = DateTime.fromISO(job_.createdOn.replace(" ", "T")).minus({hours: 5}).toFormat("F"); }
      // FormatDate

      let jobURL = this.createJobLink(job_.uid);

      return `<tr class="${rowClass}">
         <td class="name"><a href="${jobURL}" target="_blank">${job_.name}</a></td>
         <td class="created-on">${createdOn}</td>
         <td class="status">${job_.status}</td>
      </tr>`;
   }


   // Load the panel contents and display them on the page.
   async load() {

      this.isActive = true;

      // Make the container visible.
      this.elements.container.classList.add("active");

      // Clear any existing content in the container.
      this.elements.container.innerHTML = "";

      //----------------------------------------------------------------------------------------------------------------
      // Generate the HTML for the job history
      //----------------------------------------------------------------------------------------------------------------
      let html = 
         `<div class="panel-title">Job History</div>
         <button class="test-button">Test zip download</button>
         <div class="search-controls">
               <input class="search-text" type="text" placeholder="Enter search text (optional)" spellcheck="false" />
               <button class="search-button ictv-btn">${Icon.search} Search</button>
               <button class="clear-button ictv-btn">Clear</button>
         </div>
         <div class="jobs-panel"></div>`;

      this.elements.container.innerHTML = html;


      // Get references to the DOM elements.

      this.elements.clearButton = this.elements.container.querySelector(".clear-button");
      if (!this.elements.clearButton) { throw new Error(`Invalid clear button DOM element`); }

      this.elements.jobsPanel = this.elements.container.querySelector(".jobs-panel");
      if (!this.elements.jobsPanel) { throw new Error(`Invalid jobs panel DOM element`); }

      this.elements.searchButton = this.elements.container.querySelector(".search-button");
      if (!this.elements.searchButton) { throw new Error(`Invalid search button DOM element`); }

      this.elements.searchText = this.elements.container.querySelector(".search-text");
      if (!this.elements.searchText) { throw new Error(`Invalid search text DOM element`); }


      this.elements.clearButton.addEventListener("click", async (event_) => {
         return await this.clearSearch();
      })

      this.elements.searchButton.addEventListener("click", async (event_) => {
         return await this.search();
      })


      const testButton = this.elements.container.querySelector(".test-button");
      if (!testButton) { throw new Error("Invalid test button"); }

      testButton.addEventListener("click", async (event_) => {
   
         const filename = "TaxaBLAST_6329ac558aa411f0940c1273ccd16f87.zip";
         const testResult = await SequenceSearchService.downloadFile(this.parent.authToken, filename, "6329ac558aa411f0940c1273ccd16f87");
         //console.log("testResult = ", testResult)

         let file = new Blob([testResult]);
         console.log("file size = ", file.size)

         // Associate the ArrayBuffer with a Blob, create a download link, and trigger the download.
         const link = document.createElement('a')
         link.href = URL.createObjectURL(new Blob(
            [ testResult ],
            { type: 'application/zip' }
         ))
         link.download = filename;
         link.click();
      })


      // Initialize tippy tooltips for buttons.
      tippy(".has-tooltip");
      return;
    }

    async search() {

        const searchText = Utils.safeTrim(this.elements.searchText.value);
        console.log("TODO: searching for ", searchText)

        this.jobs = await SequenceSearchService.searchJobs(this.parent.authToken, searchText, this.parent.user.uid);

        if (!Array.isArray(this.jobs) || this.jobs.length < 1) {
            this.elements.jobsPanel.innerHTML = `<div class="no-data">You have no submitted jobs</div>`;
            return;
        }

        let rowsHTML = "";

        this.jobs.forEach((job_: ISeqSearchJob, index_: number) => {
            rowsHTML += this.createJobRow(job_, index_);
        })

        this.elements.jobsPanel.innerHTML = `<table class="jobs">
            <thead>
                <tr class="header-row">
                    <th>Job name</th>
                    <th>Created on</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody>${rowsHTML}</tbody>
        </table>`;

        new DataTables(`.jobs-panel table.jobs`, {
            autoWidth: false,
            columnDefs: [
               { width: "160px", targets: 0},
               { width: "100px", targets: 1},
               { width: "80px", targets: 2}
            ],
            info: true,
            layout: {
               //bottomEnd: true
            },
            ordering: true,
            paging: true,
            searching: false
         });

        return; 
    }

    unload() {
        this.isActive = false;
        this.elements.container.classList.remove("active");

        // TODO: should we remove event listeners?
    }
}