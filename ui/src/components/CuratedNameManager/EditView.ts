
import { AlertBuilder } from "../../helpers/AlertBuilder";
import { CuratedNameType } from "../../global/Types";
import { ICuratedName } from "../../models/ICuratedName";
import { IManager } from "./IManager";
import { SearchContext, TaxonomySearchPanel } from "../../helpers/TaxonomySearchPanel";
import { Utils } from "../../helpers/Utils";
import { ViewMode } from "./Terms";


export class EditView {

   // The current curated name object.
   curatedName: ICuratedName;

   // The UID of the current curated name.
   curatedNameUID: string;

   // DOM Elements
   elements: {
      bodyPanel: HTMLElement,
      container: HTMLElement,
      ictvTaxonomyPanel: HTMLElement,
      titlePanel: HTMLElement,

      // Controls
      cancelTaxonButton: HTMLButtonElement,
      commentsControl: HTMLTextAreaElement,
      ictvNameControl: HTMLElement,
      nameControl: HTMLInputElement,
      nameClassControl: HTMLSelectElement,
      saveButton: HTMLButtonElement,
      selectTaxonButton: HTMLButtonElement,
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

   // The parent object (CuratedNameManager).
   manager: IManager;

   // The taxonomy search panel that will let the user select a taxon to
   // associate with the curated name.
   searchPanel: TaxonomySearchPanel;

   title: string;

   // The page's view mode ("create" or "edit").
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
         cancelTaxonButton: null,
         commentsControl: null,
         selectTaxonButton: null,
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
      
      // Hide the cancel button.
      this.elements.cancelTaxonButton.classList.remove("active");

      // Clear the search panel.
      this.searchPanel.clearSearch();

      // Hide the ICTV taxonomy panel (the search panel).
      this.elements.ictvTaxonomyPanel.classList.remove("active");

      // Display the select taxon button.
      this.elements.selectTaxonButton.classList.add("active");

      return;
   }


