
import { AppSettings } from "../../global/AppSettings";
import { IRelease } from "../../models/TaxonHistory/IRelease";
import { ITaxon } from "../../models/TaxonHistory/ITaxon";
import { ITaxonHistoryResult } from "../../models/TaxonHistory/ITaxonHistoryResult";
import { TaxaLevel } from "../../global/Types";
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


export class TaxonReleaseHistory {

   allRankNamesArray: string[] = null;

   // CSS classes
   cssClasses: { [key: string]: string; } = {
      container: "taxon-release-history",
      copyStatus: "copy-status",
      exportLineageLabel: "export-lineage-label",
      includeEmptyControl: "include-empty-control",
      includeEmptyLabel: "include-empty-label",
      lineageCopyControl: "lineage-copy-control",
      lineageDownloadControl: "lineage-download-control",
      lineageExportFormat: "lineage-export-format",
      lineageExportRanks: "lineage-export-ranks",
      lineageExportRow: "lineage-export-row",
      lineageRow: "lineage-row",
      messagePanel: "taxon-release-history-message",
      rankName: "rank-name",
      releaseHeader: "release-header",
      release: "release",
      releaseBody: "release-body",
      releases: "releases",
      releaseTitle: "release-title",
      releaseYear: "release-year",
      settingsLabel: "settings-label",
      settingsPanel: "settings-panel",
      settingsRow: "settings-row",
      settingsTitle: "settings-title",
      taxonName: "taxon-name",
      titleLineage: "title-lineage",
      titleRow: "title-row",
      titleName: "title-name",
      titleRank: "title-rank",
      titleRelease: "title-release"
   }

   currentMslRelease: number;

   elements: {
      container: HTMLElement,
      messagePanel: HTMLElement,
      parent: HTMLElement,
      releases: HTMLElement
   }

   icons: { [key: string]: string; } = {
      lineage: "fas fa-chevron-right",
      spinner: "fas fa-spinner fa-spin"
   }

   // An ICTV ID provided as a query string parameter.
   ictvID: string = null;

   lineageDisplayFormat: LineageDisplayFormat = LineageDisplayFormat.vertical;

   lineageLeftOffset = 15;

   // The time it will take to fade out a status message (for now this is only used by copyToClipboard).
   messageFadeTime: number = 5000;

   releaseLookup: Map<number, IRelease>;

   // DOM selectors
   selectors: { [key: string]: string; } = {
      container: null,
      parent: null
   }

   taxaLookup: Map<number, ITaxon>;

   // A taxnode ID provided as a query string parameter.
   taxNodeID: string = null;

   taxonHistory: ITaxonHistoryResult;


