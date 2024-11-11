
import { ISearchResult } from "../components/VirusNameLookup/ISearchResult";
import { WebService } from "../services/WebService";
import { WebServiceKey } from "../global/Types";

export class _VirusNameLookupService {


   async lookupName(currentMslRelease_: number, maxResultCount_: number, searchText_: string): Promise<ISearchResult[]> {

      const data = {
         actionCode: "lookup_name",
         currentMslRelease: currentMslRelease_,
         maxResultCount: maxResultCount_,
         searchText: searchText_
      }
      
      return await WebService.drupalGet<ISearchResult[]>(WebServiceKey.virusNameLookup, null, data);
   }

}

// Create a singleton instance of _VirusNameLookupService.
export const VirusNameLookupService = new _VirusNameLookupService();