   // Request a curated name object from the parent object (manager).
   async getData() {

      this.curatedName = await this.manager.getName(this.curatedNameUID);

      if (!!this.curatedName) {

         // Update the ICTV taxonomy variables.
         this.ictvTaxonomy.name = this.curatedName.taxonName;
         this.ictvTaxonomy.rankName = this.curatedName.rankName;
         this.ictvTaxonomy.taxnodeID = this.curatedName.ictvTaxnodeID;
      }

      return;
   }

   
   // This callback function is provided to the taxonomy search panel to handle a search result selection.
   async handleTaxonomySelection(dataID_: string, name_: string, rank_: string, releaseNumber_: number) {

      console.log(`dataID: ${dataID_}, name: ${name_}, rank: ${rank_}, releaseNumber = ${releaseNumber_}`)

      // Validate the data ID parameter and try to cast as an int.
      let taxnodeID = parseInt(dataID_);
      if (isNaN(taxnodeID)) { 
         await AlertBuilder.displayError("Selection has an invalid taxnode ID");
         taxnodeID = null; 
      }

      // Populate the ICTV taxonomy object.
      this.ictvTaxonomy.name = name_;
      this.ictvTaxonomy.rankName = rank_;
      this.ictvTaxonomy.taxnodeID = taxnodeID;
      
      // Clear the search panel.
      this.searchPanel.clearSearch();

      // Update the ICTV taxon name control.
      const ictvName = this.manager.formatTaxonNameAndRank(this.ictvTaxonomy.name, this.ictvTaxonomy.rankName);
      this.elements.ictvNameControl.innerHTML = ictvName;

      // Hide the ICTV taxonomy panel (the search panel).
      this.elements.ictvTaxonomyPanel.classList.remove("active");

      // Display the select taxon button.
      this.elements.selectTaxonButton.classList.add("active");

      // Hide the cancel button.
      this.elements.cancelTaxonButton.classList.remove("active");

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

               <div class="control-row">
                  <label>Type</label>
                  <select class="type-control"></select>
               </div>

               <div class="control-row ictv-name-row">
                  <label>ICTV name</label>
                  <div class="ictv-name-control">
                     <div class="ictv-name">No ICTV taxon specified</div>
                     <button class="ictv-btn select-taxon-button active">Select taxon</button>
                     <button class="ictv-btn cancel-taxon-button">Cancel selection</button>
                  </div>
               </div>

               <div class="ictv-taxonomy-panel"></div>
               
               <div class="control-row">
                  <label>Comments</label>
                  <textarea class="comments-control" placeholder="Comments are optional"></textarea>
               </div>

               <button class="ictv-btn save-button">Save</button>
            </div>
         </div>`;

      this.elements.container.innerHTML = html;

      // Get references to DOM Elements.
      this.elements.bodyPanel = this.elements.container.querySelector(".body-panel");
      this.elements.titlePanel = this.elements.container.querySelector(".title-panel");

      this.elements.cancelTaxonButton = this.elements.container.querySelector(".cancel-taxon-button");
      if (!this.elements.cancelTaxonButton) { return await AlertBuilder.displayError("Invalid cancel taxon button Element"); }

      this.elements.commentsControl = this.elements.container.querySelector(".comments-control");
      if (!this.elements.commentsControl) { return await AlertBuilder.displayError("Invalid comments control Element"); }

      this.elements.selectTaxonButton = this.elements.container.querySelector(".select-taxon-button");
      if (!this.elements.selectTaxonButton) { return await AlertBuilder.displayError("Invalid select taxon button Element"); }

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
      this.elements.selectTaxonButton.addEventListener("click", async () => { await this.selectTaxonomy()});
      this.elements.cancelTaxonButton.addEventListener("click", async () => { await this.cancelTaxonomySelection()});

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
         this.elements.commentsControl.value = this.curatedName.comments;
         this.elements.ictvNameControl.innerHTML = this.manager.formatTaxonNameAndRank(this.ictvTaxonomy.name, this.ictvTaxonomy.rankName);
         this.elements.nameControl.value = this.curatedName.name;
         this.elements.typeControl.value = this.curatedName.type;
      }

      return;
   }


   async save() {

      // Get and validate values from the controls.
      let comments = Utils.safeTrim(this.elements.commentsControl.value);

      let name = Utils.safeTrim(this.elements.nameControl.value);
      if (name.length < 1) { return await AlertBuilder.displayError("Please enter a valid name"); }

      let type = this.elements.typeControl.value as CuratedNameType;
      if (!type) { return await AlertBuilder.displayError("Please select a type"); }

      if (!this.ictvTaxonomy.name || !this.ictvTaxonomy.rankName || !this.ictvTaxonomy.taxnodeID) {
         return await AlertBuilder.displayError("Please select an ICTV taxon");
      }
      
      // Create a JSON object with the control values.
      let curatedName: ICuratedName = {
         comments: comments,
         ictvTaxnodeID: this.ictvTaxonomy.taxnodeID,
         name: name,
         type: type,
      }

      // The view mode determines which web service to call.
      if (this.viewMode === ViewMode.create) {

         // Create a new curated name.
         await this.manager.createName(curatedName);

      } else if (this.viewMode === ViewMode.edit) {

         // Include the curated name's UID attribute.
         curatedName.uid = this.curatedName.uid;

         // Update an existing curated name.
         await this.manager.updateName(curatedName);

      } else {
         return await AlertBuilder.displayError(`Unhandled view mode ${this.viewMode}`);
      }

      return;
   }

   
   // Handle a request to select an ICTV taxon to associate with the curated name.
   async selectTaxonomy() {

      // Display the cancel button.
      this.elements.cancelTaxonButton.classList.add("active");

      // Display the search panel.
      this.elements.ictvTaxonomyPanel.classList.add("active");

      // Hide the search taxon button.
      this.elements.selectTaxonButton.classList.remove("active");

      return;
   }

}