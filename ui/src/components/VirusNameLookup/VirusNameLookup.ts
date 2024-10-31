
import { AlertBuilder } from "../../helpers/AlertBuilder";
import DataTables from "datatables.net-dt";
import { ISearchResult } from "./ISearchResult";
import { VirusNameLookupService } from "../../services/VirusNameLookupService";


export class VirusNameLookup {

   dataTable;

   defaults = {
      maxCountDiff: 5,
      maxLengthDiff: 5,
      maxResultCount: 100
   }

   elements: {
      container: HTMLDivElement,
      maxCountDiff: HTMLInputElement,
      maxLengthDiff: HTMLInputElement,
      maxResultCount: HTMLInputElement,
      resultsPanel: HTMLDivElement,
      searchButton: HTMLButtonElement,
      searchText: HTMLInputElement
   }

   icons: {
      search: string,
      spinner: string
   }

   results: ISearchResult[];

   // DOM selectors
   selectors: { [key: string]: string; } = {
      container: null,
      resultsPanel: null,
      searchButton: null,
      searchText: null
   }

   settings = {
      defaultRowsPerPage: 50
   }

   // C-tor
   constructor(containerSelector_: string) {

      if (!containerSelector_) { throw new Error("Invalid container selector"); }

      this.selectors.container = containerSelector_;

      this.elements = {
         container: null,
         maxCountDiff: null,
         maxLengthDiff: null,
         maxResultCount: null,
         resultsPanel: null,
         searchButton: null,
         searchText: null
      }

      this.icons = {
         search: `<i class="fa-solid fa-magnifying-glass"></i>`,
         spinner: `<i class="fa fa-spinner fa-spin spinner-icon"></i>`
      }
   }


   async displayResults() {

      if (!Array.isArray(this.results) || !this.results || this.results.length < 1) {
         this.elements.resultsPanel.innerHTML = "No results";
         return;
      }

      let html = 
         `<table class="results-table">
            <thead>
               <tr class="header-row">
                  <th>Name</th>
                  <th>Rank</th>
                  <th>Tax DB/ID</th>
                  <th>Count diff</th>
                  <th>Division</th>
                  <th>Exact match</th>
                  <th>Is valid</th>
                  <th>Length diff</th>
                  <th>Name class</th>
                  <th>Name class score</th>
                  <th>Pair count</th>
                  <th>Rank score</th>
                  <th>Score</th>
                  <th>Version</th>
               </tr>
            </thead>
            <tbody>`;

      this.results.forEach((result_: ISearchResult, index_: number) => {

         // Alternate the CSS class every row.
         const rowClass = index_ % 2 === 0 ? "odd-bg" : "even-bg";

         let taxDbID = "";

         switch (result_.taxonomyDB) {
            case "ictv_taxonomy":
               taxDbID = "ICTV";
               break;
            case "ictv_vmr":
               taxDbID = "VMR";
               break;
            case "ncbi_taxonomy":
               taxDbID = "NCBI";
               break;
            default: taxDbID = "??? "
         }

         const nameClass = result_.nameClass.replace("_", " ");

         let row = `<tr class="${rowClass}">
            <td>${result_.name}</td>
            <td>${result_.rankName}</td>
            <td>${taxDbID} ${result_.taxonomyID}</td>
            <td>${result_.countDifferences}</td>
            <td>${result_.division}</td>
            <td>${result_.isExactMatch}</td>
            <td>${result_.isValid}</td>
            <td>${result_.lengthDifference}</td>
            <td>${nameClass}</td>
            <td>${result_.nameClassScore}</td>
            <td>${result_.orderedPairCount}</td>
            <td>${result_.rankScore}</td>
            <td>${result_.score}</td>
            <td>${result_.versionID}</td>
         </tr>`;

         html += row;
      });

      html += "</tbody></table>";

      this.elements.resultsPanel.innerHTML = html;

      if (!!this.dataTable) { this.dataTable = null; /* TODO: destroy? */ }

      console.log("this = ", this)

      // Create a DataTable instance using the table Element.
      this.dataTable = new DataTables(`${this.selectors.container} table.results-table`, {
         /*columnDefs: [
               { targets: [0,1], orderable: false },
               { target: 2, orderable: true, type: "date" },
               { targets: [3,4,5,6], orderable: true }
         ],*/
         dom: "ltip",
         order: [], // Important: If this isn't an empty array it will move the child rows to the end!
         pageLength: this.settings.defaultRowsPerPage,
         searching: false,
         stripeClasses: []
      });

      return;
   }

