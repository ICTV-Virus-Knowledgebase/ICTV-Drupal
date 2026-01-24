
import { AlertBuilder } from "../../helpers/AlertBuilder";
import { AppSettings } from "../../global/AppSettings";
import { Identifiers } from "../../models/Identifiers";
import { ITaxon } from "../../models/TaxonHistory/ITaxon";
import { MemberSpeciesTable } from "../MemberSpeciesTable/MemberSpeciesTable";
import { TaxonHistory } from "../TaxonHistory/TaxonHistory";
import { Utils } from "../../helpers/Utils";

export enum ComponentKey {
   history = "history",
   isolates = "isolates"
}

export class TaxonDetails {

   // The tabbed components
   components: Map<ComponentKey, any> = null;

   // The DOM selector for the container element.
   containerSelector: string = null;

   // The current MSL release number.
   currentReleaseNum: number = NaN;

   // DOM element IDs for the data containers.
   elementIDs = {
      historyContainer: "taxon_history_container",
      isolatesContainer: "member_species_table_container"
   }
      
   // Important DOM elements used by this component.
   elements: {
      container: HTMLElement,

      // Taxon history
      historyTabButton: HTMLElement,
      historyTabPanel: HTMLElement,

      // Isolates
      isolatesTabButton: HTMLElement,
      isolatesTabPanel: HTMLElement,

      tabButtons: HTMLElement,
      tabPanels: HTMLElement,

      // The taxon name at the top of the page.
      taxonName: HTMLElement
   }

   identifiers: Identifiers = null;

   


   // C-tor
   constructor(containerSelector_: string) {

      if (!containerSelector_) { throw new Error("Invalid container selector"); }
      this.containerSelector = containerSelector_;

      if (isNaN(AppSettings.currentMslRelease)) { throw new Error("Invalid current MSL release"); }
      this.currentReleaseNum = AppSettings.currentMslRelease;

      // Initialize the components map.
      this.components = new Map<ComponentKey, any>();

      this.elements = {
         container: null,
         historyTabButton: null,
         historyTabPanel: null,
         isolatesTabButton: null,
         isolatesTabPanel: null,
         tabButtons: null,
         tabPanels: null,
         taxonName: null
      }
   }

   // Get taxa from the current release from the taxon history component.
   getCurrentTaxa(): ITaxon[] | null {

      const taxonHistory = this.components.get(ComponentKey.history) as TaxonHistory;
      if (!taxonHistory) { 
         throw new Error("Unable to get current taxa: Taxon history component is not initialized.");
      }

      return taxonHistory.getCurrentTaxa();
   }

   // Get the selected taxon from the taxon history component.
   getSelectedTaxon(): ITaxon {

      const taxonHistory = this.components.get(ComponentKey.history) as TaxonHistory;
      if (!taxonHistory) { throw new Error("Unable to get selected taxon: Taxon history component is not initialized"); }

      return taxonHistory.selectedTaxon;
   }

   // Handle a click on a tab button.
   handleTabClick(tabType_: ComponentKey) {

      const buttons = this.elements.tabButtons.querySelectorAll(".tab-button[data-id]") as NodeListOf<HTMLElement>;
      if (!buttons) { throw new Error("Unable to handle tab click: Invalid buttons"); }

      buttons.forEach((button_: HTMLElement) => {
         const dataID = button_.getAttribute("data-id") as ComponentKey;
         if (!dataID) { throw new Error("Unable to handle tab click: Invalid button"); }

         if (dataID === tabType_) {
            if (!button_.classList.contains("active")) { button_.classList.add("active"); }
         } else {
            button_.classList.remove("active");
         }
      })

      const panels = this.elements.tabPanels.querySelectorAll(".tab-panel[data-id]") as NodeListOf<HTMLElement>;
      if (!panels) { throw new Error("Unable to handle tab click: Invalid panels"); }

      panels.forEach((panel_: HTMLElement) => {
         const dataID = panel_.getAttribute("data-id") as ComponentKey;
         if (!dataID) { throw new Error("Unable to handle tab click: Invalid panel"); }

         if (dataID === tabType_) {
            if (!panel_.classList.contains("active")) { panel_.classList.add("active"); }
         } else {
            panel_.classList.remove("active");
         }
      })
   }
   

