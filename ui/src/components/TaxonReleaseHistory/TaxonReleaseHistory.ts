
import { AlertBuilder } from "../../helpers/AlertBuilder";
import { AppSettings } from "../../global/AppSettings";
import { IRelease } from "../../models/TaxonHistory/IRelease";
import { ITaxon } from "../../models/TaxonHistory/ITaxon";
import { ITaxonHistoryResult } from "../../models/TaxonHistory/ITaxonHistoryResult";
import { IdentifierType, LookupReleaseAction, LookupReleaseActionDefinition, ReleaseAction, TaxaLevel, WebStorageKey } from "../../global/Types";
/*import Swiper from 'swiper';
import { Navigation, Pagination } from 'swiper/modules';*/
import { TaxonomyHistoryService } from "../../services/TaxonomyHistoryService";
import { Utils } from "../../helpers/Utils";
import { IIdentifierData } from "../../models/IIdentifierData";

/*
// import Swiper and modules styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination'; */

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
      dataContainer: HTMLElement,
      messagePanel: HTMLElement,
      releases: HTMLElement,
      selectedTaxon: HTMLElement,
      settingsDialog: HTMLElement
   }

   // Settings for the lineage export.
   exportSettings: {
      format: ExportFormat,
      includeEmptyRanks: boolean,
      includeRanks: boolean,
   }

   icons: { [key: string]: string; } = {
      close: "fa-solid fa-ban",
      collapsed: "fa fa-chevron-right",
      copy: "far fa-copy",
      download: "fa-regular fa-download",
      expanded: "fa fa-chevron-down",
      file: "far fa-file",
      lineage: "fas fa-chevron-right",
      pdf: "far fa-file-pdf",
      save: "fa-solid fa-floppy-disk",
      settings: "fa-solid fa-gear",
      spinner: "fas fa-spinner fa-spin",
      success: "fas fa-check",
      zip: "far fa-file-archive"
   }

   // An ICTV ID provided as a query string parameter.
   ictvID: string = null;

   // Should lineages be displayed horizontally or vertically?
   lineageDisplayFormat: LineageDisplayFormat = LineageDisplayFormat.horizontal;

   // Each lineage rank will be indented by this amount when displayed vertically.
   lineageLeftOffset = 0.75;

   // The time it will take to fade out a status message (for now this is only used by copyToClipboard).
   messageFadeTime: number = 5000;

   releaseLookup: Map<number, IRelease>;

   selectedTaxon: ITaxon = null;

   taxaLookup: Map<number, ITaxon>;

   // A taxnode ID provided as a query string parameter.
   taxNodeID: string = null;

   taxonHistory: ITaxonHistoryResult;

   taxonName: string = null;

   // A VMR ID provided as a query string parameter.
   vmrID: string = null;


   // C-tor
   constructor(containerSelector_: string, currentMslRelease_: number) {

      if (!containerSelector_) { throw new Error("Invalid container selector"); }
      this.containerSelector = containerSelector_;

      if (!currentMslRelease_) { throw new Error("Invalid current MSL release"); }
      this.currentMslRelease = currentMslRelease_;

      this.elements = {
         container: null,
         dataContainer: null,
         messagePanel: null,
         releases: null,
         selectedTaxon: null,
         settingsDialog: null
      }

      // Default settings for the lineage export.
      this.exportSettings = {
         format: ExportFormat.tsv,
         includeEmptyRanks: false,
         includeRanks: false
      }

      // Populate the all rank names array.
      this.allRankNamesArray = [];
      for (let rankName in TaxaLevel) {
         if (rankName !== TaxaLevel.tree) { this.allRankNamesArray.push(rankName); }
      }
   }

   addEventHandlers() {

      this.elements.releases.addEventListener("click", (event_) => {

         let target = (event_.target as HTMLElement);
      
         // Was the export settings button clicked?
         if (target.classList.contains("settings-button")) { return this.openSettingsDialog(); }

         // Was an export button clicked?
         const action = target.getAttribute("data-action") as ExportAction;
         if (!!action) {

            const ictvID = target.getAttribute("data-ictv-id");
            const lineage = target.getAttribute("data-lineage");
            const name = target.getAttribute("data-name");
            const rankNames = target.getAttribute("data-ranks");
            const releaseNumber = target.getAttribute("data-msl");
            const taxNodeID = target.getAttribute("data-taxnode-id");

            // Export the lineage
            return this.exportLineage(action, ictvID, lineage, name, rankNames, releaseNumber, taxNodeID);
         }
         
         return;
      })
   }

   // Append a release panel under the "releases" container Element.
   addReleasePanel(release_: IRelease) {

      // Replace the semicolons with line breaks.
      const formattedTitle = release_.title.replace(/;/g, "<br/>");

      // The current release will have the label "CURRENT" added.
      const isCurrent = release_.releaseNumber == this.currentMslRelease ? "CURRENT RELEASE" : "";

      let html =
         `<a name="release_${release_.releaseNumber}"></a>
         <div class="release-header">
            <div class="release-year">${release_.year}</div>
            <div class="release-title">${formattedTitle}</div>
            <div class="is-current">${isCurrent}</div>
         </div>
         <div class="release-body"></div>`;

      // Create the release panel and populate it with HTML.
      const releaseEl = document.createElement("div");
      releaseEl.className = "release";
      releaseEl.setAttribute("data-msl", release_.releaseNumber.toString());
      releaseEl.innerHTML = html;

      this.elements.releases.appendChild(releaseEl);
   }

   // Add the selected taxon to the page.
   addSelectedTaxon(release_: IRelease, taxon_: ITaxon) {

      let title = "";

      // Determine the taxon's rank name.
      const rankName = this.getRankName(taxon_.lineageRanks);

      // Create HTML for the rank and linked taxon name.
      let linkedName = `<div class="taxon-rank">${rankName}</div>: 
      <a href="#release_${release_.releaseNumber}"><div class="taxon-name">${taxon_.name}</div></a>`;

      // Populate the title text.
      if (taxon_.mslReleaseNumber === this.currentMslRelease) {

         // They selected the current release.
         title = `You selected the ${release_.year} (current) release of ${linkedName} (MSL ${release_.releaseNumber})`;
         
      } else if (taxon_.mslReleaseNumber === release_.releaseNumber) {

         // They selected a release that's displayed on the page.
         title = `You selected the ${release_.year} release of ${linkedName} (MSL ${release_.releaseNumber})`;
         
      } else if (taxon_.mslReleaseNumber > release_.releaseNumber) {

         // Convert the numeric tree ID to a release year.
         const selectedYear = Utils.convertTreeIdToYear(taxon_.treeID);

         // They selected a release that's not displayed on the page.
         title = `You selected the ${selectedYear} release of ${linkedName} (MSL ${taxon_.mslReleaseNumber}) which is the same as the ${release_.year} release (MSL ${release_.releaseNumber})`;

      } else if (taxon_.isDeleted) {

         // They selected an abolished release.
         title = `You selected ${linkedName} which was abolished in the ${release_.year} release (MSL ${release_.releaseNumber})`;

      } else {
         
         // NOTE: We probably shouldn't have gotten here!
         title = `You selected the ${release_.year} release of ${linkedName} (MSL ${release_.releaseNumber})`;
      }

      this.elements.selectedTaxon.innerHTML = title;
      return;
   }

   addTaxonChanges(parentEl_: HTMLElement, taxon_: ITaxon, index_: number) {

      let html = "";

      if (index_ > 0) { html += "<hr />"; }

      // Format the lineage (taxon names and ranks).
      const formattedLineage = this.formatLineage(taxon_.lineage, taxon_.lineageIDs, taxon_.lineageRanks);

      // Get the rank name
      const rankName = this.getRankName(taxon_.lineageRanks);

      // Create the summary of changes for this taxon.
      let changeSummary = this.createChangeSummary(taxon_);

      // If there are associated proposals, create a panel to display them.
      let proposalPanel = this.createProposalPanel(taxon_.prevProposal);
   
      html +=
         `<div class="taxon-rank-and-name">
            <div class="rank-name">${rankName}:</div>
            <div class="taxon-name">${taxon_.name}</div>
            <div class="taxon-changes">${changeSummary}</div>
         </div>
         <div class="taxon-lineage-row">
            <div class="label">Lineage:</div>
            <div class="lineage">${formattedLineage}</div>
         </div>
         <div class="lineage-export-row">
            <div class="label">Export lineage:</div>
            <button class="btn btn-default lineage-copy-control"
               data-action="${ExportAction.copyToClipboard}"
               data-lineage="${taxon_.lineage}" 
               data-msl="${taxon_.mslReleaseNumber}"
               data-ranks="${taxon_.lineageRanks}"
               data-taxnode-id="${taxon_.taxnodeID}">
               <i class="${this.icons.copy}"></i> Copy to the clipboard
            </button>
            <button class="btn btn-default lineage-download-control"
               data-action="${ExportAction.download}"
               data-ictv-id="${taxon_.ictvID}"
               data-lineage="${taxon_.lineage}" 
               data-msl="${taxon_.mslReleaseNumber}"
               data-name="${taxon_.name}"
               data-ranks="${taxon_.lineageRanks}"
               data-taxnode-id="${taxon_.taxnodeID}">
               <i class="${this.icons.download}"></i> Download
            </button>
            <button class="btn btn-default settings-button"><i class="${this.icons.settings}"></i> Update settings</button>
            <div class="copy-status" data-taxnode-id="${taxon_.taxnodeID}" style="display: none">
               <i class="${this.icons.success}"></i> Copied successfully
            </div>
         </div>
         ${proposalPanel}`;

      let taxonChangesEl: HTMLDivElement = document.createElement("div");
      taxonChangesEl.className = "taxon-changes";
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

   createChangeSummary(taxon_: ITaxon): string {

      let summary = "";

      // The order of changes is New, Abolished, Promoted, Demoted, Moved, Lineage updated, Merged, Split, Renamed, and Unchanged.
      if (taxon_.isNew) { summary += `is ${this.formatAction(ReleaseAction.new)}`; }
      if (taxon_.isDeleted) { summary += `was ${this.formatAction(ReleaseAction.abolished)}`; }
      if (taxon_.isPromoted) { summary += `was ${this.formatAction(ReleaseAction.promoted)}`; }
      if (taxon_.isDemoted) { summary += `was ${this.formatAction(ReleaseAction.demoted)}`; }

      if (taxon_.isMoved) {
         if (summary.length > 0) { summary += ", "; }
         summary += `was ${this.formatAction(ReleaseAction.moved)}`;
      }

      if (taxon_.isLineageUpdated) {
         if (summary.length > 0) { summary += ", "; }
         summary += `had its ${this.formatAction(ReleaseAction.lineageUpdated)}`;
      }

      if (taxon_.isMerged || taxon_.isSplit || taxon_.isRenamed) {

         if (taxon_.isMerged) {
            if (summary.length > 0) { summary += ", "; }
            summary += `was ${this.formatAction(ReleaseAction.merged)}`;
         }

         if (taxon_.isSplit) {
            if (summary.length > 0) { summary += ", "; }
            summary += `was ${this.formatAction(ReleaseAction.split)}`;
         }

         if (taxon_.isRenamed) {
            if (summary.length > 0) { summary += ", "; }
            summary += `was ${this.formatAction(ReleaseAction.renamed)}`;
         }

         let previousNames = Utils.safeTrim(taxon_.previousNames);
         if (previousNames.length > 0) {
            if (previousNames.endsWith(",")) { previousNames = previousNames.substring(0, previousNames.length - 1); }

            summary += ` from <i>${previousNames}</i>`;
         }
      }

      if (summary.length < 1) {
         summary = (taxon_.mslReleaseNumber === this.currentMslRelease) 
            ? `is ${this.formatAction(ReleaseAction.current)}`
            : `is ${this.formatAction(ReleaseAction.unchanged)}`;
      }

      return summary;
   }

   createProposalPanel(prevProposal_: string) {

      prevProposal_ = Utils.safeTrim(prevProposal_);
      if (prevProposal_.length < 1) { return ""; }

      let proposalLinks = "";

      // Remove a trailing semicolon.
      if (prevProposal_.endsWith(";")) { prevProposal_ = prevProposal_.substring(0, prevProposal_.length - 1); }

      // If there are multiple proposal files, they will be delimited by semicolons.
      const filenames = prevProposal_.split(";");
      if (!filenames || filenames.length < 1) { return ""; }

      // Remove any duplicate filenames
      const uniqueFilenames = [...new Set(filenames)];

      uniqueFilenames.forEach((filename_: string) => {

         filename_ = filename_.trim();
         if (filename_.length < 1) { return; }

         let displayLabel = filename_;

         const periodIndex = displayLabel.lastIndexOf(".");
         if (periodIndex > 0) { displayLabel = filename_.substring(0, periodIndex); }

         // Get an icon class specific to the file type.
         const iconClass = this.getFileIconClass(filename_);

         // Separate multiple links with a line break.
         if (proposalLinks.length > 0) { proposalLinks += "<br/>"; }

         // Add a link to the release proposal file(s).
         proposalLinks += `<i class="${iconClass}" aria-hidden="true"></i>
            <a href="${AppSettings.releaseProposalsURL}${filename_}" target="_blank" rel="noopener noreferrer" 
            class="release-proposal-link">${displayLabel}</a>`;   
      })
   
      if (proposalLinks.length < 1) { return ""; }

      let proposalsLabel = filenames.length > 1 ? "Proposals" : "Proposal";

      return `<div class="taxon-proposal">
         <div class="label">${proposalsLabel}:</div>
         <div class="proposal-links">${proposalLinks}</div>
      </div>`;
   }

   // Create HTML for the export settings dialog.
   createSettingsDialogHTML() {
      
      // Which export format should be selected?
      let csvSelected = this.exportSettings.format === ExportFormat.csv ? "selected" : "";
      let tsvSelected = this.exportSettings.format === ExportFormat.tsv ? "selected" : "";

      // Should empty ranks be included?
      let includeEmpty = this.exportSettings.includeEmptyRanks ? "checked" : "";

      // Should rank names be included?
      let ranksSelected = this.exportSettings.includeRanks ? "selected" : "";
      let ranksNotSelected = !this.exportSettings.includeRanks ? "selected" : "";

      // Return the HTML for the dialog.
      return `<div id="export_settings_dialog" class="modal-dialog">
         <div class="modal-content">
            <div class="modal-header">
               <div class="modal-title">Lineage export settings</div>
            </div>
            <div class="modal-body">
               <div class="settings-row">
                  <div class="settings-label">Export lineage as </div>
                  <select class="lineage-export-format">
                     <option value="${ExportFormat.tsv}" ${tsvSelected}>tab-separated text</option>
                     <option value="${ExportFormat.csv}" ${csvSelected}>comma-separated text</option>
                  </select>
                  <select class="lineage-export-ranks">
                     <option value="true" ${ranksSelected}>with rank names</option>
                     <option value="false" ${ranksNotSelected}>without rank names</option>
                  </select>
               </div>
            <div class="settings-row">
               <div class="settings-label">Include empty ranks</div>
               <input type="checkbox" class="include-empty-control" ${includeEmpty}></input>
            </div>
            </div>
            <div class="modal-footer">
               <button class="btn btn-success save-button"><i class="${this.icons.save}"></i> Save</button>
               <button class="btn btn-default close-button"><i class="${this.icons.close}"></i> Close</button>
            </div>
         </div>
      </div>`;
   }

   // Create HTML for a taxon.
   createTaxonHTML(taxon_: ITaxon, type_: TaxonType) {

      let formattedLineage = "";
      let title = "";

      // Convert the numeric tree ID to a release year.
      const releaseYear = Utils.convertTreeIdToYear(taxon_.treeID);

      // Determine the title text.
      if (taxon_.isDeleted) {

         title = type_ === TaxonType.current 
            ? `Abolished in ${releaseYear} Release (MSL #${taxon_.mslReleaseNumber})`
            : `Your selection: Abolished in ${releaseYear} Release (MSL #${taxon_.mslReleaseNumber})`;
         
      } else {

         title = type_ === TaxonType.current 
            ? `Current release (${releaseYear} Release, MSL #${taxon_.mslReleaseNumber})`
            : `Your selection (${releaseYear} Release, MSL #${taxon_.mslReleaseNumber})`;
      }

      // Lineage ranks
      let lineageRanks = taxon_.lineageRanks;
      if (lineageRanks.endsWith(";")) { lineageRanks = lineageRanks.substring(0, lineageRanks.length - 1); }

      // Display the full lineage of the taxa.
      if (taxon_.lineage && taxon_.lineageIDs && lineageRanks) {

         // Format the lineage as HTML.
         formattedLineage = this.formatLineage(taxon_.lineage, taxon_.lineageIDs, lineageRanks);
      }

      // Get the taxons' rank name.
      const rankName = this.getRankName(taxon_.lineageRanks);

      let html = 
         `<div class="taxon ${type_} visible">
            <div class="taxon-title selected">${title}</div>
            <div class="info-row">
               <div class="taxon-rank">${rankName}</div>: <div class="taxon-name">${taxon_.name}</div>
            </div>
            <div class="lineage selected">${formattedLineage}</div>
         </div>`;

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

   // Export the selected lineage.
   exportLineage(action_: ExportAction, ictvID_: string, lineage_: string, name_: string, rankNames_: string, releaseNumber_: string, taxNodeID_: string) {

      // Use the release number to lookup the corresponding release.
      //const release = this.releaseLookup.get(releaseNumber_);
      //if (!release) { throw new Error(`Invalid release for release number ${releaseNumber_}`); }

      // Format the lineage for export, possibly including rank names.
      const formattedLineage = this.formatLineageForExport(this.exportSettings.format, this.exportSettings.includeEmptyRanks, 
         this.exportSettings.includeRanks, lineage_, rankNames_);

      switch (action_) {

         case ExportAction.copyToClipboard:

            this.copyToClipboard(formattedLineage, taxNodeID_);
            break;

         case ExportAction.download:

            let formattedName = Utils.safeTrim(name_).toLowerCase().replace(" ", "_");
         
            // Use the MSL release as the filename.
            const filename = `ictv.MSL${releaseNumber_}.ICTV${ictvID_}.${formattedName}.${this.exportSettings.format}`;

            // Initiate the download.
            this.download(filename, formattedLineage);
            break;

         default:
            throw new Error("Invalid lineage export action");
      }

      return;
   }

   // Format the action to include a tooltip.
   formatAction(action_: ReleaseAction) {

      let label = LookupReleaseAction(action_);
      let definition = LookupReleaseActionDefinition(action_);

      return `<span class=\"change ${action_} has-tooltip\">${label}<span class="tooltip">${definition}</span></span>`;
   }

   formatLineage(lineage_: string, lineageIDs_: string, lineageRanks_: string): string {

      let html = "";

      if (lineage_.endsWith(";")) { lineage_ = lineage_.substring(0, lineage_.length - 1); }
      if (lineageIDs_.endsWith(";")) { lineageIDs_ = lineageIDs_.substring(0, lineageIDs_.length - 1); }
      if (lineageRanks_.endsWith(";")) { lineageRanks_ = lineageRanks_.substring(0, lineageRanks_.length - 1); }

      // Create arrays from the delimited strings.
      const lineageArray = lineage_.split(";");
      const lineageIdArray = lineageIDs_.split(";");
      const rankArray = lineageRanks_.split(";");

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
            html += `<div class="lineage-row" style="margin-left: ${leftOffset}rem">
                  <div class="rank-name">${rankName}</div>: 
                  <div class="taxon-name">${linkedName}</div>
               </div>`;
         }

         leftOffset += this.lineageLeftOffset;
      })

      return html;
   }

   // Format the lineage for export, possibly including rank names.
   formatLineageForExport(format_: ExportFormat, includeEmptyRanks_: boolean, includeRanks_: boolean, names_: string,
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

   // Get the history of taxa with this vmr_id over all releases.
   async getByVmrID() {

      // Validate the VMR ID.
      if (!this.vmrID) { return await AlertBuilder.displayError("Invalid VMR ID"); }

      // Create and display the spinner.
      const spinner: string = this.getSpinnerHTML("Loading history...");
      this.displayMessage(spinner);

      this.taxonHistory = await TaxonomyHistoryService.getByVmrID(this.currentMslRelease, this.vmrID);
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

   // Get the last rank name from a taxon's lineage ranks.
   getRankName(lineageRanks_: string): string {

      if (!lineageRanks_) { return ""; }

      let rankNames = lineageRanks_;
      rankNames = rankNames.substring(0, rankNames.lastIndexOf(";"));
      const rankNameArray = rankNames.split(";");
      return Utils.safeTrim(rankNameArray[rankNameArray.length - 1]);
   }

   // Return a DIV that contains the spinner icon and optional text.
   getSpinnerHTML(spinnerText_?: string): string {

      const spinnerText = !spinnerText_ ? "" : ` ${spinnerText_}`;

      return `<div class="spinner-ctrl"><i class="${this.icons.spinner}"></i>${spinnerText}</div>`;
   }

   async initialize() {

      // Look for export settings in web storage.
      let settings = localStorage.getItem(WebStorageKey.lineageExportSettings);
      if (!!settings && settings.length > 0) { this.exportSettings = JSON.parse(settings); }

      // Generate the component's HTML.
      let html: string =
         `<div class="message-panel" data-is-visible="true"></div>
         <div class="data-container" data-is-visible="false">
            <div class="selected-taxon"></div>
            <div class="releases"></div>
            ${this.createSettingsDialogHTML()}
         </div>`;

      // Get a reference to the container Element.
      this.elements.container = document.querySelector(this.containerSelector);
      if (!this.elements.container) { throw new Error("Invalid container Element"); }

      // Populate the container HTML.
      this.elements.container.innerHTML = html;

      this.elements.messagePanel = this.elements.container.querySelector(".message-panel");
      if (!this.elements.messagePanel) { throw new Error("Invalid message panel element"); }

      this.elements.releases = this.elements.container.querySelector(".releases");
      if (!this.elements.releases) { throw new Error("Invalid releases element"); }

      this.elements.selectedTaxon = this.elements.container.querySelector(".selected-taxon");
      if (!this.elements.selectedTaxon) { throw new Error("Invalid selected taxon element"); }

      this.elements.settingsDialog = this.elements.container.querySelector("#export_settings_dialog");
      if (!this.elements.settingsDialog) { throw new Error("Invalid settings dialog element"); }

      this.elements.settingsDialog.addEventListener("click", (event_) => {
         
         const target = (event_.target) as HTMLElement;

         if (target.classList.contains("modal-dialog") || target.classList.contains("close-button")) {
            this.elements.settingsDialog.style.display = "none";

         } else if (target.classList.contains("save-button")) {
            this.saveExportSettings();
            this.elements.settingsDialog.style.display = "none";
         }

         return;
      })

      //---------------------------------------------------------------------------------------------------------------------------------------------------
      // Look for a taxnode_id, ictv_id, taxon_name, or other ID in the URL query parameters.
      //---------------------------------------------------------------------------------------------------------------------------------------------------
      const urlParams = new URLSearchParams(window.location.search);

      // Look for common ID parameters in the query string.
      const identifiers: IIdentifierData[] = Utils.processUrlParamsForIdentifiers(urlParams);

      // Was identifier data generated?
      if (identifiers !== null && identifiers.length > 0) {

         const idData = identifiers[0];

         switch (idData.idType) {

            case IdentifierType.taxonomy:

               // Set the taxnode ID attribute.
               this.taxNodeID = idData.value.toString();

               // Get the history by taxnode_id.
               return await this.getByTaxNodeID();

            case IdentifierType.ICTV:

               // Set the ICTV ID attribute.
               this.ictvID = idData.value.toString();

               // Get the history by ictv_id.
               return await this.getByIctvID();

            case IdentifierType.VMR:

               // Set the VMR ID attribute.
               this.vmrID = idData.value.toString();

               // Get the history by vmr_id.
               return await this.getByVmrID();

            default:
               return await AlertBuilder.displayError(`Sorry, but the ${idData.idType} identifier is not yet supported`);
         }
      }
      
      // Try to retrieve data using the taxon_name parameter.
      this.taxonName = Utils.safeTrim(urlParams.get("taxon_name"));
      if (!!this.taxonName) { return await this.getByTaxonName(); }

      return await AlertBuilder.displayError("No valid parameters were provideed. The following parameters are accepted: taxnode_id, ictv_id, and taxon_name");
   }

   // Open the lineage export settings dialog.
   openSettingsDialog() {
      this.elements.settingsDialog.style.display = "block";
      return;
   }

   processHistory() {

      // Validate the releases
      if (!this.taxonHistory.releases || this.taxonHistory.releases.length < 1) { return this.displayMessage("No history is available: Invalid MSL Release(s)"); }

      // Validate the taxa
      if (!this.taxonHistory.taxa || this.taxonHistory.taxa.length < 1) { return this.displayMessage("No history is available: No modified taxa available"); }

      // Validate the selected taxon
      if (!this.taxonHistory.selectedTaxon) { return this.displayMessage("No history is available: Invalid selected taxon"); }

      // Show the container and hide the message panel.
      this.elements.container.setAttribute("data-is-visible", "true");
      this.elements.messagePanel.setAttribute("data-is-visible", "false");

      // A lookup from MSL release number to the corresponding release object.
      this.releaseLookup = new Map<number, IRelease>();

      // An array of MSL release numbers in descending order.
      let releaseOrder = [];

      // While iterating over releases, we will determine the the release number equal to or immediately before the selected MSL.
      let foundSelectedRelease = false;
      let selectedMSL = this.taxonHistory.selectedTaxon.mslReleaseNumber;

      // Iterate over all releases where this taxon has been updated.
      this.taxonHistory.releases.forEach((release_: IRelease) => {

         // Create HTML for the release and add it to the page.
         this.addReleasePanel(release_);

         // If we haven't found the release number equal to or immediately before the selected release number, use 
         // this release number for the selected taxon.
         if (!foundSelectedRelease && release_.releaseNumber <= selectedMSL) {
            
            // We found the release to associate with the selected taxon.
            foundSelectedRelease = true;

            // Add the selected taxon to the page.
            this.addSelectedTaxon(release_, this.taxonHistory.selectedTaxon);
         }

         // Add the release's MSL release number to the ordered list
         releaseOrder.push(release_.releaseNumber);

         // Initialize the release's array of modified taxa.
         release_.taxa = [];

         // Trim the list of available rank names and remove a trailing comma.
         let rankNames = Utils.safeTrim(release_.rankNames);
         if (rankNames.endsWith(";")) { rankNames = rankNames.substring(0, rankNames.length - 2); }
         release_.rankNames = rankNames;

         // Determine the CSS selector of the release's "taxa Element".
         let taxaElementSelector = `.releases .release[data-msl="${release_.releaseNumber}"] .release-body`;

         release_.taxaElement = document.querySelector(taxaElementSelector);
         if (!release_.taxaElement) { throw new Error(`Invalid release panel for MSL release number ${release_.releaseNumber}`); }

         // Add the release to the lookup.
         this.releaseLookup.set(release_.releaseNumber, release_);
      })

      // Iterate over all taxa from the taxon's history.
      this.taxonHistory.taxa.forEach((taxon_: ITaxon) => {

         const releaseNumber = taxon_.mslReleaseNumber;

         // Get the MSL release associated with the taxon.
         const release = this.releaseLookup.get(releaseNumber);
         if (!release) { console.log("invalid release for taxon ", taxon_); return; }

         const taxonIndex = release.taxa.length;

         // Add the modified taxon to its release.
         release.taxa.push(taxon_);

         // Add the release back to the lookup.
         this.releaseLookup.set(releaseNumber, release);

         this.addTaxonChanges(release.taxaElement, taxon_, taxonIndex);
      })

      // Add event handlers to all controls.
      this.addEventHandlers();
   }

   saveExportSettings() {

      // The export format (CSV or TSV)
      const formatEl: HTMLSelectElement = document.querySelector(`${this.containerSelector} .modal-dialog .lineage-export-format`);
      if (!formatEl) { throw new Error("Invalid format Element"); }

      this.exportSettings.format = formatEl.options[formatEl.selectedIndex].value as ExportFormat;

      // Should rank names be included?
      const ranksEl: HTMLSelectElement = document.querySelector(`${this.containerSelector} .modal-dialog .lineage-export-ranks`);
      if (!ranksEl) { throw new Error("Invalid ranks Element"); }

      this.exportSettings.includeRanks = false;
      if (ranksEl.options[ranksEl.selectedIndex].value === "true") { this.exportSettings.includeRanks = true; }

      // Should empty ranks be included?
      const includeEmptyEl: HTMLInputElement = document.querySelector(`${this.containerSelector} .modal-dialog .include-empty-control`);
      if (!includeEmptyEl) { throw new Error("Invalid include empty Element"); }

      this.exportSettings.includeEmptyRanks = includeEmptyEl.checked;

      // Persist the settings to local storage.
      const settings = JSON.stringify(this.exportSettings);
      localStorage.setItem(WebStorageKey.lineageExportSettings, settings);

      return;
   }

}