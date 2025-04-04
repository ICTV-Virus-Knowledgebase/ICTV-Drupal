
import { AlertBuilder } from "../../helpers/AlertBuilder";
import { AppSettings } from "../../global/AppSettings";
import { IRelease } from "../../models/TaxonHistory/IRelease";
import { ITaxon } from "../../models/TaxonHistory/ITaxon";
import { ITaxonDetail } from "../../models/TaxonHistory/ITaxonDetail";
import { ITaxonHistoryResult } from "../../models/TaxonHistory/ITaxonHistoryResult";
import { IdPrefix, TaxaLevel } from "../../global/Types";
import { TaxonomyHistoryService } from "../../services/TaxonomyHistoryService";
import { Utils } from "../../helpers/Utils";


// "Forward declarations" for external JavaScript libraries.
declare var jQuery: any;

enum ExportAction {
   copyToClipboard = "copyToClipboard",
   download = "download"
}

enum ExportFormat {
   csv = "csv",
   tsv = "tsv"
}

enum LineageDisplayFormat {
   horizontal = "horizontal",
   vertical = "vertical"
}

enum TaxonType {
   current = "current",
   selected = "selected"
}


export class TaxonReleaseHistory {

   allRankNamesArray: string[] = null;

   // The DOM selector for the container element.
   containerSelector: string = null;

   currentMslRelease: number;

   elements: {
      container: HTMLElement,
      currentTaxon: HTMLElement,
      dataContainer: HTMLElement,
      messagePanel: HTMLElement,
      releases: HTMLElement,
      selectedTaxon: HTMLElement
   }

   icons: { [key: string]: string; } = {
      file: "far fa-file",
      lineage: "fas fa-chevron-right",
      pdf: "far fa-file-pdf",
      spinner: "fas fa-spinner fa-spin",
      zip: "far fa-file-archive"
   }

   // An ICTV ID provided as a query string parameter.
   ictvID: string = null;

   lineageDisplayFormat: LineageDisplayFormat = LineageDisplayFormat.vertical;

   lineageLeftOffset = 15;

   // The time it will take to fade out a status message (for now this is only used by copyToClipboard).
   messageFadeTime: number = 5000;

   releaseLookup: Map<number, IRelease>;

   taxaLookup: Map<number, ITaxon>;

   // A taxnode ID provided as a query string parameter.
   taxNodeID: string = null;

   taxonHistory: ITaxonHistoryResult;

   taxonName: string = null;


   // C-tor
   constructor(containerSelector_: string, currentMslRelease_: number) {

      if (!containerSelector_) { throw new Error("Invalid container selector"); }
      this.containerSelector = containerSelector_;

      if (!currentMslRelease_) { throw new Error("Invalid current MSL release"); }
      this.currentMslRelease = currentMslRelease_;

      this.elements = {
         container: null,
         currentTaxon: null,
         dataContainer: null,
         messagePanel: null,
         releases: null,
         selectedTaxon: null
      }

      // Populate the all rank names array.
      this.allRankNamesArray = [];
      for (let rankName in TaxaLevel) {
         if (rankName !== TaxaLevel.tree) { this.allRankNamesArray.push(rankName); }
      }
   }

