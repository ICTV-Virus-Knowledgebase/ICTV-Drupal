
import { AlertBuilder } from "../../helpers/AlertBuilder";
import { AppSettings } from "../../global/AppSettings";
import { Identifiers } from "../../models/Identifiers";
import { MemberSpeciesTable } from "../MemberSpeciesTable/MemberSpeciesTable";
import { TaxonHistory } from "../TaxonHistory/TaxonHistory";
import { Utils } from "../../helpers/Utils";

enum ComponentKey {
   history = "history",
   isolates = "isolates"
}

export class TaxonDetails {

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
      tabPanels: HTMLElement
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
         tabPanels: null
      }
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
         `<div class="container-panel">
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
         
         console.log("tab clicked: ", tabType)

         this.handleTabClick(tabType);
         return;
      })

      // Get the URL parameters
      const urlParams = new URLSearchParams(window.location.search);

      // Look for identifier parameters in the query string.
      this.identifiers = Utils.getIdentifiersFromURL(urlParams);
      
      console.log("Identifiers: ", this.identifiers)

      // Was a VMR ID parameter provided? This determines which tab is displayed by default.
      if (!isNaN(this.identifiers.vmrID)) {

         // Hide the history tab and panel.
         this.elements.historyTabButton.classList.remove("active");
         this.elements.historyTabPanel.classList.remove("active");

         // Show the isolates tab and panel.
         this.elements.isolatesTabButton.classList.add("active");
         this.elements.isolatesTabPanel.classList.add("active");
      }
  
      // Initialize the taxon history component.
      const taxonHistory = new TaxonHistory(`#${this.elementIDs.historyContainer}`, this.currentReleaseNum);
      taxonHistory.initialize(this.identifiers);
      this.components.set(ComponentKey.history, taxonHistory);

      // Initialize the member species (isolates) table.
      const isolatesTable = new MemberSpeciesTable(`#${this.elementIDs.isolatesContainer}`);
      await isolatesTable.initialize();
      await isolatesTable.loadTable(this.identifiers.ictvID, this.identifiers.vmrID, this.identifiers.msl, false, this.identifiers.taxNodeID, this.identifiers.taxonName);
      this.components.set(ComponentKey.isolates, isolatesTable);
      
   }

   
}