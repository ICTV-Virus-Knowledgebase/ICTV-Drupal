
// "Forward declarations" for external JavaScript libraries.
declare var jQuery: any;

import { AppSettings } from "../../global/AppSettings";
import { IMslRelease } from "../../models/IMslRelease";
import { ITaxon } from "../../models/ITaxon";
import { IDisplaySettings } from "./IDisplaySettings";
import { SearchContext, TaxonomySearchPanel } from "../../helpers/TaxonomySearchPanel";
import { OrderedTaxaLevel, TaxaLevel, TaxaLevelLabel, TaxonomyDisplayType, TopLevelRank } from "../../global/Types";
import { TaxonomyService } from "../../services/TaxonomyService";
import tippy, { Props, ReferenceElement } from "tippy.js";

// The initial data provided to the taxonomy browser.
interface IInitialData {
    displayType: TaxonomyDisplayType,
    releaseNumber: string,
    taxonName: string
}


export class TaxonomyBrowser {

    // How long should it take to animate a node's expand/collapse?
    animationDuration: number = 100;

    // The application-assigned control key for this instance of the TaxonomyControl.
    controlKey: string = null;

    // CSS classes
    cssClasses: { [key: string]: string; } = {
        childCount: "tc-count",
        dialogContainer: "dialog-container",
        filterRanksControl: "filter-ranks-control",
        hideAboveRankControl: "hide-above-rank-control",
        includeAllReleasesCtrl: "all-releases-ctrl",
        memberOfControl: "member-of-control",
        node: "tc-node",
        preExpandToRankControl: "pre-expand-to-rank-ctrl",
        rankControl: "rank-control",
        rankControlsContainer: "rank-controls-container",
        releaseDescription: "release-description",
        releaseHistory: "release-history",
        releasePanel: "release-panel",
        releaseTaxaStats: "release-taxa-stats",
        releaseTitle: "release-title",
        searchPanelContainer: "search-panel-container",
        /*searchPanel: "search-panel",
        searchControl: "search-ctrl",
        searchControls: "search-controls",
        searchResults: "search-results",
        searchResultsTable: "search-results-table",
        searchText: "search-text",*/
        taxonomyBrowser: "taxonomy-browser",
        toolTip: "taxonomy-tool-tip",
        toolTipText: "text",
        treeNode: "tree-node"
    }

    // Display settings (with defaults)
    displaySettings: IDisplaySettings = {
        displayChildCount: true,
        displayHistoryCtrls: true,
        displayMemberOfCtrls: true,
        displayRankCtrls: true,
        displayReleaseHistory: false,
        displaySearchPanel: true,
        leftAlignAll: false,
        useParentTaxonForReleaseRankCount: false,
        useSmallFont: false
    }

    // Default values
    defaults: { 
        hideAboveRank: TaxaLevel,
        preExpandToRank: TaxaLevel
    }

    elements: {
        hideAboveRankControl: HTMLSelectElement,
        preExpandToRankControl: HTMLSelectElement,
        taxonomyBrowser: HTMLElement,
        toolTip: HTMLElement,
        toolTipText: HTMLElement
    }

    // Icons
    icons: { [key: string]: string; } = {
        collapse: "<i class='fas fa-minus'></i>",
        expand: "<i class='fas fa-plus'></i>",
        history: "<i class='fa-regular fa-pen-to-square'></i>",
        info: "<i class='fa fa-info-circle'></i>",
        spinner: "<i class='fas fa-spinner fa-spin'></i>",
        //spinner: "<div class='spinner-ctrl'><i class='fas fa-spinner fa-spin'></i> {{spinner_text}}</div>",
        star: "<i class='fas fa-star'></i>"
    }

    // Data that specifies how the control is to be initially populated.
    initialData: IInitialData = null;

    // Local data for this TaxonomyControl instance is persisted in web storage.
    localData: {
        hideAboveRank: TaxaLevel,
        preExpandToRank: TaxaLevel
    }

    // The MSL release
    mslRelease: IMslRelease;

    // CSS selectors
    selectors: { [key: string]: string; } = {
        container: null,
        dialogContainer: null,
        hideAboveRankControl: null,
        preExpandToRankControl: null,
        rankControlsContainer: null,
        releaseDescription: null,
        releaseHistory: null,
        releasePanel: null,
        releaseTaxaStats: null,
        releaseTitle: null,
        taxonomyBrowser: null,
        toolTip: null,
        toolTipText: null
    }

    // Should we scroll down to the release info after it loads?
    scrollToReleaseAfterLoading: boolean = false;

    // An instance of the taxonomy search panel object.
    searchPanel: TaxonomySearchPanel;

    // A singleton Tippy instance
    tooltipInstance = null;

    toolTipTopOffset: number = 0;

    // URLs used by this control.
    urls: { [key: string]: string } = null;

    // The web storage key is used when persisting and retrieving local data from web storage.
    webStorageKey: string = null;



