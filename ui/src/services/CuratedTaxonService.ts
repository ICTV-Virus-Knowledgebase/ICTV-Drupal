
import { ICuratedTaxon } from "../components/CuratedTaxonManager/ICuratedTaxon";


export class _CuratedTaxonService {

   async getCuratedTaxa(): Promise<ICuratedTaxon[]> {
      return;
   }

   async updateContent() {
      return;
   }
}

// Create a singleton instance of _CuratedTaxonService.
export const CuratedTaxonService = new _CuratedTaxonService();