
import { WebServiceKey } from "../global/Types";
import { Utils } from "../helpers/Utils";


export class _AppSettings {

   // The URL for web services on the app server.
   appServerURL: string = null;

   // The JWT authentication token for the app server.
   authToken: string = null;

   // The current MSL release number.
   currentMslRelease: number = null;

   // A display label for the current VMR.
   currentVMR: string = null;

   // The location of release proposal files. 
   releaseProposalsURL: string = null;

   // The taxon details page name.
   taxonDetailsPage: string = null;
   
   // The base URL for local web services.
   webServiceURL: string = null;

   // The website's base URL.
   websiteURL: string = null;

   // A lookup from web service keys to web service URLs (not including the full path).
   webServiceLookup: {[key_ in WebServiceKey]: string } = {

      // Curated names
      createCuratedName: "create-curated-name",
      deleteCuratedName: "delete-curated-name",
      getCuratedName: "get-curated-name",
      getCuratedNames: "get-curated-names",
      updateCuratedName: "update-curated-name",

      // The Drupal CSRF token
      csrfToken: "session/token",
      
      // Find the species
      findTheSpecies: "virus-name-lookup",

      // Proposal service
      getProposalJobs: "get-proposal-jobs",
      getProposalValidationSummary: "get-proposal-validation-summary",
      uploadProposals: "upload-proposals",

      // TaxaBLAST
      downloadTaxaBlastFile: "download-taxablast-file",
      getTaxaBlastOutputFile: "get-taxablast-output-file",
      getTaxaBlastJob: "get-taxablast-job",
      searchTaxaBlastJobs: "search-taxablast-jobs",
      uploadSequences: "upload-sequences",

      // Taxonomy
      getByReleasePreExpanded: "api/get-by-release-pre-expanded",
      getChildTaxa: "api/get-child-taxa",
      getMslRelease: "api/get-msl-release",
      getReleaseHistory: "api/get-release-history",
      getTaxaByName: "api/get-taxa-by-name",
      getTaxon: "api/get-taxon",
      getTaxonDetails: "api/get-taxon-details",
      getTreeExpandedToNode: "api/get-tree-expanded-to-node",
      getUnassignedChildTaxaByName: "api/get-unassigned-child-taxa-by-name",
      searchTaxonomy: "api/search-taxonomy",

      // Taxonomy history
      taxonomyHistory: "api/get-taxon-history",
      
      // Member species table
      virusIsolate: "api/get-virus-isolates"
   }

   // C-tor
   constructor() {
      this.websiteURL = Utils.getBaseURL();
   }
}

// Create a singleton instance of _AppSettings.
export const AppSettings = new _AppSettings();

