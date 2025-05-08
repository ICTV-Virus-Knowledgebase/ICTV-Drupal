

(function ($, Drupal_, drupalSettings_) {

    let initialized = false;


    Drupal_.behaviors.ictv_taxon_history = {

        // This function will be run on page load and ajax load.
        attach: function (context_, settings_) {

            // Exit if this has already been initialized.
            if (initialized) { return; }

            initialized = true;
            
            //----------------------------------------------------------------------------------------
            // Initialize the ICTV_TaxonHistory AppSettings using drupalSettings
            //----------------------------------------------------------------------------------------

            // The website's base URL.
            window.ICTV_TaxonHistory.AppSettings.applicationURL = settings_.applicationURL;

            // Set the base URL for web services.
            window.ICTV_TaxonHistory.AppSettings.baseWebServiceURL = settings_.baseWebServiceURL;

            // The current MSL release number.
            window.ICTV_TaxonHistory.AppSettings.currentMslRelease = settings_.currentMslRelease;

            // The location of release proposal files. 
            window.ICTV_TaxonHistory.AppSettings.releaseProposalsURL = settings_.releaseProposalsURL;

            // The taxon history page name.
            window.ICTV_TaxonHistory.AppSettings.taxonHistoryPage = settings_.taxonHistoryPage;
            
            
            // The DOM selector of the container Element added to the page.
            const containerSelector = "#taxon_history_container";

            // Create a new TaxonReleaseHistory instance.
            const taxonHistory = new window.ICTV_TaxonHistory.TaxonHistory(containerSelector, settings_.currentMslRelease);

            // Initialize and display the taxon history.
            taxonHistory.initialize();
        }
    };
    
})(jQuery, Drupal, drupalSettings);