    // C-tor
    constructor(containerSelector_: string, controlKey_: string, displaySettings_: IDisplaySettings, 
        initialData_: IInitialData) {

        if (!containerSelector_) { throw new Error("Invalid container selector"); }
        this.selectors.container = containerSelector_;

        // Validate the control key parameter.
        if (!controlKey_) { throw new Error("Invalid control key"); }
        this.controlKey = controlKey_;

        // Display settings (optional)
        if (displaySettings_) { this.displaySettings = displaySettings_; }

        // Set implicit settings.
        if (this.displaySettings.leftAlignAll || this.displaySettings.useSmallFont) {

            // If either of these settings are true, someone probably wants to make the most of limited space.
            // Hide rank controls and "member of" controls.
            this.displaySettings.displayMemberOfCtrls = false;
            this.displaySettings.displayRankCtrls = false;

        } else {
            this.displaySettings.displayMemberOfCtrls = true;
            this.displaySettings.displayRankCtrls = true;
        }

        // Data that specifies how the control is to be initially populated.
        if (!initialData_ || !initialData_.displayType) { throw new Error("Invalid initial data"); }
        this.initialData = initialData_;

        // Set default values
        this.defaults = {
            hideAboveRank: TaxaLevel.realm,
            preExpandToRank: TaxaLevel.realm
        }

        // Initialize the DOM element references
        this.elements = {
            hideAboveRankControl: null,
            preExpandToRankControl: null,
            taxonomyBrowser: null,
            toolTip: null,
            toolTipText: null
        }

        //--------------------------------------------------------------------------------------------------------------
        // Create CSS selectors using the container and standard CSS class names.
        //--------------------------------------------------------------------------------------------------------------

        // The dialog container
        this.selectors.dialogContainer = `${this.selectors.container} .${this.cssClasses.dialogContainer}`;

        // The release history
        this.selectors.releaseHistory = `${this.selectors.container} .${this.cssClasses.releaseHistory}`;

        // The search panel
        this.selectors.searchPanelContainer = `${this.selectors.container} .${this.cssClasses.searchPanelContainer}`;

        // The MSL release info
        this.selectors.releasePanel = `${this.selectors.container} .${this.cssClasses.releasePanel}`;
        this.selectors.releaseTitle = `${this.selectors.releasePanel} .${this.cssClasses.releaseTitle}`;
        this.selectors.releaseDescription = `${this.selectors.releasePanel} .${this.cssClasses.releaseDescription}`;
        this.selectors.releaseTaxaStats = `${this.selectors.releasePanel} .${this.cssClasses.releaseTaxaStats}`;

        // The taxonomy browser
        this.selectors.taxonomyBrowser  = `${this.selectors.container} .${this.cssClasses.taxonomyBrowser }`;

        // Rank controls
        this.selectors.rankControlsContainer = `${this.selectors.container} .${this.cssClasses.rankControlsContainer}`;
        this.selectors.hideAboveRankControl = `${this.selectors.rankControlsContainer} .${this.cssClasses.hideAboveRankControl}`;
        this.selectors.preExpandToRankControl = `${this.selectors.rankControlsContainer} .${this.cssClasses.preExpandToRankControl}`;
        this.selectors.filterRanksControl = `${this.selectors.rankControlsContainer} .${this.cssClasses.filterRanksControl}`;

        // The toolTip and its text
        this.selectors.toolTip = `${this.selectors.container} .${this.cssClasses.toolTip}`;
        this.selectors.toolTipText = `${this.selectors.toolTip} .${this.cssClasses.toolTipText}`;

        // Create the web storage key from the current URL and control key.
        this.webStorageKey = `${window.location.href}__${this.controlKey}`;

        // Default the ranks to "hide above" and "pre-expand to".
        this.localData = {
            hideAboveRank: this.defaults.hideAboveRank,
            preExpandToRank: this.defaults.preExpandToRank
        };

        if (this.displaySettings.displaySearchPanel) {
        
            // Create an instance of the taxonomy search panel.
            this.searchPanel = new TaxonomySearchPanel(this.selectors.searchPanelContainer, SearchContext.TaxonomyBrowser, 
                this.handleSearchResultSelection.bind(this));
        } 
    }

    // Create the "hide above" rank control, "pre-expand to" rank control, and the "go" button that retrieves the taxonomy data.
    createRankControls(): string {

        // Options for the "hide above rank" list with an empty option at the top.
        let hideAboveOptions: string = `<option value=""></option>`;

        // Options for the "pre-expand to rank" list with an empty option at the top.
        let preExpandOptions: string = `<option value=""></option>`;

        Object.keys(TopLevelRank).forEach((rank_: string) => {

            // The "hide above" control
            let hideAboveSelected: string = "";
            if (rank_ === this.localData.hideAboveRank) { hideAboveSelected = " selected"; }
            
            hideAboveOptions += `<option value="${rank_}"${hideAboveSelected}>${TaxaLevelLabel[rank_]}</option>`;

            // The "pre-expand" control
            let preExpandSelected: string = "";
            if (rank_ === this.localData.preExpandToRank) { preExpandSelected = " selected"; }

            preExpandOptions += `<option value="${rank_}"${preExpandSelected}>${TaxaLevelLabel[rank_]}</option>`;
        })

        let html: string =
            `<div class="${this.cssClasses.rankControlsContainer}">
                <div class="${this.cssClasses.rankControl}">
                    <label>Expand ranks to show</label>
                    <select class="${this.cssClasses.preExpandToRankControl}">${preExpandOptions}</select>
                </div>
                <div class="${this.cssClasses.rankControl}">
                    <label>Hide ranks above</label>
                    <select class="${this.cssClasses.hideAboveRankControl}">${hideAboveOptions}</select>
                </div>
                <button class="btn btn-success ${this.cssClasses.filterRanksControl}" type="button">Go</button>
            </div>`;

        return html;
    }

    displayRelease(release_: IMslRelease) {

        if (!release_ || !release_.year) {
            
            // Clear the title and description, then hide the release panel and exit.
            jQuery(this.selectors.releaseTitle).html("");
            jQuery(this.selectors.releaseDescription).html("");
            jQuery(this.selectors.releaseTaxaStats).html("");
            jQuery(this.selectors.releasePanel).hide();
            return false;
        }

        let title: string = `Virus Taxonomy: ${release_.year} Release`;

        let notes = release_.notes || "";
        if (notes) { notes = notes.replace(";", "<br/>"); }

        // Populate the title and description
        jQuery(this.selectors.releaseTitle).html(title);
        jQuery(this.selectors.releaseDescription).html(notes);

        // Should we display the release rank count? Generally, this will only be hidden
        // when the minimal Taxonomy Control is used on wiki pages.
        if (this.displaySettings.useParentTaxonForReleaseRankCount) {

            // Clear the rank counts.
            jQuery(this.selectors.releaseTaxaStats).html("");

        } else {

            // Format the release's rank counts and populate the panel.
            let ranks = this.formatTaxaRanks(release_);

            jQuery(this.selectors.releaseTaxaStats).html(ranks);
        }

        // Display the release panel
        jQuery(this.selectors.releasePanel).show();
    }


    // Create HTML for a single taxon and add it to the page.
    displayTaxon(taxon_: ITaxon) {

        let ctrlHTML = "";
        let html = "";
        let isRefHTML = "";

        // Populate the control HTML
        if (taxon_.levelName === "species") {

            // Is this a reference strain?
            if (taxon_.isReference) { isRefHTML = `<div class="tc-ref-species">${this.icons.star}</div>`; }

        } else {

            let ctrlIcon = "";
            if (taxon_.numChildren > 0) { ctrlIcon += this.icons.expand; }

            ctrlHTML = `<div class="tc-ctrl" data-id="${taxon_.taxnodeID}">${ctrlIcon}</div>`;
        }

        let rightSide = "<div class=\"reveal-on-hover\">Click for details</div>";

        // The total number of previous or next history items.
        let totalHistory: number = 0;
        if (taxon_.nextDeltaCount > 0) { totalHistory += taxon_.nextDeltaCount; }
        if (taxon_.prevDeltaCount > 0) { totalHistory += taxon_.prevDeltaCount; }

        // Was this taxon updated in this release?
        if (totalHistory > 0) { rightSide +=  `<div class="updated">Updated</div>`; }

        // Always add the info icon.
        //rightSide += this.icons.info;

        let containerClasses = "";

        // Should the container be left-offset?
        if (taxon_.nodeDepth > 2 && !this.displaySettings.leftAlignAll) { containerClasses += " left-offset"; }
        if (this.displaySettings.useSmallFont) { containerClasses += " small-font"; }

        // Should we display the parent rank and name?
        let memberOfControl = "";
        if (this.displaySettings.displayMemberOfCtrls && taxon_.memberOf && taxon_.parentID && taxon_.parentLevelName) {
            memberOfControl = `<div class="${this.cssClasses.memberOfControl}" data-id="${taxon_.taxnodeID}">${taxon_.parentLevelName}: ${taxon_.memberOf}</div>`;
        }

        html +=
            `<div class="tc-container${containerClasses}">
                ${isRefHTML}
                <div class="tc-node" 
                    data-id="${taxon_.taxnodeID}"
                    data-name="${taxon_.taxonName}"
                    data-rank="${taxon_.levelName}" 
                    data-child-taxa="${taxon_.childTaxaCount}"
                >
                    <div class="tc-left-side">
                        ${ctrlHTML}
                        <div class="tc-rank">${taxon_.levelName}:</div>
                        <div class="tc-name">${taxon_.taxonName}</div>
                        <div class="tc-member-of">${memberOfControl}</div>
                    </div>
                    <div class="tc-right-side">${rightSide}</div>
                </div>
                <div class="tc-children" data-id="${taxon_.taxnodeID}" data-expanded="false" data-populated="false"></div>
            </div>`;
        
        jQuery(`.tc-children[data-id="${taxon_.parentID}"]`).append(html); 
    }
    