   addEventHandlers() {

      this.elements.releases.addEventListener("click", (event_) => {

         const target = (event_.target as HTMLElement);
         if (target.nodeName !== "BUTTON") { return false; }

         // TODO: don't I need to consume the event???

         // Get the action, lineage, and rank names attributes.
         const action = target.getAttribute("data-action") as ExportAction;
         const lineage = target.getAttribute("data-lineage");
         const rankNames = target.getAttribute("data-ranks");

         const taxNodeID = target.getAttribute("data-taxnode-id");

         // Get the tree ID and try to parse as an integer.
         const strTreeID: string = target.getAttribute("data-tree-id");
         const treeID = parseInt(strTreeID);
         if (isNaN(treeID)) { throw new Error("Invalid tree ID"); }

         // Get the export format (CSV or TSV)
         const formatEl: HTMLSelectElement = document.querySelector(`${this.containerSelector} .lineage-export-format`);
         if (!formatEl) { throw new Error("Invalid format Element"); }

         const exportFormat = formatEl.options[formatEl.selectedIndex].value as ExportFormat;

         // Should rank names be included?
         const ranksEl: HTMLSelectElement = document.querySelector(`${this.containerSelector} .lineage-export-ranks`);
         if (!ranksEl) { throw new Error("Invalid ranks Element"); }

         let includeRanks = false;
         if (ranksEl.options[ranksEl.selectedIndex].value === "true") { includeRanks = true; }

         // Should empty ranks be included?
         const includeEmptyEl: HTMLInputElement = document.querySelector(`${this.containerSelector} .include-empty-control`);
         if (!includeEmptyEl) { throw new Error("Invalid include empty Element"); }

         const includeEmptyRanks = includeEmptyEl.checked;

         // Use the tree ID to lookup the corresponding release.
         const release = this.releaseLookup.get(treeID);
         if (!release) { throw new Error(`Invalid release for tree ID ${treeID}`); }

         // Format the lineage for export, possibly including rank names.
         const formattedLineage = this.formatLineageForExport(exportFormat, includeEmptyRanks, includeRanks, lineage, rankNames);

         switch (action) {

            case ExportAction.copyToClipboard:

               this.copyToClipboard(formattedLineage, taxNodeID);
               break;

            case ExportAction.download:

               // Use the MSL release as the filename.
               const filename = `mslRelease${release.releaseNumber || ""}.${exportFormat}`;

               // Initiate the download.
               this.download(filename, formattedLineage);
               break;

            default:
               throw new Error("Invalid export action");
         }

         return false;
      })
   }

   // Append a release panel under the "releases" container Element.
   addReleasePanel(release_: IRelease) {

      const formattedTitle = release_.title.replace(/;/g, ";<br/>");

      let html =
         `<div class="release-header">
            <div class="release-year">${release_.year}</div>
            <div class="release-title">${formattedTitle}</div>
         </div>
         <div class="release-body"></div>`;

      // Create the release panel and populate it with HTML.
      const releaseEl = document.createElement("div");
      releaseEl.className = "release";
      releaseEl.setAttribute("data-tree-id", release_.treeID.toString());
      releaseEl.innerHTML = html;

      this.elements.releases.appendChild(releaseEl);
   }

