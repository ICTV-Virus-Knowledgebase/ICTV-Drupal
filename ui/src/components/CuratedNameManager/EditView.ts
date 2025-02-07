
import { AlertBuilder } from "../../helpers/AlertBuilder";
import { ICuratedName } from "./ICuratedName";
import { IManager } from "./IManager";
import { SearchContext, TaxonomySearchPanel } from "../../helpers/TaxonomySearchPanel";
import { CuratedNameType } from "../../global/Types";
import { ViewMode } from "./Terms";


export class EditView {


   curatedName: ICuratedName;

   curatedNameUID: string;

   elements: {
      bodyPanel: HTMLElement,
      container: HTMLElement,
      ictvTaxonomyPanel: HTMLElement,
      titlePanel: HTMLElement,

      // Controls
      cancelTaxonomyButton: HTMLButtonElement,
      ictvNameControl: HTMLElement,
      nameControl: HTMLInputElement,
      nameClassControl: HTMLSelectElement,
      saveButton: HTMLButtonElement,
      selectTaxonomyButton: HTMLButtonElement,
      typeControl: HTMLSelectElement
   }

   icons: {
      add: string,
      spinner: string
   }

   // The ICTV taxonomy data associated with the curated name.
   ictvTaxonomy: {
      name: string,
      rankName: string,
      taxnodeID: number
   }

   manager: IManager;

   searchPanel: TaxonomySearchPanel;

   title: string;

   viewMode: ViewMode;


   // C-tor
   constructor(containerEl_: HTMLElement, manager_: IManager) {

      if (!containerEl_) { throw new Error("Invalid container Element"); }

      this.elements = {
         bodyPanel: null,
         container: containerEl_,
         ictvTaxonomyPanel: null,
         titlePanel: null,

         // Controls
         cancelTaxonomyButton: null,
         selectTaxonomyButton: null,
         ictvNameControl: null,
         nameControl: null,
         nameClassControl: null,
         saveButton: null,
         typeControl: null
      }

      if (!manager_) { throw new Error("Invalid manager parameter"); }
      this.manager = manager_;

      this.icons = {
         add: `<i class="fa-solid fa-plus add-icon"></i>`,
         spinner: `<i class="fa fa-spinner fa-spin spinner-icon"></i>`
      }

      this.ictvTaxonomy = {
         name: null,
         rankName: null,
         taxnodeID: null
      }
   }


   async cancelTaxonomySelection() {
      console.log("TODO: in cancelTaxonomySelection")

      // Hide the cancel button.
      this.elements.cancelTaxonomyButton.classList.remove("active");

      // Clear the search panel.
      this.searchPanel.clearSearch();

      // Hide the ICTV taxonomy panel (the search panel).
      this.elements.ictvTaxonomyPanel.classList.remove("active");

      // Re-enable the edit taxonomy button.
      this.elements.selectTaxonomyButton.disabled = false;

      return;
   }


   async getData() {

      // Get the curated name with this UID.
      this.curatedName = await this.manager.getName(this.curatedNameUID);
   
      // Populate the controls.
      await this.populateControls();

      return;
   }


   
   // This callback function is provided to the taxonomy search panel to handle a search result selection.
   async handleTaxonomySelection(dataID_: string, name_: string, rank_: string, releaseNumber_: number) {

      console.log(`dataID: ${dataID_}, name: ${name_}, rank: ${rank_}, releaseNumber = ${releaseNumber_}`)

      let taxnodeID = parseInt(dataID_);
      if (isNaN(taxnodeID)) { 
         await AlertBuilder.displayError("Selection has an invalid taxnode ID");
         taxnodeID = null; 
      }

      // Populate the ICTV taxonomy data.
      this.ictvTaxonomy.name = name_;
      this.ictvTaxonomy.rankName = rank_;
      this.ictvTaxonomy.taxnodeID = taxnodeID;
      
      // Clear the search panel.
      this.searchPanel.clearSearch();

      // Update the ICTV taxon name control.
      const ictvName = !this.ictvTaxonomy.name || !this.ictvTaxonomy.rankName ? "" : `${this.ictvTaxonomy.rankName}: ${this.ictvTaxonomy.name}`;
      this.elements.ictvNameControl.innerHTML = ictvName;

      // Hide the ICTV taxonomy panel (the search panel).
      this.elements.ictvTaxonomyPanel.classList.remove("active");

      // Re-enable the edit taxonomy button.
      this.elements.selectTaxonomyButton.disabled = false;

      // Hide the cancel button.
      this.elements.cancelTaxonomyButton.classList.remove("active");

      return;
   }