    async expandCollapse(taxNodeID_: string, animate_: boolean): Promise<boolean> {

        let childContainer = jQuery(`.tc-children[data-id="${taxNodeID_}"]`);
        if (!childContainer) { throw new Error("Invalid childContainer in expandCollapse"); }

        let isExpanded = jQuery(childContainer).attr("data-expanded");
        let isPopulated = jQuery(childContainer).attr("data-populated");
        
        let animationDuration = this.animationDuration;
        if (!animate_) { animationDuration = 0; }

        if (isExpanded == "true") {

            //------------------------------------------------------------------------------------------
            // Collapse the node
            //------------------------------------------------------------------------------------------

            // Toggle the icon
            jQuery(`.tc-ctrl[data-id="${taxNodeID_}"]`).html(this.icons.expand);

            // Toggle "is expanded"
            jQuery(childContainer).attr("data-expanded", "false");

            // Hide the children
            jQuery(childContainer).hide(animationDuration);

        } else if (isPopulated == "false") {

            // Get this node's child taxa.
            await this.getChildTaxa(taxNodeID_);

        } else {

            //------------------------------------------------------------------------------------------
            // Expand the node
            //------------------------------------------------------------------------------------------

            // Toggle the icon
            jQuery(`.tc-ctrl[data-id="${taxNodeID_}"]`).html(this.icons.collapse);

            // Toggle "is expanded"
            jQuery(childContainer).attr("data-expanded", "true");
            
            // Display the children
            jQuery(childContainer).show(animationDuration);
        }

        return true;
    }


    formatTaxaRanks(mslRelease_: IMslRelease): string {

        let results = "";
        
        if (mslRelease_.realms > 0) {
            results += `${mslRelease_.realms.toString()} `;
            if (mslRelease_.realms == 1) {
                results += "realm";
            } else {
                results += "realms";
            }
        }

        if (mslRelease_.subrealms > 0) {

            results += `${results.length > 0 ? ", " : ""}${mslRelease_.subrealms.toString()} `;
            if (mslRelease_.subrealms == 1) {
                results += "subrealm";
            } else {
                results += "subrealms";
            }
        }

        if (mslRelease_.kingdoms > 0) {

            results += `${results.length > 0 ? ", " : ""}${mslRelease_.kingdoms.toString()} `;
            if (mslRelease_.kingdoms == 1) {
                results += "kingdom";
            } else {
                results += "kingdoms";
            }
        }

        if (mslRelease_.subkingdoms > 0) {

            results += `${results.length > 0 ? ", " : ""}${mslRelease_.subkingdoms.toString()} `;
            if (mslRelease_.subkingdoms == 1) {
                results += "subkingdom";
            } else {
                results += "subkingdoms";
            }
        }

        if (mslRelease_.phyla > 0) {

            results += `${results.length > 0 ? ", " : ""}${mslRelease_.phyla.toString()} `;
            if (mslRelease_.phyla == 1) {
                results += "phylum";
            } else {
                results += "phyla";
            }
        }

        if (mslRelease_.subphyla > 0) {

            results += `${results.length > 0 ? ", " : ""}${mslRelease_.subphyla.toString()} `;
            if (mslRelease_.subphyla == 1) {
                results += "subphylum";
            } else {
                results += "subphyla";
            }
        }

        if (mslRelease_.classes > 0) {

            results += `${results.length > 0 ? ", " : ""}${mslRelease_.classes.toString()} `;
            if (mslRelease_.classes == 1) {
                results += "class";
            } else {
                results += "classes";
            }
        }

        if (mslRelease_.subclasses > 0) {

            results += `${results.length > 0 ? ", " : ""}${mslRelease_.subclasses.toString()} `;
            if (mslRelease_.subclasses == 1) {
                results += "subclass";
            } else {
                results += "subclasses";
            }
        }

        if (mslRelease_.orders > 0) {

            results += `${results.length > 0 ? ", " : ""}${mslRelease_.orders.toString()} `;
            if (mslRelease_.orders == 1) {
                results += "order";
            } else {
                results += "orders";
            }
        }

        if (mslRelease_.suborders > 0) {

            results += `${results.length > 0 ? ", " : ""}${mslRelease_.suborders.toString()} `;
            if (mslRelease_.suborders == 1) {
                results += "suborder";
            } else {
                results += "suborders";
            }
        }

        if (mslRelease_.families > 0) {

            results += `${results.length > 0 ? ", " : ""}${mslRelease_.families.toString()} `;
            if (mslRelease_.families == 1) {
                results += "family";
            } else {
                results += "families";
            }
        }

        if (mslRelease_.subfamilies > 0) {

            results += `${results.length > 0 ? ", " : ""}${mslRelease_.subfamilies.toString()} `;
            if (mslRelease_.subfamilies == 1) {
                results += "subfamily";
            } else {
                results += "subfamilies";
            }
        }

        if (mslRelease_.genera > 0) {

            results += `${results.length > 0 ? ", " : ""}${mslRelease_.genera.toString()} `;
            if (mslRelease_.genera == 1) {
                results += "genus";
            } else {
                results += "genera";
            }
        }

        if (mslRelease_.subgenera > 0) {

            results += `${results.length > 0 ? ", " : ""}${mslRelease_.subgenera.toString()} `;
            if (mslRelease_.subgenera == 1) {
                results += "subgenus";
            } else {
                results += "subgenera";
            }
        }

        if (mslRelease_.species > 0) {

            results += `${results.length > 0 ? ", " : ""}${mslRelease_.species.toString()} `;
            results += "species";
        }

        return results;
    }

    
    async getChildTaxa(taxNodeID_: string) {

        const response = await TaxonomyService.getChildTaxa(taxNodeID_);
        if (!response) { throw new Error("Invalid response in getChildTaxa"); }
        if (!response.parentTaxnodeID) { throw new Error("Invalid parent ID in getChildTaxa"); }
        if (!response.taxonomy) { throw new Error("Invalid child taxa"); }

        // Update the node as being populated.
        jQuery(`.tc-children[data-id="${response.parentTaxnodeID}"]`).attr("data-populated", "true");

        response.taxonomy.forEach((taxon_: ITaxon) => {
            this.displayTaxon(taxon_);
        });
        
        // Expand the parent to display the newly-added child taxa.
        this.expandCollapse(response.parentTaxnodeID, true);

        return;
    }

