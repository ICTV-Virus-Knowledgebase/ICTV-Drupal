
import { AppSettings } from "../global/AppSettings";
import DataTable from "datatables.net-dt";
import { ITaxonSearchResult } from "../models/ITaxonSearchResult";
import { TaxonomyService } from "../services/TaxonomyService";


export enum SearchContext {
   CuratedNames = "CuratedNames",
   TaxonomyBrowser = "TaxonomyBrowser",
   VisualTaxonomy = "VisualTaxonomy"
}


// An interface for a callback function that handles the selection of a search result.
/*export interface ISelectionHandler {
   (dataID_: string, lineage_: string, rank_: string, releaseNumber_: number);
}*/


export class TaxonomySearchPanel {


   containerSelector: string;

   // CSS classes
   cssClasses: { [key: string]: string; } = {
      clearSearchControl: "clear-search-ctrl",
      historyButton: "history-button",
      includeAllReleasesCtrl: "all-releases-ctrl",
      searchControl: "search-ctrl",
      searchControls: "search-controls",
      searchPanel: "search-panel",
      searchResults: "search-results",
      searchResultsTable: "search-results-table",
      searchText: "search-text",
      viewButton: "view-button"
   }

   // DOM elements
   elements: {
      clearSearchControl: HTMLButtonElement,
      container: HTMLElement,
      includeAllReleasesCtrl: HTMLInputElement,
      searchPanel: HTMLElement,
      searchControl: HTMLButtonElement,
      searchControls: HTMLElement,
      searchResults: HTMLElement,
      searchResultsTable: HTMLTableElement,
      searchText: HTMLInputElement
   } =  {
      clearSearchControl: null,
      container: null,
      includeAllReleasesCtrl: null,
      searchPanel: null,
      searchControl: null,
      searchControls: null,
      searchResults: null,
      searchResultsTable: null,
      searchText: null
   }

   // The currently selected MSL release
   selectedRelease: number;

   // A callback function that handles the selection of a search result.
   selectionHandler: Function; //ISelectionHandler = null;

   // Icons
   icons: { [key: string]: string; } = {
      search: "TODO",
      spinner: "<i class='fas fa-spinner fa-spin'></i>"
   }

   searchContext: SearchContext;



   // C-tor
   constructor(containerSelector_: string, searchContext_: SearchContext, selectionHandler_: Function) {
      this.containerSelector = containerSelector_;
      this.searchContext = searchContext_;
      this.selectionHandler = selectionHandler_;
   }

   async clearSearch() {
      this.elements.searchText.value = "";
      this.elements.searchResults.innerHTML = "";
      this.elements.includeAllReleasesCtrl.checked = false;
      return;
   }


   // Return a DIV that contains the spinner icon and optional text.
   getSpinnerHTML(spinnerText_: string): string {
      if (!spinnerText_) { spinnerText_ = ""; }
      return `<div class="spinner-ctrl">${this.icons.spinner} ${spinnerText_}</div>`;
   }


