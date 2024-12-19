
import { AlertBuilder } from "../../helpers/AlertBuilder";
import { AppSettings } from "../../global/AppSettings";
import DataTables from "datatables.net-dt";
import { IIctvResult } from "./IIctvResult";
import { ISearchResult } from "./ISearchResult";
import { LookupNameClassDefinition, LookupTaxonomyRank, NameClass, SearchModifier, TaxonomyDB } from "../../global/Types";
import { VirusNameLookupService } from "../../services/VirusNameLookupService";


export class VirusNameLookup {

   currentVMR: string = AppSettings.currentVMR;

   elements: {
      clearButton: HTMLButtonElement,
      container: HTMLDivElement,
      resultsCount: HTMLDivElement,
      resultsPanel: HTMLDivElement,
      searchButton: HTMLButtonElement,
      searchModifier: HTMLSelectElement,
      searchText: HTMLInputElement
   }

   icons: {
      info: string,
      lineageDelimiter: string,
      search: string,
      spinner: string
   }

   placeholderText = {
      [SearchModifier.all_words]: "Enter one or more required words",
      [SearchModifier.any_words]: "Enter one or more optional words",
      [SearchModifier.contains]: "Enter a word or part of a word",
      [SearchModifier.exact_match]: "Enter words for a match in the same order"
   }
   
   results: IIctvResult[];

   // DOM selectors
   selectors: { [key: string]: string; } = {
      container: null,
      resultsPanel: null,
      searchButton: null,
      searchModifier: null,
      searchText: null
   }

   searchText: string;

   settings = {
      currentMslRelease: NaN
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
         resultsCount: null,
         resultsPanel: null,
         searchButton: null,
         searchModifier: null,
         searchText: null
      }