   addTaxonChanges(parentEl_: HTMLElement, taxon_: ITaxon, index_: number) {

      let html = "";

      if (index_ > 0) { html += "<hr />"; }

      // Format the lineage (taxon names and ranks).
      const formattedLineage = this.displayLineage(taxon_.lineage, taxon_.lineageIDs, taxon_.rankNames);

      // Tags relevant to the current release.
      let tags = taxon_.prevTagCSV || "";
      if (tags && tags.length > 0) {

         // Trim whitespace from the beginning and end of the tags.
         tags = tags.trim();

         // Make sure they don't end in a comma.
         if (tags.endsWith(",")) { tags = tags.substring(0, tags.length - 1); }

         // Add a space after all remaining commas.
         tags = tags.replace(/,/g, ", ");

      } else {
         // If there is no tag, add the default label "Unchanged".
         tags = "Unchanged";
      }

      let proposalRow = "";

      // Proposal link(s)
      let proposalLinks = "";
      if (taxon_.prevProposal && taxon_.prevProposal.length > 0) {

         // If there are multiple proposal files, they should be delimited by semicolons.
         const filenames = taxon_.prevProposal.split(";");
         if (filenames && filenames.length > 0) {
            filenames.forEach((filename_: string) => {
               filename_ = filename_.trim();
               if (filename_.length > 0) {

                  let displayLabel = filename_;

                  const periodIndex = filename_.lastIndexOf(".");
                  if (periodIndex > 0) { displayLabel = filename_.substring(0, periodIndex); }

                  // Get an icon class specific to the file type.
                  const iconClass = this.getFileIconClass(filename_);

                  // Separate multiple links with a comma.
                  if (proposalLinks.length > 0) { proposalLinks += ", "; }

                  // Add a link to the release proposal file(s).
                  proposalLinks += `<a href="${AppSettings.releaseProposalsURL}${filename_}" target="_blank" rel="noopener noreferrer"
                            class="release-proposal-link"><i class="${iconClass}" aria-hidden="true"></i> ${displayLabel}</a>`;
               }
            })
         }

         if (!!proposalLinks) {
            proposalRow =
               `<div class="taxon-proposal">
                        <span class="download-proposals-title">Proposal:</span>${proposalLinks}
                    </div>`;
         }
      }

      html +=
         `<div class="taxon-tags">${tags}</div>
            <div class="taxon-lineage">${formattedLineage}</div>
            ${proposalRow}
            <div class="lineage-export-row">
                <div class="lineage-title">Export lineage:</div>
                <button class="btn btn-success lineage-copy-control"
                    data-action="${ExportAction.copyToClipboard}"
                    data-lineage="${taxon_.lineage}"
                    data-ranks="${taxon_.rankNames}"
                    data-taxnode-id="${taxon_.taxnodeID}" 
                    data-tree-id="${taxon_.treeID}">
                    <i class="far fa-copy"></i> Copy to the clipboard
                </button>
                <span class="between-buttons">or</span>
                <button class="btn btn-primary lineage-download-control"
                    data-action="${ExportAction.download}" 
                    data-lineage="${taxon_.lineage}"
                    data-ranks="${taxon_.rankNames}"
                    data-taxnode-id="${taxon_.taxnodeID}" 
                    data-tree-id="${taxon_.treeID}">
                    <i class="fas fa-download"></i> Download
                </button>
                <div class="copy-status" data-taxnode-id="${taxon_.taxnodeID}" style="display: none">
                    <i class="fas fa-check"></i> Copied successfully
                </div>
            </div>`;

      let taxonChangesEl: HTMLDivElement = document.createElement("div");
      taxonChangesEl.innerHTML = html;
      parentEl_.append(taxonChangesEl);
   }

   // Copy the text to the clipboard.
   // Info: https://caniuse.com/?search=clipboard
   copyToClipboard(text_: string, taxNodeID_: string) {

      navigator.clipboard.writeText(text_).then(() => {

         // Populate and display the success message, then fade out and revert to the initial state.
         jQuery(`${this.containerSelector} .copy-status[data-taxnode-id="${taxNodeID_}"]`)
            .show()
            .fadeOut(this.messageFadeTime, () => {
               jQuery(this).hide();
            });

      }, (reason_) => {
         // The Promise was rejected.
         throw new Error(`Unable to copy to clipboard: ${reason_}`);
      })
   }

   displayLineage(lineage_: string, lineageIDs_: string, ranks_: string): string {

      let html = "";

      if (lineage_.endsWith(";")) { lineage_ = lineage_.substring(0, lineage_.length - 1); }
      if (lineageIDs_.endsWith(";")) { lineageIDs_ = lineageIDs_.substring(0, lineageIDs_.length - 1); }
      if (ranks_.endsWith(";")) { ranks_ = ranks_.substring(0, ranks_.length - 1); }

      // Create arrays from the delimited strings.
      const lineageArray = lineage_.split(";");
      const lineageIdArray = lineageIDs_.split(";");
      const rankArray = ranks_.split(";");

      // Validate the array lengths.
      if (lineageArray.length !== rankArray.length) { throw new Error("The number of taxa and ranks don't match"); }
      if (lineageIdArray.length !== lineageArray.length) { throw new Error("The number of lineage IDs and taxa don't match"); }

      let leftOffset = 0;

      lineageArray.forEach((taxonName_: string, index_: number) => {

         const formattedName = Utils.italicizeTaxonName(taxonName_);

         // Lookup the taxon's taxnode ID (lineage ID) and rank name.
         let lineageID = lineageIdArray[index_];
         let rankName = rankArray[index_];

         const lineageURL = `${AppSettings.applicationURL}/${AppSettings.taxonHistoryPage}?taxnode_id=${lineageID}&taxon_name=${taxonName_}"`;

         const linkedName = `<a href="${lineageURL}" target="_blank">${formattedName}</a>`;


         if (this.lineageDisplayFormat === LineageDisplayFormat.horizontal) {

            // Add an icon to delimit the lineage entries.
            if (index_ > 0) { html += `<span class="lineage-chevron" aria-hidden="true"><i class="${this.icons.lineage}"></i></span>`; }

            // Add the rank and linked name.
            html += `<span class="horizontal-lineage" title="${rankName}">${linkedName}</span>`;

         } else {

            // Add the rank and linked name.
            html += `<div class="lineage-row" style="margin-left: ${leftOffset}px">
                  <div class="rank-name">${rankName}</div>: 
                  <div class="taxon-name">${linkedName}</div>
               </div>`;
         }

         leftOffset += this.lineageLeftOffset;
      })

      return html;
   }