   async initialize() {

      this.elements.container = document.querySelector(this.containerSelector);
      if (!this.elements.container) { throw new Error("Invalid container element in initialize"); }

      // Create HTML for the search panel.
      const html = 
         `<div class="${this.cssClasses.searchPanel}" data-is-visible="true">
            <div class="input-group ${this.cssClasses.searchControls}">
               <input type="text" class="form-control ${this.cssClasses.searchText}" placeholder="Search taxonomy..." />
               <button class="btn ${this.cssClasses.searchControl}" type="button"><i class="fa fa-search"></i> Search</button>
               <button class="btn ${this.cssClasses.clearSearchControl}" type="button"><i class="fas fa-times"></i> Reset</button>
            </div>
            <div class="all-releases-row">
               <input type="checkbox" class="${this.cssClasses.includeAllReleasesCtrl}" />
               <label>Select to search across all ICTV releases</label>
            </div>
            <div class="${this.cssClasses.searchResults}"></div>
         </div>`;

      // Add the HTML to the page.
      this.elements.container.innerHTML = html;
      

      // Get references to DOM Elements used by this object.
      this.elements.clearSearchControl = this.elements.container.querySelector(`.${this.cssClasses.clearSearchControl}`);
      if (!this.elements.clearSearchControl) { throw new Error("Invalid clearSearchControl element"); }

      this.elements.includeAllReleasesCtrl = this.elements.container.querySelector(`.${this.cssClasses.includeAllReleasesCtrl}`);
      if (!this.elements.includeAllReleasesCtrl) { throw new Error("Invalid includeAllReleasesCtrl element"); }

      this.elements.searchControl = this.elements.container.querySelector(`.${this.cssClasses.searchControl}`);
      if (!this.elements.searchControl) { throw new Error("Invalid searchControl element"); }

      this.elements.searchResults = this.elements.container.querySelector(`.${this.cssClasses.searchResults}`);
      if (!this.elements.searchResults) { throw new Error("Invalid searchResults element"); }

      this.elements.searchText = this.elements.container.querySelector(`.${this.cssClasses.searchText}`);
      if (!this.elements.searchText) { throw new Error("Invalid searchText element"); }


      // Pressing the enter key while the focus is on the search field is the same as clicking the search button.
      this.elements.searchText.addEventListener("keypress", async (event_: KeyboardEvent) => {
         if (event_.key === "Enter") {

               event_.preventDefault();
               event_.stopPropagation();

               await this.search();
         }
         return true;
      })

      // Pressing the enter key while the focus is on the "include all releases" checkbox is 
      // the same as clicking the search button.
      this.elements.includeAllReleasesCtrl.addEventListener("keypress", async (event_: KeyboardEvent) => {
         if (event_.key === "Enter") {
               
               event_.preventDefault();
               event_.stopPropagation();

               await this.search();
         }
         return true;
      })

      // Unchecking the "all releases" checkbox reloads the current release and its taxonomy.
      this.elements.includeAllReleasesCtrl.addEventListener("change", async (event_: Event) => {
         
         if ((<HTMLInputElement>event_.target).checked) { return; }
         
         return this.selectionHandler(null, null, null, AppSettings.currentMslRelease);
      });

      // Clicking the search control triggers the search.
      this.elements.searchControl.addEventListener("click", async () => {
         return await this.search();
      });

      // Clicking on the "clear search" control clears the search parameters.
      this.elements.clearSearchControl.addEventListener("click", async () => {
         return await this.clearSearch();
      });

      // Put focus on the search text.
      this.elements.searchText.focus();

      // Handle all click events from buttons in the search results Element.
      this.elements.searchResults.addEventListener("click", async (event_: MouseEvent) => {

         // Get the closest TR Element to the target Element.
         const buttonEl = (event_.target as HTMLElement).closest("button");
         if (!buttonEl) { return; }
         
         // Get the taxnode ID.
         let id = buttonEl.getAttribute("data-id");
         if (!id) { throw new Error("Unable to select search result: Empty ID"); }

         if (buttonEl.classList.contains("view-search-result-button")) {

            // Select the search result in the taxonomy tree.
            let lineage = buttonEl.getAttribute("data-lineage");
            let name = buttonEl.getAttribute("data-name");
            let rankName = buttonEl.getAttribute("data-rank");
            let strRelease = buttonEl.getAttribute("data-release");
            let release = null;

            if (!!strRelease) {
               release = parseInt(strRelease);
               if (Number.isNaN(release)) { release = null; } 
            }

            if (this.searchContext === SearchContext.CuratedNames) {
               await this.selectionHandler(id, name, rankName, release);
            } else {
               await this.selectionHandler(id, lineage, rankName, release);
            }

         } else if (buttonEl.classList.contains("view-history-button")) {

               // Get the taxon name
               let taxonName = buttonEl.getAttribute("data-name");
               if (!taxonName) { throw new Error("Invalid taxon name"); }

               // Open a new tab containing the taxon history page.
               window.open(`${AppSettings.taxonHistoryPage}?taxnode_id=${id}&taxon_name=${taxonName}`, "_blank");

         } else { return; }

         event_.preventDefault();
         event_.stopImmediatePropagation();

         return false;
      })
   }


