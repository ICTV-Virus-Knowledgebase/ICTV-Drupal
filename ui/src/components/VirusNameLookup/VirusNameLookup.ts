
import { AlertBuilder } from "../../helpers/AlertBuilder";
import { AppSettings } from "../../global/AppSettings";
import DataTables from "datatables.net-dt";
import { IIctvResult } from "./IIctvResult";
import { ISearchResult } from "./ISearchResult";
import { LookupNameClass, LookupNameClassDefinition, LookupTaxonomyRank, NameClass, SearchModifier, TaxonomyDB } from "../../global/Types";
import { VirusNameLookupService } from "../../services/VirusNameLookupService";

enum ResultType {
   abolished = "abolished",
   current = "current",
   invalid = "invalid"
}


export class VirusNameLookup {

   // The DOM selector of the module's container Element.
   containerSelector: string = null;

   currentVMR: string = AppSettings.currentVMR;

   elements: {
      abolishedTabButton: HTMLElement,
      abolishedTabCount: HTMLElement,
      abolishedTabPanel: HTMLElement,
      clearButton: HTMLButtonElement,
      container: HTMLDivElement,
      currentTabButton: HTMLElement,
      currentTabCount: HTMLElement,
      currentTabPanel: HTMLElement,
      invalidTabButton: HTMLElement,
      invalidTabCount: HTMLElement,
      invalidTabPanel: HTMLElement,
      resultsCount: HTMLElement,
      resultsPanel: HTMLElement,
      searchButton: HTMLButtonElement,
      searchModifier: HTMLSelectElement,
      searchText: HTMLInputElement,
      spinnerPanel: HTMLElement,
      tabButtons: HTMLElement,
      tabPanels: HTMLElement
   }

   // The URL of the Find the Species page (used by the minimal component).
   findTheSpeciesURL: string;

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

   searchText: string;

   settings = {
      currentMslRelease: NaN,
      pageSize: 10
   }

