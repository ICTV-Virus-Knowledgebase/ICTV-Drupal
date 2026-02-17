
import { delegate, Props, ReferenceElement } from 'tippy.js';


// A callback function that uses an HTML element to generate HTML for the tooltip.
interface IGenerateHTML {
   (element_: ReferenceElement<Props>): string
}


export class TooltipBuilder {

   // The tooltip will be displayed on elements that have this DOM selector.
   elementSelector: string;

   // A callback function to create HTML for display in the tooltip.
   generateHTML: IGenerateHTML;


   // C-tor
   constructor(elementSelector_: string, callback_: IGenerateHTML) {

      if (!callback_) { throw new Error("Invalid HTML generator callback function parameter"); }
      this.generateHTML = callback_;

      if (!elementSelector_) { throw new Error("Invalid element selector parameter"); }
      this.elementSelector = elementSelector_;


      delegate(document.body, {

         allowHTML: true,

         // Provide any placeholder so the instance can show; we'll replace content in onShow
         content: " ",  // avoids "empty" tooltip edge cases

         //delay: [settings.tooltip.showDelay, settings.tooltip.hideDelay],

         // Does the tooltip contain clickable UI?
         interactive: true,

         target: this.elementSelector,
         
         // TODO: This should be a c-tor parameter that defaults to ICTV-Tooltip.
         theme: "ICTV-Tooltip",

         // Instance is the element that's hovered over.
         onShow: (instance_) => {
            const el = instance_.reference;
            instance_.setContent(this.generateHTML(el));
         }
      })
   }

   // If the HTML can contain user input, escape it before injecting into HTML.
   escapeHTML(html_: string) {
      return String(html_)
         .replace(/&/g, '&amp;')
         .replace(/</g, '&lt;')
         .replace(/>/g, '&gt;')
         .replace(/"/g, '&quot;')
         .replace(/'/g, '&#039;');
   }

   /*createHTML(el) {
      const { id, name } = el.dataset; // reads data-id / data-name
      return `
         <div class="tip">
            <div><b>ID:</b> ${escapeHtml(id ?? '')}</div>
            <div><b>Name:</b> ${escapeHtml(name ?? '')}</div>
         </div>
      `;
   }*/
}
