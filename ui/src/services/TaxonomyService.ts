
import { IDisplaySettings } from "../components/TaxonomyBrowser/IDisplaySettings";
import { IMslRelease } from "../models/IMslRelease";
import { ITaxonDetailsResult } from "../models/ITaxonDetailsResult";
import { ITaxonSearchResult } from "../models/ITaxonSearchResult";
import { WebService } from "./WebService";
import { TaxaLevel, WebServiceKey } from "../global/Types";


export class _TaxonomyService {

    async getChildTaxa(taxNodeID_: string) {

        const data = {
            action_code: "get_child_taxa",
            taxnode_id: taxNodeID_
        };

        const responseData = await WebService.post<any>(WebServiceKey.taxonomy, data);
        
        return responseData;
    }

    async getMslRelease(releaseNumber_: string): Promise<IMslRelease>  {

        let mslRelease: IMslRelease = null;

        const data = {
            action_code: "get_msl_release",
            msl_release: releaseNumber_
        }

        const responseData = await WebService.post<any>(WebServiceKey.taxonomy, data);
        if (responseData && responseData.release) { mslRelease = responseData.release as IMslRelease}

        return mslRelease;
    }


    async getReleaseHistory() {

        const data = {
            action_code: "get_release_history"
        }

        const responseData = await WebService.post<any>(WebServiceKey.taxonomy, data);

        return responseData;
    }

    // Get taxa from the specified release number (defaulting to the most-recent, if empty). The results 
    // will be constrained by the "hide above" rank and "pre-expand to" rank in local data.
    async getReleaseTaxa(displaySettings_: IDisplaySettings, hideAboveRank_: TaxaLevel, preExpandToRank_: TaxaLevel,
        releaseNumber_: string): Promise<string> {

        // TODO: validate displaySettings_

        let data = {
            action_code: "get_by_release_pre_expanded",
            display_child_count: displaySettings_.displayChildCount,
            display_history_controls: displaySettings_.displayHistoryCtrls,
            display_member_of_controls: displaySettings_.displayMemberOfCtrls,
            left_align_all: displaySettings_.leftAlignAll,
            msl_release: releaseNumber_,
            pre_expand_to_rank: preExpandToRank_,
            top_level_rank: hideAboveRank_,
            use_small_font: displaySettings_.useSmallFont
        }

        const responseData = await WebService.post<any>(WebServiceKey.taxonomy, data);

        let taxonomyHTML: string = null;
        if (responseData && responseData.taxonomyHTML) { taxonomyHTML = responseData.taxonomyHTML; }
        
        return taxonomyHTML;
    }


    async getTaxaByName(releaseNumber_: string, taxonName_: string) {

        const data = {
            action_code: "get_taxa_by_name",
            msl_release: releaseNumber_,
            taxon_name: taxonName_
        };

        const responseData = await WebService.post<any>(WebServiceKey.taxonomy, data);

        return responseData;
    }


    async getTaxonDetails(taxNodeID_: string): Promise<ITaxonDetailsResult> {

        if (!taxNodeID_) { throw new Error("Invalid taxNodeID"); }
        
        const data = {
            action_code: "get_taxon_details",
            taxnode_id: taxNodeID_
        };

        const responseData = await WebService.post<ITaxonDetailsResult>(WebServiceKey.taxonomy, data);

        console.log(responseData);

        return responseData;
    }


    async getTreeExpandedToNode(displaySettings_: IDisplaySettings, hideAboveRank_: TaxaLevel, preExpandToRank_: TaxaLevel, 
        releaseNumber_: string, taxNodeID_: string) {
        
        if (!releaseNumber_) { throw new Error("Invalid releaseNumber in getTreeExpandedToNode"); }
        if (!taxNodeID_) { throw new Error("Invalid taxNodeID in getTreeExpandedToNode"); }

        const data = {
            action_code: "get_tree_expanded_to_node",
            display_child_count: displaySettings_.displayChildCount,
            display_history_controls: displaySettings_.displayHistoryCtrls,
            display_member_of_controls: displaySettings_.displayMemberOfCtrls,
            left_align_all: displaySettings_.leftAlignAll,
            msl_release: releaseNumber_,
            pre_expand_to_rank: preExpandToRank_,
            taxnode_id: taxNodeID_,
            top_level_rank: hideAboveRank_,
            use_small_font: displaySettings_.useSmallFont
        }
        
        const responseData = await WebService.post<any>(WebServiceKey.taxonomy, data);

        return responseData;
    }


    async getUnassignedChildTaxaByName(releaseNumber_: string, taxonName_: string) {

        const data = {
            action_code: "get_unassigned_child_taxa_by_name",
            msl_release: releaseNumber_,
            taxon_name: taxonName_
        }

        const responseData = await WebService.post<any>(WebServiceKey.taxonomy, data);

        return responseData;
    }


    async search(currentRelease_: number, includeAllReleases_: boolean, searchText_: string, selectedRelease_?: number): Promise<ITaxonSearchResult[]> {

        // Validate the search text
        if (!searchText_) { alert("Please enter search text"); return null; }

        if (!selectedRelease_) { selectedRelease_ = null; }

        const data = {
            action_code: "search_taxonomy",
            current_release: currentRelease_,
            include_all_releases: includeAllReleases_,
            search_text: searchText_,
            selected_release: selectedRelease_
        };

        return await WebService.post<ITaxonSearchResult[]>(WebServiceKey.taxonomy, data);
    }

    
    async searchVisualTaxonomy(currentRelease_: number, includeAllReleases_: boolean, searchText_: string, selectedRelease_?: number): Promise<ITaxonSearchResult[]> {

        // Validate the search text
        if (!searchText_) { alert("Please enter search text"); return null; }

        if (!selectedRelease_) { selectedRelease_ = null; }

        const data = {
            action_code: "search_visual_taxonomy",
            current_release: currentRelease_,
            include_all_releases: includeAllReleases_,
            search_text: searchText_,
            selected_release: selectedRelease_
        };

        return await WebService.post<ITaxonSearchResult[]>(WebServiceKey.taxonomy, data);
    }


}

// Create a singleton instance of _TaxonomyService.
export const TaxonomyService = new _TaxonomyService();