   // C-tor
   constructor(containerSelector_: string) {

      if (!containerSelector_) { throw new Error("Invalid container selector in VirusNameLookup"); }
      this.containerSelector = containerSelector_;

      // Use the current MSL release from the AppSettings.
      this.settings.currentMslRelease = AppSettings.currentMslRelease;

      this.elements = {
         abolishedTabButton: null,
         abolishedTabCount: null,
         abolishedTabPanel: null,
         clearButton: null,
         container: null,
         currentTabButton: null,
         currentTabCount: null,
         currentTabPanel: null,
         invalidTabButton: null,
         invalidTabCount: null,
         invalidTabPanel: null,
         resultsCount: null,
         resultsPanel: null,
         searchButton: null,
         searchModifier: null,
         searchText: null,
         spinnerPanel: null,
         tabButtons: null,
         tabPanels: null
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
      this.elements.searchModifier.value = SearchModifier.exact_match;
      this.searchText = "";

      // Hide the results panel
      this.elements.resultsPanel.classList.remove("active");

      this.elements.resultsCount.innerHTML = "";

      // Clear the tab button counts and panel contents.
      this.elements.abolishedTabCount.innerHTML = "";
      this.elements.abolishedTabPanel.innerHTML = "";
      this.elements.currentTabCount.innerHTML = "";
      this.elements.currentTabPanel.innerHTML = "";
      this.elements.invalidTabCount.innerHTML = "";
      this.elements.invalidTabPanel.innerHTML = "";
      return;
   }


   // Create a link to GenBank using one or more accessions.
   createAccessionLink(accessions_: string) {

      if (!accessions_) { return ""; }

      accessions_ = accessions_.trim();
      if (accessions_.length < 1) { return ""; }

      // If commas were used as a delimiter, replace them with semicolons.
      accessions_ = accessions_.replace(",", ";");

      let accessionCount = 0;
      let accessionList = "";
      let linkText = "";

      // Tokenize using a semicolon as the delimiter. If there aren't any semicolons, the input text will be the only token.
      const tokens = accessions_.split(";");
      if (Array.isArray(tokens) && tokens.length > 0) {

         tokens.forEach((token_: string) => {

            if (!token_) { return; }

            let trimmedToken = token_.trim();
            if (trimmedToken.length < 1) { return; }

            let accession = null;

            // Get the accession from the token.
            let colonIndex = trimmedToken.indexOf(":");
            if (colonIndex > 0) {
               accession = trimmedToken.substring(colonIndex + 1);
               accession = accession.trim();
               if (accession.length < 1) { return; }
            } else {
               accession = trimmedToken;
            }

            if (accessionCount > 0) {

               // Add a semicolon and line break before all but the first link.
               linkText += "; ";

               // Add a comma before all but the first accession number.
               accessionList += ","
            }

            // Add the token to the link text.
            linkText += trimmedToken;

            // Add the accession number to the comma-delimited list.
            accessionList += accession;

            // Increment the accession count.
            accessionCount += 1;
         })
      }

      if (accessionList.length < 1 || linkText.length < 1) { return ""; }

      return `<a href=\"https://www.ncbi.nlm.nih.gov/nuccore/${accessionList}\" target=\"_blank\">${linkText}</a>`;
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
               matchURL = this.createTaxonDetailsURL(match_.name, match_.taxonomyID);
               source = `ICTV: MSL ${match_.versionID}`;
               break;

            case TaxonomyDB.ncbi_taxonomy:
               matchURL = this.createNcbiTaxonomyURL(match_.taxonomyID);
               source = "NCBI";
               break;

            default:
               source = "Unknown";
               break;
         }
         
         // Highlight the search text in the match name.
         let matchName = this.highlightText(match_.name.trim());

         // Format the match rank
         let matchRank = this.formatRank(match_.nameClass, match_.rankName, match_.taxonomyDB);
         if (matchRank.length > 0) { matchRank += ": "; }

         // Format name class
         const nameClass = LookupNameClass(match_.nameClass, match_.taxonomyDB);

         // Lookup a tooltip for the name class.
         const nameClassTip = LookupNameClassDefinition(match_.nameClass, match_.taxonomyDB);

         // Should we hyperlink the match name?
         let linkedMatchName = !matchURL ? matchName : `<a href="${matchURL}" target="_blank">${matchName}</a>`;

         html += 
            `<tr class="${rowClass}">
               <td class="match-number">${matchCount}</td>
               <td class="match-name">${matchRank}${linkedMatchName}</td>
               <td class="source">${source} (<span class="has-tooltip">${nameClass} <span class="tooltip">${nameClassTip}</span></span>)</td>
            </tr>`;
      })

      html = 
         `<table class="invalid-results-table results-table" data-count="${matchCount}">
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


   createResultMatchRows(matches_: ISearchResult[], resultName_: string): string {

      let html = "";

      matches_.forEach((result_: ISearchResult, index_: number) => {

         // Alternate the CSS class every row.
         let rowClass = index_ % 2 === 0 ? "odd-bg" : "even-bg";

         let source = "";

         // Format the match version and taxonomy database/ID.
         switch (result_.taxonomyDB) {
            case TaxonomyDB.ictv_taxonomy:
            case TaxonomyDB.ictv_epithets:
               source = `ICTV: MSL ${result_.versionID}`;
               break;
            case TaxonomyDB.ictv_vmr:
               source = `ICTV: VMR ${this.currentVMR}`;
               break;
            case TaxonomyDB.ncbi_taxonomy:
               source = "NCBI";
               break;
         }

         // Determine the URL of a linked match name.
         let matchURL = null;
         switch (result_.taxonomyDB) {
            case TaxonomyDB.ictv_taxonomy:
               matchURL = this.createTaxonDetailsURL(result_.name, result_.taxonomyID);
               break;

            case TaxonomyDB.ncbi_taxonomy:
               matchURL = this.createNcbiTaxonomyURL(result_.taxonomyID);
               break;
         }

         // Highlight the search text in the result name.
         let matchName = this.highlightText(result_.name.trim());

         // Italicize ICTV taxa
         if (result_.taxonomyDB === TaxonomyDB.ictv_epithets || result_.taxonomyDB === TaxonomyDB.ictv_taxonomy) {
            matchName = `<i>${matchName}</i>`;
         }

         // Should the match name be hyperlinked?
         let linkedMatchName = !matchURL ? matchName : `<a href="${matchURL}" target="_blank">${matchName}</a>`;

         let intermediateText = "";

         // Display the intermediate name if it exists and it's different from the ICTV result name.
         if (!!result_.intermediateName && result_.intermediateName.length > 0 && result_.intermediateName.toUpperCase() !== resultName_.toUpperCase()) {

            let intermediateRank = this.formatRank(NameClass.scientific_name, result_.intermediateRank, result_.taxonomyDB);
            if (intermediateRank.length > 0) { intermediateRank = `${intermediateRank}: `; }

            intermediateText = `${intermediateRank}<i>${result_.intermediateName}</i>`;
         }

         // Format the match rank
         let matchRank = this.formatRank(result_.nameClass, result_.rankName, result_.taxonomyDB);
         if (matchRank.length > 0) { matchRank += ": "; }

         // Format the name class
         const nameClass = LookupNameClass(result_.nameClass, result_.taxonomyDB);

         // Lookup a tooltip for the name class.
         const nameClassTip = LookupNameClassDefinition(result_.nameClass, result_.taxonomyDB);

         // Add the table row to the HTML.
         html += `<tr class="${rowClass}">
            <td class="match-name">${matchRank}${linkedMatchName}</td>
            <td class="source">${source} (<span class="has-tooltip">${nameClass} <span class="tooltip">${nameClassTip}</span></span>)</td>
            <td class="match-name">${intermediateText}</td>
         </tr>`;
      })

      return html;
   }


   // Create a URL for the NCBI Taxonomy page.
   createNcbiTaxonomyURL(taxonomyID_: number) {
      return `https://www.ncbi.nlm.nih.gov/Taxonomy/Browser/wwwtax.cgi?mode=Info&id=${taxonomyID_}`;
   }

   
   createResultItem(ictvResult_: IIctvResult, index_: number, itemID_: string, parentID_: string): string {

      // Format the ICTV result's lineage.
      const lineage = this.formatLineage(ictvResult_);

      // The result name will be hyperlinked.
      const url = this.createTaxonDetailsURL(ictvResult_.name, ictvResult_.taxnodeID);

      let linkedResultName = `<a class="result-link .ms-auto" href="${url}" target="_blank">${ictvResult_.name}</a>`;
      
      // Format the result rank (since it's an ICTV result there should always be a valid rank name).
      const resultRank = !ictvResult_.rankName || ictvResult_.rankName === "no_rank" ? "" : `<b>${LookupTaxonomyRank(ictvResult_.rankName)}</b>`;

      const matchesTitle = ictvResult_.matches.length === 1 ? "Database match: <b>1</b>" : `Database matches: <b>${ictvResult_.matches.length}</b>`;

      // Create rows for the match table.
      const matchRows = this.createResultMatchRows(ictvResult_.matches, ictvResult_.name);

      // Use more convenient variable names for the exemplar and its GenBank accession.
      let exemplar = ictvResult_.exemplar;
      let genbankAccession = ictvResult_.genbankAccession;

      let abolishedNote = "";
      let examplarInfo = "";

      if (ictvResult_.mslRelease < AppSettings.currentMslRelease) {

         // Note when the taxon was abolished.
         const year = `${ictvResult_.taxnodeID}`.substring(0, 4);
         abolishedNote = ` (abolished after ${year})`;

      } else if (!!exemplar && exemplar.length > 0 && !!genbankAccession && genbankAccession.length > 0) { 
         
            const genbankLink = this.createAccessionLink(genbankAccession);

            // Display the exemplar virus and its GenBank accession(s).
            examplarInfo = `Exemplar virus: ${exemplar} (${genbankLink})`;
      }

      let html =
         `<div class="ictv-accordion-item" data-id="${itemID_}">
            <div class="ictv-accordion-header">
               <div class="ictv-accordion-control" data-id="${itemID_}">
                  <i class="fa fa-chevron-down ictv-accordion-control-icon"></i>
               </div>
               <div class="ictv-accordion-label">
                  <div class="result-index">#${index_}</div>
                  <div class="lineage-and-result">
                     <div class="lineage">${lineage}</div>
                     <div class="result">
                        <div class="result-name">${resultRank}: <i>${linkedResultName}</i>${abolishedNote}</div>
                        <div class="result-note">${examplarInfo}</div>
                     </div>
                  </div>
               </div>
            </div>
            <div class="ictv-accordion-body" data-id="${itemID_}">
               <div class="ictv-accordion-content">
                  <div class="matches-title">${matchesTitle}</div>
                  <table class="${itemID_}_table results-table" data-count="${ictvResult_.matches.length}">
                     <thead>
                        <tr class="header-row">
                           <th class="name">Matching name</th>
                           <th class="source">Source (name type)</th>
                           <th class="intermediate">Superceded taxon name</th>
                        </tr>
                     </thead>
                     <tbody>${matchRows}</tbody>
                  </table>
               </div>
            </div>
         </div>`;

      return html;
   }


   // Create a URL for the ICTV taxon details page.
   createTaxonDetailsURL(name_: string, taxonomyID_: number) {
      return `https://ictv.global/taxonomy/taxondetails?taxnode_id=${taxonomyID_}&taxon_name=${name_}`;
   }


   async displayResults() {
      
      // Make the results panel visible.
      this.elements.resultsPanel.classList.add("active"); 

      // The number of abolished ICTV results.
      let abolishedCount = 0;

      // HTML for the abolished ICTV results.
      let abolishedHTML = "";

      const abolishedResultsID = "abolished_ictv_results";

      // The number of valid ICTV results.
      let currentCount = 0;

      // HTML for the current ICTV results.
      let currentHTML = "";

      const currentResultsID = "current_ictv_results";

      // HTML for the invalid matches.
      let invalidHTML = "";

      // Matches without an ICTV result.
      let invalidMatches = [];

      // A collection of item IDs (which correspond to an ICTV result).
      let itemIDs = [];

      let currentReleaseText = !AppSettings.currentMslRelease ? "" : ` (MSL ${AppSettings.currentMslRelease})`;


      // Iterate over the ICTV results.
      if (Array.isArray(this.results) && this.results.length > 0) {

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
      }
      
      // Create the invalid matches table.
      invalidHTML = this.createInvalidResultTable(invalidMatches);

      
      let tabCount = 0;

      //-----------------------------------------------------------------------------------------------------------------------------
      // Current ICTV results
      //-----------------------------------------------------------------------------------------------------------------------------
      if (currentCount > 0) {

         this.elements.currentTabButton.classList.remove("disabled");
         this.elements.currentTabCount.innerHTML = `(${currentCount})`;
         this.elements.currentTabPanel.innerHTML = 
            `<div class="section-count"><b>Hits to current ICTV taxa${currentReleaseText}:</b> ${currentCount}</div>
            <div class="accordion" id="${currentResultsID}">${currentHTML}</div>`;

         tabCount += 1;

      } else {
         this.elements.currentTabButton.classList.add("disabled");
         this.elements.currentTabCount.innerHTML = "(0)";
         this.elements.currentTabPanel.innerHTML = `No hits <br/><br/><br/>`;
      }

      //-----------------------------------------------------------------------------------------------------------------------------
      // Abolished ICTV results
      //-----------------------------------------------------------------------------------------------------------------------------
      if (abolishedCount > 0) {

         const abolishedLinkID = "abolished-section";

         this.elements.abolishedTabButton.classList.remove("disabled");
         this.elements.abolishedTabCount.innerHTML = `(${abolishedCount})`;
         this.elements.abolishedTabPanel.innerHTML = 
            `<div class="section-count" id="${abolishedLinkID}"><b>Hits to abolished ICTV taxa:</b> ${abolishedCount}</div>
            <div class="accordion" id="${abolishedResultsID}">${abolishedHTML}</div>`;

         tabCount += 1;

      } else {
         this.elements.abolishedTabButton.classList.add("disabled");
         this.elements.abolishedTabCount.innerHTML = "(0)";
         this.elements.abolishedTabPanel.innerHTML = "No hits <br/><br/><br/>";
      }

      //-----------------------------------------------------------------------------------------------------------------------------
      // Matches without ICTV results
      //-----------------------------------------------------------------------------------------------------------------------------
      if (invalidMatches.length > 0) {

         const invalidLinkID = "invalid-matches-section";

         this.elements.invalidTabButton.classList.remove("disabled");
         this.elements.invalidTabCount.innerHTML = `(${invalidMatches.length})`;

         const invalidS = invalidMatches.length === 1 ? "" : "s";
         const invalidMessage = `<b>Name${invalidS} without a valid taxon match:</b> ${invalidMatches.length}`;

         this.elements.invalidTabPanel.innerHTML = `<div class="section-count" id="${invalidLinkID}">${invalidMessage}</div>${invalidHTML}`;

         tabCount += 1;

      } else {
         this.elements.invalidTabButton.classList.add("disabled");
         this.elements.invalidTabCount.innerHTML = "(0)";
         this.elements.invalidTabPanel.innerHTML = "No hits <br/><br/><br/>";
      }

      if (invalidMatches.length > 0) {

         const tableEl = this.elements.container.querySelector(`${this.containerSelector} table.invalid-results-table`);
         if (!tableEl) { return; }

         const matchCount = parseInt(tableEl.getAttribute("data-count") || "0");

         // Only create a DataTable instance if the number of results is greater than the page size.
         if (matchCount > this.settings.pageSize) { 

            // Create a DataTable instance using the table Element.
            const dataTable = new DataTables(`${this.containerSelector} table.invalid-results-table`, {
               autoWidth: false,
               columnDefs: [{ orderable: false, targets: 0 }],
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
               pagingType: "full_numbers", // simple, simple_numbers, full, full_numbers
               searching: false,
               stripeClasses: []
            })
         }
      }

      if (itemIDs.length < 1) { return; }

      // Create a DataTable instance for every item ID.
      // NOTE: If possible, create DataTable instances as-needed (when expanding an accordion) rather than creating all instances now.
      itemIDs.forEach((itemID_: string) => {

         const tableEl = this.elements.container.querySelector(`${this.containerSelector} table.${itemID_}_table`);
         if (!tableEl) { console.error(`Invalid table Element for item ID ${itemID_}`); return; }

         const matchCount = parseInt(tableEl.getAttribute("data-count") || "0");

         // Only create a DataTable instance if the number of results is greater than the page size.
         if (matchCount > this.settings.pageSize) { 
            
            // Create a DataTable instance using the table Element.
            const dataTable = new DataTables(`${this.containerSelector} table.${itemID_}_table`, {
               autoWidth: false,
               columnDefs: [{ orderable: false, targets: 0 }],
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
               pagingType: "full_numbers", // simple, simple_numbers, full, full_numbers
               searching: false,
               stripeClasses: []
            });
         }
      })

      this.elements.container.querySelectorAll(".accordion .lineage-and-result a.result-link").forEach(link => {
         link.addEventListener("click", event_ => {

            // Prevent the click event from bubbling up to the button.
            event_.stopPropagation(); 
            return true;
         });
      });
       
      return;
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


   // Format the rank name.
   formatRank(nameClass_: NameClass, rankName_: string, taxonomyDB_: TaxonomyDB) {

      // Only display ranks for scientific names and equivalent names.
      if (nameClass_ !== NameClass.scientific_name && nameClass_ !== NameClass.equivalent_name) { return ""; }

      if (!rankName_ || rankName_.length < 1 || rankName_ === "no_rank") { return ""; }

      // Lookup the rank's label.
      let formattedRank = LookupTaxonomyRank(rankName_);
      if (!formattedRank) { return ""; }

      // Remove NCBI ranks (???)
      if (taxonomyDB_ === TaxonomyDB.ncbi_taxonomy) { formattedRank = ""; }

      return formattedRank;
   }


   // Handle a click on a tab button.
   handleTabClick(resultType_: ResultType) {

      const buttons = this.elements.tabButtons.querySelectorAll(".tab-button[data-id]") as NodeListOf<HTMLElement>;
      if (!buttons) { throw new Error("Unable to handle tab click: Invalid buttons"); }

      buttons.forEach((button_: HTMLElement) => {
         const dataID = button_.getAttribute("data-id") as ResultType;
         if (!dataID) { throw new Error("Unable to handle tab click: Invalid button"); }

         if (dataID === resultType_) {
            if (!button_.classList.contains("active")) { button_.classList.add("active"); }
         } else {
            button_.classList.remove("active");
         }
      })

      const panels = this.elements.tabPanels.querySelectorAll(".tab-panel[data-id]") as NodeListOf<HTMLElement>;
      if (!panels) { throw new Error("Unable to handle tab click: Invalid panels"); }

      panels.forEach((panel_: HTMLElement) => {
         const dataID = panel_.getAttribute("data-id") as ResultType;
         if (!dataID) { throw new Error("Unable to handle tab click: Invalid panel"); }

         if (dataID === resultType_) {
            if (!panel_.classList.contains("active")) { panel_.classList.add("active"); }
         } else {
            panel_.classList.remove("active");
         }
      })
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
      this.elements.container = document.querySelector(this.containerSelector);
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
         <div class="spinner-panel">${this.icons.spinner} <span class="spinner-message">Searching...</span></div>
         <div class="results-count"></div>
         <div class="results-panel">
            <div class="tab-buttons">
               <div class="tab-button active" data-id="${ResultType.current}">Hits to current ICTV taxa <span class="count"></span></div>
               <div class="tab-button" data-id="${ResultType.abolished}">Hits to abolished ICTV taxa <span class="count"></span></div>
               <div class="tab-button" data-id="${ResultType.invalid}">Hits with no ICTV results <span class="count"></span></div>
            </div>
            <div class="tab-panels">
               <div class="tab-panel active" data-id="${ResultType.current}"></div>
               <div class="tab-panel" data-id="${ResultType.abolished}"></div>
               <div class="tab-panel" data-id="${ResultType.invalid}"></div>
            </div>
         </div>`;

      this.elements.container.innerHTML = html;

      //-----------------------------------------------------------------------------------------------------------------------------
      // Get references to DOM Elements.
      //-----------------------------------------------------------------------------------------------------------------------------

      // The main panel Elements
      this.elements.resultsCount = this.elements.container.querySelector(".results-count");
      if (!this.elements.resultsCount) { return await AlertBuilder.displayError("Invalid results count Element"); }

      this.elements.resultsPanel = this.elements.container.querySelector(".results-panel");
      if (!this.elements.resultsPanel) { return await AlertBuilder.displayError("Invalid results panel Element"); }

      this.elements.spinnerPanel = this.elements.container.querySelector(".spinner-panel");
      if (!this.elements.spinnerPanel) { return await AlertBuilder.displayError("Invalid spinner panel Element"); }

      this.elements.tabButtons = this.elements.resultsPanel.querySelector(".tab-buttons");
      if (!this.elements.tabButtons) { return await AlertBuilder.displayError("Invalid tab buttons Element"); }

      this.elements.tabPanels = this.elements.container.querySelector(".tab-panels");
      if (!this.elements.tabPanels) { return await AlertBuilder.displayError("Invalid tab panels Element"); }


      // Individual tab buttons
      this.elements.abolishedTabButton = this.elements.tabButtons.querySelector(`.tab-button[data-id="${ResultType.abolished}"]`) as HTMLElement;
      if (!this.elements.abolishedTabButton) { throw new Error("Invalid abolished tab button"); }

      this.elements.currentTabButton = this.elements.tabButtons.querySelector(`.tab-button[data-id="${ResultType.current}"]`) as HTMLElement;
      if (!this.elements.currentTabButton) { throw new Error("Invalid current tab button"); }

      this.elements.invalidTabButton = this.elements.tabButtons.querySelector(`.tab-button[data-id="${ResultType.invalid}"]`) as HTMLElement;
      if (!this.elements.invalidTabButton) { throw new Error("Invalid invalid tab button"); }


      // Tab button counts
      this.elements.abolishedTabCount = this.elements.abolishedTabButton.querySelector(".count") as HTMLElement;
      if (!this.elements.abolishedTabCount) { throw new Error("Invalid abolished tab count"); }

      this.elements.currentTabCount = this.elements.currentTabButton.querySelector(".count") as HTMLElement;
      if (!this.elements.currentTabCount) { throw new Error("Invalid current tab count"); }

      this.elements.invalidTabCount = this.elements.invalidTabButton.querySelector(".count") as HTMLElement;
      if (!this.elements.invalidTabCount) { throw new Error("Invalid invalid tab count"); }


      // Tab panels
      this.elements.abolishedTabPanel = this.elements.tabPanels.querySelector(`.tab-panel[data-id="${ResultType.abolished}"]`);
      if (!this.elements.abolishedTabPanel) { throw new Error("Invalid abolished tab panel"); }

      this.elements.currentTabPanel = this.elements.tabPanels.querySelector(`.tab-panel[data-id="${ResultType.current}"]`);
      if (!this.elements.currentTabPanel) { throw new Error("Invalid current tab panel"); }

      this.elements.invalidTabPanel = this.elements.tabPanels.querySelector(`.tab-panel[data-id="${ResultType.invalid}"]`);
      if (!this.elements.invalidTabPanel) { throw new Error("Invalid invalid tab panel"); }


      // Search controls
      this.elements.clearButton = this.elements.container.querySelector(".clear-button");
      if (!this.elements.clearButton) { return await AlertBuilder.displayError("Invalid clear button Element"); }

      this.elements.searchButton = this.elements.container.querySelector(".search-button");
      if (!this.elements.searchButton) { return await AlertBuilder.displayError("Invalid search button Element"); }

      this.elements.searchModifier = this.elements.container.querySelector(".search-modifier");
      if (!this.elements.searchModifier) { return await AlertBuilder.displayError("Invalid search modifier Element"); }

      this.elements.searchText = this.elements.container.querySelector(".search-text");
      if (!this.elements.searchText) { return await AlertBuilder.displayError("Invalid search text Element"); }


      //-----------------------------------------------------------------------------------------------------------------------------
      // Add event handlers
      //-----------------------------------------------------------------------------------------------------------------------------
      this.elements.clearButton.addEventListener("click", async () => { await this.clearSearch()});
      this.elements.searchButton.addEventListener("click", async () => { await this.search()});

      // Pressing the enter key while the focus is on the search text field is the same as clicking the search button.
      this.elements.searchText.addEventListener("keypress", async (event_) => {    
         if (event_.key === "Enter") {
            event_.preventDefault();
            event_.stopPropagation();

            // Search for the user-provided text.
            await this.search();
         }
         return true;
      })

      // https://codepen.io/serhatbek/pen/bGyVLpM
      // https://dev.to/serhatbek/vanilla-javascript-tabs-21i8
      this.elements.tabButtons.addEventListener("click", async (event_) => {
         const tabEl = (event_.target as HTMLElement).closest(".tab-button");
         if (!tabEl) { return; }

         event_.preventDefault();
         event_.stopPropagation();

         const resultType = tabEl.getAttribute("data-id") as ResultType;
         this.handleTabClick(resultType);
         return;
      })

      // The selected search modifier determines the search text placeholder.
      this.elements.searchModifier.addEventListener("change", async (event_) => {

         // Lookup the placeholder text for the current search modifier.
         let placeholder = this.placeholderText[this.elements.searchModifier.value as SearchModifier];

         this.elements.searchText.setAttribute("placeholder", placeholder);
         return true;
      })

      // Initialize the accordion Elements.
      this.initializeAccordions();
      
      // Should an initial search be performed?
      await this.initialSearch();

      return;
   }


   // Initialize the accordion Elements.
   initializeAccordions() {

      this.elements.tabPanels.addEventListener("click", (event_) => {

         let targetEl = event_.target as HTMLElement;

         // If the chevron icon was clicked, use its parent Element.
         if (targetEl.classList.contains("ictv-accordion-control-icon")) { targetEl = targetEl.parentElement; }

         if (targetEl.classList.contains("ictv-accordion-control")) {

            const itemID = targetEl.getAttribute("data-id");
            if (!itemID) { return; }
            
            event_.preventDefault();
            event_.stopPropagation();

            const accordionItemEl = this.elements.tabPanels.querySelector(`.ictv-accordion-item[data-id="${itemID}"]`);
            if (!accordionItemEl) { return; }

            const bodyEl = this.elements.tabPanels.querySelector(`.ictv-accordion-body[data-id="${itemID}"]`) as HTMLElement;
            if (!bodyEl) { return; }

            if (accordionItemEl.classList.contains("active")) {
               accordionItemEl.classList.remove("active");
               bodyEl.style.maxHeight = "0";
            } else {
               accordionItemEl.classList.add("active");
               bodyEl.style.maxHeight = bodyEl.scrollHeight + "px";
            }
         }

         return;
      })

      return;
   }


   // Initialize the minimal search component.
   async initializeMinimalComponent() {

      // Set the "Find the Species" URL.
      this.findTheSpeciesURL = `${AppSettings.applicationURL}/find_the_species`;
      
      // Get the container Element.
      this.elements.container = document.querySelector(this.containerSelector);
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
            </div>
         </div>`;

      this.elements.container.innerHTML = html;

      //-----------------------------------------------------------------------------------------------------------------------------
      // Get references to DOM Elements.
      //-----------------------------------------------------------------------------------------------------------------------------

      // Search controls
      this.elements.searchButton = this.elements.container.querySelector(".search-button");
      if (!this.elements.searchButton) { return await AlertBuilder.displayError("Invalid search button Element"); }

      this.elements.searchModifier = this.elements.container.querySelector(".search-modifier");
      if (!this.elements.searchModifier) { return await AlertBuilder.displayError("Invalid search modifier Element"); }

      this.elements.searchText = this.elements.container.querySelector(".search-text");
      if (!this.elements.searchText) { return await AlertBuilder.displayError("Invalid search text Element"); }


      //-----------------------------------------------------------------------------------------------------------------------------
      // Add event handlers
      //-----------------------------------------------------------------------------------------------------------------------------
      this.elements.searchButton.addEventListener("click", async () => { await this.navigateToFindTheSpecies()});

      // Pressing the enter key while the focus is on the search text field is the same as clicking the search button.
      this.elements.searchText.addEventListener("keypress", async (event_) => {    
         if (event_.key === "Enter") {
            event_.preventDefault();
            event_.stopPropagation();

            // Navigate to the actual Find the Species page.
            await this.navigateToFindTheSpecies();
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

   // Perform a search if query string parameters have been provided.
   async initialSearch() {

      const urlParams = new URLSearchParams(window.location.search);
      //const urlParams = (new URL(window.location)).searchParams;

      let searchText = urlParams.get("search_text");

      if (!!searchText && searchText.length > 0) {
         let searchModifier = urlParams.get("search_modifier");
         if (!searchModifier) { searchModifier = SearchModifier.exact_match; }

         this.elements.searchText.value = searchText;
         this.elements.searchModifier.value = searchModifier;

         // Perform the search.
         await this.search();
      }
 
      return;
   }


   // Navigate to the actual Find the Species page.
   async navigateToFindTheSpecies() {

      this.searchText = this.elements.searchText.value;
      if (!this.searchText) { 
         return await AlertBuilder.displayInfo("Please enter valid search text"); 
      } else if (this.searchText.length < 3) {
         return await AlertBuilder.displayInfo("Please enter at least 3 characters");
      }

      const searchModifier = this.elements.searchModifier.value as SearchModifier;

      if (!this.findTheSpeciesURL) { return await AlertBuilder.displayError(`The "Find the Species" URL is invalid`); }

      // Navigate to the Find the Species page and include query string parameters.
      window.location.assign(`${this.findTheSpeciesURL}?search_text=${this.searchText}&search_modifier=${searchModifier}`);

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

      // Display the spinner
      this.elements.spinnerPanel.classList.add("active");

      // Hide the results panel
      this.elements.resultsPanel.classList.remove("active");

      this.elements.resultsCount.innerHTML = "";

      // Clear the tab button counts and panel contents.
      this.elements.abolishedTabCount.innerHTML = "";
      this.elements.abolishedTabPanel.innerHTML = "";
      this.elements.currentTabCount.innerHTML = "";
      this.elements.currentTabPanel.innerHTML = "";
      this.elements.invalidTabCount.innerHTML = "";
      this.elements.invalidTabPanel.innerHTML = "";

      // Reset the current tab button/panel as active.
      this.handleTabClick(ResultType.current);

      try {
         this.results = await VirusNameLookupService.lookupName(this.settings.currentMslRelease, searchModifier, this.searchText);
      }
      catch (error_) {
         this.elements.searchButton.disabled = false;
         this.elements.spinnerPanel.classList.remove("active");
         return await AlertBuilder.displayError(error_);
      }

      // Re-enable the search button.
      this.elements.searchButton.disabled = false;

      // Hide the spinner and "Searching...".
      this.elements.spinnerPanel.classList.remove("active");

      // Display the search results.
      await this.displayResults();

      return;
   }

}