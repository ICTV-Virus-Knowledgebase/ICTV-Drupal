
export class DialogBuilder {

   // Create HTML for a dialog button.
   static createButtonHTML(cssClasses_: string, label_: string, iconHTML_?: string) {

      if (!iconHTML_) { 
         iconHTML_ = ""; 
      } else {
         iconHTML_ += " ";
      }

      return `<button class="btn ${cssClasses_}">${iconHTML_}${label_}</button>`;
   }

   // Create HTML for a dialog.
   static createDialogHTML(footerHTML_: string, bodyHTML_: string, id_: string, title_: string) {
      
      return `<div id="${id_}" class="modal-dialog">
         <div class="modal-content">
            <div class="modal-header">
               <div class="modal-title">${title_}</div>
            </div>
            <div class="modal-body">${bodyHTML_}</div>
            <div class="modal-footer">${footerHTML_}</div>
         </div>
      </div>`;
   }

}