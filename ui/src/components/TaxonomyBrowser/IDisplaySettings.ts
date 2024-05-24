

// Settings specific to the Taxonomy Browser.
export interface IDisplaySettings {

    displayChildCount: boolean,

    displayHistoryCtrls: boolean,

    displayMemberOfCtrls?: boolean,

    displayRankCtrls?: boolean,

    displayReleaseHistory: boolean,

    displaySearchPanel: boolean,
    
    leftAlignAll: boolean,

    // Should we replace the release's rank count with the parent taxon's rank count?
    // Note: this is only used by minimal Taxonomy Controls on wiki pages.
    useParentTaxonForReleaseRankCount: boolean,

    useSmallFont: boolean
}