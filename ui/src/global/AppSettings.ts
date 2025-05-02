
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
   taxonHistoryPage: string = null;
   
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
      
      // Proposal service
      proposal: "proposal-api",

      // Sequence search
      getSequenceSearchResult: "get-seqsearch-result",
      uploadSequences: "upload-sequences",

      // Taxonomy
      taxonomy: "taxonomy.ashx",
      getMslRelease: "get-msl-release",
      getByReleasePreExpanded: "get-by-release-pre-expanded",
      getChildTaxa: "get-child-taxa",
      searchTaxonomy: "search-taxonomy",
      getTreeExpandedToNode: "get-tree-expanded-to-node",
      getTaxaByName: "get-taxa-by-name",
      getTaxonDetails: "get-taxon-details",
      getUnassignedChildTaxaByName: "get-unassigned-child-taxa-by-name",
      getReleaseHistory: "get-release-history",
      getReleaseTaxa: "get-release-taxa",

      // TaxonHistory
      taxonomyHistory: "taxonomyHistory.ashx",
      getTaxonHistory: "get-taxon-history",
      
      // Member species table
      // virusIsolate: "virusIsolate.ashx",
      virusIsolate: "get-virus-isolates",

      // Virus name lookup
      virusNameLookup: "virus-name-lookup"
   }
}

// Create a singleton instance of _AppSettings.
export const AppSettings = new _AppSettings();

