
import { AlertBuilder } from "../../helpers/AlertBuilder";
import { AppSettings } from "../../global/AppSettings";
import { IRelease } from "../../models/TaxonHistory/IRelease";
import { ITaxon } from "../../models/TaxonHistory/ITaxon";
import { ITaxonHistoryResult } from "../../models/TaxonHistory/ITaxonHistoryResult";
import { Identifiers } from "../../models/Identifiers";
import { LookupReleaseAction, LookupReleaseActionDefinition, LookupTaxonomyRank, ReleaseAction, TaxaLevel, WebStorageKey } from "../../global/Types";
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




export class TaxonHistory {

   // All possible rank names in the latest release, excluding "tree".
   allRankNamesArray: string[] = null;

   // The DOM selector for the container element.
   containerSelector: string = null;

   // The taxon history data provided by the web service.
   data: ITaxonHistoryResult;

   // Important DOM elements used by this component.
   elements: {
      container: HTMLElement,
      instructions: HTMLElement,
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
      lineage: "fa-light fa-chevron-right",
      pdf: "far fa-file-pdf",
      save: "fa-solid fa-floppy-disk",
      settings: "fa-solid fa-gear",
      spinner: "fas fa-spinner fa-spin",
      success: "fas fa-check",
      zip: "far fa-file-archive"
   }

   // Identifiers provided as query string parameters.
   identifiers: Identifiers;


   messages = {

      // This message will be displayed along with a spinner icon when retrieving data.
      loading: "Loading history...",

      // This message will be displayed if no data is available.
      noData: "No history is available"
   }

   // A lookup from MSL release number to the corresponding release object.
   releaseLookup: Map<number, IRelease>;

   // The taxon specified by the identifier parameter(s).
   selectedTaxon: ITaxon = null;

   settings = {

      // The current MSL release number.
      currentReleaseNum: NaN,

      // The number of distinct ICTV IDs from all displayed taxa.
      distinctIctvIDs: 0,

      // Should lineages be displayed horizontally or vertically?
      lineageDisplayFormat: LineageDisplayFormat.horizontal,

      // Each lineage rank will be indented by this amount when displayed vertically.
      lineageLeftOffset: 0.75,

      // The time it will take to fade out a status message (for now this is only used by copyToClipboard).
      messageFadeTime: 5000,

      // The minimum number of distinct ICTV IDs to enable highlighting.
      minIctvIDsForHighlight: 2
   }

   // A lookup from taxnode ID to taxon object.
   taxaLookup: Map<number, ITaxon>;

   

