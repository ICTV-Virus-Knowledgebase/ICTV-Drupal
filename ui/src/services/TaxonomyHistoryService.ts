
import { ITaxonHistoryResult } from "../models/TaxonHistory/ITaxonHistoryResult";
import { WebService } from "./WebService";
import { WebServiceKey } from "../global/Types";


export class _TaxonomyHistoryService {

    // Get the history of the specified taxon over all releases.
    async getTaxonHistory(currentMslRelease_: number, taxNodeID_: string): Promise<ITaxonHistoryResult> {

        // Validate the tax node ID.
        if (!taxNodeID_) { throw new Error("Invalid tax node ID") }

        const data = {
            action_code: "get_taxon_history",
            "current_release": currentMslRelease_,
            "taxnode_id": taxNodeID_
        };

        const responseData = await WebService.get<ITaxonHistoryResult>(WebServiceKey.taxonomyHistory, data);

        return responseData;
    }


    // Get the history of the specified taxon over all releases.
    async getByIctvID(ictvID_: string) {

        // Validate the ICTV ID.
        if (!ictvID_) { throw new Error("Invalid ICTV ID") }

        const data = {
            action_code: "get_taxonomy_history",
            "ictv_id": ictvID_
        };

        const responseData = await WebService.get<any>(WebServiceKey.taxonomyHistory, data);

        return responseData;
    }


    // Get the history of the specified taxon name over all releases.
    async getByName(taxonName_: string) {

        // Validate and maintain the taxon name.
        if (!taxonName_) { throw new Error("Invalid taxon name in getByName"); }

        const data = {
            action_code: "get_taxonomy_history",
            "taxon_name": taxonName_
        };

        const responseData = await WebService.get<any>(WebServiceKey.taxonomyHistory, data);

        return responseData;
    }


    // Get the history of the specified taxon over all releases.
    async getByTaxNodeID(taxNodeID_: string) {

        // Validate and maintain the tax node ID.
        if (!taxNodeID_) { throw new Error("Invalid taxnode ID"); }
        
        const data = {
            action_code: "get_taxonomy_history",
            taxnode_id: taxNodeID_
        };

        const responseData = await WebService.get<any>(WebServiceKey.taxonomyHistory, data);

        return responseData;
    }



}

// Create a singleton instance of _TaxonomyHistoryService.
export const TaxonomyHistoryService = new _TaxonomyHistoryService();


