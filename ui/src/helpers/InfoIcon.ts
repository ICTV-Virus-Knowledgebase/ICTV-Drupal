
import { AlertBuilder } from "./AlertBuilder";
import { Utils } from "./Utils";


// An icon with a "click to view" tooltip. Clicking on it opens a 
// Sweetalert2 dialog with a custom title and HTML.
export class InfoIcon {

   html: string;
   infoKey: string;
   label: string;
   title: string;
   tooltip: string;


   // C-tor
   constructor(html_: string, infoKey_: string, label_: string, title_?: string) {

      this.html = Utils.safeTrim(html_);
      if (this.html.length < 1) { throw new Error("InfoIcon error: Invalid HTML"); }

      this.infoKey = Utils.safeTrim(infoKey_);
      if (this.infoKey.length < 1) { throw new Error("InfoIcon error: Invalid info key"); }

      this.label = Utils.safeTrim(label_);
      if (this.label.length < 1) { throw new Error("InfoIcon error: Invalid label"); }

      this.title = Utils.safeTrim(title_);
      if (this.title.length < 1) { this.title = this.label; }

      this.tooltip = `Click to view more information about ${this.label}`;
   }


   // A static method that doesn't require creating an object instance.
   public static CreateHTML(html_: string, infoKey_: string, label_: string, 
      title_?: string, tooltip_?: string): string {

      html_= Utils.safeTrim(html_);
      if (html_.length < 1) { throw new Error("InfoIcon error: Invalid HTML"); }

      infoKey_ = Utils.safeTrim(infoKey_);
      if (infoKey_.length < 1) { throw new Error("InfoIcon error: Invalid info key"); }

      label_ = Utils.safeTrim(label_);
      if (label_.length < 1) { throw new Error("InfoIcon error: Invalid label"); }

      title_ = Utils.safeTrim(title_);
      if (title_.length < 1) { title_ = label_; }

      tooltip_ = Utils.safeTrim(tooltip_);
      if (tooltip_.length < 1) {
         tooltip_ = `Click to view more information about ${label_}`;
      }
   
      const encodedHTML = Utils.htmlEncode(html_);

      return `<i class=\"fa-solid fa-circle-info info-icon has-tooltip\"
         data-html=\"${encodedHTML}\"
         data-info-key=\"${infoKey_}\"
         data-tippy-content=\"${tooltip_}\"
         data-title=\"${title_}\"
      ></i>`;
   }

   // Handle a click on an area that contains info icons.
   public static async handleClick(event_: Event) {

      const target = event_.target as HTMLElement;
      
      // Get the closest info icon Element to the target Element.
      const iconEl = target.closest(`i.info-icon`) as HTMLElement;
      if (!iconEl) { return; }

      const html = Utils.htmlDecode(iconEl.dataset.html);
      const title = iconEl.dataset.title;

      return await AlertBuilder.displayIconInfo(html, title);
   }

   // Create HTML using the object instance.
   public toHTML(): string {

      const encodedHTML = Utils.htmlEncode(this.html);

      return `<i class=\"fa-solid fa-circle-info info-icon has-tooltip\"
         data-html=\"${encodedHTML}\"
         data-info-key=\"${this.infoKey}\"
         data-tippy-content=\"${this.tooltip}\"
         data-title=\"${this.title}\"
      ></i>`;
   }

}