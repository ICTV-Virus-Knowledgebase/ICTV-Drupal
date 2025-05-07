
import { AlertBuilder } from "../../helpers/AlertBuilder";
import { AppSettings } from "../../global/AppSettings";
import { IRelease } from "../../models/TaxonHistory/IRelease";
import { ITaxon } from "../../models/TaxonHistory/ITaxon";
import { ITaxonHistoryResult } from "../../models/TaxonHistory/ITaxonHistoryResult";
import { Identifiers } from "../../models/Identifiers";
import { LookupReleaseAction, LookupReleaseActionDefinition, ReleaseAction, TaxaLevel, WebStorageKey } from "../../global/Types";
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

   // The number of distinct ICTV IDs from all displayed taxa.
   distinctIctvIDs = 0;

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

   // Should lineages be displayed horizontally or vertically?
   lineageDisplayFormat: LineageDisplayFormat = LineageDisplayFormat.horizontal;

   // Each lineage rank will be indented by this amount when displayed vertically.
   lineageLeftOffset = 0.75;

   // The time it will take to fade out a status message (for now this is only used by copyToClipboard).
   messageFadeTime: number = 5000;

   messages = {

      // This message will be displayed along with a spinner icon when retrieving data.
      loading: "Loading history...",

      // This message will be displayed if no data is available.
      noData: "No history is available"
   }

   // The minimum number of distinct ICTV IDs to enable highlighting.
   MIN_ICTV_IDS_FOR_HIGHLIGHT = 2;

   releaseLookup: Map<number, IRelease>;

   // The taxon specified by the identifier parameter(s).
   selectedTaxon: ITaxon = null;

   taxaLookup: Map<number, ITaxon>;

   // The taxon history data provided by the web service.
   taxonHistory: ITaxonHistoryResult;


   // C-tor
   constructor(containerSelector_: string, currentMslRelease_: number) {

      if (!containerSelector_) { throw new Error("Invalid container selector"); }
      this.containerSelector = containerSelector_;

      if (!currentMslRelease_) { throw new Error("Invalid current MSL release"); }
      this.currentMslRelease = currentMslRelease_;

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

            // Get data attributes from the button element.
            const ictvID = target.getAttribute("data-ictv-id");
            const lineage = target.getAttribute("data-lineage");
            const name = target.getAttribute("data-name");
            const rankNames = target.getAttribute("data-ranks");
            const releaseNumber = target.getAttribute("data-msl");
            const taxNodeID = target.getAttribute("data-taxnode-id");

            // Export the lineage
            return this.exportLineage(action, ictvID, lineage, name, rankNames, releaseNumber, taxNodeID);
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

      // Create HTML for the rank and linked taxon name.
      let linkedName = `<span class="taxon-rank">${taxon_.rankName}</span>  
         <a href="#release_${release_.releaseNumber}"><span class="taxon-name">${taxon_.name}</span></a>`;

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

      // Format the lineage as HTML, adding "taxon details" links to each taxon name.
      const formattedLineage = this.formatLineage(taxon_.lineage, taxon_.lineageIDs, taxon_.lineageRanks);

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
            <button class="btn btn-default settings-button"><i class="${this.icons.settings}"></i> Settings</button>
            <div class="copy-status" data-taxnode-id="${taxon_.taxnodeID}" style="display: none">
               <i class="${this.icons.success}"></i> Copied successfully
            </div>
         </div>
         ${proposalPanel}`;

      let taxonChangesEl: HTMLDivElement = document.createElement("div");
      taxonChangesEl.classList.add("changed-taxon");

      if (taxon_.isDeleted) { taxonChangesEl.classList.add("abolished"); }

      taxonChangesEl.setAttribute("data-ictv-id", taxon_.ictvID.toString());
      taxonChangesEl.setAttribute("data-taxnode-id", taxon_.taxnodeID.toString())
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

   // Create a summary of changes to a taxon.
   createChangeSummary(taxon_: ITaxon): string {

      let actions: ReleaseAction[] = [];
      let descriptions: string[] = [];

      // The order of changes is New, Abolished, Promoted, Demoted, Moved, Lineage updated, Merged, Split, Renamed, and Unchanged.

      // New
      if (taxon_.isNew) {

         // Add a description and update the list of actions.
         descriptions.push(this.formatAction(ReleaseAction.new)); 
         actions.push(ReleaseAction.new);
      }

      // Abolished (deleted)
      if (taxon_.isDeleted) { 
         
         // Add a description and update the list of actions.
         descriptions.push(this.formatAction(ReleaseAction.abolished)); 
         actions.push(ReleaseAction.abolished);
      }

      // Promoted or demoted
      if (taxon_.isPromoted) { 
         
         // Add a description and update the list of actions.
         descriptions.push(`${this.formatAction(ReleaseAction.promoted)}${taxon_.previousRank}`);
         actions.push(ReleaseAction.promoted);

      } else if (taxon_.isDemoted) { 
         
         // Add a description and update the list of actions.
         descriptions.push(`${this.formatAction(ReleaseAction.demoted)}${taxon_.previousRank}`);
         actions.push(ReleaseAction.demoted);
      }

      // Moved (don't include if the lineage has been updated, as well)
      if (taxon_.isMoved && !taxon_.isLineageUpdated) {

         let formattedPrevParent = "";
         
         if (taxon_.previousParent && taxon_.previousParent.name) {

            let prevParentName = taxon_.previousParent.name;

            // Make sure the taxon doesn't still have the "moved from" taxon in its current lineage.
            let lineage = Utils.safeTrim(taxon_.lineage);
            if (lineage.endsWith(";")) { lineage = lineage.substring(0, lineage.length - 1); }
            
            const lineageArray = lineage.split(";")
            if (!lineageArray.includes(prevParentName) && prevParentName !== taxon_.name) { 
               
               // A formatted version of the taxon's parent in the previous MSL release.
               formattedPrevParent = this.formatPreviousParent(taxon_);
            }
         } 
         
         // Add a description and update the list of actions.
         descriptions.push(`${this.formatAction(ReleaseAction.moved)}${formattedPrevParent}`);
         actions.push(ReleaseAction.moved);
      }

      // Lineage updated
      if (taxon_.isLineageUpdated) { 

         // Add a description and update the list of actions.
         descriptions.push(`had its ${this.formatAction(ReleaseAction.lineageUpdated)}`);
         actions.push(ReleaseAction.lineageUpdated);
      }

      // Merged / split / renamed
      if (taxon_.isMerged || taxon_.isSplit || taxon_.isRenamed) {

         // Format the list of delimited previous names.
         const fromPreviousNames = this.formatPreviousNames(taxon_.previousNames);

         // Merged or split
         if (taxon_.isMerged) { 

            // Add a description and update the list of actions.
            descriptions.push(`${this.formatAction(ReleaseAction.merged)} from ${fromPreviousNames}`);
            actions.push(ReleaseAction.merged);
   
         } else if (taxon_.isSplit) {

            // Add a description and update the list of actions.
            descriptions.push(`${this.formatAction(ReleaseAction.split)} from ${fromPreviousNames}`);
            actions.push(ReleaseAction.split);    
         }

         // Renamed
         if (taxon_.isRenamed) { 

            if (taxon_.isMerged || taxon_.isSplit) {
               
               // Add a description
               descriptions.push(`${this.formatAction(ReleaseAction.renamed)}`);

            } else {

               // Add a description
               descriptions.push(`${this.formatAction(ReleaseAction.renamed)} of ${fromPreviousNames}`);
            }
            
            // Update the list of actions.
            actions.push(ReleaseAction.renamed);
         }
      }

      // If no descriptions have been added, this taxon is unchanged or current (if this is the current release).
      if (descriptions.length < 1) {
         if (taxon_.mslReleaseNumber === this.currentMslRelease) {
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

   // Format the lineage as HTML, adding "taxon details" links to each taxon name.
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
                  <div class="rank-name">${rankName}</div> 
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

      if (rankNames_) { rankNames_ = rankNames_.trim(); }
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
               if (rankName_) { result += `${rankName_.trim()}${delimiter}`; }
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
               if (includedRankName) { includedRankName = includedRankName.toLowerCase(); }
            }

            // Is there a valid "included" rank name that matches the rank name from "all" rank names?
            if (includedRankName && rankName_ === includedRankName) {

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
      if (!taxon_.previousParent || !taxon_.previousParent.name || !taxon_.previousParent.rank) { return ""; }
      return ` from <span class="subtle-rank-name">${taxon_.previousParent.rank}</span> <span class="subtle-taxon-name">${taxon_.previousParent.name}</span>`;
   }

   // Get the history of taxa with this ictv_id over all releases.
   async getByIctvID() {

      // Validate the ICTV ID.
      if (!this.identifiers.ictvID) { return await AlertBuilder.displayError("Invalid ICTV ID"); }

      // Create and display the spinner.
      const spinner: string = this.getSpinnerHTML(this.messages.loading);
      this.displayMessage(spinner);

      this.taxonHistory = await TaxonomyHistoryService.getByIctvID(this.currentMslRelease, this.identifiers.ictvID, this.identifiers.msl);
      if (!this.taxonHistory) { return this.displayMessage(this.messages.noData); }

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

      this.taxonHistory = await TaxonomyHistoryService.getByTaxNodeID(this.currentMslRelease, this.identifiers.taxNodeID);
      if (!this.taxonHistory) { return this.displayMessage(this.messages.noData); }

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

      this.taxonHistory = await TaxonomyHistoryService.getByName(this.currentMslRelease, this.identifiers.taxonName);
      if (!this.taxonHistory) { return this.displayMessage(this.messages.noData); }

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

      this.taxonHistory = await TaxonomyHistoryService.getByVmrID(this.currentMslRelease, this.identifiers.vmrID);
      if (!this.taxonHistory) { return this.displayMessage(this.messages.noData); }

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

   // Get the taxon's previous parent (rank and name).
   getPreviousParent(previousLineage_: string): string[] {

      previousLineage_ = Utils.safeTrim(previousLineage_);
      if (previousLineage_.length < 1) { return null; }

      let parent = "";
      
      // Remove a trailing semicolon.
      if (previousLineage_.endsWith(";")) { previousLineage_ = previousLineage_.substring(0, previousLineage_.length - 1); }

      // Split the delimited taxa into an array.
      const previousTaxa = previousLineage_.split(";");

      // Get the last taxon.
      if (previousTaxa.length === 0) { 
         return null; 
      } else if (previousTaxa.length === 1) {
         parent = Utils.safeTrim(previousTaxa[0]);
      } else {
         parent = Utils.safeTrim(previousTaxa[previousTaxa.length - 2]);
      }
      
      if (parent.length < 1) { return null; }

      // Split into rank name and name.
      //const names = parent.split(":");
      return parent.split(":");
   }

   // Get a taxon's rank from a previous release. Note that previousLineage_ is expected to be 
   // a list of "<rank name>:<taxon name>" delimited by a semicolon.
   getPreviousRank(previousLineage_: string) {

      previousLineage_ = Utils.safeTrim(previousLineage_);
      if (previousLineage_.length < 1) { return ""; }

      // Remove a trailing semicolon.
      if (previousLineage_.endsWith(";")) { previousLineage_ = previousLineage_.substring(0, previousLineage_.length - 1); }
      
      // Split the delimited taxa into an array.
      const previousTaxa = previousLineage_.split(";");

      // Get the last taxon.
      let lastTaxon = Utils.safeTrim(previousTaxa[previousTaxa.length - 1]);
      if (lastTaxon.length < 1) { return ""; }

      // Split into rank name and name.
      const names = lastTaxon.split(":");
      if (names.length != 2) { return ""; }

      // Get the rank name
      let rankName = names[0];
      if (rankName.length < 1) { return ""; }

      return rankName;
   }

   // Get the last rank name from a taxon's lineage ranks. Note that lineageRanks_ is a list of rank names 
   // delimited by a semicolon.
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

   // Highlight all changed taxa with this ICTV ID as a data attribute.
   highlightSelectedLineage(selectedIctvID_: number) {

      // Only highlight changed taxa if there are enough distinct ICTV IDs.
      if (this.distinctIctvIDs < this.MIN_ICTV_IDS_FOR_HIGHLIGHT) { return; }

      // Lowlight (?) any currently highlighted changed-taxa.
      const highlightedTaxaEls = this.elements.releases.querySelectorAll(`.changed-taxon.highlighted`);
      if (highlightedTaxaEls) { highlightedTaxaEls.forEach(el_ => el_.classList.remove("highlighted")); }

      const selectedTaxaEls = this.elements.releases.querySelectorAll(`.changed-taxon[data-ictv-id="${selectedIctvID_}"]`);
      if (selectedTaxaEls) { selectedTaxaEls.forEach(el_ => el_.classList.add("highlighted")); }

      return;
   }

   async initialize() {

      // Look for export settings in web storage.
      let settings = localStorage.getItem(WebStorageKey.lineageExportSettings);
      if (settings && settings.length > 0) { this.exportSettings = JSON.parse(settings); }

      // Generate the component's HTML.
      let html: string =
         `<div class="message-panel visible"></div>
         <div class="data-container">
            <div class="selected-taxon"></div>
            <div class="instructions">
               (Changes in the history of <span class="selected-name"></span> are <span class="highlighted">highlighted in yellow</span>.
               Click on a taxon to select it and highlight its history.)
            </div>
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

      // Get the query string parameters
      const urlParams = new URLSearchParams(window.location.search);

      // Look for identifier parameters in the query string.
      this.identifiers = Utils.getIdentifiersFromURL(urlParams);
      if (!Identifiers.isValid(this.identifiers)) { return await AlertBuilder.displayError("No valid identifiers were provided"); }

      if (!isNaN(this.identifiers.taxNodeID)) {

         // Get the history by taxnode ID.
         return await this.getByTaxNodeID();

      } else if (!isNaN(this.identifiers.ictvID)) {
         
         // Get the history by ICTV ID.
         return await this.getByIctvID();

      } else if (!isNaN(this.identifiers.vmrID)) {
         
         // Get the history by VMR (isolate) ID.
         return await this.getByVmrID();

      } else if (this.identifiers.taxonName) {

         // Get the history by taxon name.
         return await this.getByTaxonName();
      }

      return await AlertBuilder.displayError("No valid parameters were provideed. The following parameters are accepted: taxnode_id, ictv_id, vmr_id, and taxon_name");
   }

   // Open the lineage export settings dialog.
   openSettingsDialog() {
      this.elements.settingsDialog.style.display = "block";
      return;
   }

   // Process and display the data returned from the web service.
   processHistory() {

      // Validate the releases
      if (!this.taxonHistory.releases || this.taxonHistory.releases.length < 1) { return this.displayMessage("No history is available: Invalid MSL Release(s)"); }

      // Validate the taxa
      if (!this.taxonHistory.taxa || this.taxonHistory.taxa.length < 1) { return this.displayMessage("No history is available: No modified taxa available"); }

      // Set and validate the selected taxon
      this.selectedTaxon = this.taxonHistory.selectedTaxon;
      if (!this.selectedTaxon) { return this.displayMessage("Invalid selected taxon"); }
      
      // Add metadata to the taxon (for convenience).
      this.selectedTaxon = this.processTaxon(this.selectedTaxon);

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
            this.addSelectedTaxon(release_, this.selectedTaxon);
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

      // We will use this list to keep track of distinct ICTV IDs.
      let ictvIDs = [];

      // Iterate over all taxa from the taxon's history.
      this.taxonHistory.taxa.forEach((taxon_: ITaxon) => {

         const releaseNumber = taxon_.mslReleaseNumber;

         // Get the MSL release associated with the taxon.
         const release = this.releaseLookup.get(releaseNumber);
         if (!release) { console.log("invalid release for taxon ", taxon_); return; }

         // Add metadata to the taxon.
         taxon_ = this.processTaxon(taxon_);

         const taxonIndex = release.taxa.length;

         // Add the modified taxon to its release.
         release.taxa.push(taxon_);

         // Add the release back to the lookup.
         this.releaseLookup.set(releaseNumber, release);

         // Add the taxon, a summary of its changes, and its lineage to the associated release.
         this.addTaxonChanges(taxonIndex, release.taxaElement, taxon_);

         // Should we update the list of distinct ICTV IDs?
         if (!ictvIDs.includes(taxon_.ictvID)) { ictvIDs.push(taxon_.ictvID); }

         // Update the taxa lookup.
         this.taxaLookup.set(taxon_.taxnodeID, taxon_);
      })

      // Add event handlers to all controls.
      this.addEventHandlers();

      // Get the number of distinct ICTV IDs from taxa displayed on the page.
      this.distinctIctvIDs = ictvIDs.length;

      // Should we display the instructions panel?
      if (this.distinctIctvIDs > this.MIN_ICTV_IDS_FOR_HIGHLIGHT) {
         this.elements.instructions.classList.add("visible");
      }
      
      // Highlight all changed taxa with this ICTV ID as a data attribute.
      this.highlightSelectedLineage(this.selectedTaxon.ictvID);
   }

   // Add metadata to the taxon (for convenience).
   processTaxon(taxon_: ITaxon): ITaxon {

      // Set the rank name and previous rank name.
      taxon_.rankName = this.getRankName(taxon_.lineageRanks);
      taxon_.previousRank = this.getPreviousRank(taxon_.lineageRanks);

      // Get the previous parent's rank and name.
      const previousParent = this.getPreviousParent(taxon_.previousLineage);
      if (previousParent && previousParent.length === 2) {
         taxon_.previousParent = {
            name: previousParent[1],
            rank: previousParent[0]
         }
      }

      return taxon_;
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

      this.selectedTaxon = this.taxaLookup.get(taxNodeID_);
      if (!this.selectedTaxon) { console.log("Invalid taxon in updateSelectedTaxon"); return; }

      const release = this.releaseLookup.get(this.selectedTaxon.mslReleaseNumber);
      if (!release) { console.log("Invalid release in updateSelectedTaxon"); return; }

      // Repopulate the selected taxon panel.
      return this.addSelectedTaxon(release, this.selectedTaxon);
   }
}