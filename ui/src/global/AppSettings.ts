
import { WebServiceKey } from "../global/Types";


export class _AppSettings {

    // The website's base URL.
    applicationURL: string = null; //"https://cms.ictv.global";

    // The base URL for C# web services.
    baseWebServiceURL: string = null; //"https://dev.ictvonline.org/api/";

    // The current MSL release number.
    currentMslRelease: number = null; //"38";

    // The URL for Drupal web services.
    drupalWebServiceURL: string = null; //"https://cms.ictv.global/"; //"https://app.ictv.global/"; // 

    // The location of release proposal files. 
    releaseProposalsURL: string = null; //"https://cms.ictv.global/ictv/proposals/";

    // The taxon history page name.
    taxonHistoryPage: string = null; //"taxonHistory"; 
    
    // A lookup from web service keys to web service URLs (not including the full path).
    webServiceLookup: {[key_ in WebServiceKey]: string } = {
        csrfToken: "session/token",
        proposal: "proposal-api",
        taxonomy: "taxonomy.ashx",
        taxonomyHistory: "taxonomyHistory.ashx",
        virusIsolate: "virusIsolate.ashx"
    }
}

// Create a singleton instance of _AppSettings.
export const AppSettings = new _AppSettings();