    // Look for a copy of local data persisted in web storage. If nothing is there, provide default values.
    getLocalData() {

        let json: string = sessionStorage.getItem(this.webStorageKey);
        if (json) {
            this.localData = JSON.parse(json);
        } else {
            // Set the ranks to empty so defaults will be provided by "validateLocalData".
            this.localData.hideAboveRank = null;
            this.localData.preExpandToRank = null;
        }

        // Validate the ranks and assign defaults, if necessary.
        this.validateLocalData(null, null, false);
    }


    // Get the specified MSL release (defaulting to the most-recent, if empty).
    async getRelease(releaseNumber_?: string) {

        if (!releaseNumber_) { releaseNumber_ = null; }

        // The spinner icon
        let spinner = this.getSpinnerHTML("Loading...");

        // Clear the search results and display the spinner.
        this.elements.taxonomyBrowser.innerHTML = spinner;

        // Get the MSL Release
        this.mslRelease = await TaxonomyService.getMslRelease(releaseNumber_);

        // Display the release details.
        this.displayRelease(this.mslRelease);

        return;
    }

    async getReleaseHistory() {

        // The spinner icon
        let spinner = this.getSpinnerHTML("Loading...");

        // Clear the search results and display the spinner.
        jQuery(this.selectors.releaseHistory).html(spinner);

        const response = await TaxonomyService.getReleaseHistory(); 

        this.processReleaseHistory(response.releases);

        return;
    }

    // Get taxa from the specified release number (defaulting to the most-recent, if empty). The results 
    // will be constrained by the "hide above" rank and "pre-expand to" rank in local data.
    async getReleaseTaxa() {

        let hideAboveRank: TaxaLevel = this.localData.hideAboveRank || <TaxaLevel>this.defaults.hideAboveRank;
        let preExpandToRank: TaxaLevel = this.localData.preExpandToRank || <TaxaLevel>this.defaults.preExpandToRank;

        // Display the spinner icon
        let spinner = this.getSpinnerHTML("Loading...");

        // Clear the search results and display the spinner.
        this.elements.taxonomyBrowser.innerHTML = spinner;

        // Get the taxonomy HTML
        const taxonomyHTML: string = await TaxonomyService.getReleaseTaxa(this.displaySettings, hideAboveRank, preExpandToRank, this.mslRelease.releaseNumber);
        if (!taxonomyHTML) { throw new Error("Invalid taxonomy HTML"); }

        // Process the release data.
        this.processReleaseTaxa(taxonomyHTML);
        
        return;
    }

    // Return a DIV that contains the spinner icon and optional text.
    getSpinnerHTML(spinnerText_: string): string {

        if (!spinnerText_) { spinnerText_ = ""; }

        return `<div class="spinner-ctrl">${this.icons.spinner} ${spinnerText_}</div>`;
    }


    async getTaxaByName() {

        // Clear the taxonomy control
        this.elements.taxonomyBrowser.innerHTML = "";

        const response = await TaxonomyService.getTaxaByName(this.mslRelease.releaseNumber, this.initialData.taxonName);

        this.processTaxaByName(response.parentID, response.taxa, response.taxNodeID);

        return;
    }


    async getTreeExpandedToNode(rank_: TaxaLevel, releaseNumber_: string, taxNodeID_: string) {
        
        if (!rank_) { throw new Error("Invalid rank in getTreeExpandedToNode"); }
        if (!releaseNumber_) { throw new Error("Invalid releaseNumber in getTreeExpandedToNode"); }
        if (!taxNodeID_) { throw new Error("Invalid taxNodeID in getTreeExpandedToNode"); }

        // The spinner icon
        const spinner = this.getSpinnerHTML("Loading...");

        // Clear the taxonomy control and display the spinner.
        this.elements.taxonomyBrowser.innerHTML = spinner;

        // Scroll down to the location of the spinner icon.
        let scrollOffset = jQuery(this.selectors.taxonomyBrowser).offset();
        if (scrollOffset && scrollOffset.top) {
            jQuery('html, body').animate({
                scrollTop: scrollOffset.top - 300
            }, 'slow');
        }

        // Get the selected taxon's rank.
        let rankIndex: number = OrderedTaxaLevel[rank_];

        // Default the "pre-expand to" rank to this rank.
        let preExpandIndex: number = rankIndex;

        // Don't pre-expand any lower than family.
        let familyIndex: number = OrderedTaxaLevel[TaxaLevel.family];
        if (preExpandIndex > familyIndex) { preExpandIndex = familyIndex; }

        // Should we adjust the "hide above" rank?
        let hideAboveIndex: number = OrderedTaxaLevel[this.localData.hideAboveRank];
        if (hideAboveIndex >= preExpandIndex) {

            let defaultHideAboveIndex: number = OrderedTaxaLevel[this.defaults.hideAboveRank];
            if (rankIndex < defaultHideAboveIndex) {
                hideAboveIndex = OrderedTaxaLevel[TaxaLevel.realm];
            } else {
                hideAboveIndex = defaultHideAboveIndex;
            }
        }

        // Determine the ranks associated with these indices.
        let hideAboveRank: TaxaLevel = <TaxaLevel>OrderedTaxaLevel[hideAboveIndex];
        let preExpandToRank: TaxaLevel = <TaxaLevel>OrderedTaxaLevel[preExpandIndex];

        // The validate method will also populate local data and persist it.
        this.validateLocalData(hideAboveRank, preExpandToRank, true);
        
        // Get the tree data expanded to the selected node.
        const response = await TaxonomyService.getTreeExpandedToNode(this.displaySettings, hideAboveRank, preExpandToRank,
            releaseNumber_, taxNodeID_);

        // Display the updated taxonomy tree.
        await this.processTreeExpandedToNode(response.parentTaxNodeID, response.subTreeHTML, response.taxNodeID, 
            response.taxonomyHTML);

        return;
    }


    async getUnassignedChildTaxaByName() {

        // Clear the taxonomy control
        this.elements.taxonomyBrowser.innerHTML = "";

        const response = await TaxonomyService.getUnassignedChildTaxaByName(this.mslRelease.releaseNumber, this.initialData.taxonName);
        
        this.processTaxaByName(response.parentID, response.taxa, response.taxNodeID);

        return;
    }


