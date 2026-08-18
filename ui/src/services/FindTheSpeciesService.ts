
import { IIctvResult } from "../components/FindTheSpecies/IIctvResult";
import { WebService } from "./WebService";
import { SearchModifier, WebServiceKey } from "../global/Types";

export class _FindTheSpeciesService {

   // Search the database to find taxon name matches.
   async lookupName(currentMslRelease_: number, searchModifier_: SearchModifier, searchText_: string): Promise<IIctvResult[]> {

      const data = {
         currentMslRelease: currentMslRelease_,
         searchModifier: searchModifier_,
         searchText: searchText_
      }
      
      return await WebService.requestData<IIctvResult[]>(WebServiceKey.findTheSpecies, data);
   }

}

// Create a singleton instance of _FindTheSpeciesService.
export const FindTheSpeciesService = new _FindTheSpeciesService();