   // C-tor
   constructor(containerSelector_: string, currentMslRelease_: number) {

      if (!containerSelector_) { throw new Error("Invalid container selector"); }
      this.containerSelector = containerSelector_;

      if (!currentMslRelease_) { throw new Error("Invalid current MSL release"); }
      this.settings.currentReleaseNum = currentMslRelease_;

      this.elements = {
         container: null,
         instructions: null,
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

      this.identifiers = null;

      // Initialize the taxa lookup.
      this.taxaLookup = new Map<number, ITaxon>();
   }

   addEventHandlers() {

      // Add a click event handler to the "releases" panel.
      this.elements.releases.addEventListener("click", (event_) => {

         let target = (event_.target as HTMLElement);

         // Was the export settings button clicked?
         if (target.classList.contains("settings-button")) { return this.openSettingsDialog(); }

         // Was an export button clicked?
         const action = target.getAttribute("data-action") as ExportAction;
         if (action) {

            // Get the taxnodeID data attribute from the button element.
            const taxNodeID = target.getAttribute("data-taxnode-id");

            // Lookup the taxon by its taxnode ID.
            const taxon = this.taxaLookup.get(Utils.convertStringToInt(taxNodeID));
            if (!taxon) { throw new Error("Invalid taxon for export"); }

            // Export the lineage
            return this.exportLineage(action, taxon);
         }
         
         // Was a "changed taxon" element clicked?
         const changedTaxonEl = target.closest(".changed-taxon");
         if (changedTaxonEl) {

            // Get the ICTV ID and taxnode ID attributes from the element.
            const ictvID: number = Utils.convertStringToInt(changedTaxonEl.getAttribute("data-ictv-id"));
            const taxNodeID: number = Utils.convertStringToInt(changedTaxonEl.getAttribute("data-taxnode-id"));

            if (!isNaN(ictvID) && !isNaN(taxNodeID)) {

               // Highlight all changed taxa with this ICTV ID as a data attribute.
               this.highlightSelectedLineage(ictvID);

               // Update the selected taxon.
               this.updateSelectedTaxon(taxNodeID);
            }
         }

         return;
      })
   }

   // Append a release panel under the "releases" container Element.
   addReleasePanel(release_: IRelease) {

      // Replace the semicolons with line breaks.
      const formattedTitle = release_.title.replace(/;/g, "<br/>");

      // The current release will have the label "CURRENT" added.
      const isCurrent = release_.isCurrent ? "CURRENT RELEASE" : "";

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
      releaseEl.setAttribute("data-msl", `${release_.releaseNumber}`);
      releaseEl.innerHTML = html;

      this.elements.releases.appendChild(releaseEl);
   }

   // Add the selected taxon to the page.
   addSelectedTaxon(mostRecentMSL_: number, mostRecentYear_: string, taxon_: ITaxon) {

      let title = "";

      // Create HTML for the rank and linked taxon name.
      let linkedName = `<span class="taxon-rank">${taxon_.rankName}</span>  
         <a href="#release_${mostRecentMSL_}"><span class="taxon-name">${taxon_.name}</span></a>`;

      // Populate the title text.
      if (taxon_.mslReleaseNum === this.settings.currentReleaseNum) {

         // They selected the current release.
         title = `You selected the ${mostRecentYear_} (current) release of ${linkedName} (MSL ${mostRecentMSL_})`;
         
      } else if (taxon_.mslReleaseNum === mostRecentMSL_) {

         // They selected a release that's displayed on the page.
         title = `You selected the ${mostRecentYear_} release of ${linkedName} (MSL ${mostRecentMSL_})`;
         
      } else if (taxon_.mslReleaseNum > mostRecentMSL_) {

         // Convert the numeric tree ID to a release year.
         const selectedYear = Utils.convertTreeIdToYear(taxon_.treeID);

         // They selected a release that's not displayed on the page.
         title = `You selected the ${selectedYear} release of ${linkedName} (MSL ${taxon_.mslReleaseNum}) which is the same as the ${mostRecentYear_} release (MSL ${mostRecentMSL_})`;

      } else if (taxon_.isDeleted) {

         // They selected an abolished release.
         title = `You selected ${linkedName} which was abolished in the ${mostRecentYear_} release (MSL ${mostRecentMSL_})`;

      } else {
         
         // NOTE: We probably shouldn't have gotten here!
         title = `You selected the ${mostRecentYear_} release of ${linkedName} (MSL ${mostRecentMSL_})`;
      }

      // Populate the selected taxon panel.
      this.elements.selectedTaxon.innerHTML = title;

      // Update the selected taxon name in the instructions.
      const selectedNameEl = this.elements.container.querySelector(".instructions .selected-name");
      if (!selectedNameEl) { throw new Error("Invalid selected name element in the instructions"); }
      selectedNameEl.innerHTML = taxon_.name;

      return;
   }

   // Add the taxon, a summary of its changes, and its lineage to the associated release.
   addTaxonChanges(index_: number, parentEl_: HTMLElement, taxon_: ITaxon) {

      let html = "";

      // Add an HR element between the "changed taxon" sections.
      if (index_ > 0) { parentEl_.append(document.createElement("hr")); }

      // Create the summary of changes for this taxon.
      let changeSummary = this.createChangeSummary(taxon_);

      // If there are associated proposals, create a panel to display them.
      let proposalPanel = this.createProposalPanel(taxon_.prevProposal);
   
      html +=
         `<div class="taxon-rank-and-name">
            <div class="rank-name">${taxon_.rankName}</div>
            <div class="taxon-name">${taxon_.name}</div>
            <div class="taxon-changes">${changeSummary}</div>
         </div>
         <div class="taxon-lineage-row">
            <div class="label">Lineage:</div>
            <div class="lineage">${taxon_.formattedLineage}</div>
         </div>
         <div class="lineage-export-row">
            <div class="label">Export lineage:</div>
            <button class="btn btn-default lineage-copy-control"
               data-action="${ExportAction.copyToClipboard}"
               data-taxnode-id="${taxon_.taxnodeID}">
               <i class="${this.icons.copy}"></i> Copy to the clipboard
            </button>
            <button class="btn btn-default lineage-download-control"
               data-action="${ExportAction.download}"
               data-taxnode-id="${taxon_.taxnodeID}">
               <i class="${this.icons.download}"></i> Download
            </button>
            <button class="btn btn-default settings-button"><i class="${this.icons.settings}"></i> Settings</button>
            <div class="copy-status" data-taxnode-id="${taxon_.taxnodeID}" style="display: none">
               <i class="${this.icons.success}"></i> Copied successfully
            </div>
         </div>
         ${proposalPanel}`;

      let taxonChangesEl: HTMLDivElement = document.createElement("div");
      taxonChangesEl.classList.add("changed-taxon");

      if (taxon_.isDeleted) { taxonChangesEl.classList.add("abolished"); }

      taxonChangesEl.setAttribute("data-ictv-id", `${taxon_.ictvID}`);
      taxonChangesEl.setAttribute("data-taxnode-id", `${taxon_.taxnodeID}`);
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
            .fadeOut(this.settings.messageFadeTime, () => {
               jQuery(this).hide();
            });

      }, (reason_) => {
         // The Promise was rejected.
         throw new Error(`Unable to copy to clipboard: ${reason_}`);
      })
   }

   // Create a summary of changes to a taxon.
   createChangeSummary(taxon_: ITaxon): string {

      let actions: ReleaseAction[] = [];
      let descriptions: string[] = [];

      // The order of changes is New, Abolished, Promoted, Demoted, Moved, Lineage updated, Merged, Split, Renamed, and Unchanged.

      // New
      if (taxon_.isNew) {
         descriptions.push(this.formatAction(ReleaseAction.new)); 
         actions.push(ReleaseAction.new);
      }

      // Abolished (deleted)
      if (taxon_.isDeleted) {
         descriptions.push(this.formatAction(ReleaseAction.abolished)); 
         actions.push(ReleaseAction.abolished);
      }

      // Promoted or demoted
      if (taxon_.isPromoted) { 
         let fromRank = !taxon_.previousRank ? "" : ` from ${taxon_.previousRank}`;

         descriptions.push(`${this.formatAction(ReleaseAction.promoted)}${fromRank}`);
         actions.push(ReleaseAction.promoted);

      } else if (taxon_.isDemoted) {
         let fromRank = !taxon_.previousRank ? "" : ` from ${taxon_.previousRank}`;

         descriptions.push(`${this.formatAction(ReleaseAction.demoted)}${fromRank}`);
         actions.push(ReleaseAction.demoted);
      }

      // Moved
      if (taxon_.isMoved /*&& !taxon_.isLineageUpdated*/) {

         // Create a formatted version of the taxon's parent from the previous MSL release.
         let formattedParent = this.formatPreviousParent(taxon_);
         
         // Add a description and update the list of actions.
         descriptions.push(`${this.formatAction(ReleaseAction.moved)}${formattedParent}`);
         actions.push(ReleaseAction.moved);
      }

      // Lineage updated
      if (taxon_.isLineageUpdated) {

         // TODO: Find the first ancestor that's different between the current and previous lineages.

         descriptions.push(`had its ${this.formatAction(ReleaseAction.lineageUpdated)}`);
         actions.push(ReleaseAction.lineageUpdated);
      }

      // Merged / split / renamed
      if (taxon_.isMerged || taxon_.isSplit || taxon_.isRenamed) {

         // Format the list of delimited previous names.
         const fromPreviousNames = this.formatPreviousNames(taxon_.prevNames);

         // Merged or split
         if (taxon_.isMerged) {
            descriptions.push(`${this.formatAction(ReleaseAction.merged)} from ${fromPreviousNames}`);
            actions.push(ReleaseAction.merged);
   
         } else if (taxon_.isSplit) {
            descriptions.push(`${this.formatAction(ReleaseAction.split)} from ${fromPreviousNames}`);
            actions.push(ReleaseAction.split);    
         }

         // Renamed
         if (taxon_.isRenamed) { 

            // Add descriptions for renamed taxa.
            if (taxon_.isMerged || taxon_.isSplit) {
               descriptions.push(`${this.formatAction(ReleaseAction.renamed)}`);
            } else {
               descriptions.push(`${this.formatAction(ReleaseAction.renamed)} of ${fromPreviousNames}`);
            }
            
            // Update the list of actions.
            actions.push(ReleaseAction.renamed);
         }
      }

      // If no descriptions have been added, this taxon is unchanged or current (if this is the current release).
      if (descriptions.length < 1) {
         if (taxon_.mslReleaseNum === this.settings.currentReleaseNum) {
            return `is ${this.formatAction(ReleaseAction.current)}`;
         } else {
            return `is ${this.formatAction(ReleaseAction.unchanged)}`;
         }
      }

      // Get the last index (zero-based).
      let lastIndex = descriptions.length - 1;
      let summary = "";

      // Combine the descriptions into a summary.
      descriptions.forEach((description_, index_) => {

         if (index_ === 0) {

            if (actions[0] === ReleaseAction.new) {

               // New is prefaced by "is".
               summary += "is ";

            } else if (actions[0] !== ReleaseAction.lineageUpdated && actions[0] !== ReleaseAction.renamed) { 

               // The summary will begin with "was" for all actions other than "lineage updated" and "renamed".
               summary += "was "; 
            }
         }

         // Precede each non-first description with a comma, and preface the final description with "and".
         if (index_ > 0 && descriptions.length > 2) { summary += ", "; }
         if (index_ === lastIndex && descriptions.length > 1) { summary += " and "; }

         summary += description_;
      })

      return summary;
   }

   createProposalPanel(prevProposal_: string) {

      prevProposal_ = Utils.safeTrim(prevProposal_);
      if (prevProposal_.length < 1) { return ""; }

      let proposalLinks = "";

      // If there are multiple proposal files, they will be delimited by semicolons.
      const filenames = prevProposal_.split(";");
      if (!filenames || filenames.length < 1) { return ""; }

      // Remove any duplicate filenames
      const uniqueFilenames = [...new Set(filenames)];

      uniqueFilenames.forEach((filename_: string) => {

         filename_ = filename_.trim();
         if (filename_.length < 1) { return; }

         let displayLabel = filename_;

         // Separate multiple links with a line break.
         if (proposalLinks.length > 0) { proposalLinks += "<br/>"; }

         const periodIndex = displayLabel.lastIndexOf(".");
         if (periodIndex > 0) { 

            displayLabel = filename_.substring(0, periodIndex); 
         
            // Get an icon class specific to the file type.
            const iconClass = this.getFileIconClass(filename_);

            // Add a link to the release proposal file(s).
            proposalLinks += `<i class="${iconClass}" aria-hidden="true"></i>
               <a href="${AppSettings.releaseProposalsURL}${filename_}" target="_blank" rel="noopener noreferrer" 
               class="release-proposal-link">${displayLabel}</a>`;
         } else {
            proposalLinks += displayLabel;
         }
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

   // Display an HTML message in the message panel.
   displayMessage(message_: string) {

      // Populate and show the message panel.
      this.elements.messagePanel.innerHTML = message_;

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
   exportLineage(action_: ExportAction, taxon_: ITaxon) {

      // Format the lineage for export, possibly including rank names.
      const formattedLineage = this.formatLineageForExport(taxon_);

      switch (action_) {

         case ExportAction.copyToClipboard:

            this.copyToClipboard(formattedLineage, `${taxon_.taxnodeID}`);
            break;

         case ExportAction.download:

            // TODO: restrict to alphanumeric characters and underscores.
            let formattedName = Utils.safeTrim(taxon_.name).toLowerCase().replace(" ", "_");
         
            // Use the MSL release as the filename.
            const filename = `ictv.MSL${taxon_.mslReleaseNum}.ICTV${taxon_.ictvID}.${formattedName}.${this.exportSettings.format}`;

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

   // Format the lineage as HTML, adding "taxon details" links to each taxon name.
   formatLineage(taxon_: ITaxon): string {

      let html = "";

      // Validate the array lengths.
      if (taxon_.lineageNameArray.length !== taxon_.lineageRankArray.length) { throw new Error("The number of lineage names and ranks don't match"); }
      if (taxon_.lineageIDArray.length !== taxon_.lineageNameArray.length) { throw new Error("The number of lineage IDs and names don't match"); }

      let leftOffset = 0;

      taxon_.lineageNameArray.forEach((taxonName_: string, index_: number) => {

         const formattedName = Utils.italicizeTaxonName(taxonName_);

         // Lookup the taxon's taxnode ID (lineage ID) and rank name.
         let lineageID = taxon_.lineageIDArray[index_];
         let rankName = taxon_.lineageRankArray[index_];

         // The taxon details URL for this lineage entry.
         const lineageURL = `${AppSettings.applicationURL}/${AppSettings.taxonHistoryPage}?taxnode_id=${lineageID}&taxon_name=${taxonName_}"`;

         // The taxon name as a link.
         const linkedName = `<a href="${lineageURL}" target="_blank">${formattedName}</a>`;

         if (this.settings.lineageDisplayFormat === LineageDisplayFormat.horizontal) {

            // Add an icon to delimit the lineage entries.
            if (index_ > 0) { html += `<span class="lineage-chevron" aria-hidden="true"><i class="${this.icons.lineage}"></i></span>`; }

            // Add the rank and linked name.
            html += `<span class="horizontal-lineage" title="${rankName}">${linkedName}</span>`;

         } else {

            // Add the rank and linked name.
            html += `<div class="lineage-row" style="margin-left: ${leftOffset}rem">
               <div class="rank-name">${rankName}</div> 
               <div class="taxon-name">${linkedName}</div>
            </div>`;
         }

         leftOffset += this.settings.lineageLeftOffset;
      })

      return html;
   }

   // Format the lineage for export, possibly including rank names.
   formatLineageForExport(taxon_: ITaxon): string {

      // Initialize the delimiter and final result.
      let delimiter = "";
      let result = "";

      // The export format will either be "tsv" or "csv".
      switch (this.exportSettings.format) {
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

      // Should we include rank names?
      if (this.exportSettings.includeRanks && taxon_.lineageRankArray.length > 0) {

         if (this.exportSettings.includeEmptyRanks) {

            // Include all rank names, even if not available in this release.
            this.allRankNamesArray.forEach((rankName_: string) => {
               result += `${rankName_.trim()}${delimiter}`;
            })

         } else {

            // Only include the rank names that were provided.
            taxon_.lineageRankArray.forEach((rankName_: string) => {
               if (rankName_) { result += `${rankName_.trim()}${delimiter}`; }
            })
         }

         result += "\n";
      }

      // Include the taxa names
      if (this.exportSettings.includeEmptyRanks) {

         let rankIndex = 0;

         // Iterate over all rank names, including ranks without names.
         this.allRankNamesArray.forEach((rankName_: string) => {

            rankName_ = rankName_.toLowerCase();

            let includedRankName = null;

            if (taxon_.lineageRankArray.length >= (rankIndex + 1)) {
               includedRankName = taxon_.lineageRankArray[rankIndex];
               if (includedRankName) { includedRankName = includedRankName.toLowerCase(); }
            }

            // Is there a valid "included" rank name that matches the rank name from "all" rank names?
            if (includedRankName && rankName_ === includedRankName) {

               // Since the "included" rank exists, there should also be a name at this index.
               let name = "";

               if (taxon_.lineageNameArray.length >= (rankIndex + 1)) {
                  name = taxon_.lineageNameArray[rankIndex];
               } else {
                  // This shouldn't be reached!
                  console.error(`Invalid name at rank index ${rankIndex}`)
               }

               result += `${name.trim()}${delimiter}`

               rankIndex += 1;

            } else {
               result += `${delimiter}`
            }
         })

      } else {

         // Only include the specified names.
         taxon_.lineageNameArray.forEach((name_: string) => {
            result += `${name_.trim()}${delimiter}`
         })
      }

      return result;
   }

   // Format the comma-delimited list of previous names so that each name is italicized and the 
   // last comma is followed by " and ".
   formatPreviousNames(previousNames_: string) {

      let previousNames = Utils.safeTrim(previousNames_);
      if (previousNames.length < 1) { return ""; }

      // Remove a trailing comma.
      if (previousNames.endsWith(",")) { previousNames = previousNames.substring(0, previousNames.length - 1); }

      let formattedNames = "";

      // Split the comma-delimited list into an array.
      const prevNameArray = previousNames.split(",");
      if (prevNameArray.length < 1) { return ""; }

      const lastIndex = prevNameArray.length - 1;

      // Iterate over every name and format them.
      prevNameArray.forEach((prevName_, index_) => {

         if (formattedNames.length > 0 && index_ < lastIndex) { formattedNames += ", "; }

         if (prevNameArray.length > 1 && index_ === lastIndex) {
            if (prevNameArray.length > 2) { formattedNames += ","; }
            formattedNames += " and "; 
         }

         formattedNames += `<i>${Utils.safeTrim(prevName_)}</i>`;
      })
      
      if (formattedNames.length < 1) { return ""; }

      return `${formattedNames}`; 
   }

   // Return the formatted rank and taxon name of the taxon's previous parent.
   formatPreviousParent(taxon_: ITaxon) {

      // Validate the previous lineage name and rank arrays.
      if (!taxon_.prevLineageNameArray || taxon_.prevLineageNameArray.length < 2) { return ""; }
      if (!taxon_.prevLineageRankArray || taxon_.prevLineageRankArray.length < 2) { return ""; }

      let parentName = Utils.safeTrim(taxon_.prevLineageNameArray[taxon_.prevLineageNameArray.length - 2]);
      if (parentName.length < 1) { return ""; }

      let parentRank = Utils.safeTrim(taxon_.prevLineageRankArray[taxon_.prevLineageRankArray.length - 2]);
      if (parentRank.length < 1) { return ""; }

      // Make sure the taxon doesn't still have the "moved from" taxon in its current lineage.
      if (taxon_.lineageNameArray.includes(parentName) || parentName === taxon_.name) { return ""; }

      return ` from <span class="subtle-rank-name">${parentRank}</span> <span class="subtle-taxon-name">${parentName}</span>`;
   }

   // Get the history of taxa with this ictv_id over all releases.
   async getByIctvID() {

      // Validate the ICTV ID.
      if (!this.identifiers.ictvID) { return await AlertBuilder.displayError("Invalid ICTV ID"); }

      // Create and display the spinner.
      const spinner: string = this.getSpinnerHTML(this.messages.loading);
      this.displayMessage(spinner);

      this.data = await TaxonomyHistoryService.getByIctvID(this.settings.currentReleaseNum, this.identifiers.ictvID, this.identifiers.msl);
      if (!this.data) { return this.displayMessage(this.messages.noData); }

      // Hide the spinner icon.
      this.displayMessage("");

      return this.processHistory();
   }

   // Get the history of the taxon with this taxnode_id over all releases.
   async getByTaxNodeID() {

      // Validate the tax node ID.
      if (!this.identifiers.taxNodeID) { return await AlertBuilder.displayError("Invalid taxnode ID"); }

      // Create and display the spinner.
      const spinner: string = this.getSpinnerHTML(this.messages.loading);
      this.displayMessage(spinner);

      this.data = await TaxonomyHistoryService.getByTaxNodeID(this.settings.currentReleaseNum, this.identifiers.taxNodeID);
      if (!this.data) { return this.displayMessage(this.messages.noData); }

      // Hide the spinner icon.
      this.displayMessage("");

      return this.processHistory();
   }

   // Get the history of taxa with this name over all releases.
   async getByTaxonName() {

      // Validate the tax node ID.
      if (!this.identifiers.taxonName) { return AlertBuilder.displayError("Invalid taxon name"); }

      // Create and display the spinner.
      const spinner: string = this.getSpinnerHTML(this.messages.loading);
      this.displayMessage(spinner);

      this.data = await TaxonomyHistoryService.getByName(this.settings.currentReleaseNum, this.identifiers.taxonName);
      if (!this.data) { return this.displayMessage(this.messages.noData); }

      // Hide the spinner icon.
      this.displayMessage("");

      return this.processHistory();
   }

   // Get the history of taxa with this vmr_id over all releases.
   async getByVmrID() {

      // Validate the VMR ID.
      if (!this.identifiers.vmrID) { return await AlertBuilder.displayError("Invalid VMR ID"); }

      // Create and display the spinner.
      const spinner: string = this.getSpinnerHTML(this.messages.loading);
      this.displayMessage(spinner);

      this.data = await TaxonomyHistoryService.getByVmrID(this.settings.currentReleaseNum, this.identifiers.vmrID);
      if (!this.data) { return this.displayMessage(this.messages.noData); }

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

   // Get a taxon's rank from a previous release.
   getPreviousRank(taxon_: ITaxon): string {

      if (!taxon_.prevLineageRankArray || taxon_.prevLineageRankArray.length < 1) { return ""; }
      
      return taxon_.prevLineageRankArray[taxon_.prevLineageRankArray.length - 1];
   }

   // Return a DIV that contains the spinner icon and optional text.
   getSpinnerHTML(spinnerText_?: string): string {

      const spinnerText = !spinnerText_ ? "" : ` ${spinnerText_}`;

      return `<div class="spinner-ctrl"><i class="${this.icons.spinner}"></i>${spinnerText}</div>`;
   }

   

   // Highlight all changed taxa with this ICTV ID as a data attribute.
   highlightSelectedLineage(selectedIctvID_: number) {

      // Only highlight changed taxa if there are enough distinct ICTV IDs.
      if (this.settings.distinctIctvIDs < this.settings.minIctvIDsForHighlight) { 

         // Hide the instructions (about highlighting).
         this.elements.instructions.classList.remove("visible");
         return; 
      }

      // Display the instructions (about highlighting).
      this.elements.instructions.classList.add("visible");

      // Lowlight (?) any currently highlighted changed-taxa.
      const highlightedTaxaEls = this.elements.releases.querySelectorAll(`.changed-taxon.highlighted`);
      if (highlightedTaxaEls) { highlightedTaxaEls.forEach(el_ => el_.classList.remove("highlighted")); }

      const selectedTaxaEls = this.elements.releases.querySelectorAll(`.changed-taxon[data-ictv-id="${selectedIctvID_}"]`);
      if (selectedTaxaEls) { selectedTaxaEls.forEach(el_ => el_.classList.add("highlighted")); }

      return;
   }

   async initialize(identifiers_?: Identifiers | null) {

      // Look for export settings in web storage.
      let settings = localStorage.getItem(WebStorageKey.lineageExportSettings);
      if (settings && settings.length > 0) { this.exportSettings = JSON.parse(settings); }

      // Generate the component's HTML.
      let html: string =
         `<div class="container-panel">
            <div class="message-panel"></div>
            <div class="selected-taxon"></div>
               <div class="instructions">
                  (The history of <span class="selected-name"></span> is <span class="highlighted">highlighted in yellow</span>.
                  Click on a taxon to select it and highlight its history.)
               </div>
               <div class="releases"></div>
               ${this.createSettingsDialogHTML()}
            </div>
         </div>`;
         
      // Get a reference to the container Element.
      this.elements.container = document.querySelector(this.containerSelector);
      if (!this.elements.container) { throw new Error("Invalid container Element"); }

      // Populate the container HTML.
      this.elements.container.innerHTML = html;

      this.elements.messagePanel = this.elements.container.querySelector(".message-panel");
      if (!this.elements.messagePanel) { throw new Error("Invalid message panel element"); }

      this.elements.instructions = this.elements.container.querySelector(".instructions");
      if (!this.elements.instructions) { throw new Error("Invalid instructions panel element"); }

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

      if (identifiers_ && Identifiers.isValid(identifiers_)) {
         this.identifiers = identifiers_;
      } else {
         // Get the query string parameters
         const urlParams = new URLSearchParams(window.location.search);

         // Look for identifier parameters in the query string.
         this.identifiers = Utils.getIdentifiersFromURL(urlParams);
      }

      if (!Identifiers.isValid(this.identifiers)) { return await AlertBuilder.displayError("No valid identifiers were provided"); }

      if (!isNaN(this.identifiers.taxNodeID)) {

         // Get the history by taxnode ID.
         /*return*/ await this.getByTaxNodeID();

      } else if (!isNaN(this.identifiers.ictvID)) {
         
         // Get the history by ICTV ID.
         /*return*/ await this.getByIctvID();

      } else if (!isNaN(this.identifiers.vmrID)) {
         
         // Get the history by VMR (isolate) ID.
         /*return*/ await this.getByVmrID();

      } else if (this.identifiers.taxonName) {

         // Get the history by taxon name.
         /*return*/ await this.getByTaxonName();
      }

      return; // await AlertBuilder.displayError("No valid parameters were provideed. The following parameters are accepted: taxnode_id, ictv_id, vmr_id, and taxon_name");
   }

   // Open the lineage export settings dialog.
   openSettingsDialog() {
      this.elements.settingsDialog.style.display = "block";
      return;
   }

   // Process and display the data returned from the web service.
   processHistory() {

      // Validate the releases
      if (!this.data.releases || this.data.releases.length < 1) { return this.displayMessage("No history is available: Invalid MSL Release(s)"); }

      // Validate the taxa
      if (!this.data.taxa || this.data.taxa.length < 1) { return this.displayMessage("No history is available: No modified taxa available"); }

      // Reverse the taxa array so that oldest changes come first.
      this.data.taxa = this.data.taxa.reverse();
      
      // A lookup from MSL release number to the corresponding release object.
      this.releaseLookup = new Map<number, IRelease>();

      // Iterate over all releases where taxa have been updated. Note that they should already be sorted
      // from most recent to least recent.
      this.data.releases.forEach((release_: IRelease) => {

         // Trim the list of available rank names and remove a trailing comma.
         let rankNames = Utils.safeTrim(release_.rankNames);
         if (rankNames.endsWith(";")) { rankNames = rankNames.substring(0, rankNames.length - 2); }
         release_.rankNames = rankNames;
         
         // Initialize the release's array of modified taxa.
         release_.taxa = [];

         if (release_.isVisible) {

            // Create HTML for the release and add it to the page.
            this.addReleasePanel(release_);

            // Add the release body element to release object.
            release_.bodyElement = document.querySelector(`.releases .release[data-msl="${release_.releaseNumber}"] .release-body`);
            if (!release_.bodyElement) { throw new Error(`Invalid release panel for MSL release number ${release_.releaseNumber}`); }
         }

         // Add the release to the lookup.
         this.releaseLookup.set(release_.releaseNumber, release_);
      })

      // We will use this list to keep track of distinct ICTV IDs.
      let ictvIDs = [];

      let mostRecentMSL: number = NaN;
      let mostRecentYear: string = null;
      let previousTaxNodeID = null;

      // Iterate over all taxa from the taxon history.
      this.data.taxa.forEach((taxon_: ITaxon) => {

         // If this taxon is the same as the one we previously encountered, skip it to avoid duplicates.
         if (previousTaxNodeID && taxon_.taxnodeID === previousTaxNodeID && !taxon_.isDeleted) { return; }

         // This taxon will be considered the "previous" taxon in the next iteration.
         previousTaxNodeID = taxon_.taxnodeID;
         
         // Get the MSL release associated with the taxon.
         const release = this.releaseLookup.get(taxon_.mslReleaseNum);
         if (!release) { console.error("invalid release for taxon ", taxon_); return; }

         // Add metadata to the taxon.
         taxon_ = this.processTaxon(taxon_);

         // Add the modified taxon to its release.
         release.taxa.push(taxon_);

         // Add the release back to the lookup.
         this.releaseLookup.set(taxon_.mslReleaseNum, release);

         // Should we update the list of distinct ICTV IDs?
         if (!ictvIDs.includes(taxon_.ictvID)) { ictvIDs.push(taxon_.ictvID); }

         // Update the taxa lookup.
         this.taxaLookup.set(taxon_.taxnodeID, taxon_);

         if (release.isVisible) {

            // Update the most recent MSL release number and year.
            mostRecentMSL = release.releaseNumber;
            mostRecentYear = release.year;

            const taxonIndex = release.taxa.length;

            // Create an HTML summary of the taxon's changes and add it to the page.
            this.addTaxonChanges(taxonIndex, release.bodyElement, taxon_);
         }

         if (taxon_.isSelected) {

            // Update the selected taxon variable.
            this.selectedTaxon = taxon_;

            // Display the selected taxon.
            this.addSelectedTaxon(mostRecentMSL, mostRecentYear, taxon_);
         }  
      })

      // Add event handlers to all controls.
      this.addEventHandlers();

      // Get the number of distinct ICTV IDs from taxa displayed on the page.
      this.settings.distinctIctvIDs = ictvIDs.length;

      // Highlight all changed taxa with this ICTV ID as a data attribute.
      this.highlightSelectedLineage(this.selectedTaxon.ictvID);
   }

   // Add metadata to the taxon (for convenience).
   processTaxon(taxon_: ITaxon): ITaxon {

      // Remove trailing semicolons.
      taxon_.lineageIDs = this.removeTrailingSemicolon(taxon_.lineageIDs);
      taxon_.lineageNames = this.removeTrailingSemicolon(taxon_.lineageNames);
      taxon_.lineageRanks = this.removeTrailingSemicolon(taxon_.lineageRanks);
      taxon_.prevLineageNames = this.removeTrailingSemicolon(taxon_.prevLineageNames);
      taxon_.prevLineageRanks = this.removeTrailingSemicolon(taxon_.prevLineageRanks); 
      taxon_.prevNames = this.removeTrailingSemicolon(taxon_.prevNames);
      taxon_.prevProposal = this.removeTrailingSemicolon(taxon_.prevProposal);

      // Convert the semicolon-delimited lineage strings into arrays for easier processing.
      taxon_.lineageIDArray = !!taxon_.lineageIDs ? taxon_.lineageIDs.split(";") : null;
      taxon_.lineageNameArray = !!taxon_.lineageNames ? taxon_.lineageNames.split(";") : null;
      taxon_.lineageRankArray = !!taxon_.lineageRanks ? taxon_.lineageRanks.split(";") : null;
      taxon_.prevLineageNameArray = !!taxon_.prevLineageNames ? taxon_.prevLineageNames.split(";") : null;
      taxon_.prevLineageRankArray = !!taxon_.prevLineageRanks ? taxon_.prevLineageRanks.split(";") : null;

      // Convert the comma-delimited previous names into an array for easier processing.
      taxon_.prevNameArray = taxon_.prevNames.split(",");

      // Format the lineage as HTML, adding "taxon details" links to each taxon name.
      taxon_.formattedLineage = this.formatLineage(taxon_) || "";

      // Set the previous rank name.
      taxon_.previousRank = this.getPreviousRank(taxon_);

      // Lookup the formatted version of the taxon's rank name.
      taxon_.rankName = LookupTaxonomyRank(taxon_.rankName);

      return taxon_;
   }

   // Remove a trailing semicolon from a delimited list.
   removeTrailingSemicolon(value_: string) {
      value_ = Utils.safeTrim(value_);
      if (value_.endsWith(";")) { value_ = value_.substring(0, value_.length - 1); }
      return value_;
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

   // Update the selected taxon.
   updateSelectedTaxon(taxNodeID_: number) {

      // Get the taxon from the lookup.
      this.selectedTaxon = this.taxaLookup.get(taxNodeID_);
      if (!this.selectedTaxon) { console.error("Invalid taxon in updateSelectedTaxon"); return; }

      // Get its MSL release.
      const release = this.releaseLookup.get(this.selectedTaxon.mslReleaseNum);
      if (!release) { console.error("Invalid release in updateSelectedTaxon"); return; }

      // Repopulate the selected taxon panel.
      return this.addSelectedTaxon(release.releaseNumber, release.year, this.selectedTaxon);
   }
}