    // Handle a change to the "hide above" rank control.
    async handleHideAboveChange() {

        // Get the currently-selected "hide above" rank from the control. Use the default if the selection was empty.
        let hideAboveRank: TaxaLevel = <TaxaLevel>this.elements.hideAboveRankControl.value;
        if (!hideAboveRank) {

            // Set the default value and update the control.
            hideAboveRank = this.defaults.hideAboveRank;

            // Remove the change handler.
            this.elements.hideAboveRankControl.removeEventListener("change", async () => {
                return await this.handleHideAboveChange();
            })
            //jQuery(this.selectors.hideAboveRankControl).off("change");

            // Update the "hide above" control.
            this.elements.hideAboveRankControl.value = hideAboveRank;
            //jQuery(this.selectors.hideAboveRankControl).val(hideAboveRank);

            // Re-add the change handler.
            this.elements.hideAboveRankControl.addEventListener("change", async () => {
                return await this.handleHideAboveChange();
            })
            /*jQuery(this.selectors.hideAboveRankControl).change(() => {
                this.handleHideAboveChange(jQuery(this));
            });*/
        }
        
        // Update local data.
        this.localData.hideAboveRank = hideAboveRank;

        // Get the indices for both ranks.
        let hideAboveIndex: number = OrderedTaxaLevel[this.localData.hideAboveRank];
        let preExpandIndex: number = OrderedTaxaLevel[this.localData.preExpandToRank];
        
        // If pre-expand is above "hide above", set it to either 2 ranks above, or the highest index rank (species).
        if (preExpandIndex < hideAboveIndex) {

            // What's the highest rank index?
            let maxRankIndex: number = -1;
            for (let rank in OrderedTaxaLevel) { maxRankIndex += 1; }

            // Adjust the "pre-expand to" index to accommodate the new "hide above" rank.
            preExpandIndex = Math.min(hideAboveIndex + 2, maxRankIndex);

            // Update the "pre-expand to" rank to the taxa level with this index.
            this.localData.preExpandToRank = <TaxaLevel>OrderedTaxaLevel[preExpandIndex];

            // Remove the change handler.
            this.elements.preExpandToRankControl.removeEventListener("change", async () => {
                return await this.handlePreExpandChange();
            })
            //jQuery(this.selectors.preExpandToRankControl).off("change");

            // Update the "pre-expand to" control.
            this.elements.preExpandToRankControl.value = this.localData.preExpandToRank;
            //jQuery(this.selectors.preExpandToRankControl).val(this.localData.preExpandToRank);

            // Re-add the change handler.
            this.elements.preExpandToRankControl.addEventListener("change", async () => {
                return await this.handlePreExpandChange();
            })
            /*jQuery(this.selectors.preExpandToRankControl).change(() => {
                this.handlePreExpandChange(jQuery(this));
            });*/
        }

        // Save the changes.
        this.saveLocalData();
    }


    // Handle a change to the "pre-expand to" rank control.
    async handlePreExpandChange() {

        // Get the currently-selected "pre-expand to" rank from the control. If the selection was empty,
        // use the default and update the control.
        let preExpandToRank: TaxaLevel = <TaxaLevel>this.elements.preExpandToRankControl.value;
        if (!preExpandToRank) {

            // Set the default value and update the control.
            preExpandToRank = this.defaults.preExpandToRank;

            // Remove the change handler.
            this.elements.preExpandToRankControl.removeEventListener("change", async () => {
                return await this.handlePreExpandChange();
            })
            //jQuery(this.selectors.preExpandToRankControl).off("change");

            // Update the control.
            this.elements.preExpandToRankControl.value = preExpandToRank;
            //jQuery(this.selectors.preExpandToRankControl).val(preExpandToRank);

            // Re-add the change handler.
            this.elements.preExpandToRankControl.addEventListener("change", async () => {
                return await this.handlePreExpandChange();
            })
            /*jQuery(this.selectors.preExpandToRankControl).change(() => {
                this.handlePreExpandChange(jQuery(this));
            });*/
        }

        // Set the pre-expand rank in local storage, validate the hide-above, and save both in web storage.
        this.setPreExpandRank(preExpandToRank, true, false);

        return;
    }

    // This callback function is provided to the taxonomy search panel (child component) to handle a search result selection.
    async handleSearchResultSelection(taxNodeID_: string, lineage_: string, rank_: string, releaseNumber_: string) {

        //console.log(`inside handleSearchResultSelection with id ${taxNodeID_}, lineage ${lineage_}, rank ${rank_}, release ${releaseNumber_}`)

        // Get the specified release
        await this.getRelease(releaseNumber_);

        if (!taxNodeID_ || !rank_) {

            // If taxnode ID and rank weren't provided, display the entire taxonomy for this release.
            await this.getReleaseTaxa();

        } else {
            // Get the tree expanded to the selected node.
            await this.getTreeExpandedToNode(<TaxaLevel>rank_, releaseNumber_, taxNodeID_);
        }

        return;
    }

