
import { ICuratedName } from "../components/CuratedNameManager/ICuratedName";
import { WebService } from "../services/WebService";
import { WebServiceKey } from "../global/Types";


export class _CuratedNameService {

   async addCuratedName() {
      return;
   }

   async deleteCuratedName() {
      return;
   }

   async getCuratedNames(): Promise<ICuratedName[]> {

      return await WebService.drupalGet<ICuratedName[]>(WebServiceKey.virusNameLookup, null);
   }

   async updateCuratedName() {
      return;
   }
}

// Create a singleton instance of _CuratedNameService.
export const CuratedNameService = new _CuratedNameService();