   displayMessage(message_: string) {

      // Hide the container
      this.elements.container.setAttribute("data-is-visible", "false");

      // Populate and show the message panel.
      this.elements.messagePanel.innerHTML = message_;
      this.elements.messagePanel.setAttribute("data-is-visible", "true");

      return false;
   }

   // Open a dialog to download the text as the filename provided.
   download(filename_: string, text_: string) {

      const linkEl = document.createElement('a');
      linkEl.setAttribute("href", `data:text/plain;charset=utf-8,${encodeURIComponent(text_)}`);
      linkEl.setAttribute("download", filename_);

      if (document.createEvent) {
         const event = document.createEvent("MouseEvents");
         event.initEvent("click", true, true);
         linkEl.dispatchEvent(event);
      } else {
         linkEl.click();
      }
   }

   // Format the lineage for export, possibly including rank names.
   formatLineageForExport(format_: string, includeEmptyRanks_: boolean, includeRanks_: boolean, names_: string,
      rankNames_: string): string {

      if (!names_) { throw new Error("Invalid names parameter"); }

      names_ = names_.trim();
      if (names_.endsWith(";")) { names_ = names_.substring(0, names_.length - 1); }

      if (!!rankNames_) { rankNames_ = rankNames_.trim(); }
      if (rankNames_.endsWith(";")) { rankNames_ = rankNames_.substring(0, rankNames_.length - 1); }

      // Initialize the delimiter and final result.
      let delimiter = "";
      let result = "";

      // The export format will either be "tsv" or "csv".
      switch (format_) {
         case ExportFormat.csv:
            delimiter = ",";
            break;

         case ExportFormat.tsv:
            delimiter = "\t";
            break;

         default:
            AlertBuilder.displayErrorSync("Invalid format type (empty)");
            return null;
      }

      // Split the delimited lists into arrays.
      const namesArray = names_.split(";");
      const rankNamesArray = rankNames_.split(";")

      // Should we include rank names?
      if (includeRanks_ && rankNames_.length > 0) {

         if (includeEmptyRanks_) {

            // Include all rank names, even if not available in this release.
            this.allRankNamesArray.forEach((rankName_: string) => {
               result += `${rankName_.trim()}${delimiter}`;
            })

         } else {

            // Only include the rank names that were provided.
            rankNamesArray.forEach((rankName_: string) => {
               if (!!rankName_) { result += `${rankName_.trim()}${delimiter}`; }
            })
         }

         result += "\n";
      }

      // Include the taxa names
      if (includeEmptyRanks_) {

         let rankIndex = 0;

         // Iterate over all rank names, including ranks without names.
         this.allRankNamesArray.forEach((rankName_: string) => {

            rankName_ = rankName_.toLowerCase();

            let includedRankName = null;

            if (rankNamesArray.length >= (rankIndex + 1)) {
               includedRankName = rankNamesArray[rankIndex];
               if (!!includedRankName) { includedRankName = includedRankName.toLowerCase(); }
            }

            // Is there a valid "included" rank name that matches the rank name from "all" rank names?
            if (!!includedRankName && rankName_ === includedRankName) {

               // Since the "included" rank exists, there should also be a name at this index.
               let name = "";

               if (namesArray.length >= (rankIndex + 1)) {
                  name = namesArray[rankIndex];
               } else {
                  // This shouldn't be reached!
                  console.log(`Invalid name at rank index ${rankIndex}`)
               }

               result += `${name.trim()}${delimiter}`

               rankIndex += 1;

            } else {
               result += `${delimiter}`
            }
         })

      } else {

         // Only include the specified names.
         namesArray.forEach((name_: string) => {
            result += `${name_.trim()}${delimiter}`
         })
      }

      return result;
   }

