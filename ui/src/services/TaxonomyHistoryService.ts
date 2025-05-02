
import { ITaxonHistoryResult } from "../models/TaxonHistory/ITaxonHistoryResult";
import { WebService } from "./WebService";
import { WebServiceKey } from "../global/Types";


export class _TaxonomyHistoryService {


   // Get the history of the taxon with this ICTV ID (and possibly MSL release number) over all releases.
   async getByIctvID(currentMslRelease_: number, ictvID_: number, mslRelease_: number = NaN): Promise<ITaxonHistoryResult> {

      // Validate the ICTV ID.
      if (!ictvID_) { throw new Error("Invalid ICTV ID") }

      if (isNaN(mslRelease_)) { mslRelease_ = null; }

      let data = {
         action_code: "get_taxon_history",
         current_release: currentMslRelease_,
         "ictv_id": ictvID_,
         "msl_release": mslRelease_
      };

      return await WebService.get<ITaxonHistoryResult>(WebServiceKey.taxonomyHistory, data);
   }


   // Get the history of the taxon with this name over all releases
   async getByName(currentMslRelease_: number, taxonName_: string): Promise<ITaxonHistoryResult> {

      // Validate and maintain the taxon name.
      if (!taxonName_) { throw new Error("Invalid taxon name in getByName"); }

      const data = {
         action_code: "get_taxon_history",
         current_release: currentMslRelease_,
         "taxon_name": taxonName_
      };

      return await WebService.get<ITaxonHistoryResult>(WebServiceKey.taxonomyHistory, data);
   }


   // Get the history of the taxon with this taxnode ID over all releases.
   async getByTaxNodeID(currentMslRelease_: number, taxNodeID_: number): Promise<ITaxonHistoryResult> {

      // Validate and maintain the tax node ID.
      if (!taxNodeID_) { throw new Error("Invalid taxnode ID"); }

      const data = {
         action_code: "get_taxon_history",
         current_release: currentMslRelease_,
         taxnode_id: taxNodeID_
      };

      return await WebService.get<ITaxonHistoryResult>(WebServiceKey.taxonomyHistory, data);
   }

   
   // Get the history of the taxon with this VMR (isolate) ID over all releases.
   async getByVmrID(currentMslRelease_: number, vmrID_: number): Promise<ITaxonHistoryResult> {

      // Validate the VMR ID.
      if (!vmrID_) { throw new Error("Invalid VMR ID") }

      const data = {
         action_code: "get_taxon_history",
         current_release: currentMslRelease_,
         "vmr_id": vmrID_
      };

      return await WebService.get<ITaxonHistoryResult>(WebServiceKey.taxonomyHistory, data);
   }

}

// Create a singleton instance of _TaxonomyHistoryService.
export const TaxonomyHistoryService = new _TaxonomyHistoryService();


