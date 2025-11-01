
import { IVirusIsolate } from "../models/IVirusIsolate";
import { Utils } from "../helpers/Utils";
import { WebService } from "./WebService";
import { WebServiceKey } from "../global/Types";


export class _VirusIsolateService {

   async getIsolates(isolateID_: number, mslRelease_: number, onlyUnassigned_: boolean, taxnodeID_: number, taxonName_: string): Promise<IVirusIsolate[]> {

      const data = {
         isolate_id: isolateID_,
         msl_release: mslRelease_,
         only_unassigned: onlyUnassigned_,
         taxnode_id: taxnodeID_,
         taxon_name: Utils.safeTrim(taxonName_)
      }

      const responseData = await WebService.get<IVirusIsolate[]>(WebServiceKey.virusIsolate, data);
      return responseData;
   }

   // NOTE: This is the old version
   async getVirusIsolates(mslRelease_: number, onlyUnassigned_: boolean, taxonName_: string): Promise<IVirusIsolate[]> {

      // Validate the taxon name
      if (!taxonName_) { throw new Error("Please enter a valid taxon name"); }

      const data = {
         action_code: "get_virus_isolates",
         msl_release: mslRelease_,
         only_unassigned: onlyUnassigned_,
         taxon_name: taxonName_
      };

      const responseData = await WebService.post<IVirusIsolate[]>(WebServiceKey.virusIsolate, data);

      return responseData;
   }

}

// Create a singleton instance of _VirusIsolateService.
export const VirusIsolateService = new _VirusIsolateService();