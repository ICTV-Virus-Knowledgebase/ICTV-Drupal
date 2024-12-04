
import { AlertBuilder } from "../../helpers/AlertBuilder";
import { AppSettings } from "../../global/AppSettings";
import { IIctvResult } from "./IIctvResult";
import { ISearchResult } from "./ISearchResult";
import { TaxonomyDB } from "../../global/Types";
import { VirusNameLookupService } from "../../services/VirusNameLookupService";


export class VirusNameLookup {

   elements: {
      clearButton: HTMLButtonElement,
      container: HTMLDivElement,
      maxResults: HTMLSelectElement,
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
      currentMslRelease: NaN,
      defaultRowsPerPage: 100,
      maxResultCount: 100
   }

   // C-tor
   constructor(containerSelector_: string) {

      if (!containerSelector_) { throw new Error("Invalid container selector in VirusNameLookup"); }
      this.selectors.container = containerSelector_;

      // Use the current MSL release from the AppSettings.
      this.settings.currentMslRelease = AppSettings.currentMslRelease;

      this.elements = {
         clearButton: null,
         container: null,
         maxResults: null,
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


   createInvalidResultTable(matches_: ISearchResult[]) {

      if (!Array.isArray(matches_)) { return ""; }

      let html = "";
         
      let matchCount = 0;

      matches_.forEach((match_: ISearchResult, index_: number) => {

         // Alternate the CSS class every row.
         let rowClass = index_ % 2 === 0 ? "odd-bg" : "even-bg";

         matchCount += 1;

         let matchURL = null;
         let source = "";

         // Format the source and determine the URL of a linked match name.
         switch (match_.taxonomyDB) {
            case TaxonomyDB.ictv_taxonomy:
            case TaxonomyDB.ictv_epithets:
               matchURL = `https://ictv.global/taxonomy/taxondetails?taxnode_id=${match_.taxonomyID}&taxon_name=${match_.name}`;
               source = "ICTV";
               break;

            case TaxonomyDB.ncbi_taxonomy:
               matchURL = `https://www.ncbi.nlm.nih.gov/Taxonomy/Browser/wwwtax.cgi?mode=Info&id=${match_.taxonomyID}`;
               source = "NCBI";
               break;
            default:
               source = "Unknown";

               console.log("unknown match = ", match_)

               break;
         }
         
         let matchName = `<i>${match_.name}</i>`;

         // Format the match rank
         let matchRank = match_.rankName.replace("_", " ");

         let displayedRank = match_.nameClass == "scientific_name" || match_.nameClass == "taxon_name" ? `${matchRank}: ` : "";

         // Format name class
         const nameClass = match_.nameClass.replace("_", " ");

         // Should we hyperlink the match name?
         let linkedMatchName = !matchURL ? matchName : `<a href="${matchURL}" target="_blank">${matchName}</a>`;

         html += 
            `<tr class="${rowClass}">
               <td class="match-number">${matchCount}</td>
               <td class="match-name">${displayedRank}${linkedMatchName}</td>
               <td class="match-name">${match_.division}</td>
               <td class="name-class">${nameClass}</td>
               <td class="source">${source}</td>
            </tr>`;
      })

      const es = matchCount === 1 ? "" : "es";

      html = 
         `<div class="results-count">${matchCount} match${es} without an ICTV result</div>
            <table class="invalid-results-table">
               <thead>
                  <tr class="header-row">
                     <th class="match-th">#</th>
                     <th class="match-th">Matching name</th>
                     <th class="match-th">Organism type</th>
                     <th class="match-th">Name type</th>
                     <th class="match-th">Source</th>
                  </tr>
               </thead>
               <tbody>${html}</tbody>
            </table>`;

      return html;
   }

   createMatchColumns(result_: ISearchResult): string {

      let source = "";

      // Format the match version and taxonomy database/ID.
      switch (result_.taxonomyDB) {
         case TaxonomyDB.ictv_epithets:
         case TaxonomyDB.ictv_taxonomy:
            source = `ICTV (MSL ${result_.versionID})`;
            break;
         case TaxonomyDB.ictv_vmr:
            source = "VMR";
            break;
         case TaxonomyDB.ncbi_taxonomy:
            source = "NCBI";
            break;
      }

      // Determine the URL of a linked match name.
      let matchURL = null;
      switch (result_.taxonomyDB) {
         case TaxonomyDB.ictv_taxonomy:
         case TaxonomyDB.ictv_epithets:
            matchURL = `https://ictv.global/taxonomy/taxondetails?taxnode_id=${result_.taxonomyID}&taxon_name=${result_.name}`;
            break;

         case TaxonomyDB.ncbi_taxonomy:
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

         let intermediateRank = !result_.intermediateRank ? "" : `${result_.intermediateRank}: `

         // Hyperlink the intermediate name.
         let intermediateName = `<i>${result_.intermediateName}</i>`;
         linkedIntermediateName = !matchURL ? intermediateName : `${intermediateRank}<a href="${matchURL}" target="_blank">${intermediateName}</a>`;
      }

      // Format the match rank
      let matchRank = result_.rankName.replace("_", " ");
      if (result_.taxonomyDB === TaxonomyDB.ictv_epithets) { matchRank += " epithet"; }

      let displayedRank = result_.nameClass == "scientific_name" || result_.nameClass == "taxon_name" ? `${matchRank}: ` : "";

      // Format name class
      const nameClass = result_.nameClass.replace("_", " ");

      // Create the table columns.
      return `<td class="match-name">${displayedRank}${linkedMatchName}</td>
         <td class="match-name">${linkedIntermediateName}</td>
         <td class="name-class">${nameClass}</td>
         <td class="source">${source}</td>`;
   }

   async displayResults() {

      if (!Array.isArray(this.results) || this.results.length < 1) {
         this.elements.resultsPanel.innerHTML = "No results";
         return;
      }

      // Matches without an ICTV result.
      let invalidMatches = [];

      // The number of valid ICTV results.
      let ictvResultCount = 0;

      // The number of matches associated with the valid ICTV results.
      let matchCount = 0;

      let html = 
         `<div class="results-count"></div>
         <table class="results-table">
            <thead>
               <tr class="header-row">
                  <th class="result-th">#</th>
                  <th class="result-th">Current ICTV Taxonomy</th>
                  <th class="match-th">Matching name</th>
                  <th class="match-th">Associated name</th>
                  <th class="match-th">Name type</th>
                  <th class="match-th">Source</th>
               </tr>
            </thead>
            <tbody>`;

      this.results.forEach((ictvResult_: IIctvResult, index_: number) => {

         if (!ictvResult_.mslRelease) {

            // No ICTV match was found for this result's matches.
            invalidMatches = ictvResult_.matches;
            return;
         }

         // Alternate the CSS class every row.
         let rowClass = index_ % 2 === 0 ? "odd-bg" : "even-bg";

         ictvResultCount += 1;
         matchCount += ictvResult_.matches.length;

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

         // Flag abolished ICTV results.
         let resultVersion = "";
         if (!!ictvResult_.mslRelease && ictvResult_.mslRelease < this.settings.currentMslRelease) { resultVersion = " (abolished)";}

         html += 
            `<tr class="${rowClass}">
               <td class="result-td" rowspan="${ictvResult_.matches.length}">${ictvResultCount}</td>
               <td class="result-td" rowspan="${ictvResult_.matches.length}">${resultRank}: <i>${linkedResultName}</i>${resultVersion}</td>`;

         let isFirst = true;

         // Iterate over all of this ICTV result's matches.
         ictvResult_.matches.forEach((match_: ISearchResult) => {

            if (!isFirst) { html += `<tr class="${rowClass}">`; }

            isFirst = false;

            let columns = this.createMatchColumns(match_);

            html += `${columns}</tr>`;
         })
      });

      html += `</tbody>
         </table>
         <div class="invalid-matches"></div>`;

      this.elements.resultsPanel.innerHTML = html;

      // Populate the result count.
      const resultsCountEl = this.elements.resultsPanel.querySelector(".results-count");
      if (!resultsCountEl) { throw new Error("Invalid results count Element"); }

      const s = ictvResultCount === 1 ? "" : "s";
      resultsCountEl.innerHTML = `${ictvResultCount} ICTV result${s}`;

      const es = matchCount === 1 ? "" : "es";
      resultsCountEl.innerHTML += ` (${matchCount} match${es})`;

      if (Array.isArray(invalidMatches) && invalidMatches.length > 0) {

         // Display a table of invalid matches.
         let invalidHTML = this.createInvalidResultTable(invalidMatches);

         const invalidEl = this.elements.resultsPanel.querySelector(".invalid-matches");
         if (!invalidEl) { throw new Error("Invalid invalid matches Element"); }

         invalidEl.innerHTML = invalidHTML;
      }

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

               <label class="max-results-label">Max results</label>
               <select class="max-results">
                  <option value="50">50</option>
                  <option value="100" selected>100</option>
                  <option value="500">500</option>
                  <option value="1000">1000</option>
               </select>
            </div>
         </div>
         <div class="results-panel"></div>`;

      this.elements.container.innerHTML = html;

      // Get references to all elements.
      this.elements.clearButton = this.elements.container.querySelector(".clear-button");
      if (!this.elements.clearButton) { return await AlertBuilder.displayError("Invalid clear button Element"); }

      this.elements.maxResults = this.elements.container.querySelector(".max-results");
      if (!this.elements.maxResults) { return await AlertBuilder.displayError("Invalid max results Element"); }

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

      this.elements.searchButton.disabled = true;

      const maxResults = parseInt(this.elements.maxResults.value);

      // Display the spinner and "Searching...".
      this.elements.resultsPanel.innerHTML = `${this.icons.spinner} <span class="spinner-message">Searching...</span>`;

      try {
         let searchText = this.elements.searchText.value;
         if (!searchText) { throw new Error("Please enter valid search text"); }

         this.results = await VirusNameLookupService.lookupName(this.settings.currentMslRelease, maxResults, searchText);
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