   async initialize(curatedNameUID_: string, viewMode_: ViewMode) {

      if (!!curatedNameUID_) { this.curatedNameUID = curatedNameUID_; }

      if (!viewMode_) { viewMode_ = ViewMode.create; }
      this.viewMode = viewMode_;

      const html = 
         `<div class="title-panel"></div>
         <div class="body-panel">

            <div class="form-panel">

               <div class="control-row">
                  <label>Name</label>
                  <input type="text" class="name-control" />
               </div>

               <div class="control-row ictv-name-row">
                  <label>ICTV name</label>
                  <div class="ictv-name-control">
                     <div class="ictv-name">No ICTV taxon provided</div>
                     <button class="ictv-btn select-taxonomy-button">Select taxon</button>
                     <button class="ictv-btn cancel-taxonomy-button">Cancel</button>
                  </div>
               </div>

               <div class="ictv-taxonomy-panel"></div>
               
               <div class="control-row">
                  <label>Type</label>
                  <select class="type-control"></select>
               </div>

               <button class="ictv-btn save-button">Save</button>
            </div>
         </div>`;

      this.elements.container.innerHTML = html;

      // Get references to DOM Elements.
      this.elements.bodyPanel = this.elements.container.querySelector(".body-panel");
      this.elements.titlePanel = this.elements.container.querySelector(".title-panel");

      this.elements.cancelTaxonomyButton = this.elements.container.querySelector(".cancel-taxonomy-button");
      if (!this.elements.cancelTaxonomyButton) { return await AlertBuilder.displayError("Invalid cancel taxonomy button Element"); }

      this.elements.selectTaxonomyButton = this.elements.container.querySelector(".select-taxonomy-button");
      if (!this.elements.selectTaxonomyButton) { return await AlertBuilder.displayError("Invalid select taxonomy button Element"); }

      this.elements.ictvTaxonomyPanel = this.elements.container.querySelector(".ictv-taxonomy-panel");
      if (!this.elements.ictvTaxonomyPanel) { return await AlertBuilder.displayError("Invalid ICTV taxonomy panel Element"); }

      this.elements.ictvNameControl = this.elements.container.querySelector(".ictv-name-control .ictv-name");
      if (!this.elements.ictvNameControl) { return await AlertBuilder.displayError("Invalid ICTV name control Element"); }

      this.elements.nameControl = this.elements.container.querySelector(".name-control");
      if (!this.elements.nameControl) { return await AlertBuilder.displayError("Invalid name control Element"); }

      this.elements.saveButton = this.elements.container.querySelector(".save-button");
      if (!this.elements.saveButton) { return await AlertBuilder.displayError("Invalid save button Element"); }

      this.elements.typeControl = this.elements.container.querySelector(".type-control");
      if (!this.elements.typeControl) { return await AlertBuilder.displayError("Invalid type control Element"); }


      // Add event handlers
      this.elements.saveButton.addEventListener("click", async () => { await this.save()});
      this.elements.selectTaxonomyButton.addEventListener("click", async () => { await this.selectTaxonomy()});
      this.elements.cancelTaxonomyButton.addEventListener("click", async () => { await this.cancelTaxonomySelection()});

      // Populate the type control with options.
      Object.values(CuratedNameType).forEach((value) => {
      
         //const label = LookupNameClass(value, null);

         const option = document.createElement("option");
         option.value = value;
         option.label = value; // TODO!

         this.elements.typeControl.appendChild(option);
      })

      // Initialize the taxonomy search panel.
      const searchPanelSelector = `${this.manager.containerSelector} .ictv-taxonomy-panel`;
      this.searchPanel = new TaxonomySearchPanel(searchPanelSelector, SearchContext.CuratedNames, this.handleTaxonomySelection.bind(this));
      await this.searchPanel.initialize();

      // If a curated name UID was provided and we are in edit mode, get data and populate the controls.
      if (!!this.curatedNameUID && this.viewMode === ViewMode.edit) {
         await this.getData();
         await this.populateControls();
      }

      return;
   }


   async populateControls() {

      if (!!this.curatedName) {

         const ictvName =  !this.curatedName.taxonName || !this.curatedName.rankName ? "" : `${this.curatedName.rankName}: ${this.curatedName.taxonName}`;

         //this.elements.ictvIdControl.value = `${this.curatedName.ictvID}`;
         //this.elements.ictvTaxonomyIdControl.value = `${this.curatedName.ictvTaxnodeID}`;
         this.elements.ictvNameControl.innerHTML = ictvName;
         this.elements.nameControl.value = this.curatedName.name;
         //this.elements.nameClassControl.value = this.curatedName.nameClass;
         //this.elements.rankNameControl.value = this.curatedName.rankName;
         this.elements.typeControl.value = this.curatedName.type;

         // Update the ICTV taxonomy variables.
         this.ictvTaxonomy.name = this.curatedName.taxonName;
         this.ictvTaxonomy.rankName = this.curatedName.rankName;
         this.ictvTaxonomy.taxnodeID = this.curatedName.ictvTaxnodeID;
      }

      return;
   }


   async save() {

      console.log("TODO: are we in edit or create mode?")
      return;
   }

   
   // Handle a request to select an ICTV taxon to associate with the curated name.
   async selectTaxonomy() {

      // Display the cancel button.
      this.elements.cancelTaxonomyButton.classList.add("active");

      // Display the search panel.
      this.elements.ictvTaxonomyPanel.classList.add("active");

      // Disable the edit taxonomy button.
      this.elements.selectTaxonomyButton.disabled = true;

      return;
   }

}