   async initialize() {

      // Get the container Element.
      this.elements.container = document.querySelector(this.selectors.container);
      if (!this.elements.container) { return await AlertBuilder.displayError("Invalid container Element"); }

      const html = 
         `<div class="lookup-container">
            <div class="search-controls">
               <input class="search-text" type="text" placeholder="Enter a virus name" />
               <button class="search-button">${this.icons.search} Search</button>
            </div>
            <div class="settings-panel">
               <div class="settings-title">Settings (for testing)</div>
               <div class="settings-row">
                  <label>Max character diff</label>
                  <input class="max-count-diff" type="number" min="0" value="${this.defaults.maxCountDiff}" />
               </div>
               <div class="settings-row">
                  <label>Max length diff</label>
                  <input class="max-length-diff" type="number" min="0" value="${this.defaults.maxLengthDiff}" />
               </div>
               <div class="settings-row">
                  <label>Max results</label>
                  <input class="max-results" type="number" min="0" value="${this.defaults.maxResultCount}" />
               </div>
            </div>
         </div>
         <div class="results-panel"></div>`;

      this.elements.container.innerHTML = html;

      // Get references to all elements.
      const settingsPanelEl = this.elements.container.querySelector(".settings-panel");
      if (!settingsPanelEl) { return await AlertBuilder.displayError("Invalid settings panel Element"); }

      this.elements.maxCountDiff = settingsPanelEl.querySelector(".max-count-diff");
      if (!this.elements.maxCountDiff) { return await AlertBuilder.displayError("Invalid max count diff Element"); }

      this.elements.maxLengthDiff = settingsPanelEl.querySelector(".max-length-diff");
      if (!this.elements.maxLengthDiff) { return await AlertBuilder.displayError("Invalid max length diff Element"); }

      this.elements.maxResultCount = settingsPanelEl.querySelector(".max-results");
      if (!this.elements.maxResultCount ) { return await AlertBuilder.displayError("Invalid max results Element"); }

      this.elements.resultsPanel = this.elements.container.querySelector(".results-panel");
      if (!this.elements.resultsPanel) { return await AlertBuilder.displayError("Invalid results panel Element"); }

      this.elements.searchButton = this.elements.container.querySelector(".search-button");
      if (!this.elements.searchButton) { return await AlertBuilder.displayError("Invalid search button Element"); }

      this.elements.searchText = this.elements.container.querySelector(".search-text");
      if (!this.elements.searchText) { return await AlertBuilder.displayError("Invalid search text Element"); }


      // Add event handlers
      this.elements.searchButton.addEventListener("click", async () => { await this.search()});

      return;
   }

   // Lookup the virus name using the web service.
   async search() {

      let maxCountDiff = parseInt(this.elements.maxCountDiff.value);
      if (isNaN(maxCountDiff)) { maxCountDiff = this.defaults.maxCountDiff; }

      let maxLengthDiff = parseInt(this.elements.maxLengthDiff.value);
      if (isNaN(maxLengthDiff)) { maxLengthDiff = this.defaults.maxLengthDiff; }

      let maxResultCount = parseInt(this.elements.maxResultCount.value)
      if (isNaN(maxResultCount)) { maxResultCount = this.defaults.maxResultCount; }

      this.elements.searchButton.disabled = true;

      this.elements.resultsPanel.innerHTML = `${this.icons.spinner} <span class="spinner-message">Searching...</span>`;

      try {
         let searchText = this.elements.searchText.value;
         if (!searchText) { throw new Error("Please enter valid search text"); }

         this.results = await VirusNameLookupService.lookupName(maxCountDiff, maxLengthDiff, maxResultCount, searchText);
      }
      catch (error_) {
         this.elements.searchButton.disabled = false;
         return await AlertBuilder.displayError(error_);
      }

      this.elements.searchButton.disabled = false;

      await this.displayResults();

      return;
   }

}