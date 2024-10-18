
import DataTable from 'datatables.net-dt';
import { IVirusIsolate } from "../../models/IVirusIsolate";
import { Utils } from "../../helpers/Utils";
import { VirusIsolateService } from "../../services/VirusIsolateService";


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

      // Lineage names
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

   dataTable;

   elements: {
      container: HTMLElement
   }

   icons: {
      exemplar: string
   }

   // DOM selectors
   selectors: { [key: string]: string; } = {
      container: null
   }

   // The taxon name
   taxonName: string;


   // C-tor
   constructor(containerSelector_: string) {

      if (!containerSelector_) { throw new Error("Invalid container selector"); }

      this.selectors.container = containerSelector_;

      // Initialize the counts collections.
      this.counts = new Map<string, number>();

      this.columns.forEach((column_: string) => {
         this.counts.set(column_, 0);
      })

      this.elements = {
         container: null
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

      // Update the counts lookup for each column.
      this.columns.forEach((column_: string) => {

         // Does this column exist and does it have a non-empty value?
         if (!!isolate_[column_] && isolate_[column_].length > 0) {
            let currentCount = this.counts.get(column_);
            this.counts.set(column_, currentCount + 1);
         }
      })

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
         `<tr class="${rowClass}">
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


   async initialize(taxonName_: string, mslRelease_?: number, onlyUnassigned_?: boolean) {

      if (!taxonName_ || taxonName_.length < 1) { throw new Error("Invalid taxon name"); }
      this.taxonName = taxonName_;

      if (!mslRelease_) { mslRelease_ = null; }

      if (onlyUnassigned_ !== true) { onlyUnassigned_ = false; }

      // Get the container Element.
      this.elements.container = document.querySelector(this.selectors.container);
      if (!this.elements.container) { throw new Error("Invalid container Element"); }


      // Get the taxon's virus isolates.
      const isolates: IVirusIsolate[] = await VirusIsolateService.getVirusIsolates(mslRelease_, onlyUnassigned_, this.taxonName)
      if (isolates == null || isolates.length < 1) {
         this.elements.container.innerHTML = ""; // "No virus isolates were found";
         return;
      }

      let rowCount = 0;

      // Begin generating the HTML that will be dynamically added to the page.
      let html =
         `<h2 class="virus-isolates-title">Member Species</h2>
            <a href="#member_species_table"></a>          
            <table class="virus-isolates-table">
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
                <tbody>`;

      // Create a row for each virus isolate.
      isolates.forEach((isolate_: IVirusIsolate) => {
         html += this.createIsolateRow(isolate_, rowCount);
         rowCount += 1;
      })

      html += `</tbody></table>
            <hr class="virus-isolates-lower-hr" />
            <div class="virus-isolates-table-legend">${this.icons.exemplar} Exemplar isolate of the species</div>
            <div class="virus-isolates-disclaimer">Virus names, the choice of exemplar isolates, and virus abbreviations, are not official ICTV designations</div>`;

      this.elements.container.innerHTML = html;

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

      // Convert the table into a DataTable instance.
      this.dataTable = new DataTable(`${this.selectors.container} table`, {
         autoWidth: false,
         dom: "t",
         order: [],
         paging: false,
         searching: false 
      });

      return;
   }
}