    async initialize() {

        // Look for the local data in web storage.
        this.getLocalData();

        // The HTML that will be added to the "container" Element.
        let html: string = "";
        
        if (this.displaySettings.displayReleaseHistory) {

            // The release history
            html += `<div class="${this.cssClasses.releaseHistory}"></div>`;
        }
        
        if (this.displaySettings.displaySearchPanel) {
            html += `<div class="${this.cssClasses.searchPanelContainer}"></div>`;
        }

        // The release panel
        html +=
            `<div class="${this.cssClasses.releasePanel}">
                <div class="${this.cssClasses.releaseTitle}"></div>
                <div class="${this.cssClasses.releaseDescription}"></div>
                <div class="${this.cssClasses.releaseTaxaStats}"></div>
            </div>`;

        // Rank controls
        if (this.displaySettings.displayRankCtrls === true) { html += this.createRankControls(); }
        
        // The taxonomy browser
        html += `<div class="${this.cssClasses.taxonomyBrowser}"></div>`;

        // Add a dialog container to the page.
        html += `<div class="${this.cssClasses.dialogContainer}"></div>`;

        // Add the HTML to the page.
        jQuery(this.selectors.container).html(html);

        if (this.displaySettings.displaySearchPanel) {
            this.searchPanel.initialize();
        }
        

        //---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
        // Add event handlers.
        //---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
        
        // Get the taxonomy control Element.
        this.elements.taxonomyBrowser = document.querySelector(this.selectors.taxonomyBrowser);
        if (!this.elements.taxonomyBrowser) { throw new Error("Invalid taxonomy control Element"); }

        // Clicking on a node control expands/collapses the node's child taxa.
        this.elements.taxonomyBrowser.addEventListener("click", async (event_: MouseEvent) => {

            const target = <HTMLElement>event_.target;

            // Get the closest node Element to the target Element.
            const nodeEl = target.closest(`.${this.cssClasses.node}`);
            if (!nodeEl) { return; }

            const taxNodeID = nodeEl.getAttribute("data-id");
            if (!taxNodeID) { return false; }

            if (target.classList.contains("tc-right-side") || target.parentElement.classList.contains("tc-right-side")) {

                event_.preventDefault();
                event_.stopPropagation();

                // Get the taxon name
                let taxonName = nodeEl.getAttribute("data-name");
                if (!taxonName) { throw new Error("Invalid taxon name value"); }

                // Remove the i Elements
                taxonName = taxonName.replace("<i>", "").replace("</i>", "");

                window.open(`${AppSettings.taxonHistoryPage}?taxnode_id=${taxNodeID}&taxon_name=${taxonName}`, "_blank");

            } else {
                event_.preventDefault();
                event_.stopPropagation();

                return await this.expandCollapse(taxNodeID, true);

            }
        })

        // If rank controls are added, add event handlers.
        if (this.displaySettings.displayRankCtrls) {

            // Get a reference to the "hide above rank" control Element.
            this.elements.hideAboveRankControl = document.querySelector(this.selectors.hideAboveRankControl);
            if (!this.elements.hideAboveRankControl) { throw new Error("Invalid hideAboveRank control"); }

            // Get a reference to the "pre-expand to rank" control Element.
            this.elements.preExpandToRankControl = document.querySelector(this.selectors.preExpandToRankControl);
            if (!this.elements.preExpandToRankControl) { throw new Error("Invalid preExpandToRank control"); }

            // Handle a click on the "hide above rank" control.
            this.elements.hideAboveRankControl.addEventListener("change", async () => {
                await this.handleHideAboveChange();
            })

            // Handle a click on the "pre-expand to rank" control.
            this.elements.preExpandToRankControl.addEventListener("change", async () => {
                await this.handlePreExpandChange();
            })

            // A click event on the "go" button.
            jQuery(this.selectors.filterRanksControl).click(async () => {

                // Get the new top-level rank.
                let hideAboveRank = <TaxaLevel>this.elements.hideAboveRankControl.value;
                this.localData.hideAboveRank = hideAboveRank || this.defaults.hideAboveRank;
                
                // Get the new "pre-expand to rank"
                let preExpandToRank = <TaxaLevel>this.elements.preExpandToRankControl.value;
                this.localData.preExpandToRank = preExpandToRank || this.defaults.preExpandToRank;
                
                // Persist the modified local data in web storage.
                this.saveLocalData();

                // Get the release constrained by the "hide above" and "pre-expand" selections.
                await this.getRelease(this.mslRelease.releaseNumber);

                await this.getReleaseTaxa();
            });
        }

        if (this.initialData.displayType === TaxonomyDisplayType.display_release_history) {

            const releaseHistoryEl = document.querySelector(this.selectors.releaseHistory);
            if (!releaseHistoryEl) { throw new Error("Invalid release history Element"); }

            // Add a click event handler for the release history table entries.
            releaseHistoryEl.addEventListener("click", async (event_: MouseEvent) => {

                const releaseControl = <HTMLElement>event_.target;
                if (!releaseControl.classList.contains("release-ctrl")) { return false; }

                // Get the link's release number.
                const releaseNumber = releaseControl.getAttribute("data-release");
                if (!releaseNumber) { return false; }

                event_.preventDefault();
                event_.stopPropagation();
                
                // Scroll to the release after it is selected.
                this.scrollToReleaseAfterLoading = true;

                // Get the requested release and its associated taxonomy.
                await this.getRelease(releaseNumber);
                await this.getReleaseTaxa();

                return false;
            })
        }

        // Handle mouseover events in the taxonomy control.
        this.elements.taxonomyBrowser.addEventListener("mouseover", (event_: MouseEvent) => {

            const target = <HTMLElement>event_.target;

            // Get the closest node Element to the target Element.
            const nodeEl = target.closest(`.${this.cssClasses.node}`);
            if (!nodeEl) { return; }
            
            // Get the node's rank
            const rank = nodeEl.getAttribute("data-rank");
            if (!rank || rank === "species") { return true; }

            // Get the child taxa counts
            const childTaxaCounts = nodeEl.getAttribute("data-child-taxa");
            if (!childTaxaCounts) { return true; }

            // We will process the event.
            event_.preventDefault();
            event_.stopPropagation();

            if (nodeEl.hasAttribute("_tippy")) {

                // Avoid creating a second Tippy instance. 
                const test = nodeEl as ReferenceElement<Props>;
                test._tippy.show();

            } else {

                // Create a tooltip instance for the child taxa counts.
                tippy(nodeEl, {
                    arrow: true,
                    animation: 'fade',
                    content: childTaxaCounts,
                    interactive: true,
                    placement: "top",
                    showOnCreate: true,
                    theme: "light-border"
                })
            }

            return;
        })  

        // Populate the control using the initial data.
        switch (this.initialData.displayType) {

            case TaxonomyDisplayType.display_all:
                await this.getRelease(this.initialData.releaseNumber);
                await this.getReleaseTaxa();
                break;

            case TaxonomyDisplayType.display_release_history:
                await this.getReleaseHistory();
                break;

            case TaxonomyDisplayType.display_unassigned_child_taxa: 
                await this.getRelease(this.initialData.releaseNumber);
                await this.getUnassignedChildTaxaByName();
                break;

            default: 
                await this.getRelease(this.initialData.releaseNumber);
                await this.getTaxaByName();
        }

        /*
        // Populate the control using the initial data.
        if (this.initialData.displayType === TaxonomyDisplayType.display_all) {

            await this.getRelease(this.initialData.releaseNumber);

            await this.getReleaseTaxa();

        } else if (this.initialData.displayType === TaxonomyDisplayType.display_release_history) {

            await this.getReleaseHistory();

        } else if (this.initialData.displayType === TaxonomyDisplayType.display_unassigned_child_taxa) {

            await this.getRelease(this.initialData.releaseNumber);

            await this.getUnassignedChildTaxaByName();

        } else {
            await this.getRelease(this.initialData.releaseNumber);

            await this.getTaxaByName();
        }
        */
        return;
    }


    processReleaseHistory(releases_: IMslRelease[]) {

        jQuery(this.selectors.releaseHistory).html("");

        let resultCount: number = 0;

        let html: string =
            `<table class="cell-border compact stripe hover">
                <thead>
                    <th>Year</th>
                    <th>Release Info</th>
                    <th>Order</th>
                    <th>Family</th>
                    <th>Subfamily</th>
                    <th>Genus</th>
                    <th>Species</th>
                </thead>
                <tbody>`;

        if (!!releases_) {

            // Add a row for each MSL Release. 
            releases_.forEach((release_: IMslRelease) => {
                
                html +=
                    `<tr>
                        <td class="release-ctrl" data-release="${release_.releaseNumber}">${release_.year}</td>
                        <td>${release_.notes}</td>
                        <td>${release_.orders}</td>
                        <td>${release_.families}</td>
                        <td>${release_.subfamilies}</td>
                        <td>${release_.genera}</td>
                        <td>${release_.species}</td>
                    </tr>`;

                resultCount += 1;
            });
        }

        html += "</tbody></table>";

        if (resultCount < 1) { html = "No results"; }

        jQuery(this.selectors.releaseHistory).html(html);
       
        if (resultCount > 0) {

            // Convert the table into a DataTable instance.
            jQuery(`${this.selectors.releaseHistory} table`).DataTable({
                dom: "t",
                order: [],
                paging: false,
                searching: false
            });
        }
    }

