
import { IIctvResult } from "../components/VirusNameLookup/IIctvResult";
import { WebService } from "../services/WebService";
import { SearchModifier, WebServiceKey } from "../global/Types";

export class _VirusNameLookupService {


   async lookupName(currentMslRelease_: number, searchModifier_: SearchModifier, searchText_: string): Promise<IIctvResult[]> {

      const data = {
         actionCode: "lookup_name",
         currentMslRelease: currentMslRelease_,
         searchModifier: searchModifier_,
         searchText: searchText_
      }
      
      return await WebService.drupalGet<IIctvResult[]>(WebServiceKey.virusNameLookup, null, data);
   }

}

// Create a singleton instance of _VirusNameLookupService.
export const VirusNameLookupService = new _VirusNameLookupService();