   // Get the history of taxa with this ictv_id over all releases.
   async getByIctvID() {

      // Validate the ICTV ID.
      if (!this.ictvID) { return await AlertBuilder.displayError("Invalid ICTV ID"); }

      // Create and display the spinner.
      const spinner: string = this.getSpinnerHTML("Loading history...");
      this.displayMessage(spinner);

      this.taxonHistory = await TaxonomyHistoryService.getByIctvID(this.currentMslRelease, this.ictvID);
      if (!this.taxonHistory) { return this.displayMessage("No history is available"); }

      // Hide the spinner icon.
      this.displayMessage("");

      return this.processHistory();
   }

   // Get the history of the taxon with this taxnode_id over all releases.
   async getByTaxNodeID() {

      // Validate the tax node ID.
      if (!this.taxNodeID) { return await AlertBuilder.displayError("Invalid taxnode ID"); }

      // Create and display the spinner.
      const spinner: string = this.getSpinnerHTML("Loading history...");
      this.displayMessage(spinner);

      this.taxonHistory = await TaxonomyHistoryService.getByTaxNodeID(this.currentMslRelease, this.taxNodeID);
      if (!this.taxonHistory) { return this.displayMessage("No history is available"); }

      // Hide the spinner icon.
      this.displayMessage("");

      return this.processHistory();
   }

   // Get the history of taxa with this name over all releases.
   async getByTaxonName() {

      // Validate the tax node ID.
      if (!this.taxonName) { return AlertBuilder.displayError("Invalid taxon name"); }

      // Create and display the spinner.
      const spinner: string = this.getSpinnerHTML("Loading history...");
      this.displayMessage(spinner);

      this.taxonHistory = await TaxonomyHistoryService.getByName(this.currentMslRelease, this.taxonName);
      if (!this.taxonHistory) { return this.displayMessage("No history is available"); }

      // Hide the spinner icon.
      this.displayMessage("");

      return this.processHistory();
   }

   // Get the icon class that matches the filename's extension.
   getFileIconClass(filename_: string): string {

      if (!filename_) { return ""; }

      const periodIndex = filename_.lastIndexOf(".");
      if (periodIndex < 0) { return "far fa-file"; }

      const extension = filename_.substring(periodIndex);

      switch (extension) {
         case ".pdf":
            return this.icons.pdf;
         case ".zip":
            return this.icons.zip;
         default:
            return this.icons.file;
      }
   }

   // Return a DIV that contains the spinner icon and optional text.
   getSpinnerHTML(spinnerText_?: string): string {

      const spinnerText = !spinnerText_ ? "" : ` ${spinnerText_}`;

      return `<div class="spinner-ctrl"><i class="${this.icons.spinner}"></i>${spinnerText}</div>`;
   }

