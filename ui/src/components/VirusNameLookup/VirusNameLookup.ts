
import { AlertBuilder } from "../../helpers/AlertBuilder";
import DataTables from "datatables.net-dt";
import { IIctvResult } from "./IIctvResult";
import { ISearchResult } from "./ISearchResult";
import { VirusNameLookupService } from "../../services/VirusNameLookupService";


export class VirusNameLookup {

   dataTable;

   defaults = {
      currentMslRelease: 5,
      maxResultCount: 100
   }

   elements: {
      clearButton: HTMLButtonElement,
      container: HTMLDivElement,
      maxResultCount: HTMLInputElement,
      resultsPanel: HTMLDivElement,
      searchButton: HTMLButtonElement,
      searchText: HTMLInputElement
   }

   icons: {
      search: string,
      spinner: string
   }

   results: IIctvResult[];

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
         clearButton: null,
         container: null,
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


   // Clear the search text and panel of results.
   async clearSearch() {
      this.elements.searchText.value = "";
      this.elements.resultsPanel.innerHTML = "";
      return;
   }


   createMatchColumns(result_: ISearchResult): string {

      let matchVersion = "";
      let taxonomyDB = "";

      // Format the match version and taxonomy database/ID.
      switch (result_.taxonomyDB) {
         case "ictv_epithets":
         case "ictv_taxonomy":
            matchVersion = `MSL ${result_.versionID}`;
            taxonomyDB = "ICTV";
            break;
         case "ictv_vmr":
            taxonomyDB = "VMR";
            break;
         case "ncbi_taxonomy":
            taxonomyDB = "NCBI";
            break;
      }

      // Determine the URL of a linked match name.
      let matchURL = null;
      switch (result_.taxonomyDB) {
         case "ictv_taxonomy":
         case "ictv_epithets":
            matchURL = `https://ictv.global/taxonomy/taxondetails?taxnode_id=${result_.taxonomyID}&taxon_name=${result_.name}`;
            break;

         case "ncbi_taxonomy":
            matchURL = `https://www.ncbi.nlm.nih.gov/Taxonomy/Browser/wwwtax.cgi?mode=Info&id=${result_.taxonomyID}`;
            break;
      }

      let matchName = `<i>${result_.name}</i>`;

      // Depending on the match data, we might hyperlink the match name and the intermediate name.
      let linkedIntermediateName = null;
      let linkedMatchName = null;

      if (!result_.intermediateName) {

         // Should we hyperlink the match name?
         linkedMatchName = !matchURL ? matchName : `<a href="${matchURL}" target="_blank">${matchName}</a>`;

         linkedIntermediateName = "";

      } else {

         linkedMatchName = matchName;

         // Hyperlink the intermediate name.
         let intermediateName = `<i>${result_.intermediateName}</i>`;
         linkedIntermediateName = !matchURL ? intermediateName : `<a href="${matchURL}" target="_blank">${intermediateName}</a>`;
      }

      // Format the match rank
      const matchRank = result_.rankName.replace("_", " ");

      let displayedRank = result_.nameClass == "scientific_name" ? `${matchRank}: ` : "";

      // Format name class
      const nameClass = result_.nameClass.replace("_", " ");

      // Create the table columns.
      return `<td class="match-name">${displayedRank}${linkedMatchName}</td>
         <td class="match-name">${linkedIntermediateName}</td>
         <td>${taxonomyDB}</td>
         <td class="name-class">${nameClass}</td>
         <td>${result_.division}</td>
         <td>${matchVersion}</td>`;
   }

