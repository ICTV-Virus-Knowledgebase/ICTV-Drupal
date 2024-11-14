
import { IIctvResult } from "../components/VirusNameLookup/IIctvResult";
import { WebService } from "../services/WebService";
import { WebServiceKey } from "../global/Types";

export class _VirusNameLookupService {


   async lookupName(currentMslRelease_: number, maxResultCount_: number, searchText_: string): Promise<IIctvResult[]> {

      const data = {
         actionCode: "lookup_name",
         currentMslRelease: currentMslRelease_,
         maxResultCount: maxResultCount_,
         searchText: searchText_
      }
      
      return await WebService.drupalGet<IIctvResult[]>(WebServiceKey.virusNameLookup, null, data);
   }

}

// Create a singleton instance of _VirusNameLookupService.
export const VirusNameLookupService = new _VirusNameLookupService();