   async search() {

      // Get search text
      let searchText = this.elements.searchText.value;
      if (!searchText) { alert("Please enter search text"); return false; }

      let includeAllReleases: boolean = this.elements.includeAllReleasesCtrl.checked;

      // Disable the search and reset buttons.
      this.elements.searchControl.disabled = true;
      this.elements.clearSearchControl.disabled = true;

      // The spinner icon and label.
      let spinner = this.getSpinnerHTML("Searching...");

      // Clear the search results and display the spinner.
      this.elements.searchResults.innerHTML = spinner;
      
      let searchResults = null;

      // Call the search web service
      searchResults = await TaxonomyService.search(AppSettings.currentMslRelease, includeAllReleases, searchText);

      // Re-enable the search and reset buttons.
      this.elements.searchControl.disabled = false;
      this.elements.clearSearchControl.disabled = false;


      let html: string = "";
      let resultCount: number = 0;
      
      if (searchResults) {

         html += `<table class="${this.cssClasses.searchResultsTable} cell-border compact stripe">
            <thead>
               <tr class="header-row">
                  <th data-orderable="false" class="view-ctrl-column"></th>
                  <th>Release</th>
                  <th>Rank</th>
                  <th>Name</th>
               </tr>
            </thead>
            <tbody>`;  

         // Iterate over the taxonomy search results and create a table row for each one.
         searchResults.forEach((searchResult_: ITaxonSearchResult) => {

            let dataID = "";
            let dataLineage = "";

            if (this.searchContext === SearchContext.TaxonomyBrowser || this.searchContext === SearchContext.CuratedNames) {
               dataID = `${searchResult_.taxnodeID}`;
               dataLineage = searchResult_.lineage;

            } else if (this.searchContext === SearchContext.VisualTaxonomy) {
               dataID = `${searchResult_.jsonID}`;
               dataLineage = searchResult_.jsonLineage;
            }

            if (this.searchContext === SearchContext.CuratedNames) {
               html +=
                  `<tr>
                     <td class="view-ctrl">
                        <button class="slim-btn view-search-result-button"
                           data-id="${dataID}" 
                           data-name="${searchResult_.name}" 
                           data-rank="${searchResult_.rankName}" 
                           data-release="${searchResult_.releaseNumber}">Select</button>
                     </td>
                     <td class="release-name">${searchResult_.treeName}</td>
                     <td class="level-name">${searchResult_.rankName}</td>
                     <td class="result-html">${searchResult_.lineageHTML}</td>
                  </tr>`;
            } else {
               html +=
                  `<tr>
                     <td class="view-ctrl">
                        <button class="slim-btn view-search-result-button"
                           data-id="${dataID}" 
                           data-lineage="${dataLineage}" 
                           data-rank="${searchResult_.rankName}" 
                           data-release="${searchResult_.releaseNumber}">View</button>

                        <button class="slim-btn view-history-button"
                           data-id="${dataID}" 
                           data-name="${searchResult_.name}">History</button>
                     </td>
                     <td class="release-name">${searchResult_.treeName}</td>
                     <td class="level-name">${searchResult_.rankName}</td>
                     <td class="result-html">${searchResult_.lineageHTML}</td>
                  </tr>`;
            }

            resultCount += 1;
         })

         html += "</tbody></table>";
      }

      if (resultCount < 1) { 
         this.elements.searchResults.innerHTML = "No results"; 
         return;
      }

      // Display the search results HTML.
      this.elements.searchResults.innerHTML = html;

      // Convert the table into a DataTable instance. 
      new DataTable(`${this.containerSelector} .${this.cssClasses.searchResultsTable}`, {
         dom: "ltip",
         "order": [],
         searching: false
      });
   }

}