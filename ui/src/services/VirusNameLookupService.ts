
import { IIctvResult } from "../components/VirusNameLookup/IIctvResult";
import { WebService } from "../services/WebService";
import { SearchModifier, WebServiceKey } from "../global/Types";

export class _VirusNameLookupService {

   // Search the database to find taxon name matches.
   async lookupName(currentMslRelease_: number, searchModifier_: SearchModifier, searchText_: string): Promise<IIctvResult[]> {

      const data = {
         currentMslRelease: currentMslRelease_,
         searchModifier: searchModifier_,
         searchText: searchText_
      }
      
      return await WebService.drupalGet<IIctvResult[]>(WebServiceKey.virusNameLookup, null, data);
   }

}

// Create a singleton instance of _VirusNameLookupService.
export const VirusNameLookupService = new _VirusNameLookupService();