   async initialize() {

      /*
      Version as of 17:30 on 040125

      <div class="taxon-title selected">Your selection</div>
      <div class="taxon selected">
         <div class="taxon-rank"></div>:
         <div class="taxon-name"></div>
         <div class="taxon-release"></div>
      </div>
      <div class="lineage selected"></div> 

      <div class="taxon-title current">The current taxon</div>
      <div class="taxon current">
         <div class="taxon-rank"></div>:
         <div class="taxon-name"></div>
         <div class="taxon-release"></div>
      </div>
      <div class="lineage current"></div> 
      */

      // Generate the component's HTML.
      let html: string =
         `<div class="message-panel" data-is-visible="true"></div>
         <div class="data-container" data-is-visible="false">

            <div class="taxon selected">
               <div class="taxon-title selected">Your selection <span class="taxon-release"></span></div>
               <div class="info-row">
                  <div class="taxon-rank"></div>: <div class="taxon-name"></div>
               </div>
               <div class="lineage selected"></div>
            </div>
            
            <div class="taxon current">
               <div class="taxon-title current">Current release <span class="taxon-release"></span></div>
               <div class="info-row">
                  <div class="taxon-rank"></div>: <div class="taxon-name"></div>
               </div>
               <div class="lineage current"></div>
            </div>
            
            <div class="settings-panel">
               <div class="settings-title">Export settings</div>
               <div class="settings-row">
                  <div class="settings-label">Export lineage as </div>
                  <select class="lineage-export-format">
                     <option value="${ExportFormat.tsv}" selected>tab-separated text</option>
                     <option value="${ExportFormat.csv}">comma-separated text</option>
                  </select>
                  <select class="lineage-export-rank">
                     <option value="true">with rank names</option>
                     <option value="false" selected>without rank names</option>
                  </select>
               </div>
               <div class="settings-row">
                  <div class="settings-label">Include empty ranks</div>
                  <input type="checkbox" class="include-empty-control" checked></input>
               </div>
            </div>
            <div class="releases"></div>
         </div>`;

      // Get a reference to the container Element.
      this.elements.container = document.querySelector(this.containerSelector);
      if (!this.elements.container) { throw new Error("Invalid container Element"); }

      // Populate the container HTML.
      this.elements.container.innerHTML = html;

      this.elements.currentTaxon = this.elements.container.querySelector(".taxon.current");
      if (!this.elements.currentTaxon) { throw new Error("Invalid current taxon element"); }

      this.elements.messagePanel = this.elements.container.querySelector(".message-panel");
      if (!this.elements.messagePanel) { throw new Error("Invalid message panel element"); }

      this.elements.releases = this.elements.container.querySelector(".releases");
      if (!this.elements.releases) { throw new Error("Invalid releases element"); }

      this.elements.selectedTaxon = this.elements.container.querySelector(".taxon.selected");
      if (!this.elements.selectedTaxon) { throw new Error("Invalid selected taxon element"); }


      //---------------------------------------------------------------------------------------------------------------------------------------------------
      // Look for a taxnode_id, ictv_id, or taxon_name in the URL query parameters.
      //---------------------------------------------------------------------------------------------------------------------------------------------------
      const urlParams = new URLSearchParams(window.location.search);

      // Taxnode_id takes precedence over other possible parameters.
      this.taxNodeID = Utils.safeTrim(urlParams.get("taxnode_id"));
      if (!!this.taxNodeID) {
         if (this.taxNodeID.startsWith(IdPrefix.taxnodeID)) { this.taxNodeID = this.taxNodeID.replace(IdPrefix.taxnodeID, ""); }
         return await this.getByTaxNodeID(); 
      }

      // Ictv_id takes precedence over the taxon_name parameter.
      this.ictvID = Utils.safeTrim(urlParams.get("ictv_id"));
      if (!!this.ictvID) { 
         if (this.ictvID.startsWith(IdPrefix.ictvID)) { this.ictvID = this.ictvID.replace(IdPrefix.ictvID, ""); }
         return await this.getByIctvID(); 
      }

      // Try to retrieve data using the taxon_name parameter.
      this.taxonName = Utils.safeTrim(urlParams.get("taxon_name"));
      if (!!this.taxonName) { return await this.getByTaxonName(); }
      
      return await AlertBuilder.displayError("No valid parameters were provideed. The following parameters are accepted: taxnode_id, ictv_id, and taxon_name");
   }


