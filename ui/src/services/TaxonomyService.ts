
import { IDisplaySettings } from "../components/TaxonomyBrowser/IDisplaySettings";
import { IMslRelease } from "../models/IMslRelease";
import { IReleaseHistoryResult } from "../components/TaxonomyBrowser/IReleaseHistoryResult";
import { ITaxon } from "../models/ITaxon";
import { ITaxonDetailsResult } from "../models/ITaxonDetailsResult";
import { ITaxonLineageIDs } from "../models/ITaxonLineageIDs";
import { ITaxonSearchResult } from "../models/ITaxonSearchResult";
import { ITreeExpandedToNode } from "../models/ITreeExpandedToNode";
import { WebService } from "./WebService";
import { IctvRank, WebServiceKey } from "../global/Types";


export class _TaxonomyService {

   // Get taxa from the specified release number (defaulting to the most-recent, if empty). The results 
   // will be constrained by the "hide above" rank and "pre-expand to" rank in local data.
   async getByReleasePreExpanded(displaySettings_: IDisplaySettings, hideAboveRank_: IctvRank, preExpandToRank_: IctvRank,
      releaseNumber_: string): Promise<string> {

      // TODO: validate displaySettings_

      let data = {
         display_child_count: displaySettings_.displayChildCount,
         display_history_controls: displaySettings_.displayHistoryCtrls,
         display_member_of_controls: displaySettings_.displayMemberOfCtrls,
         left_align_all: displaySettings_.leftAlignAll,
         msl_release: releaseNumber_,
         pre_expand_to_rank: preExpandToRank_,
         top_level_rank: hideAboveRank_,
         use_small_font: displaySettings_.useSmallFont
      }

      const responseData = await WebService.requestData<any>(WebServiceKey.getByReleasePreExpanded, data);

      let taxonomyHTML: string = null;
      if (responseData && responseData.taxonomyHTML) { taxonomyHTML = responseData.taxonomyHTML; }

      return taxonomyHTML;
   }

   async getChildTaxa(taxNodeID_: string) {

      const data = {
         taxnode_id: taxNodeID_
      };

      const responseData = await WebService.requestData<any>(WebServiceKey.getChildTaxa, data);

      return responseData;
   }

   // Get a comma-delimited list of taxnode_ids in a taxon's lineage.
   async getTaxonLineageIDs(taxNodeID_: string): Promise<ITaxonLineageIDs> {

      const data = {
         taxnode_id: taxNodeID_
      };

      return await WebService.requestData<ITaxonLineageIDs>(WebServiceKey.getTaxonLineageIDs, data);
   }

   async getMslRelease(releaseNumber_: string): Promise<IMslRelease> {

      let mslRelease: IMslRelease = null;

      const data = {
         msl_release: releaseNumber_
      }

      const responseData = await WebService.requestData<any>(WebServiceKey.getMslRelease, data);
      if (responseData && responseData.release) { mslRelease = responseData.release as IMslRelease }

      return mslRelease;
   }

   async getReleaseHistory(): Promise<IReleaseHistoryResult> {
      return await WebService.requestData<IReleaseHistoryResult>(WebServiceKey.getReleaseHistory);
   }

   async getTaxaByName(releaseNumber_: string, taxonName_: string) {

      const data = {
         msl_release: releaseNumber_,
         taxon_name: taxonName_
      };

      const responseData = await WebService.requestData<any>(WebServiceKey.getTaxaByName, data);

      return responseData;
   }

   // Get a single taxon using its taxnode_id.
   async getTaxon(taxNodeID_: string): Promise<ITaxon> {

      if (!taxNodeID_) { throw new Error("Invalid taxNodeID"); }

      const data = {
         taxnode_id: taxNodeID_
      };

      return await WebService.requestData<ITaxon>(WebServiceKey.getTaxon, data);
   }

   async getTaxonDetails(taxNodeID_: string): Promise<ITaxonDetailsResult> {

      if (!taxNodeID_) { throw new Error("Invalid taxNodeID"); }

      const data = {
         taxnode_id: taxNodeID_
      };

      const responseData = await WebService.requestData<ITaxonDetailsResult>(WebServiceKey.getTaxonDetails, data);

      console.log(responseData);

      return responseData;
   }


   // Get HTML for (the visible portion of) the entire taxonomy that contains this taxnode ID. This includes
   // all top-level nodes (whose direct parent is the tree/root node), the lineage of the selected taxon, and
   // the immediate child nodes of the lineage nodes (with redundancies removed).
   async getTreeExpandedToNode(taxNodeID_: string): Promise<ITreeExpandedToNode> {

      if (!taxNodeID_) { throw new Error("Invalid taxNodeID in getTreeExpandedToNode"); }

      const data = {
         taxnode_id: taxNodeID_
      }

      return await WebService.requestData<ITreeExpandedToNode>(WebServiceKey.getTreeExpandedToNode, data);
   }


   async getUnassignedChildTaxaByName(releaseNumber_: string, taxonName_: string) {

      const data = {
         msl_release: releaseNumber_,
         taxon_name: taxonName_
      }

      const responseData = await WebService.requestData<any>(WebServiceKey.getUnassignedChildTaxaByName, data);

      return responseData;
   }


   async search(currentRelease_: number, includeAllReleases_: boolean, searchText_: string, selectedRelease_?: number): Promise<ITaxonSearchResult[]> {

      // Validate the search text
      if (!searchText_) { alert("Please enter search text"); return null; }

      if (!selectedRelease_) { selectedRelease_ = null; }

      const data = {
         current_release: currentRelease_,
         include_all_releases: includeAllReleases_,
         search_text: searchText_,
         selected_release: selectedRelease_
      };

      return await WebService.requestData<ITaxonSearchResult[]>(WebServiceKey.searchTaxonomy, data);
   }

}

// Create a singleton instance of _TaxonomyService.
export const TaxonomyService = new _TaxonomyService();


