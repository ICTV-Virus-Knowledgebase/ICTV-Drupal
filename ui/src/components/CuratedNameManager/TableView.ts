
import { AlertBuilder } from "../../helpers/AlertBuilder";
import { ICuratedName } from "./ICuratedName";
import { IManager } from "./IManager";
import { LookupNameClass, LookupTaxonomyRank } from "../../global/Types";


export class TableView {

   elements: {
      container: HTMLElement,
      newNameButton: HTMLElement,
      resultsCount: HTMLElement,
      resultsPanel: HTMLElement,
      spinnerPanel: HTMLElement
   }

   icons: {
      add: string,
      spinner: string
   }

   // A restricted version (interface) of the parent object.
   manager: IManager;

   // The curated names that will be displayed.
   results: ICuratedName[];


   // C-tor
   constructor(containerEl_: HTMLElement, manager_: IManager) {

      if (!containerEl_) { throw new Error("Invalid container Element"); }

      this.elements = {
         container: containerEl_,
         newNameButton: null,
         resultsCount: null,
         resultsPanel: null,
         spinnerPanel: null
      }

      if (!manager_) { throw new Error("Invalid manager parameter"); }
      this.manager = manager_;

      this.icons = {
         add: `<i class="fa-solid fa-plus add-icon"></i>`,
         spinner: `<i class="fa fa-spinner fa-spin spinner-icon"></i>`
      }
   }


   async displayResults() {

      let rowHTML = "";

      this.results.forEach((curatedName_: ICuratedName, index_: number) => {

         // Alternate the CSS class every row.
         let rowClass = index_ % 2 === 0 ? "odd-bg" : "even-bg";

         let nameClass = LookupNameClass(curatedName_.nameClass, curatedName_.taxonomyDB);

         let rankName = LookupTaxonomyRank(curatedName_.rankName);

         let type = !curatedName_.type ? "" : curatedName_.type;

         rowHTML += `<tr class="${rowClass}">
            <td class="edit-column"><button class="ictv-btn edit-button" data-uid="${curatedName_.uid}">Edit</button></td>
            <td>${curatedName_.name}</td>
            <td>${nameClass}</td>
            <td>${rankName}</td>
            <td>${type}</td>
         </tr>`;
      })

      let html = 
         `<table class="results-table">
            <thead>
               <tr class="header-row">
                  <th></th>
                  <th>Name</th>
                  <th>Name class</th>
                  <th>Rank</th>
                  <th>Type</th>
               </tr>
            </thead>
            <tbody>
            ${rowHTML}
            </tbdoy>
         </table>`;

      this.elements.resultsPanel.innerHTML = html;

      const resultsTable = this.elements.container.querySelector(".results-table");
      if (!resultsTable) { return await AlertBuilder.displayError("Invalid results table Element"); }

      resultsTable.addEventListener("click", async (ev_) => { await this.handleEditButton(ev_)});
      return;
   }


   // Handle a click event on an edit button in the results table.
   async handleEditButton(event_: Event) {

      // Was this event triggered by a click on an edit button?
      const testElement = event_.target as HTMLElement;
      if (testElement.nodeName.toLowerCase() !== "button" || !testElement.classList.contains("edit-button")) { return false; }

      event_.preventDefault();
      event_.stopPropagation();

      // Get and validate the button's UID attribute.
      const uid = testElement.getAttribute("data-uid");
      if (!uid) { return await AlertBuilder.displayError("Invalid data-uid attribute"); }

      // Request to edit the curated name with this UID.
      await this.manager.editName(uid);
      return;
   }


   async initialize() {
      
      const html = 
         `<div class="controls-panel">
            <button class=\"btn new-name-btn\">${this.icons.add} New curated name</button>
         </div>
         <div class="spinner-panel">${this.icons.spinner} <span class="spinner-message">Loading...</span></div>
         <div class="results-count"></div>
         <div class="results-panel"></div>`;

      this.elements.container.innerHTML = html;


      this.elements.newNameButton = this.elements.container.querySelector(".new-name-btn");
      if (!this.elements.newNameButton) { return await AlertBuilder.displayError("Invalid new name button Element"); }

      this.elements.resultsCount = this.elements.container.querySelector(`.results-count`);
      if (!this.elements.resultsCount) { return await AlertBuilder.displayError("Invalid results count Element"); }

      this.elements.resultsPanel = this.elements.container.querySelector(`.results-panel`);
      if (!this.elements.resultsPanel) { return await AlertBuilder.displayError("Invalid results panel Element"); }

      this.elements.spinnerPanel = this.elements.container.querySelector(".spinner-panel");
      if (!this.elements.spinnerPanel) { return await AlertBuilder.displayError("Invalid spinner panel Element"); }

      // Add event handlers
      this.elements.newNameButton.addEventListener("click", async () => { await this.manager.createName()});

      // Load curated names
      await this.loadData();
   }


   async loadData() {

      // Display the spinner
      this.elements.spinnerPanel.classList.add("active");

      // Hide the results panel
      this.elements.resultsPanel.classList.remove("active");

      // Get all curated names.
      this.results = await this.manager.getNames();

      // Hide the spinner and "Searching...".
      this.elements.spinnerPanel.classList.remove("active");

      // Display the results panel.
      this.elements.resultsPanel.classList.add("active");

      // Populate the results panel.
      await this.displayResults();
      return;
   }

}