   populateTaxon(taxon_: ITaxonDetail, type_: TaxonType) {

      // Convert the numeric tree ID to a release year.
      const releaseYear = Utils.convertTreeIdToYear(taxon_.treeID);

      const parentClass = `.taxon.${type_}`;

      const parentEl = this.elements.container.querySelector(parentClass);
      if (!parentEl) { throw new Error(`Unable to find the ${type_} taxon element`)};

      // The taxon's rank
      const rankEl = parentEl.querySelector(`.taxon-rank`);
      if (!rankEl) { throw new Error("Unable to find the taxon-rank element"); }
      rankEl.innerHTML = taxon_.rankName;

      // The taxon's name
      const nameEl = parentEl.querySelector(`.taxon-name`);
      if (!nameEl) { throw new Error("Unable to find the taxon-name element"); }
      nameEl.innerHTML = taxon_.taxonName;

      // The taxon's MSL release
      const releaseEl = parentEl.querySelector(`.taxon-release`);
      if (!releaseEl) { throw new Error("Unable to find the taxon-release element"); }
      releaseEl.innerHTML = `(${releaseYear} Release, MSL #${taxon_.mslRelease})`
      
      // Display the full lineage of the taxa.
      if (taxon_.lineage && taxon_.lineageIDs && taxon_.rankNames) {

         // Format the lineage as HTML.
         const formattedLineage = this.displayLineage(taxon_.lineage, taxon_.lineageIDs, taxon_.rankNames);

         // Populate the lineage element.
         const lineageEl = parentEl.querySelector(`.lineage`);
         if (!lineageEl) { throw new Error(`Invalid ${type_} lineage element`); }
         lineageEl.innerHTML = formattedLineage;
      }

      // Make the taxon element visible.
      parentEl.classList.add("visible");
   }

   
   processHistory() {

      // Validate the current taxon.
      if (!this.taxonHistory.currentTaxon) { return this.displayMessage("No history is available: Invalid current taxon"); }

      // Validate the selected taxon.
      if (!this.taxonHistory.selectedTaxon) { return this.displayMessage("No history is available: Invalid selected taxon"); }

      // Validate the releases
      if (!this.taxonHistory.releases || this.taxonHistory.releases.length < 1) { return this.displayMessage("No history is available: Invalid MSL Release(s)"); }

      // Validate the taxa
      if (!this.taxonHistory.taxa || this.taxonHistory.taxa.length < 1) { return this.displayMessage("No history is available: No modified taxa available"); }

      // Show the container and hide the message panel.
      this.elements.container.setAttribute("data-is-visible", "true");
      this.elements.messagePanel.setAttribute("data-is-visible", "false");

      // Populate the selected taxon.
      this.populateTaxon(this.taxonHistory.selectedTaxon, TaxonType.selected);
      
      // Populate the current taxon.
      this.populateTaxon(this.taxonHistory.currentTaxon, TaxonType.current);

      // A lookup from release tree ID to the corresponding release object.
      this.releaseLookup = new Map<number, IRelease>();

      // An array of release tree IDs in descending order.
      let releaseOrder = [];

      // Iterate over all releases where this taxon has been updated.
      this.taxonHistory.releases.forEach((release_: IRelease) => {

         // Create HTML for the release and add it to the page.
         this.addReleasePanel(release_);

         // Add the release's tree ID to the ordered list
         releaseOrder.push(release_.treeID);

         // Initialize the release's aray of modified taxa.
         release_.taxa = [];

         // Trim the list of available rank names and remove a trailing comma.
         let rankNames = release_.rankNames;
         rankNames = rankNames.trim();
         if (rankNames.endsWith(",")) { rankNames = rankNames.substring(0, rankNames.length - 2); }
         release_.rankNames = rankNames;

         // Determine the CSS selector of the release's "taxa Element".
         let taxaElementSelector = `.releases .release[data-tree-id="${release_.treeID}"] .release-body`;

         release_.taxaElement = document.querySelector(taxaElementSelector);
         if (!release_.taxaElement) { throw new Error(`Invalid release panel for tree ID ${release_.treeID}`); }

         // Add the release to the lookup.
         this.releaseLookup.set(release_.treeID, release_);
      })

      // Iterate over all taxa from the taxon's history.
      this.taxonHistory.taxa.forEach((taxon_: ITaxon) => {

         const treeID = taxon_.treeID;

         const release = this.releaseLookup.get(treeID);
         if (!release) { throw new Error(`Invalid release for tree ID ${treeID}`); }

         const taxonIndex = release.taxa.length;

         // Add the modified taxon to its release.
         release.taxa.push(taxon_);

         // Add the release back to the lookup.
         this.releaseLookup.set(treeID, release);

         this.addTaxonChanges(release.taxaElement, taxon_, taxonIndex);
      })

      // Add event handlers to all controls.
      this.addEventHandlers();
   }

}