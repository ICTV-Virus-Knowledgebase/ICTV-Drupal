
import DataTables from 'datatables.net-dt';
import Api from 'datatables.net-dt';
import { ITaxon } from '../../models/TaxonHistory/ITaxon';
import { IVirusIsolate } from "../../models/IVirusIsolate";
import { ComponentKey, TaxonDetails } from '../TaxonDetails';
import { Utils } from "../../helpers/Utils";
import { VirusIsolateService } from "../../services/VirusIsolateService";

//import { Identifiers } from '../../models/Identifiers';


export class MemberSpeciesTable {


   // Every column that can be displayed in the table.
   columns: string[] = [
      "abbrev",
      "accessionNumber",
      "alternativeNameCSV",
      "availableSequence",
      "exemplar",
      "isolate",
      "refSeqAccession",
      "taxNodeID",

      // Rank names
      "subrealm",
      "kingdom",
      "subkingdom",
      "phylum",
      "subphylum",
      "order",
      "suborder",
      "class_", // "Class" is a reserved word here and on the server side.
      "subclass",
      "family",
      "subfamily",
      "genus",
      "subgenus",
      "species",
   ]

   counts: Map<string, number>;

   dataTable: any;

   elements: {
      container: HTMLElement,
      messagePanel: HTMLElement,
      rowContainer: HTMLElement,
      tableContainer: HTMLElement
   }

   icons: {
      exemplar: string
   }

   // DOM selectors
   selectors: { [key: string]: string; } = {
      container: null
   }

   // An optional reference to the parent TaxonDetails component.
   taxonDetails: TaxonDetails = null;

   // The taxon name
   taxonName: string;


   // C-tor
   constructor(containerSelector_: string, taxonDetails_?: TaxonDetails) {

      if (!containerSelector_) { throw new Error("Invalid container selector"); }

      this.selectors.container = containerSelector_;

      // Set the optional TaxonDetails reference.
      this.taxonDetails = taxonDetails_ || null;

      // Initialize the counts collections.
      this.counts = new Map<string, number>();

      this.columns.forEach((column_: string) => {
         this.counts.set(column_, 0);
      })

      this.elements = {
         container: null,
         messagePanel: null,
         rowContainer: null,
         tableContainer: null
      }

      this.icons = {
         exemplar: "<i class=\"fas fa-star\"></i>"
      }
   }


   createLinksFromAccession(accessionText_: string) {

      if (!accessionText_) { return ""; }

      accessionText_ = accessionText_.trim();
      if (accessionText_.length < 1) { return ""; }

      // If commas were used as a delimiter, replace them with semicolons.
      accessionText_ = accessionText_.replace(",", ";");

      let accessionCount = 0;
      let accessionList = "";
      let linkText = "";

      // Tokenize using a semicolon as the delimiter. If there aren't any semicolons, the input text will be the only token.
      const tokens = accessionText_.split(";");
      if (!!tokens && tokens.length > 0) {

         tokens.forEach((token_: string) => {

            if (!token_) { return; }

            let trimmedToken = token_.trim();
            if (trimmedToken.length < 1) { return; }

            let accession = null;

            // Get the accession from the token.
            let colonIndex = trimmedToken.indexOf(":");
            if (colonIndex > 0) {
               accession = trimmedToken.substring(colonIndex + 1);
               accession = accession.trim();
               if (accession.length < 1) { return; }
            } else {
               accession = trimmedToken;
            }

            if (accessionCount > 0) {

               // Add a semicolon and line break before all but the first link.
               linkText += ";<br/>";

               // Add a comma before all but the first accession number.
               accessionList += ","
            }

            // Add the token to the link text.
            linkText += trimmedToken;

            // Add the accession number to the comma-delimited list.
            accessionList += accession;

            // Increment the accession count.
            accessionCount += 1;
         })
      }

      if (accessionList.length < 1 || linkText.length < 1) { return ""; }

      return `<a href=\"https://www.ncbi.nlm.nih.gov/nuccore/${accessionList}\" target=\"_blank\">${linkText}</a>`;
   }


