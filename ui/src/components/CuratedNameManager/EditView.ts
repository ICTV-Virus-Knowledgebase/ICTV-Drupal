
import { AlertBuilder } from "../../helpers/AlertBuilder";
import { ICuratedName } from "./ICuratedName";
import { IManager } from "./IManager";
import { LookupNameClass, LookupTaxonomyRank, NameClass, TaxonomyDB, TaxonomyRank } from "../../global/Types";
import { ViewMode } from "./Terms";


export class EditView {


   curatedName: ICuratedName;

   curatedNameUID: string;

   elements: {
      bodyPanel: HTMLElement,
      container: HTMLElement,
      titlePanel: HTMLElement,

      // Controls
      ictvIdControl: HTMLInputElement,
      ictvTaxonomyIdControl: HTMLInputElement,
      nameControl: HTMLInputElement,
      nameClassControl: HTMLSelectElement,
      rankNameControl: HTMLSelectElement,
      saveButton: HTMLButtonElement,
      typeControl: HTMLSelectElement
   }

   icons: {
      add: string,
      spinner: string
   }

   manager: IManager;

   title: string;

   viewMode: ViewMode;


   // C-tor
   constructor(containerEl_: HTMLElement, manager_: IManager) {

      if (!containerEl_) { throw new Error("Invalid container Element"); }

      this.elements = {
         bodyPanel: null,
         container: containerEl_,
         titlePanel: null,

         // Controls
         ictvIdControl: null,
         ictvTaxonomyIdControl: null,
         nameControl: null,
         nameClassControl: null,
         rankNameControl: null,
         saveButton: null,
         typeControl: null
      }

      if (!manager_) { throw new Error("Invalid manager parameter"); }
      this.manager = manager_;

      this.icons = {
         add: `<i class="fa-solid fa-plus add-icon"></i>`,
         spinner: `<i class="fa fa-spinner fa-spin spinner-icon"></i>`
      }
   }


   async getData() {

      // Get the curated name with this UID.
      this.curatedName = await this.manager.getName(this.curatedNameUID);
   
      // Populate the controls.
      await this.populateControls();

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
                  <label>Name class</label>
                  <select class="name-class-control"></select>
               </div>

               <div class="control-row">
                  <label>Rank name</label>
                  <select class="rank-name-control"></select>
               </div>

               <div class="control-row">
                  <label>Type</label>
                  <select class="type-control"></select>
               </div>

               <div class="control-row">
                  <label>ICTV ID</label>
                  <input type="text" class="ictv-id-control" />
               </div>

               <div class="control-row">
                  <label>ICTV Taxonomy ID</label>
                  <input type="text" class="ictv-taxonomy-id-control" />
               </div>

               <button class="ictv-btn save-button">Save</button>
            </div>
         </div>`;

      this.elements.container.innerHTML = html;

      // Get references to DOM Elements.
      this.elements.bodyPanel = this.elements.container.querySelector(".body-panel");
      this.elements.titlePanel = this.elements.container.querySelector(".title-panel");

      this.elements.ictvIdControl = this.elements.container.querySelector(".ictv-id-control");
      if (!this.elements.ictvIdControl) { return await AlertBuilder.displayError("Invalid ICTV ID control Element"); }

      this.elements.ictvTaxonomyIdControl = this.elements.container.querySelector(".ictv-taxonomy-id-control");
      if (!this.elements.ictvTaxonomyIdControl) { return await AlertBuilder.displayError("Invalid ICTV taxonomy ID control Element"); }

      this.elements.nameControl = this.elements.container.querySelector(".name-control");
      if (!this.elements.nameControl) { return await AlertBuilder.displayError("Invalid name control Element"); }

      this.elements.nameClassControl = this.elements.container.querySelector(".name-class-control");
      if (!this.elements.nameClassControl) { return await AlertBuilder.displayError("Invalid name class control Element"); }

      this.elements.rankNameControl = this.elements.container.querySelector(".rank-name-control");
      if (!this.elements.rankNameControl) { return await AlertBuilder.displayError("Invalid rank name control Element"); }

      this.elements.saveButton = this.elements.container.querySelector(".save-button");
      if (!this.elements.saveButton) { return await AlertBuilder.displayError("Invalid save button Element"); }

      this.elements.typeControl = this.elements.container.querySelector(".type-control");
      if (!this.elements.typeControl) { return await AlertBuilder.displayError("Invalid type control Element"); }


      // Add event handlers
      this.elements.saveButton.addEventListener("click", async () => { await this.save()});


      // Populate the name class control with options.
      Object.values(NameClass).forEach((value) => {
      
         const label = LookupNameClass(value, null);

         const option = document.createElement("option");
         option.value = value;
         option.label = label;

         this.elements.nameClassControl.appendChild(option);
      })

      // Populate the rank name control with options.
      Object.keys(TaxonomyRank).forEach((key) => {
      
         const label = LookupTaxonomyRank(key);

         const option = document.createElement("option");
         option.value = key;
         option.label = label;

         this.elements.rankNameControl.appendChild(option);
      })

      // If a curated name UID was provided and we are in edit mode, get data and populate the controls.
      if (!!this.curatedNameUID && this.viewMode === ViewMode.edit) {
         await this.getData();
         await this.populateControls();
      }

      return;
   }


   
   async populateControls() {

      if (!!this.curatedName) {
         this.elements.ictvIdControl.value = `${this.curatedName.ictvID}`;
         this.elements.ictvTaxonomyIdControl.value = `${this.curatedName.ictvTaxnodeID}`;
         this.elements.nameControl.value = this.curatedName.name;
         this.elements.nameClassControl.value = this.curatedName.nameClass;
         this.elements.rankNameControl.value = this.curatedName.rankName;
         //this.elements.typeControl.value = this.curatedName.type;
      }

      return;
   }


   async save() {

      console.log("TODO: are we in edit or create mode?")
      return;
   }

}