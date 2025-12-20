
export class DialogBuilder {

   static Classes = {
      dialog: "modal-dialog",

      // Add one of these two classes to display or hide an element.
      visible: "visible",
      hidden: "hidden"

      // TODO: others?
   }

   // Create HTML for a dialog button.
   static CreateButtonHTML(cssClasses_: string, label_: string, iconHTML_?: string, isDisabled_?: boolean) {

      iconHTML_ = !iconHTML_ ? "" : iconHTML_ += " ";

      // Is the button initially disabled?
      const disabled = isDisabled_ ? " disabled" : "";

      return `<button class="btn ${cssClasses_}"${disabled}>${iconHTML_}${label_}</button>`;
   }

   // Create HTML for a dialog.
   static CreateDialogHTML(footerHTML_: string, bodyHTML_: string, id_: string, title_: string) {
      
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