   createIsolateRow(isolate_: IVirusIsolate, rowCount_: number): string {

      // Italicize the species name, as appropriate.
      const species = Utils.italicizeTaxonName(isolate_.species);

      // Convert non-empty accession numbers to links.
      let accessionLinks = this.createLinksFromAccession(isolate_.accessionNumber);

      const exemplar = isolate_.exemplar === "E" ? this.icons.exemplar : "";

      // Lineage names
      const subrealm = !isolate_.subrealm ? "" : Utils.italicizeTaxonName(isolate_.subrealm);
      const kingdom = !isolate_.kingdom ? "" : Utils.italicizeTaxonName(isolate_.kingdom);
      const subkingdom = !isolate_.subkingdom ? "" : Utils.italicizeTaxonName(isolate_.subkingdom);
      const phylum = !isolate_.phylum ? "" : Utils.italicizeTaxonName(isolate_.phylum);
      const subphylum = !isolate_.subphylum ? "" : Utils.italicizeTaxonName(isolate_.subphylum);
      const order = !isolate_.order ? "" : Utils.italicizeTaxonName(isolate_.order);
      const suborder = !isolate_.suborder ? "" : Utils.italicizeTaxonName(isolate_.suborder);
      const class_ = !isolate_.class_ ? "" : Utils.italicizeTaxonName(isolate_.class_);
      const subclass = !isolate_.subclass ? "" : Utils.italicizeTaxonName(isolate_.subclass);
      const family = !isolate_.family ? "" : Utils.italicizeTaxonName(isolate_.family);
      const subfamily = !isolate_.subfamily ? "" : Utils.italicizeTaxonName(isolate_.subfamily);
      const genus = !isolate_.genus ? "" : Utils.italicizeTaxonName(isolate_.genus);
      const subgenus = !isolate_.subgenus ? "" : Utils.italicizeTaxonName(isolate_.subgenus);

      // Alternate between virus-row and alt-virus-row as the row class.
      let rowClass = "virus-row";
      if (rowCount_ % 2 != 0) { rowClass = "alt-virus-row"; }

      const html =
         `<tr class="${rowClass}" data-isolate-id="${isolate_.isolateID}">
            <td class="col-exemplar">${exemplar}</td>
            <td class="col-subrealm">${subrealm}</td>
            <td class="col-kingdom">${kingdom}</td>
            <td class="col-subkingdom">${subkingdom}</td>
            <td class="col-phylum">${phylum}</td>
            <td class="col-subphylum">${subphylum}</td>
            <td class="col-order">${order}</td>
            <td class="col-suborder">${suborder}</td>
            <td class="col-class_">${class_}</td>
            <td class="col-subclass">${subclass}</td>
            <td class="col-family">${family}</td>
            <td class="col-subfamily">${subfamily}</td>
            <td class="col-genus">${genus}</td>
            <td class="col-subgenus">${subgenus}</td>
            <td class="col-species">${species}</td>
            <td class="col-alternativeNameCSV">${isolate_.alternativeNameCSV}</td>
            <td class="col-isolate">${isolate_.isolate}</td>
            <td class="col-accessionNumber">${accessionLinks}</td>
            <td class="col-availableSequence">${isolate_.availableSequence}</td>
            <td class="col-abbrev">${isolate_.abbrev}</td>
         </tr>`

      return html;
   }

   // Create the HTML that is displayed when no isolates are found for the taxon and release.
   createNoIsolatesHTML(): string {

      // If there is no TaxonDetails component reference, return a generic message.
      if (!this.taxonDetails) { return "<div class=\"error\">No isolates have been defined for earlier releases of this taxon, but isolates might be available for the current taxon</div>"; }

      let currentTaxa: ITaxon[] = null;
      
      // TODO: Consider sleeping for a moment to ensure that the TaxonHistory component is initialized.

      try {
         // Get the current taxa from the TaxonDetails component.
         currentTaxa = this.taxonDetails.getCurrentTaxa();
      } catch (error_) {
         return `<div class=\"error\">Unable to get current taxa: ${error_ instanceof Error ? error_.message : String(error_)}</div>`;
      }
      
      if (!Array.isArray(currentTaxa) || currentTaxa.length < 1) {
         return `<div class=\"isolate-message\">This taxon was abolished and no isolates are defined.</div>`;
      }

      // The message that explains that isolates might be available for the current taxon/taxa.
      let message = `No isolates have been defined for earlier releases of this taxon, but isolates might be available for the current ${currentTaxa.length == 1 ? "taxon" : "taxa"}: `;

      // Get the current URL without any query string parameters.
      let url = window.location.pathname;
      const qIndex = url.indexOf("?");
      if (qIndex > -1) { url = url.substring(0, qIndex); }

      let linkRows = "";

      currentTaxa.forEach((taxon_: ITaxon) => {

         // The link's URL parameters
         let parameters = `taxnode_id=${taxon_.taxnodeID}&taxon_name=${encodeURIComponent(taxon_.name)}&view=${ComponentKey.isolates}`;

         const year = Utils.convertTreeIdToYear(taxon_.treeID);

         linkRows += `<li>
            <span class="taxon-rank">${taxon_.rankName}</span> 
            <a href="${url}?${parameters}" target="_blank"><span class="taxon-name">${taxon_.name}</span></a> (${year}, MSL Release ${taxon_.mslReleaseNum})
         </li>`;
      })
      
      return `<div class="isolate-message">${message}</div><ul class="taxa-links">${linkRows}</ul>`;
   }

