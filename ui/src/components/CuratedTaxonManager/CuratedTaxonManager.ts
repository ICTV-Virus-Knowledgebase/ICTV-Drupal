
import { AlertBuilder } from "../../helpers/AlertBuilder";
import { CuratedTaxonService } from "../../services/CuratedTaxonService";
import { ICuratedTaxon } from "./ICuratedTaxon";


export class CuratedTaxonManager {

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

   results: ICuratedTaxon[];


   // C-tor
   constructor(containerSelector_: string) {

      if (!containerSelector_) { throw new Error("Invalid container selector in VirusNameLookup"); }
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

      this.results.forEach((curatedTaxon_: ICuratedTaxon, index_: number) => {


         /*
         ictvID: number;
            ictvName: string;
            ictvTaxnodeID: number;
            isActive: boolean;
            name: string;
            nameClass: NameClass;
            rankName: TaxonomyRank;
            type: CuratedTaxonType;
            comments: string;

         */
      })

      let html = 
         `<table class="curated-taxa">
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
   }

   
   async loadData() {

      this.results = await CuratedTaxonService.getCuratedTaxa();

      await this.displayResults();
      return;
   }
}