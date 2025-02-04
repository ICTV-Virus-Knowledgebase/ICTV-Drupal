
import { AlertBuilder } from "../../helpers/AlertBuilder";
import { CuratedNameService } from "../../services/CuratedNameService";
import { ICuratedName } from "./ICuratedName";


export class CuratedNameManager {

   // The DOM selector of the module's container Element.
   containerSelector: string = null;


   elements: {
      container: HTMLElement,
      resultsCount: HTMLElement,
      resultsPanel: HTMLElement
   }

   icons: {
      spinner: string
   }

   results: ICuratedName[];


   // C-tor
   constructor(containerSelector_: string) {

      if (!containerSelector_) { throw new Error("Invalid container selector in CuratedNameManager"); }
      this.containerSelector = containerSelector_;

      this.elements = {
         container: null,
         resultsCount: null,
         resultsPanel: null
      }

      this.icons = {
         spinner: `<i class="fa fa-spinner fa-spin spinner-icon"></i>`
      }
   }


   async displayResults() {

      let rowHTML = "";

      this.results.forEach((curatedTaxon_: ICuratedName, index_: number) => {


         /*
         comments: string;
            createdBy: string;
            createdOn: string;
            division: string;
            ictvID: number;
            ictvTaxnodeID: number;
            id: number;
            isValid: boolean;
            name: string;
            nameClass: NameClass;
            rankName: TaxonomyRank;
            taxonomyDB: TaxonomyDB;
            taxonomyID: number;
            type: CuratedNameType;
            versionID: number;

         */
      })

      let html = 
         `<table class="curated-names">
            <thead>
               <tr class="header-row"></tr>
            </thead>
            <tbody>
            ${rowHTML}
            </tbdoy>
         </table>`;

      this.elements.resultsPanel.innerHTML = html;


      return;
   }


   async initialize() {
   
      // Get the container Element.
      this.elements.container = document.querySelector(this.containerSelector);
      if (!this.elements.container) { return await AlertBuilder.displayError("Invalid container Element"); }

      const html = 
         `<div class="spinner-panel">${this.icons.spinner} <span class="spinner-message">Loading...</span></div>
         <div class="results-count"></div>
         <div class="results-panel"></div>`;

      this.elements.container.innerHTML = html;

      this.elements.resultsCount = document.querySelector(`${this.containerSelector} .results-count`);
      if (!this.elements.resultsCount) { throw new Error("Invalid results count Element"); }

      this.elements.resultsPanel = document.querySelector(`${this.containerSelector} .results-panel`);
      if (!this.elements.resultsPanel) { throw new Error("Invalid results panel Element"); }


      // Load curated names
      await this.loadData();
   }

   
   async loadData() {

      this.results = await CuratedNameService.getCuratedNames();

      await this.displayResults();
      return;
   }
}