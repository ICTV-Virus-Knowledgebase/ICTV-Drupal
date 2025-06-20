
import { AlertBuilder } from "../../helpers/AlertBuilder";
import { ButtonClass, Constants, Icon, PanelKey } from "./Common";
import { decode } from "base64-arraybuffer";
import { ISeqSearchPanel } from "./ISeqSearchPanel";
import { SequenceSearch } from "./SequenceSearch";
import { SequenceSearchService } from "../../services/SequenceSearchService";
import * as pako from "pako";


export class BlastPanel implements ISeqSearchPanel {

   // DOM elements
   elements: {
      container: HTMLElement
   }

   // The parent page
   parent: SequenceSearch = null;


   // C-tor
   constructor(parent_: SequenceSearch) {

      if (!parent_) { throw new Error("Invalid parent parameter"); }
      this.parent = parent_;



   }


   // Download the BLAST CSV data for a specific result.
   async downloadCSV(index_: number) {

      // Get the result with the specified index.
      const result = this.parent.job.data.results[index_];
      if (!result || !result.csv_file || !result.blast_csv) {
         await AlertBuilder.displayError("No CSV file is available for download.");
         return;
      }

      // Decode the base64-encoded CSV file and decompress it.
      const arrayBuffer: ArrayBuffer = pako.inflate(decode(result.csv_file));
      if (!arrayBuffer || arrayBuffer.byteLength === 0) {
         await AlertBuilder.displayError("The CSV file is invalid: It may be empty or corrupted.");
         return;
      }

      // Associate the ArrayBuffer with a Blob, create a download link, and trigger the download.
      const link = document.createElement('a')
      link.href = URL.createObjectURL(new Blob(
         [ arrayBuffer ],
         { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }
      ))
      link.download = result.blast_csv;
      link.click();

      return;
   }


   display() {

      console.debug("Displaying the BLAST panel");
   }

   async handleResultsClick(event_) {

      if (event_.target.tagName !== "BUTTON") { return; }

      const button = event_.target as HTMLButtonElement;

      // Get and validate the button's data index attribute.
      let strDataIndex = button.getAttribute("data-index");
      const dataIndex = parseInt(strDataIndex);
      if (dataIndex < 0 || dataIndex > this.parent.job.data.results.length) {
         await AlertBuilder.displayError(`Invalid result index: ${dataIndex}`);
         return;
      }

      // The button's class determines which action to take.
      /*if (button.classList.contains(ButtonClass.copyURL)) {
         await this.copyJobURL();

      } else*/ if (button.classList.contains(ButtonClass.downloadCSV)) {
         await this.downloadCSV(dataIndex);

      } else if (button.classList.contains(ButtonClass.viewHTML)) {
         await this.viewHTML(dataIndex);
      }
     
      return;
   }

   unload() {


   }

   // Display the BLAST HTML data for a specific result.
   async viewHTML(index_: number) {

      // Get the result with the specified index.
      const result = this.parent.job.data.results[index_];

      // Open a new tab/window and populate it with the contents of the BLAST HTML file.
      const blastWindow = window.open("", "_blank");

      // Decode the base64-encoded HTML file and decompress it.
      const html = pako.inflate(decode(result.html_file), { to: 'string' });
      blastWindow.document.writeln(html);

      // Remove the extension from the file name and use it as the window's title.
      blastWindow.document.title = result.blast_html.replace(".html", "");

      return;
   }

}