   // C-tor
   constructor(currentMslRelease_: number, parentSelector_: string) {

      if (!currentMslRelease_) { throw new Error("Invalid current MSL release"); }
      this.currentMslRelease = currentMslRelease_;

      if (!parentSelector_) { throw new Error("Invalid parent selector"); }

      this.selectors.parent = parentSelector_;
      this.selectors.container = `${parentSelector_} .${this.cssClasses.container}`;
      this.selectors.messagePanel = `${parentSelector_} .${this.cssClasses.messagePanel}`;
      this.selectors.releases = `${parentSelector_} .${this.cssClasses.releases}`;
      this.selectors.titleRow = `${parentSelector_} .${this.cssClasses.titleRow}`;

      this.elements = {
         container: null,
         messagePanel: null,
         parent: null,
         releases: null
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
         const formatEl: HTMLSelectElement = document.querySelector(`${this.selectors.container} .${this.cssClasses.lineageExportFormat}`);
         if (!formatEl) { throw new Error("Invalid format Element"); }

         const exportFormat = formatEl.options[formatEl.selectedIndex].value as ExportFormat;

         // Should rank names be included?
         const ranksEl: HTMLSelectElement = document.querySelector(`${this.selectors.container} .${this.cssClasses.lineageExportRanks}`);
         if (!ranksEl) { throw new Error("Invalid ranks Element"); }

         let includeRanks = false;
         if (ranksEl.options[ranksEl.selectedIndex].value === "true") { includeRanks = true; }

         // Should empty ranks be included?
         const includeEmptyEl: HTMLInputElement = document.querySelector(`${this.selectors.container} .${this.cssClasses.includeEmptyControl}`);
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
         `<div class="${this.cssClasses.releaseHeader}">
                <div class="${this.cssClasses.releaseYear}">${release_.year}</div>
                <div class="${this.cssClasses.releaseTitle}">${formattedTitle}</div>
            </div>
            <div class="${this.cssClasses.releaseBody}"></div>`;

      // Create the release panel and populate it with HTML.
      const releaseEl = document.createElement("div");
      releaseEl.className = this.cssClasses.release;
      releaseEl.setAttribute("data-tree-id", release_.treeID.toString());
      releaseEl.innerHTML = html;

      jQuery(this.selectors.releases).append(releaseEl);
   }

   addTaxonChanges(parentEl_: HTMLElement, taxon_: ITaxon, index_: number) {

      let html = "";

      if (index_ > 0) { html += "<hr />"; }

      // Format the lineage (taxon names and ranks).
      const formattedLineage = this.displayLineage(taxon_.lineage, taxon_.rankNames);

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
            <div class="${this.cssClasses.lineageExportRow}">
                <div class="lineage-title">Export lineage:</div>
                <button class="btn btn-success ${this.cssClasses.lineageCopyControl}"
                    data-action="${ExportAction.copyToClipboard}"
                    data-lineage="${taxon_.lineage}"
                    data-ranks="${taxon_.rankNames}"
                    data-taxnode-id="${taxon_.taxnodeID}" 
                    data-tree-id="${taxon_.treeID}">
                    <i class="far fa-copy"></i> Copy to the clipboard
                </button>
                <span class="between-buttons">or</span>
                <button class="btn btn-primary ${this.cssClasses.lineageDownloadControl}"
                    data-action="${ExportAction.download}" 
                    data-lineage="${taxon_.lineage}"
                    data-ranks="${taxon_.rankNames}"
                    data-taxnode-id="${taxon_.taxnodeID}" 
                    data-tree-id="${taxon_.treeID}">
                    <i class="fas fa-download"></i> Download
                </button>
                <div class="${this.cssClasses.copyStatus}" data-taxnode-id="${taxon_.taxnodeID}" style="display: none">
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
         jQuery(`${this.selectors.container} .${this.cssClasses.copyStatus}[data-taxnode-id="${taxNodeID_}"]`)
            .show()
            .fadeOut(this.messageFadeTime, () => {
               jQuery(this).hide();
            });

      }, (reason_) => {
         // The Promise was rejected.
         throw new Error(`Unable to copy to clipboard: ${reason_}`);
      })
   }

   displayLineage(lineage_: string, ranks_: string): string {

      let html = "";

      if (lineage_.endsWith(";")) { lineage_ = lineage_.substring(0, lineage_.length - 1); }
      if (ranks_.endsWith(";")) { ranks_ = ranks_.substring(0, ranks_.length - 1); }

      const lineageArray = lineage_.split(";");
      const rankArray = ranks_.split(";");

      if (lineageArray.length !== rankArray.length) { throw new Error("The number of taxa and ranks don't match"); }

      let leftOffset = 0;

      lineageArray.forEach((taxonName_: string, index_: number) => {

         const formattedName = Utils.italicizeTaxonName(taxonName_);

         let rankName = rankArray[index_];

         if (this.lineageDisplayFormat === LineageDisplayFormat.horizontal) {

            if (index_ > 0) { html += `<span class="lineage-chevron" aria-hidden="true"><i class="${this.icons.lineage}"></i></span>`; }

            html += `<span class="horizontal-lineage" title="${rankName}">${formattedName}</span>`;

         } else {

            html +=
               `<div class="${this.cssClasses.lineageRow}" style="margin-left: ${leftOffset}px">
                        <div class="${this.cssClasses.rankName}">${rankName}</div>: 
                        <div class="${this.cssClasses.taxonName}">${formattedName}</div>
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
            alert("Invalid format type (empty)");
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


   // Get the history of the specified taxa node over all releases.
   async getByIctvID(ictvID_: string) {

      // Validate and maintain the ICTV ID.
      if (!ictvID_) { alert("Invalid ICTV ID"); return false; }
      this.ictvID = ictvID_;

      // Create and display the spinner.
      const spinner: string = this.getSpinnerHTML("Loading history...");
      this.displayMessage(spinner);

      this.taxonHistory = await TaxonomyHistoryService.getByIctvID(this.currentMslRelease, this.ictvID);
      if (!this.taxonHistory) { return this.displayMessage("No history is available"); }

      // Hide the spinner icon.
      this.displayMessage("");

      return this.processHistory();
   }

   // Get the history of the specified taxa node over all releases.
   async getByTaxNodeID(taxNodeID_: string) {

      // Validate and maintain the tax node ID.
      if (!taxNodeID_) { alert("Invalid taxnode ID"); return false; }
      this.taxNodeID = taxNodeID_;

      // Create and display the spinner.
      const spinner: string = this.getSpinnerHTML("Loading history...");
      this.displayMessage(spinner);

      this.taxonHistory = await TaxonomyHistoryService.getByTaxNodeID(this.currentMslRelease, this.taxNodeID);
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
            return "far fa-file-pdf";
         case ".zip":
            return "far fa-file-archive";
         default:
            return "far fa-file";
      }
   }

   // Return a DIV that contains the spinner icon and optional text.
   getSpinnerHTML(spinnerText_?: string): string {

      const spinnerText = !spinnerText_ ? "" : ` ${spinnerText_}`;

      return `<div class="spinner-ctrl"><i class="${this.icons.spinner}"></i>${spinnerText}</div>`;
   }

   async initialize() {

      // Get a reference to the parent Element.
      this.elements.parent = document.querySelector(this.selectors.parent);
      if (!this.elements.parent) { throw new Error("Invalid parent Element"); }

      let html: string =
         `<div class="${this.cssClasses.messagePanel}" data-is-visible="true"></div>
            <div class="${this.cssClasses.container}" data-is-visible="false">
                <div class="${this.cssClasses.titleRow}">
                    <div class="${this.cssClasses.titleRank}"></div>:
                    <div class="${this.cssClasses.titleName}"></div>
                    <div class="${this.cssClasses.titleRelease}"></div>
                </div>
                <div class="${this.cssClasses.titleLineage}"></div>   
                <div class="${this.cssClasses.settingsPanel}">
                    <div class="${this.cssClasses.settingsTitle}">Export settings</div>
                    <div class="${this.cssClasses.settingsRow}">
                        <div class="${this.cssClasses.settingsLabel}">Export lineage as </div>
                        <select class="${this.cssClasses.lineageExportFormat}">
                            <option value="${ExportFormat.tsv}" selected>tab-separated text</option>
                            <option value="${ExportFormat.csv}">comma-separated text</option>
                        </select>
                        <select class="${this.cssClasses.lineageExportRanks}">
                            <option value="true">with rank names</option>
                            <option value="false" selected>without rank names</option>
                        </select>
                    </div>
                    <div class="${this.cssClasses.settingsRow}">
                        <div class="${this.cssClasses.settingsLabel}">Include empty ranks</div>
                        <input type="checkbox" class="${this.cssClasses.includeEmptyControl}" checked></input>
                    </div>
                </div>
                <div class="${this.cssClasses.releases}"></div>
            </div>`;

      this.elements.parent.innerHTML = html;

      // Get a reference to the container Element.
      this.elements.container = document.querySelector(this.selectors.container);
      if (!this.elements.container) { throw new Error("Invalid container Element"); }

      // Get a reference to the message panel Element.
      this.elements.messagePanel = document.querySelector(this.selectors.messagePanel);
      if (!this.elements.messagePanel) { throw new Error("Invalid message panel Element"); }

      // Get a reference to the releases Element.
      this.elements.releases = document.querySelector(this.selectors.releases);
      if (!this.elements.releases) { throw new Error("Invalid releases Element"); }


      // Look for an ICTV ID and taxnode ID in the URL search parameters.
      const urlParams = new URLSearchParams(window.location.search);
      //const urlParams = (new URL(window.location)).searchParams;

      this.ictvID = urlParams.get("ictv_id");
      this.taxNodeID = urlParams.get("taxnode_id");

      if (!!this.ictvID) { 
         await this.getByIctvID(this.ictvID);
      } else if (!!this.taxNodeID) {
         await this.getByTaxNodeID(this.taxNodeID);
      }
      
      //if (!taxNodeID) { console.log("error!"); throw new Error("Unable to display taxonomy history: Invalid tax node ID parameter"); }
   }


   processHistory() {

      // Validate the taxon details
      if (!this.taxonHistory.detail) {
         return this.displayMessage("No history is available: Invalid taxon detail");
      }

      // Validate the releases
      if (!this.taxonHistory.releases || this.taxonHistory.releases.length < 1) {
         return this.displayMessage("No history is available: Invalid MSL Release(s)");
      }

      // Validate the taxa
      if (!this.taxonHistory.taxa || this.taxonHistory.taxa.length < 1) {
         return this.displayMessage("No history is available: No modified taxa available");
      }

      // Show the container and hide the message panel.
      this.elements.container.setAttribute("data-is-visible", "true");
      this.elements.messagePanel.setAttribute("data-is-visible", "false");

      // The taxon detail
      const taxonDetail = this.taxonHistory.detail;

      // Convert the numeric tree ID to a release year.
      const releaseYear = Utils.convertTreeIdToYear(taxonDetail.treeID);

      // Populate the taxon rank, name, and MSL release.
      jQuery(`${this.selectors.titleRow} .${this.cssClasses.titleRank}`).html(taxonDetail.rankName);
      jQuery(`${this.selectors.titleRow} .${this.cssClasses.titleName}`).html(taxonDetail.taxonName);
      jQuery(`${this.selectors.titleRow} .${this.cssClasses.titleRelease}`).html(`(${releaseYear} Release, MSL #${taxonDetail.mslRelease})`);

      // Display the full lineage of the taxa.
      if (taxonDetail.lineage) {

         const formattedLineage = this.displayLineage(taxonDetail.lineage, taxonDetail.rankNames);

         jQuery(`${this.selectors.container} .${this.cssClasses.titleLineage}`).html(formattedLineage);
      }

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
         let taxaElementSelector = `${this.selectors.releases} 
                .${this.cssClasses.release}[data-tree-id="${release_.treeID}"] 
                .${this.cssClasses.releaseBody}`

         release_.taxaElement = document.querySelector(taxaElementSelector);
         if (!release_.taxaElement) { throw new Error(`Invalid release panel for tree ID ${release_.treeID}`); }

         // Add the release to the lookup.
         this.releaseLookup.set(release_.treeID, release_);
      })

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