    processReleaseTaxa(taxonomyHTML_: string) {

        if (!taxonomyHTML_) {
            this.elements.taxonomyBrowser.innerHTML = "No results";
            return false;
        }

        // Populate the taxonomy control with the pre-generated HTML.
        this.elements.taxonomyBrowser.innerHTML = taxonomyHTML_;

        if (this.scrollToReleaseAfterLoading) {

            // Scroll down to the location of the release panel.
            let offset = jQuery(this.selectors.releasePanel).offset();
            if (offset && offset.top) {
                jQuery('html, body').animate({
                    scrollTop: offset.top - 200
                }, 'slow');
            }

            // Reset the flag.
            this.scrollToReleaseAfterLoading = false;
        }
    }


    processTaxaByName(parentID_: string, taxa_: ITaxon[], taxNodeID_: string) {

        this.elements.taxonomyBrowser.innerHTML = "";

        // Validate the parent ID, the taxnode ID, and taxonomy data. If any of these are invalid, exit and do nothing.
        if (!parentID_ || !taxNodeID_ || !Array.isArray(taxa_) || taxa_.length < 1) { return false; }

        // Add an empty parent node for the taxon to attach to.
        this.elements.taxonomyBrowser.innerHTML = `<div class="tc-children" data-id="${parentID_}"></div>`;

        // Display the parent's "children panel".
        jQuery(`.tc-children[data-id="${parentID_}"]`).show();

        if (this.displaySettings.useParentTaxonForReleaseRankCount) {

            // Populate the MSL release rank count panel with the parent taxon's name and rank count.
            let parentTaxon = taxa_[0];

            const releaseStatsEl = document.querySelector(this.selectors.releaseTaxaStats);
            if (!releaseStatsEl) { throw new Error("Invalid release tax stats Element"); }

            releaseStatsEl.innerHTML = `${parentTaxon.taxonName}: ${parentTaxon.childTaxaCount}`;
        }

        // Display the taxa
        taxa_.forEach((taxon_) => {
            this.displayTaxon(taxon_);
        });
        

        // Get the child container Element.
        const childContainerEl = document.querySelector(`.tc-children[data-id="${taxNodeID_}"]`);
        if (!childContainerEl) { throw new Error("Invalid taxon child container"); }
        
        // Update the taxon as populated
        childContainerEl.setAttribute("data-populated", "true");

        // Expand it
        return this.expandCollapse(taxNodeID_, false);
    }


    async processTreeExpandedToNode(parentTaxNodeID_: string, subTreeHTML_: string, taxNodeID_: string, taxonomyHTML_: string) {

        if (!taxonomyHTML_) {
            this.elements.taxonomyBrowser.innerHTML = "No results";
            return false;
        }

        if (!taxNodeID_) { throw new Error("Invalid taxnode ID"); }

        // Populate the page with the pre-generated HTML.
        this.elements.taxonomyBrowser.innerHTML = taxonomyHTML_;

        // Were a parent taxnode ID and subtree HTML provided?
        if (parentTaxNodeID_ && subTreeHTML_) {

            // Update the node as being populated, and add the subTree HTML as its child nodes.
            const childContainerEl = document.querySelector(`.tc-children[data-id="${parentTaxNodeID_}"]`);
            if (!childContainerEl) { throw new Error("Invalid child container Element"); }

            childContainerEl.setAttribute("data-populated", "true");
            childContainerEl.innerHTML = subTreeHTML_;

            // Expand it
            await this.expandCollapse(parentTaxNodeID_, false);
        }

        // Highlight the search result node.
        const srNodeSelector = `.${this.cssClasses.node}[data-id="${taxNodeID_}"]`;
        jQuery(srNodeSelector).addClass("highlighted-node");
        
        // Scroll down to the location of the search result node.
        let scrollOffset = jQuery(srNodeSelector).offset();
        if (scrollOffset && scrollOffset.top) {
            jQuery('html, body').animate({
                scrollTop: scrollOffset.top - 300
            }, 'slow');
        }

        return;
    }


    // Use web storage to persist local data for this TaxonomyControl instance.
    saveLocalData() {

        const json: string = JSON.stringify(this.localData);

        // Persist in session storage (to limit how long it stays around).
        sessionStorage.setItem(this.webStorageKey, json);
    }


