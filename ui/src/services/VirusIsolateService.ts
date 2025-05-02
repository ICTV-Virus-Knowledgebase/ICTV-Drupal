
import { IVirusIsolate } from "../models/IVirusIsolate";
import { WebService } from "./WebService";
import { WebServiceKey } from "../global/Types";


export class _VirusIsolateService {


    async getVirusIsolates(mslRelease_: number, onlyUnassigned_: boolean, taxonName_: string): Promise<IVirusIsolate[]> {

        // Validate the taxon name
        if (!taxonName_) { throw new Error("Please enter a valid taxon name"); }

        const data = {
            // action_code: "get_virus_isolates",
            msl_release: mslRelease_,
            only_unassigned: onlyUnassigned_,
            taxon_name: taxonName_
        };

        const responseData = await WebService.get<IVirusIsolate[]>(WebServiceKey.virusIsolate, data);

        return responseData;
    }

}

// Create a singleton instance of _VirusIsolateService.
export const VirusIsolateService = new _VirusIsolateService();