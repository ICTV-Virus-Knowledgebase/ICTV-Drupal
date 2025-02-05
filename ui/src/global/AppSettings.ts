
import { WebServiceKey } from "../global/Types";


export class _AppSettings {

   // The website's base URL.
   applicationURL: string = null;

   // The base URL for C# web services.
   baseWebServiceURL: string = null;

   // The current MSL release number.
   currentMslRelease: number = null;

   // The current VMR.
   currentVMR: string = null;

   // The URL for Drupal web services.
   drupalWebServiceURL: string = null;

   // The location of release proposal files. 
   releaseProposalsURL: string = null;

   // The taxon history page name.
   taxonHistoryPage: string = null; //"taxonHistory"; 
   
   // A lookup from web service keys to web service URLs (not including the full path).
   webServiceLookup: {[key_ in WebServiceKey]: string } = {
      createCuratedName: "create-curated_name",
      csrfToken: "session/token",
      deleteCuratedName: "delete-curated-name",
      getCuratedName: "get-curated-name",
      getCuratedNames: "get-curated-names",
      proposal: "proposal-api",
      sequenceClassifier: "sequence-classifier-api",
      taxonomy: "taxonomy.ashx",
      taxonomyHistory: "taxonomyHistory.ashx",
      updateCuratedName: "update-curated-name",
      virusIsolate: "virusIsolate.ashx",
      virusNameLookup: "virus-name-lookup"
   }
}

// Create a singleton instance of _AppSettings.
export const AppSettings = new _AppSettings();