    /*
    async search() {

        // Get search text
        let searchText = jQuery(this.selectors.searchText).val();
        if (!searchText) { alert("Please enter search text"); return false; }

        let includeAllReleases: boolean = jQuery(this.selectors.includeAllReleasesCtrl).prop("checked");

        // Disable the search and reset buttons.
        jQuery(this.selectors.searchControl).prop("disabled", true);
        jQuery(this.selectors.clearSearchControl).prop("disabled", true);

        // The spinner icon and label.
        let spinner = this.getSpinnerHTML("Searching...");

        // Clear the search results and display the spinner.
        jQuery(this.selectors.searchResults).html(spinner);
        jQuery(this.selectors.searchResults).show();
        
        let releaseNumber = null;
        if (!!this.mslRelease && !!this.mslRelease.releaseNumber) { releaseNumber = this.mslRelease.releaseNumber; }

        // Call the search web service
        const searchResults: ITaxonomySearchResult[] = await TaxonomyService.search(includeAllReleases, searchText, releaseNumber);
        
        // Re-enable the search and reset buttons.
        jQuery(this.selectors.searchControl).prop("disabled", false);
        jQuery(this.selectors.clearSearchControl).prop("disabled", false);

        let resultCount: number = 0;

        let html: string =
            `<table class="${this.cssClasses.searchResultsTable} cell-border compact stripe">
                <thead>
                    <tr class="header-row">
                        <th data-orderable="false"></th>
                        <th>Release</th>
                        <th>Rank</th>
                        <th>Name</th>
                    </tr>
                </thead>
                <tbody>`;  

        if (searchResults) {
            searchResults.forEach((searchResult_) => {
                html +=
                    `<tr>
                        <td class="view-ctrl">
                            <button class="slim-btn view-search-result-ctrl"
                                data-id="${searchResult_.taxnodeID}" 
                                data-rank="${searchResult_.levelName}" 
                                data-release="${searchResult_.releaseNumber}">View</button>
                        </td>
                        <td class="release-name">${searchResult_.treeName}</td>
                        <td class="level-name">${searchResult_.levelName}</td>
                        <td class="result-html">${searchResult_.lineageHTML}</td>
                    </tr>`;
                    
                resultCount += 1;
            });
        }

        html += "</tbody></table>";

        if (resultCount < 1) { html = "No results"; }
        

        // Get the search results Element.
        const searchResultsEl: HTMLDivElement = document.querySelector(this.selectors.searchResults);
        if (!searchResultsEl) { throw new Error("Invalid search results Element"); }

        // Display the search results HTML.
        searchResultsEl.innerHTML = html;
        
        if (resultCount > 0) {
            
            searchResultsEl.addEventListener("click", async (event_: MouseEvent) => {

                // Get the closest TR Element to the target Element.
                const buttonEl = (event_.target as HTMLElement).closest(`button`);
                if (!buttonEl) { return; }
                
                event_.preventDefault();
                event_.stopPropagation();

                const strTaxNodeID = buttonEl.getAttribute("data-id");
                if (!strTaxNodeID) { throw new Error("Unable to select search result: Empty taxNodeID"); }

                const taxNodeID: number = parseInt(strTaxNodeID);
                if (isNaN(taxNodeID)) { throw new Error("Unable to select search result: Invalid taxNodeID"); }

                const rank = buttonEl.getAttribute("data-rank") as TaxaLevel;
                if (!rank) { throw new Error("Invalid rank attribute"); }

                const releaseNumber = buttonEl.getAttribute("data-release");
                if (!releaseNumber) { throw new Error("Invalid releaseNumber attribute"); }

                // Get the release
                await this.getRelease(releaseNumber);

                // Get the tree expanded to the selected node.
                await this.getTreeExpandedToNode(rank, releaseNumber, taxNodeID);

                return false;
            })

            // Convert the table into a DataTable instance.
            jQuery(this.selectors.searchResultsTable).DataTable({

                dom: "ltip",
                
                // No ordering applied by DataTables during initialisation
                "order": [],
                searching: false
            });
        }    
    }*/


    // Set the local data's "pre-expand to" rank, possibly updating the controls.
    async setPreExpandRank(preExpandToRank_: TaxaLevel, updateHideAboveControl_: boolean, updatePreExpandControl_: boolean) {

        // Use the default if the parameter is empty.
        if (!preExpandToRank_) { preExpandToRank_ = this.defaults.preExpandToRank; }

        // Update local data.
        this.localData.preExpandToRank = preExpandToRank_;

        // Populate the "pre-expand to" rank control with this rank?
        if (updatePreExpandControl_) {

            // Remove the change handler.
            this.elements.preExpandToRankControl.removeEventListener("change", async () => {
                return await this.handlePreExpandChange();
            })
            // Update the "pre-expand to" control.
            this.elements.preExpandToRankControl.value = this.localData.preExpandToRank;

            // Re-add the change handler.
            this.elements.preExpandToRankControl.addEventListener("change", async () => {
                return await this.handlePreExpandChange();
            })
        }

        //-------------------------------------------------------------------------------------------------------
        // Update the "hide above" rank, if necessary.
        //-------------------------------------------------------------------------------------------------------

        // Get the indices of both ranks for comparison.
        let hideAboveIndex: number = OrderedTaxaLevel[this.localData.hideAboveRank];
        let preExpandIndex: number = OrderedTaxaLevel[this.localData.preExpandToRank];

        // If pre-expand is above "hide above", set "hide above" to the same rank.
        if (preExpandIndex < hideAboveIndex) {

            hideAboveIndex = preExpandIndex;

            // Update the "hide above" rank to the taxa level with this index.
            this.localData.hideAboveRank = <TaxaLevel>OrderedTaxaLevel[hideAboveIndex];

            if (updateHideAboveControl_) {

                // Remove the change handler.
                this.elements.hideAboveRankControl.removeEventListener("change", async () => {
                    return await this.handleHideAboveChange();
                })

                // Update the "hide above" control.
                this.elements.hideAboveRankControl.value = this.localData.hideAboveRank;

                // Re-add the change handler.
                this.elements.hideAboveRankControl.addEventListener("change", async () => {
                    return await this.handleHideAboveChange();
                })
            }
        }
        
        // Save the changes.
        return this.saveLocalData();
    }


    // Make sure local data (the "hide above" and "pre-expand to" ranks) is valid.
    async validateLocalData(hideAboveRank_: TaxaLevel, preExpandToRank_: TaxaLevel, updateControls_: boolean) {

        let isModified: boolean = false;

        if (!this.localData || !this.localData.hideAboveRank || !this.localData.preExpandToRank) {
            this.localData = {
                hideAboveRank: this.defaults.hideAboveRank,
                preExpandToRank: this.defaults.preExpandToRank
            };

            isModified = true;
        }

        // Was a "hide above rank" parameter provided?
        if (hideAboveRank_) {
            this.localData.hideAboveRank = hideAboveRank_;
            isModified = true;
        }

        // Was a "pre-expand to rank" parameter provided?
        if (preExpandToRank_) {
            this.localData.preExpandToRank = preExpandToRank_;
            isModified = true;
        }

        //----------------------------------------------------------------------------------------------------------------------
        // Make sure the "pre-expand to" rank is >= the "hide above" rank.
        //----------------------------------------------------------------------------------------------------------------------
        let hideAboveIndex: number = OrderedTaxaLevel[this.localData.hideAboveRank];
        let preExpandIndex: number = OrderedTaxaLevel[this.localData.preExpandToRank];

        // What's the highest rank index?
        let maxRankIndex: number = -1;
        for (let rank in OrderedTaxaLevel) { maxRankIndex += 1; }

        // If pre-expand is above "hide above", set it to either 2 ranks above, or the highest index rank (species).
        if (preExpandIndex < hideAboveIndex) {
            preExpandIndex = Math.min(hideAboveIndex + 2, maxRankIndex);
            isModified = true;
        }

        // If the data was modified, persist the updated version in web storage.
        if (isModified) { this.saveLocalData(); }

        if (updateControls_) {

            // Remove the change handlers.
            this.elements.hideAboveRankControl.removeEventListener("change", async () => {
                return await this.handleHideAboveChange();
            })
            this.elements.preExpandToRankControl.removeEventListener("change", async () => {
                return await this.handlePreExpandChange();
            })

            this.elements.hideAboveRankControl.value = this.localData.hideAboveRank;
            this.elements.preExpandToRankControl.value = this.localData.preExpandToRank;

            // Re-add the change handlers.
            this.elements.hideAboveRankControl.addEventListener("change", async () => {
                return await this.handleHideAboveChange();
            })
            this.elements.preExpandToRankControl.addEventListener("change", async () => {
                return await this.handlePreExpandChange();
            })
        }
    }

}