      this.icons = {
         info: `<i class="fa-solid fa-circle-info"></i>`,
         lineageDelimiter: `<i class="fa-solid fa-chevron-right"></i>`,
         search: `<i class="fa-solid fa-magnifying-glass"></i>`,
         spinner: `<i class="fa fa-spinner fa-spin spinner-icon"></i>`
      }
   }


   // Clear the search text and panel of results.
   async clearSearch() {
      this.elements.searchText.value = "";
      this.elements.resultsPanel.innerHTML = "";
      this.elements.searchModifier.value = SearchModifier.exact_match;
      this.searchText = "";

      this.elements.resultsCount.innerHTML = "";
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
               matchURL = `https://ictv.global/taxonomy/taxondetails?taxnode_id=${match_.taxonomyID}&taxon_name=${match_.name}`;
               source = `ICTV: MSL ${match_.versionID}`;
               break;

            case TaxonomyDB.ncbi_taxonomy:
               matchURL = `https://www.ncbi.nlm.nih.gov/Taxonomy/Browser/wwwtax.cgi?mode=Info&id=${match_.taxonomyID}`;
               source = "NCBI";
               break;

            default:
               source = "Unknown";
               break;
         }
         
         // Highlight the search text in the match name.
         let matchName = this.highlightText(match_.name.trim());

         // Format the match rank
         let matchRank = !match_.rankName || match_.rankName === "no_rank" ? "" : LookupTaxonomyRank(match_.rankName);

         let displayedRank = match_.nameClass == "scientific_name" || match_.nameClass == "taxon_name" ? matchRank : "";
         if (displayedRank.length > 0) { displayedRank += ": "; }

         // Format name class
         const nameClass = match_.nameClass.replace("_", " ");

         // Lookup a tooltip for the name class.
         const nameClassTip = LookupNameClassDefinition(match_.nameClass as NameClass);

         // Should we hyperlink the match name?
         let linkedMatchName = !matchURL ? matchName : `<a href="${matchURL}" target="_blank">${matchName}</a>`;

         html += 
            `<tr class="${rowClass}">
               <td class="match-number">${matchCount}</td>
               <td class="match-name">${displayedRank}${linkedMatchName}</td>
               <td class="source">${source} (<span class="has-tooltip">${nameClass} <span class="tooltip">${nameClassTip}</span></span>)</td>
            </tr>`;
      })

      const s = matchCount === 1 ? "" : "s";

      html = 
         `<table class="invalid_results_table">
            <thead>
               <tr class="header-row">
                  <th class="match-th">#</th>
                  <th class="match-th">Matching name</th>
                  <th class="match-th">Source (Name type)</th>
               </tr>
            </thead>
            <tbody>${html}</tbody>
         </table>`;

      return html;
   }


   createResultMatchRows(matches_: ISearchResult[]): string {

      let html = "";

      matches_.forEach((result_: ISearchResult, index_: number) => {

         // Alternate the CSS class every row.
         let rowClass = index_ % 2 === 0 ? "odd-bg" : "even-bg";

         let source = "";

         // Format the match version and taxonomy database/ID.
         switch (result_.taxonomyDB) {
            case TaxonomyDB.ictv_taxonomy:
               source = `ICTV: MSL ${result_.versionID}`;
               break;
            case TaxonomyDB.ictv_vmr:
               source = `VMR ${this.currentVMR}`;
               break;
            case TaxonomyDB.ncbi_taxonomy:
               source = "NCBI";
               break;
         }

         // Determine the URL of a linked match name.
         let matchURL = null;
         switch (result_.taxonomyDB) {
            case TaxonomyDB.ictv_taxonomy:
               matchURL = `https://ictv.global/taxonomy/taxondetails?taxnode_id=${result_.taxonomyID}&taxon_name=${result_.name}`;
               break;

            case TaxonomyDB.ncbi_taxonomy:
               matchURL = `https://www.ncbi.nlm.nih.gov/Taxonomy/Browser/wwwtax.cgi?mode=Info&id=${result_.taxonomyID}`;
               break;
         }

         // Highlight the search text in the result name.
         let matchName = this.highlightText(result_.name.trim());

         // Depending on the match data, we might hyperlink the match name and the intermediate name.
         let linkedIntermediateName = null;
         let linkedMatchName = null;

         if (!result_.intermediateName) {

            // Should we hyperlink the match name?
            linkedMatchName = !matchURL ? matchName : `<a href="${matchURL}" target="_blank">${matchName}</a>`;

            linkedIntermediateName = "";

         } else {

            linkedMatchName = matchName;

            let intermediateRank = !result_.intermediateRank || result_.intermediateRank === "no_rank" ? "" : `${LookupTaxonomyRank(result_.intermediateRank)}: `

            // Hyperlink the intermediate name.
            let intermediateName = `<i>${result_.intermediateName}</i>`;
            linkedIntermediateName = !matchURL ? intermediateName : `${intermediateRank}<a href="${matchURL}" target="_blank">${intermediateName}</a>`;
         }

         // Format the match rank
         let matchRank = !result_.rankName || result_.rankName === "no_rank" ? "" : LookupTaxonomyRank(result_.rankName);
         if (matchRank.length > 0) { matchRank += ": "; }

         let displayedRank = result_.nameClass == "scientific_name" || result_.nameClass == "taxon_name" ? matchRank : "";

         // Format the name class
         const nameClass = result_.nameClass.replace("_", " ");

         // Lookup a tooltip for the name class.
         const nameClassTip = LookupNameClassDefinition(result_.nameClass as NameClass);

         // Add the table row to the HTML.
         html += `<tr class="${rowClass}">
            <td class="match-name">${displayedRank}${linkedMatchName}</td>
            <td class="source">${source} (<span class="has-tooltip">${nameClass} <span class="tooltip">${nameClassTip}</span></span>)</td>
            <td class="match-name">${linkedIntermediateName}</td>
         </tr>`;
      })

      return html;
   }


   createResultItem(ictvResult_: IIctvResult, index_: number, itemID_: string, parentID_: string): string {

      // https://getbootstrap.com/docs/5.3/components/accordion/

      // Format the ICTV result's lineage.
      const lineage = this.formatLineage(ictvResult_);

      // Hyperlink the result name.
      const url = `https://ictv.global/taxonomy/taxondetails?taxnode_id=${ictvResult_.taxnodeID}&taxon_name=${ictvResult_.name}`;

      let linkedResultName = `<a class="result-link .ms-auto" href="${url}" target="_blank">${ictvResult_.name}</a>`;
      
      // Format the result rank
      const resultRank = !ictvResult_.rankName || ictvResult_.rankName === "no_rank" ? "" : `<b>${LookupTaxonomyRank(ictvResult_.rankName)}</b>`;

      const matchesTitle = ictvResult_.matches.length === 1 ? "Database match: <b>1</b>" : `Database matches: <b>${ictvResult_.matches.length}</b>`;

      // Create rows for the match table.
      const matchRows = this.createResultMatchRows(ictvResult_.matches);

      // NOTE: the previous version of accordion-collapse was <div id="${itemID_}" class="accordion-collapse collapse" data-bs-parent="#${parentID_}">
      let html = 
         `<div class="accordion-item">
            <h2 class="accordion-header">
               <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#${itemID_}" aria-expanded="false" aria-controls="${itemID_}">
                  <div class="result-container">
                     <div class="result-index">#${index_}</div>
                     <div class="lineage-and-result">
                        <div class="lineage">${lineage}</div>
                        <div class="result">${resultRank}: <i>${linkedResultName}</i></div>
                     </div>
                  </div>
               </button>
            </h2>
            <div id="${itemID_}" class="accordion-collapse collapse">
               <div class="accordion-body">
                  <div class="matches-title">${matchesTitle}</div>
                  <table class="${itemID_}_table result-matches">
                     <thead>
                        <tr class="header-row">
                           <th class="name">Matching name</th>
                           <th class="source">Source (name type)</th>
                           <th class="intermediate">Intermediate taxon</th>
                        </tr>
                     </thead>
                     <tbody>${matchRows}</tbody>
                  </table>
               </div>
            </div>
         </div>`;

      return html;
   }


   // https://getbootstrap.com/docs/5.3/components/accordion/
   async displayResults() {

      if (!Array.isArray(this.results) || this.results.length < 1) {
         this.elements.resultsPanel.innerHTML = "No results";
         return;
      }

      // The number of abolished ICTV results.
      let abolishedCount = 0;

      // HTML for the abolished ICTV results.
      let abolishedHTML = ``;

      const abolishedResultsID = "abolished_ictv_results";

      // The number of valid ICTV results.
      let currentCount = 0;

      // HTML for the current ICTV results.
      let currentHTML = ``;

      const currentResultsID = "current_ictv_results";

      // HTML for the invalid matches.
      let invalidHTML = "";

      // Matches without an ICTV result.
      let invalidMatches = [];

      // A collection of item IDs (which correspond to an ICTV result).
      let itemIDs = [];

      let currentReleaseText = !AppSettings.currentMslRelease ? "" : ` (MSL ${AppSettings.currentMslRelease})`;


      // Iterate over the ICTV results.
      this.results.forEach((ictvResult_: IIctvResult) => {

         if (!ictvResult_.mslRelease) {

            // No ICTV match was found for this result's matches.
            invalidMatches = ictvResult_.matches;
            return;
         }

         // Create an ID for the result's "accordion item".
         const itemID = `${ictvResult_.rankName.toLowerCase()}_${ictvResult_.name.toLowerCase().replace(/[^A-Za-z0-9]/g, "_")}`;
         itemIDs.push(itemID);

         if (ictvResult_.mslRelease == AppSettings.currentMslRelease) {

            // Increment the number of current results.
            currentCount += 1;
            currentHTML += this.createResultItem(ictvResult_, currentCount, itemID, currentResultsID);

         } else {

            // Increment the number of abolished results.
            abolishedCount += 1;
            abolishedHTML += this.createResultItem(ictvResult_, abolishedCount, itemID, abolishedResultsID);
         }
      })

      // Create the invalid matches table.
      invalidHTML = this.createInvalidResultTable(invalidMatches);

      let countsHTML = "";
      let html = "";

      //-----------------------------------------------------------------------------------------------------------------------------
      // Current ICTV results
      //-----------------------------------------------------------------------------------------------------------------------------
      if (currentCount > 0) {

         countsHTML += `Hits to current ICTV taxa${currentReleaseText}: ${currentCount}`;

         // TODO: Add a "header row" above the accordion?
         html += `<div class="accordion" id="${currentResultsID}">${currentHTML}</div>`;
      }

      //-----------------------------------------------------------------------------------------------------------------------------
      // Abolished ICTV results
      //-----------------------------------------------------------------------------------------------------------------------------
      if (abolishedCount > 0) {

         const abolishedLinkID = "abolished-section";

         if (currentCount > 0) { countsHTML += ", "; }

         const abolishedMessage = `Hits to abolished ICTV taxa: ${abolishedCount}`;

         countsHTML += `<a href="#${abolishedLinkID}">${abolishedMessage}</a>`;

         html += `<div class="section-count" id="${abolishedLinkID}">${abolishedMessage}</div>`;

         // TODO: Add a "header row" above the accordion?
         html += `<div class="accordion" id="${abolishedResultsID}">${abolishedHTML}</div>`;
      }

      //-----------------------------------------------------------------------------------------------------------------------------
      // Matches without ICTV results
      //-----------------------------------------------------------------------------------------------------------------------------
      if (invalidMatches.length > 0) {

         const invalidLinkID = "invalid-matches-section";

         if (currentCount > 0 || abolishedCount > 0) { countsHTML += ", "; }

         const invalidS = invalidMatches.length === 1 ? "" : "s";
         const invalidMessage = `Name${invalidS} without a valid taxon match: ${invalidMatches.length}`;

         countsHTML += `<a href="#${invalidLinkID}">${invalidMessage}</a>`;

         html += `<div class="section-count" id="${invalidLinkID}">${invalidMessage}</div>`;
         html += invalidHTML;

         // Add a (table) item ID for the invalid results table.
         itemIDs.push("invalid_results");
      }

      this.elements.resultsPanel.innerHTML = html;

      // Populate the result count.
      this.elements.resultsCount.innerHTML = countsHTML;

      if (itemIDs.length < 1) { return; }

      // Create a DataTable instance for every item ID.
      // NOTE: If possible, create DataTable instances as-needed (when expanding an accordion) rather than creating all instances now.
      itemIDs.forEach((itemID_: string) => {

         // Create a DataTable instance using the table Element.
         const dataTable = new DataTables(`${this.selectors.container} table.${itemID_}_table`, {
            autoWidth: false,
            layout: {
               topStart: null,
               topEnd: null,
               bottomEnd: {
                  paging: {
                      buttons: 3
                  }
              }
            },
            order: [], // Important: If this isn't an empty array it will move the child rows to the end!
            pagingType: "simple_numbers", // simple, simple_numbers, full, full_numbers
            searching: false,
            stripeClasses: []
         });
      })

      this.elements.container.querySelectorAll(".accordion .lineage-and-result a.result-link").forEach(link => {
         link.addEventListener("click", event_ => {
            console.log("handling result-link click")
            event_.stopPropagation(); // Prevents the click event from bubbling up to the button
            return true;
         });
      });
       
   }

   // Format the lineage of the ICTV result.
   formatLineage(ictvResult_: IIctvResult) {

      let colonIndex = -1;
      let html = "";
      
      if (!!ictvResult_.family && ictvResult_.rankName != "family") {
         colonIndex = ictvResult_.family.indexOf(":");
         html += `<span class="result-lineage">Family: <i>${ictvResult_.family.slice(0, colonIndex)}</i></span>`;
      }
      if (!!ictvResult_.subfamily && ictvResult_.rankName != "subfamily") {
         colonIndex = ictvResult_.subfamily.indexOf(":");
         if (html.length > 0) { html += this.icons.lineageDelimiter; }
         html += `<span class="result-lineage">Subfamily: <i>${ictvResult_.subfamily.slice(0, colonIndex)}</i></span>`;
      }
      if (!!ictvResult_.genus && ictvResult_.rankName != "genus") {
         colonIndex = ictvResult_.genus.indexOf(":");
         if (html.length > 0) { html += this.icons.lineageDelimiter; }
         html += `<span class="result-lineage">Genus: <i>${ictvResult_.genus.slice(0, colonIndex)}</i></span>`;
      }
      if (!!ictvResult_.subgenus && ictvResult_.rankName != "subgenus") {
         colonIndex = ictvResult_.subgenus.indexOf(":");
         if (html.length > 0) { html += this.icons.lineageDelimiter; }
         html += `<span class="result-lineage">Subgenus: <i>${ictvResult_.subgenus.slice(0, colonIndex)}</i></span>`;
      }

      return html;
   }

   highlightText(name_: string): string {

      if (!name_ || name_.length < 1) { return ""; }

      const searchModifier = this.elements.searchModifier.value as SearchModifier;
      if (!searchModifier) { throw new Error("Invalid search modifier (empty)"); }

      let highlightedText = name_;

      if (searchModifier == SearchModifier.contains || searchModifier == SearchModifier.exact_match) {
         const regex = new RegExp(this.searchText, "i");
         let startIndex = name_.search(regex);
         if (startIndex > -1) {
            let replacement = highlightedText.slice(startIndex, startIndex + this.searchText.length);
            highlightedText = highlightedText.replace(regex, `<span class="highlighted-text">${replacement}</span>`);
         }

      } else {
         const searchTokens = this.searchText.split(" ");
         searchTokens.forEach((token_: string) => {
            const regex = new RegExp(`(${token_})+`, "i");
            let startIndex = highlightedText.search(regex);
            if (startIndex > -1) {
               let replacement = highlightedText.slice(startIndex, startIndex + token_.length);
               highlightedText = highlightedText.replace(regex, `<span class="highlighted-text">${replacement}</span>`);
            }
         })
      }
      
      return highlightedText;
   }

   async initialize() {

      // Get the container Element.
      this.elements.container = document.querySelector(this.selectors.container);
      if (!this.elements.container) { return await AlertBuilder.displayError("Invalid container Element"); }

      const html = 
         `<div class="lookup-container">
            <div class="search-controls">
               <select class="search-modifier">
                  <option value="${SearchModifier.exact_match}" selected>Exact match</option>
                  <option value="${SearchModifier.all_words}">All words</option>
                  <option value="${SearchModifier.any_words}">Any words</option>
                  <option value="${SearchModifier.contains}">Contains</option>
               </select>
               <input class="search-text" type="text" placeholder="${this.placeholderText[SearchModifier.exact_match]}" spellcheck="false" />
               <button class="search-button ictv-btn">${this.icons.search} Search</button>
               <button class="clear-button ictv-btn">Clear</button>
            </div>
         </div>
         <div class="results-count"></div>
         <div class="results-panel"></div>`;

      this.elements.container.innerHTML = html;

      // Get references to all elements.
      this.elements.clearButton = this.elements.container.querySelector(".clear-button");
      if (!this.elements.clearButton) { return await AlertBuilder.displayError("Invalid clear button Element"); }

      this.elements.resultsCount = this.elements.container.querySelector(".results-count");
      if (!this.elements.resultsCount) { return await AlertBuilder.displayError("Invalid results count Element"); }

      this.elements.resultsPanel = this.elements.container.querySelector(".results-panel");
      if (!this.elements.resultsPanel) { return await AlertBuilder.displayError("Invalid results panel Element"); }

      this.elements.searchButton = this.elements.container.querySelector(".search-button");
      if (!this.elements.searchButton) { return await AlertBuilder.displayError("Invalid search button Element"); }

      this.elements.searchModifier = this.elements.container.querySelector(".search-modifier");
      if (!this.elements.searchModifier) { return await AlertBuilder.displayError("Invalid search modifier Element"); }

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

      // The selected search modifier determines the search text placeholder.
      this.elements.searchModifier.addEventListener("change", async (event_) => {

         // Lookup the placeholder text for the current search modifier.
         let placeholder = this.placeholderText[this.elements.searchModifier.value as SearchModifier];

         this.elements.searchText.setAttribute("placeholder", placeholder);
         return true;
      })

      return;
   }

   // Lookup the virus name using the web service.
   async search() {

      this.searchText = this.elements.searchText.value;
      if (!this.searchText) { 
         return await AlertBuilder.displayInfo("Please enter valid search text"); 
      } else if (this.searchText.length < 3) {
         return await AlertBuilder.displayInfo("Please enter at least 3 characters");
      }

      this.elements.searchButton.disabled = true;

      const searchModifier = this.elements.searchModifier.value as SearchModifier;

      // Display the spinner and "Searching...".
      this.elements.resultsPanel.innerHTML = `${this.icons.spinner} <span class="spinner-message">Searching...</span>`;
      this.elements.resultsCount.innerHTML = "";

      try {
         this.results = await VirusNameLookupService.lookupName(this.settings.currentMslRelease, searchModifier, this.searchText);
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