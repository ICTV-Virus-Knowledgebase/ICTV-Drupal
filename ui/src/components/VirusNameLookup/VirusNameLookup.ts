
import { AlertBuilder } from "../../helpers/AlertBuilder";
import { AppSettings } from "../../global/AppSettings";
import { IIctvResult } from "./IIctvResult";
import { ISearchResult } from "./ISearchResult";
import { LookupNameClassDefinition, LookupTaxonomyRank, NameClass, SearchModifier, TaxonomyDB } from "../../global/Types";
import { VirusNameLookupService } from "../../services/VirusNameLookupService";


export class VirusNameLookup {

   currentVMR: string = AppSettings.currentVMR;

   elements: {
      clearButton: HTMLButtonElement,
      container: HTMLDivElement,
      resultsPanel: HTMLDivElement,
      searchButton: HTMLButtonElement,
      searchModifier: HTMLSelectElement,
      searchText: HTMLInputElement
   }

   icons: {
      info: string,
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
         resultsPanel: null,
         searchButton: null,
         searchModifier: null,
         searchText: null
      }

      this.icons = {
         info: `<i class="fa-solid fa-circle-info"></i>`,
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
            //case TaxonomyDB.ictv_epithets:
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
         
         // Highlight the search text in the match name.
         let matchName = this.highlightText(match_.name.trim());

         // Format the match rank
         let matchRank = !match_.rankName || match_.rankName === "no_rank" ? "" : LookupTaxonomyRank(match_.rankName);

         let displayedRank = match_.nameClass == "scientific_name" || match_.nameClass == "taxon_name" ? matchRank : "";
         if (displayedRank.length > 0) { displayedRank += ": "; }

         // Format name class
         const nameClass = match_.nameClass.replace("_", " ");

         // Should we hyperlink the match name?
         let linkedMatchName = !matchURL ? matchName : `<a href="${matchURL}" target="_blank">${matchName}</a>`;

         html += 
            `<tr class="${rowClass}">
               <td class="match-number">${matchCount}</td>
               <td class="match-name">${displayedRank}${linkedMatchName}</td>
               <td class="name-class">${nameClass}</td>
               <td class="source">${source}</td>
            </tr>`;
      })

      const s = matchCount === 1 ? "" : "s";

      html = 
         `<div class="results-count" id="invalid-matches-section">${matchCount} name${s} without a valid taxon match</div>
            <table class="invalid-results-table">
               <thead>
                  <tr class="header-row">
                     <th class="match-th">#</th>
                     <th class="match-th">Matching name</th>
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
         //case TaxonomyDB.ictv_epithets:
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
         //case TaxonomyDB.ictv_epithets:
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
      //if (result_.taxonomyDB === TaxonomyDB.ictv_epithets) { matchRank += " epithet"; }
      if (matchRank.length > 0) { matchRank += ": "; }

      let displayedRank = result_.nameClass == "scientific_name" || result_.nameClass == "taxon_name" ? matchRank : "";

      // Format the name class
      const nameClass = result_.nameClass.replace("_", " ");

      // Lookup a tooltip for the name class.
      const nameClassTip = LookupNameClassDefinition(result_.nameClass as NameClass);

      // Create the table columns.
      return `<td class="match-name">${displayedRank}${linkedMatchName}</td>
         <td class="source">${source} (<span class="has-tooltip">${nameClass} <span class="tooltip">${nameClassTip}</span></span>)</td>
         <td class="match-name">${linkedIntermediateName}</td>`;
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

      let currentReleaseText = !AppSettings.currentMslRelease ? "" : ` (MSL ${AppSettings.currentMslRelease})`;

      let html = 
         `<div class="results-count"></div>
         <table class="results-table">
            <thead>
               <tr class="header-row">
                  <th class="result-th">#</th>
                  <th class="result-th">Current ICTV Taxonomy${currentReleaseText}</th>
                  <th class="match-th">Matching name</th>
                  <th class="match-th">Source</th>
                  <th class="match-th">Intermediate name</th>
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
         const resultRank = !ictvResult_.rankName || ictvResult_.rankName === "no_rank" ? "" : `<b>${LookupTaxonomyRank(ictvResult_.rankName)}</b>`;

         // Flag abolished ICTV results.
         let resultVersion = "";
         if (!!ictvResult_.mslRelease && ictvResult_.mslRelease < this.settings.currentMslRelease) { resultVersion = " (abolished)";}

         // Format the ICTV result's lineage.
         const lineage = this.formatLineage(ictvResult_);

         html += 
            `<tr class="${rowClass}">
               <td class="result-td" rowspan="${ictvResult_.matches.length}">${ictvResultCount}</td>
               <td class="result-td" rowspan="${ictvResult_.matches.length}">${lineage}${resultRank}: <i>${linkedResultName}</i>${resultVersion}</td>`;

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

      let invalidCountHTML = "";

      if (Array.isArray(invalidMatches) && invalidMatches.length > 0) {

         // Display a table of invalid matches.
         let invalidHTML = this.createInvalidResultTable(invalidMatches);

         const invalidEl = this.elements.resultsPanel.querySelector(".invalid-matches");
         if (!invalidEl) { throw new Error("Invalid invalid matches Element"); }

         invalidEl.innerHTML = invalidHTML;

         const invalidS = invalidMatches.length === 1 ? "" : "s";
         invalidCountHTML = `, <a href="#invalid-matches-section">${invalidMatches.length} name${invalidS} without a valid taxon match</a>`;
      }

      // Populate the result count.
      const resultsCountEl = this.elements.resultsPanel.querySelector(".results-count");
      if (!resultsCountEl) { throw new Error("Invalid results count Element"); }

      const hitS = ictvResultCount === 1 ? "" : "s";
      resultsCountEl.innerHTML = `${ictvResultCount} hit${hitS} to ICTV taxa`;

      const nameS = matchCount === 1 ? "" : "s";
      resultsCountEl.innerHTML += ` (${matchCount} matching name${nameS}${invalidCountHTML})`;

      return;
   }

   // TODO: take into account the rank of the result!
   formatLineage(ictvResult_: IIctvResult) {

      let colonIndex = -1;
      let html = "";
      
      if (!!ictvResult_.family && ictvResult_.rankName != "family") {
         colonIndex = ictvResult_.family.indexOf(":");
         html += `<div class="result-lineage">Family: <i>${ictvResult_.family.slice(0, colonIndex)}</i></div>`;
      }
      if (!!ictvResult_.subfamily && ictvResult_.rankName != "subfamily") {
         colonIndex = ictvResult_.subfamily.indexOf(":");
         html += `<div class="result-lineage">Subfamily: <i>${ictvResult_.subfamily.slice(0, colonIndex)}</i></div>`;
      }
      if (!!ictvResult_.genus && ictvResult_.rankName != "genus") {
         colonIndex = ictvResult_.genus.indexOf(":");
         html += `<div class="result-lineage">Genus: <i>${ictvResult_.genus.slice(0, colonIndex)}</i></div>`;
      }
      if (!!ictvResult_.subgenus && ictvResult_.rankName != "subgenus") {
         colonIndex = ictvResult_.subgenus.indexOf(":");
         html += `<div class="result-lineage">Subgenus: <i>${ictvResult_.subgenus.slice(0, colonIndex)}</i></div>`;
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
         <div class="results-panel"></div>`;

      this.elements.container.innerHTML = html;

      // Get references to all elements.
      this.elements.clearButton = this.elements.container.querySelector(".clear-button");
      if (!this.elements.clearButton) { return await AlertBuilder.displayError("Invalid clear button Element"); }

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