

import { ITaxaBlastPanel } from "./ITaxaBlastPanel";
import { TaxaBLAST } from "../TaxaBLAST";


export class MessagePanel implements ITaxaBlastPanel {

   containerSelector: string;

   // DOM elements
   elements: {
      container: HTMLElement,

   }

   // Is the panel currently active/displayed?
   isActive: boolean;

   // The parent page
   parent: TaxaBLAST = null;
   

   // C-tor
   constructor(containerEl_: HTMLElement, parent_: TaxaBLAST) {

      if (!containerEl_) { throw new Error("Invalid container element"); }
      if (!parent_) { throw new Error("Invalid parent parameter"); }
      
      this.parent = parent_;

      this.elements = {
         container: containerEl_
      }
   }

   // Make the panel visible and populate it with data.
   async load(): Promise<void> {

      console.info("LOADING message panel")

      this.isActive = true;

      // Make the container visible.
      this.elements.container.classList.add("active");
      return;
   }

   // Unload and hide the panel.
   async unload(): Promise<void> {

      this.isActive = false;
      this.elements.container.classList.remove("active");
      
      // TODO: should we remove event listeners?
      return;
   }
}