   async displayResults() {

      if (!Array.isArray(this.results) || this.results.length < 1) {
         this.elements.resultsPanel.innerHTML = "No results";
         return;
      }

      let html = 
         `<table class="results-table">
            <thead>
               <tr class="header-row">
                  <th class="result-th">#</th>
                  <th class="result-th">ICTV results</th>
                  <th class="match-th">Matching name</th>
                  <th class="match-th">Intermediate</th>
                  <th class="match-th">Database</th>
                  <th class="match-th">Name class</th>
                  <th class="match-th">Division</th>
                  <th class="match-th">Version</th>
               </tr>
            </thead>
            <tbody>`;

      this.results.forEach((ictvResult_: IIctvResult, index_: number) => {

         // Alternate the CSS class every row.
         let rowClass = index_ % 2 === 0 ? "odd-bg" : "even-bg";

         // If the result is not a phage or virus, use error colors.
         //if (result_.division !== "phages" && result_.division !== "viruses") { rowClass = "error-bg"; }

         //--------------------------------------------------------------------------------------------------------------------------------
         // Get the result values from the current search result.
         //--------------------------------------------------------------------------------------------------------------------------------
         
         // The (possibly) linked result name.
         let linkedResultName = "";
         let resultName = ictvResult_.name;
         if (resultName) {
            const url = `https://ictv.global/taxonomy/taxondetails?taxnode_id=${ictvResult_.taxnodeID}&taxon_name=${resultName}`;
            linkedResultName = `<a href="${url}" target="_blank">${resultName}</a>`;
         }

         // Format the result rank
         const resultRank = !ictvResult_.rankName ? "" : ictvResult_.rankName.replace("_", " ");

         // Format a non-empty result version.
         let resultVersion = !ictvResult_.mslRelease ? "" : `MSL ${ictvResult_.mslRelease}`;


         html += 
            `<tr class="${rowClass}">
               <td class="result-td" rowspan="${ictvResult_.matches.length}">${index_ + 1}</td>
               <td class="result-td" rowspan="${ictvResult_.matches.length}">${resultRank}: <i>${linkedResultName}</i> (${resultVersion})</td>`;

         let isFirst = true;

         // Iterate over all of this ICTV result's matches.
         ictvResult_.matches.forEach((match_: ISearchResult, matchIndex_: number) => {

            if (!isFirst) { html += `<tr class="${rowClass}">`; }

            isFirst = false;

            let columns = this.createMatchColumns(match_);

            html += `${columns}</tr>`;
         })
      });

      html += "</tbody></table>";

      this.elements.resultsPanel.innerHTML = html;

      return;
   }

   async initialize() {

      // Get the container Element.
      this.elements.container = document.querySelector(this.selectors.container);
      if (!this.elements.container) { return await AlertBuilder.displayError("Invalid container Element"); }

      const html = 
         `<div class="lookup-container">
            <div class="search-controls">
               <input class="search-text" type="text" placeholder="Enter a virus name" spellcheck="false" />
               <button class="search-button ictv-btn">${this.icons.search} Search</button>
               <button class="clear-button ictv-btn">Clear</button>
            </div>
            <div class="settings-panel">
               <div class="settings-title">Settings (for testing)</div>
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

      this.elements.maxResultCount = settingsPanelEl.querySelector(".max-results");
      if (!this.elements.maxResultCount ) { return await AlertBuilder.displayError("Invalid max results Element"); }

      this.elements.clearButton = this.elements.container.querySelector(".clear-button");
      if (!this.elements.clearButton) { return await AlertBuilder.displayError("Invalid clear button Element"); }

      this.elements.resultsPanel = this.elements.container.querySelector(".results-panel");
      if (!this.elements.resultsPanel) { return await AlertBuilder.displayError("Invalid results panel Element"); }

      this.elements.searchButton = this.elements.container.querySelector(".search-button");
      if (!this.elements.searchButton) { return await AlertBuilder.displayError("Invalid search button Element"); }

      this.elements.searchText = this.elements.container.querySelector(".search-text");
      if (!this.elements.searchText) { return await AlertBuilder.displayError("Invalid search text Element"); }


      // Add event handlers
      this.elements.clearButton.addEventListener("click", async () => { await this.clearSearch()});
      this.elements.searchButton.addEventListener("click", async () => { await this.search()});

      // Pressing the enter key while the focus is on the search text field is the same as clicking the search button.
      this.elements.searchText.addEventListener("keypress", async (event_) => {
         if (event_.key === "Enter") {
            event_.preventDefault();
            event_.stopPropagation();

            await this.search();
         }
         return true;
      })

      return;
   }

   // Lookup the virus name using the web service.
   async search() {

      // TODO: get this from the Drupal page!
      let currentMslRelease = 39; 

      let maxResultCount = parseInt(this.elements.maxResultCount.value)
      if (isNaN(maxResultCount)) { maxResultCount = this.defaults.maxResultCount; }

      this.elements.searchButton.disabled = true;

      // Display the spinner and "Searching...".
      this.elements.resultsPanel.innerHTML = `${this.icons.spinner} <span class="spinner-message">Searching...</span>`;

      try {
         let searchText = this.elements.searchText.value;
         if (!searchText) { throw new Error("Please enter valid search text"); }

         this.results = await VirusNameLookupService.lookupName(currentMslRelease, maxResultCount, searchText);

         console.log("in search this.results = ", this.results)
      }
      catch (error_) {
         this.elements.searchButton.disabled = false;
         return await AlertBuilder.displayError(error_);
      }

      this.elements.searchButton.disabled = false;

      // Display the search results.
      await this.displayResults();

      return;
   }

}