   async initialize() {
      
      // Generate the component's HTML.
      let html: string =
         `<h4 class="taxon-title"></h4>
         <div class="container-panel">
            <div class="tab-buttons">
               <div class="tab-button active" data-id="${ComponentKey.history}">Taxon History</div>
               <div class="tab-button" data-id="${ComponentKey.isolates}">Virus Isolates</div>
            </div>
            <div class="tab-panels">
               <div class="tab-panel active" data-id="${ComponentKey.history}">
                  <div class="data-container" id="${this.elementIDs.historyContainer}">TODO: taxon history</div>
               </div>
               <div class="tab-panel" data-id="${ComponentKey.isolates}">
                  <div class="data-container" id="${this.elementIDs.isolatesContainer}">TODO: isolates</div>
               </div>
            </div>
         </div>`;
         
      // Get a reference to the container Element.
      this.elements.container = document.querySelector(this.containerSelector);
      if (!this.elements.container) { throw new Error("Invalid container Element"); }

      // Populate the container HTML.
      this.elements.container.innerHTML = html;

      // Tab containers
      this.elements.tabButtons = this.elements.container.querySelector(".tab-buttons");
      if (!this.elements.tabButtons) { return await AlertBuilder.displayError("Invalid tab buttons Element"); }

      this.elements.tabPanels = this.elements.container.querySelector(".tab-panels");
      if (!this.elements.tabPanels) { return await AlertBuilder.displayError("Invalid tab panels Element"); }

      // Tab buttons
      this.elements.historyTabButton = this.elements.tabButtons.querySelector(`.tab-button[data-id="${ComponentKey.history}"]`) as HTMLElement;
      if (!this.elements.historyTabButton) { throw new Error("Invalid history tab button"); }

      this.elements.isolatesTabButton = this.elements.tabButtons.querySelector(`.tab-button[data-id="${ComponentKey.isolates}"]`) as HTMLElement;
      if (!this.elements.isolatesTabButton) { throw new Error("Invalid isolates tab button"); }

      // Tab panels
      this.elements.historyTabPanel = this.elements.tabPanels.querySelector(`.tab-panel[data-id="${ComponentKey.history}"]`);
      if (!this.elements.historyTabPanel) { throw new Error("Invalid history tab panel"); }

      this.elements.isolatesTabPanel = this.elements.tabPanels.querySelector(`.tab-panel[data-id="${ComponentKey.isolates}"]`);
      if (!this.elements.isolatesTabPanel) { throw new Error("Invalid isolates tab panel"); }

      this.elements.tabButtons.addEventListener("click", async (event_) => {

         const tabEl = (event_.target as HTMLElement).closest(".tab-button");
         if (!tabEl) { return; }

         event_.preventDefault();
         event_.stopPropagation();

         const tabType = tabEl.getAttribute("data-id") as ComponentKey;

         this.handleTabClick(tabType);
         return;
      })

      // Look for the taxon name element, but it might not have been added to the page.
      this.elements.taxonName = document.querySelector(".view-taxon-etymology .view-header");
      if (!this.elements.taxonName) {

         // Get a reference to the "backup" taxon title element.
         this.elements.taxonName = this.elements.container.querySelector(".taxon-title");
         if (this.elements.taxonName) { 
            this.elements.taxonName.classList.add("active");
         }

      } else {

         // Replace the H4 element for consistency with our alternative "taxon title" element.
         // NOTE: We won't need to do this if we can 1) figure out a way to display the taxon name block 
         // even if the taxon_name parameter is missing, or 2) if we populate the etymology using a web service
         // and can get rid of the block that currently handles this.
         this.elements.taxonName.innerHTML = `<div class="modified-taxon-title"></div>`;
         this.elements.taxonName = this.elements.taxonName.querySelector(".modified-taxon-title");
         if (!this.elements.taxonName) { console.error("An error occurred replacing the h4 element with the taxon title element"); }
      }

      // Get the URL parameters
      const urlParams = new URLSearchParams(window.location.search);

      // Look for identifier parameters in the query string.
      this.identifiers = Utils.getIdentifiersFromURL(urlParams);

      // Was a VMR ID or "view=isolates" parameter provided? If so, this will override the default tab selection.
      if (!isNaN(this.identifiers.vmrID) || urlParams.has("view", ComponentKey.isolates)) {

         // Hide the history tab and panel.
         this.elements.historyTabButton.classList.remove("active");
         this.elements.historyTabPanel.classList.remove("active");

         // Show the isolates tab and panel.
         this.elements.isolatesTabButton.classList.add("active");
         this.elements.isolatesTabPanel.classList.add("active");
      }
  
      // Initialize the taxon history component.
      const taxonHistory = new TaxonHistory(`#${this.elementIDs.historyContainer}`, this.currentReleaseNum, this);
      await taxonHistory.initialize(this.identifiers);
      this.components.set(ComponentKey.history, taxonHistory);

      // Initialize the member species (isolates) table.
      const isolatesTable = new MemberSpeciesTable(`#${this.elementIDs.isolatesContainer}`, this);
      await isolatesTable.initialize();
      await isolatesTable.loadTable(this.identifiers.ictvID, this.identifiers.vmrID, this.identifiers.msl, false, this.identifiers.taxNodeID, this.identifiers.taxonName);
      this.components.set(ComponentKey.isolates, isolatesTable); 
   }

   // Populate the taxon name, rank, and release details at the top of the page.
   populateTaxonPageTitle(title_: string) {

      if (!this.elements.taxonName) { return; }

      title_ = Utils.safeTrim(title_);
      if (!title_) { return; }

      this.elements.taxonName.innerHTML = title_;
   }

   // Reload the virus isolates table.
   async reloadIsolatesTable(taxNodeID_: number) {

      if (isNaN(taxNodeID_)) { throw new Error("Unable to reload isolates table: Invalid taxNodeID"); }

      // Get the member species (isolates) table component.
      const isolatesTable = this.components.get(ComponentKey.isolates) as MemberSpeciesTable;
      if (!isolatesTable) { throw new Error("Unable to reload isolates table: Isolates table component is not initialized"); }

      const ictvID = NaN;
      const vmrID = NaN;
      const msl = NaN;
      const taxonName = null;

      return await isolatesTable.loadTable(ictvID, vmrID, msl, false, taxNodeID_, taxonName);
   }
}