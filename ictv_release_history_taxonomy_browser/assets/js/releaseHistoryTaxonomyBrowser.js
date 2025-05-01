
(function ($, Drupal_, drupalSettings_) {

    let initialized = false;

    Drupal_.behaviors.ictv_test = {

        // This function will be run on page load and ajax load.
        attach: function (context_, settings_) {

            // Exit if this has already been initialized.
            if (initialized) { return; }

            initialized = true;
            
            //----------------------------------------------------------------------------------------
            // Initialize the ICTV AppSettings using drupalSettings
            //----------------------------------------------------------------------------------------

            // The website's base URL.
            window.ICTV_TaxonomyBrowser.AppSettings.applicationURL = settings_.applicationURL;

            // Set the base URL for web services.
            window.ICTV_TaxonomyBrowser.AppSettings.baseWebServiceURL = settings_.baseWebServiceURL;

            // The current MSL release number.
            window.ICTV_TaxonomyBrowser.AppSettings.currentMslRelease = settings_.currentMslRelease;

            // The location of release proposal files. 
            window.ICTV_TaxonomyBrowser.AppSettings.releaseProposalsURL = settings_.releaseProposalsURL;

            // The taxon history page name.
            window.ICTV_TaxonomyBrowser.AppSettings.taxonHistoryPage = settings_.taxonHistoryPage;

            
            // The DOM selector of the container Element added to the page.
            const containerSelector = "#release_history_taxonomy_browser_container";
            
            const controlKey = "releaseHistoryTaxonomyBrowser";
            const ctrlSettings = {
                displayChildCount: true,
                displayHistoryCtrls: true,
                displayMemberOfCtrls: true,
                displayRankCtrls: true,
                displayReleaseHistory: true,
                displaySearchPanel: true,
                leftAlignAll: false,

                // Should we replace the release's rank count with the parent taxon's rank count?
                // Note: this is only used by minimal Taxonomy Controls on wiki pages.
                useParentTaxonForReleaseRankCount: false,

                useSmallFont: false
            }
            const initialData =  {
                displayType: window.ICTV_TaxonomyBrowser.TaxonomyDisplayType.display_release_history,
                releaseNumber: null, // settings_.currentMslRelease,
                taxonName: null
            }

            // Create a new TaxonomyBrowser instance.
            const taxonomyBrowser = new window.ICTV_TaxonomyBrowser.TaxonomyBrowser(containerSelector, controlKey, ctrlSettings, initialData);
            if (!taxonomyBrowser) { throw new Error("Invalid taxonomy browser"); } 
            
            // Initialize and display the taxonomy browser.
            taxonomyBrowser.initialize();
        }
    };
    
})(jQuery, Drupal, drupalSettings);