   async initialize() {

      // Get the container Element.
      this.elements.container = document.querySelector(this.selectors.container);
      if (!this.elements.container) { throw new Error("Invalid container Element"); }

      // Begin generating the HTML that will be dynamically added to the page.
      let html =
         `<a href="#member_species_table"></a>
         <div class="message-panel"></div>
         <div class="table-container active">     
            <table class="virus-isolates-table compact">
               <thead>
                  <tr class="header-row">
                     <th class="col-exemplar" data-orderable="false"></th>
                     <th class="col-subrealm">Subrealm</th>
                     <th class="col-kingdom">Kingdom</th>
                     <th class="col-subkingdom">Subkingdom</th>
                     <th class="col-phylum">Phylum</th>
                     <th class="col-subphylum">Subphylum</th>
                     <th class="col-order">Order</th>
                     <th class="col-suborder">Suborder</th>
                     <th class="col-class_">Class</th>
                     <th class="col-subclass">Subclass</th>
                     <th class="col-family">Family</th>
                     <th class="col-subfamily">Subfamily</th>
                     <th class="col-genus">Genus</th>
                     <th class="col-subgenus">Subgenus</th>
                     <th class="col-species">Species</th>
                     <th class="col-alternativeNameCSV">Virus name</th>
                     <th class="col-isolate">Isolate</th>
                     <th class="col-accessionNumber">Accession</th>
                     <th class="col-availableSequence">Available sequence</th>
                     <th class="col-abbrev">Abbrev.</th>
                  </tr>
               </thead>
               <tbody></tbody>
            </table>
            <hr class="virus-isolates-lower-hr" />
            <div class="virus-isolates-table-legend">${this.icons.exemplar} Exemplar isolate of the species</div>
            <div class="virus-isolates-disclaimer">Virus names, the choice of exemplar isolates, and virus abbreviations, are not official ICTV designations</div>
         </div>`;

      this.elements.container.innerHTML = html;

      // Get references to important DOM elements.
      this.elements.messagePanel = this.elements.container.querySelector(".message-panel");
      if (!this.elements.messagePanel) { throw new Error("Invalid messagePanel Element"); }

      this.elements.rowContainer = this.elements.container.querySelector("table.virus-isolates-table tbody");
      if (!this.elements.rowContainer) { throw new Error("Invalid tbody Element"); }

      this.elements.tableContainer = this.elements.container.querySelector(".table-container");
      if (!this.elements.tableContainer) { throw new Error("Invalid tableContainer Element"); }

      return;
   }

   async loadTable(ictvID_: number, isolateID_: number, mslRelease_: number, onlyUnassigned_: boolean, taxnodeID_: number, taxonName_: string | null) {

      // Get the taxon's virus isolates.
      const isolates: IVirusIsolate[] = await VirusIsolateService.getIsolates(ictvID_, isolateID_, mslRelease_, onlyUnassigned_, taxnodeID_, taxonName_);
      if (isolates == null || isolates.length < 1) {

         // Show the message panel and hide the table container.
         this.elements.messagePanel.classList.add("active");
         this.elements.tableContainer.classList.remove("active");

         this.elements.messagePanel.innerHTML = `<div class="no-isolates-panel">${this.createNoIsolatesHTML()}</div>`;
         return;
      }

      // Hide the message panel and show the table container.
      this.elements.messagePanel.classList.remove("active");
      this.elements.tableContainer.classList.add("active");

      let html = "";

      // If an isolate ID parameter was provided, this is its display index in the result data. 
      let isolateIndex = NaN;

      isolates.forEach((isolate_: IVirusIsolate, index_: number) => {

         // Update the counts lookup for each column.
         this.columns.forEach((column_: string) => {

            const key = column_ as keyof IVirusIsolate;

            // Does this column exist and have a non-empty value?
            if (!!isolate_[key]) {
               let currentCount = this.counts.get(column_);
               this.counts.set(column_, currentCount + 1);
            }
         })

         // Is this the isolate ID parameter that was provided (if one was provided)? 
         if (!isNaN(isolateID_) && isolateID_ === isolate_.isolateID) { isolateIndex = index_; }

         // Create a row for each virus isolate.
         html += this.createIsolateRow(isolate_, index_);
      })

      // Add the rows to the table body.
      this.elements.rowContainer.innerHTML = html;

      // Hide empty columns
      this.columns.forEach((column_: string) => {
         const count = this.counts.get(column_);
         if (count < 1) {
            const columnEls: NodeListOf<HTMLElement> = document.querySelectorAll(`${this.selectors.container} .col-${column_}`);
            if (!!columnEls) {
               columnEls.forEach((columnEl_) => { columnEl_.style.display = "none"; })
            }
         }
      })

      // If the data table instance isn't destroyed here, it will raise an exception when re-initialized.
      if (!!this.dataTable) { 
         this.dataTable.destroy();
         this.dataTable = null;
      }

      // Convert the table into a DataTable instance.
      this.dataTable = new DataTables(`${this.selectors.container} table.virus-isolates-table`, {
         autoWidth: false,
         language: {
            lengthLabels: { "-1": "All"}
         },
         lengthMenu: [25, 50, 100, 500, 1000, -1],
         layout: {
            topStart: "pageLength",
            topEnd: null,
            bottomStart: "info",
            bottomEnd: {
               paging: {
                  buttons: 3
               }
            }
         },
         order: [],
         pageLength: 50,
         pagingType: "full_numbers", // simple, simple_numbers, full, full_numbers
         searching: false
      });
   }
}
